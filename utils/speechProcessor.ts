import Constants from 'expo-constants';

// Define possible response structures from LLM
interface LLMTaskResponse {
  title: string;
  description?: string;
  tags?: string[] | string;
  priority?: string;
  dueDate?: string;
  due_date?: string | number; // For backward compatibility
  category?: string;
  estimatedTime?: string;
}

interface ProcessedTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

/**
 * Обрабатывает входящий голосовой текст с помощью LLM для выделения структурированных задач
 * @param text Распознанный голосовой текст
 * @returns Массив структурированных задач
 */
export async function processVoiceText(text: string): Promise<ProcessedTask[]> {
  try {
    // Системный промпт для структурирования задач
    const systemPrompt = `
      Ты - помощник по структурированию задач из голосового ввода.
      
      Твоя задача - разбить входящий текст на отдельные задачи с правильной структурой.
      
      Для каждой задачи определи:
      1. Название (краткое, понятное)
      2. Добавь один подходящий эмодзи в начало названия каждой задачи
      3. Описание (опционально, если есть детали)
      4. Приоритет (high, medium, low - определи исходя из срочности)
      5. Срок выполнения (если упоминается конкретная дата, используй её. Если не упоминается - используй сегодняшнюю дату)
      
      Текст может содержать несколько задач, разбей их правильно.
      ВАЖНО: Для всех задач, если срок явно не указан, поставь сегодняшнюю дату.
      Возвращай только JSON-массив с задачами, без преамбул и пояснений.

      Формат ответа:
      [
        {
          "title": "🛒 Название задачи с эмодзи",
          "description": "Описание задачи (если есть)",
          "priority": "high|medium|low",
          "dueDate": "${new Date().toISOString()}" // Используй этот формат с текущей датой по умолчанию
        },
        // другие задачи
      ]
    `;

    // Получаем API ключ из переменных окружения или временный ключ для тестирования
    // В продакшене нужно настроить через .env или безопасное хранилище
    const apiKey = Constants?.expoConfig?.extra?.openRouterApiKey || process.env.OPEN_ROUTER_API_KEY || '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';
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('LLM Response:', data);
    
    // Извлекаем текст ответа
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty response');
    }
    
    // Парсим JSON из ответа
    try {
      // Попробуем найти JSON в ответе, если модель вернет текст с пояснениями
      let jsonString = content.trim();
      let tasks: LLMTaskResponse[] = [];

      // Пытаемся извлечь JSON массив из текста разными способами
      try {
        console.log('Raw LLM output:', jsonString);
        
        // Если вернулся объект с tasks как массивом
        if (jsonString.startsWith('{') && jsonString.includes('"tasks"')) {
          const jsonObj = JSON.parse(jsonString);
          if (Array.isArray(jsonObj.tasks)) {
            tasks = jsonObj.tasks;
          }
        } 
        // Если вернулся массив напрямую
        else if (jsonString.startsWith('[') && jsonString.endsWith(']')) {
          tasks = JSON.parse(jsonString);
        }
        // Если в тексте есть что-то похожее на массив JSON
        else {
          const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
          if (jsonMatch) {
            tasks = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (jsonError) {
        console.error('Initial JSON parsing failed:', jsonError);
        // Более агрессивный подход к извлечению JSON
        try {
          // Попробуем найти любые объекты в фигурных скобках
          const objectMatches = content.match(/{[^{}]*(((?:{[^{}]*})[^{}]*)+|[^{}]*)}+/g);
          if (objectMatches && objectMatches.length > 0) {
            // Создаем массив из найденных объектов
            const objectsJson = `[${objectMatches.join(',')}]`;
            console.log('Constructed JSON array:', objectsJson);
            try {
              tasks = JSON.parse(objectsJson);
            } catch (e) {
              // Возможно у нас невалидный JSON - попробуем исправить простые проблемы
              const cleanedJson = objectsJson
                .replace(/,\s*}/g, '}') // Убрать запятые перед закрывающей скобкой
                .replace(/,\s*\]/g, ']'); // Убрать запятые перед закрывающей квадратной скобкой
              tasks = JSON.parse(cleanedJson);
            }
          } else {
            throw new Error('No valid JSON objects found');
          }
        } catch (aggressiveError) {
          console.error('Aggressive JSON extraction failed:', aggressiveError);
          
          // Последняя попытка - просто создаем базовую задачу с текстом ответа LLM
          console.log('Creating simple task based on LLM response');
          tasks = [{
            title: content.length > 50 ? `${content.substring(0, 50)}...` : content,
            description: content
          }];
        }
      }
      
      // Проверка, что у нас есть массив задач
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.warn('Tasks array is empty or not an array, using basic task');
        throw new Error('Invalid task format returned');
      }
      
      // Преобразуем форматы данных, чтобы они соответствовали ожидаемому формату
      return tasks.map(task => {
        // Определяем дату выполнения, устанавливая сегодня по умолчанию
        const today = new Date();
        let dueDate;
        
        // Если указана дата в задаче, пробуем её использовать
        if (task.dueDate || task.due_date) {
          try {
            // Пробуем создать дату из указанного значения
            const parsedDate = new Date(task.dueDate || task.due_date || '');
            // Проверяем, что получилась корректная дата
            if (!isNaN(parsedDate.getTime())) {
              dueDate = parsedDate.toISOString();
            } else {
              // Если некорректная дата, используем сегодня
              dueDate = today.toISOString();
            }
          } catch (e) {
            // При ошибке парсинга используем сегодня
            dueDate = today.toISOString();
          }
        } else {
          // Если дата не указана, используем сегодня
          dueDate = today.toISOString();
        }
        
        const processedTask: ProcessedTask = {
          title: task.title || '',
          description: task.description || '',
          priority: ['low', 'medium', 'high'].includes(task.priority as string) ? task.priority as 'low' | 'medium' | 'high' : 'medium',
          dueDate: dueDate
        };
        
        // Проверяем наличие эмодзи, если нет - добавляем стандартное
        if (!processedTask.title.match(/[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/u)) {
          processedTask.title = `📝 ${processedTask.title}`;
        }
        
        return processedTask;
      });
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // Если не удалось распарсить JSON, вернем базовую задачу с исходным текстом
      return [{
        title: `📝 ${text}`,
        description: '',
        priority: 'medium',
        dueDate: new Date().toISOString()
      }];
    }
  } catch (error) {
    console.error('Error processing voice text:', error);
    // В случае любой ошибки возвращаем простую задачу с исходным текстом
    return [{
      title: `📝 ${text}`,
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString()
    }];
  }
} 