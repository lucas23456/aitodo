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
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  category?: string;
  tags?: string[];
}

// Вспомогательная функция для генерации уникального идентификатора
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
      5. Категорию (Work, Personal, Health, Shopping, Education, Finance, Travel, Design, Research, или другую подходящую)
      6. Теги (важные ключевые слова из задачи, рекомендуемые: Urgent, Important, Meeting, Project, Reminder, Design, Feedback, Later, InProgress, Review)
      7. Срок выполнения (если упоминается конкретная дата, используй её. Если не упоминается - используй сегодняшнюю дату)
      
      Текст может содержать несколько задач, разбей их правильно.
      ВАЖНО: Для всех задач, если срок явно не указан, поставь сегодняшнюю дату.
      Возвращай только JSON-массив с задачами, без преамбул и пояснений.

      Формат ответа:
      [
        {
          "title": "🛒 Название задачи с эмодзи",
          "description": "Описание задачи (если есть)",
          "priority": "high|medium|low",
          "category": "Work|Personal|Health|Shopping|Education|Finance|Travel|Design|Research|Other",
          "tags": ["Urgent", "Meeting", "Другие_теги_если_есть"],
          "dueDate": "${new Date().toISOString()}" // Используй этот формат с текущей датой по умолчанию
        },
        // другие задачи
      ]
    `;

    // Получаем API ключ из переменных окружения или временный ключ для тестирования
    const apiKey = Constants?.expoConfig?.extra?.openRouterApiKey || process.env.OPEN_ROUTER_API_KEY || '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';
    
    // Пробуем сначала первую модель, если не получится - используем вторую
    const models = [
      'google/gemini-2.0-flash-exp:free'
    ];
    
    let data;
    let response;
    let successfulModel = '';
    
    // Попробуем последовательно разные модели
    for (const model of models) {
      try {
        console.log(`Trying to use model: ${model}`);
        
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://voice-todo.app',  // Добавляем referer для OpenRouter
            'X-Title': 'VoiceTodo App'                 // Добавляем название приложения
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: systemPrompt + "\nВажно: возвращай ТОЛЬКО правильно форматированный JSON массив задач и ничего больше!"
              },
              {
                role: 'user',
                content: text,
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000,
            temperature: 0.4  // Снижаем температуру для более предсказуемых ответов
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`LLM API error with model ${model}:`, errorText);
          continue; // Пробуем следующую модель
        }

        data = await response.json();
        console.log(`Response from model ${model}:`, JSON.stringify(data).substring(0, 200) + '...');
        
        // Проверяем, что в ответе есть структура message.content
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          successfulModel = model;
          break; // Нашли работающую модель с полным ответом
        } else {
          console.error(`Model ${model} returned incomplete response structure:`, JSON.stringify(data));
          // Продолжаем перебор моделей
        }
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError);
        // Продолжаем перебор моделей
      }
    }
    
    // Если данные не были получены после всех попыток
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('All models failed. Response structure:', JSON.stringify(response || {}));
      throw new Error('Could not get valid response from any LLM model');
    }
    
    // Извлекаем текст ответа
    const content = data.choices[0].message.content;
    
    // Проверяем наличие контента
    if (!content) {
      console.error(`Empty content in response from model ${successfulModel}:`, JSON.stringify(data));
      // Вместо ошибки вернем базовую задачу
      return [{
        id: generateId(),
        title: `📝 ${text.length > 30 ? text.substring(0, 30) + '...' : text}`,
        description: text,
        priority: 'medium',
        dueDate: new Date().toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
        category: '',
        tags: [],
      }];
    }
    
    // Парсим JSON из ответа
    try {
      // Попробуем найти JSON в ответе, если модель вернет текст с пояснениями
      let jsonString = content.trim();
      let tasks: LLMTaskResponse[] = [];

      // Пытаемся извлечь JSON массив из текста разными способами
      try {
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
          tasks = [{
            title: content.length > 50 ? `${content.substring(0, 50)}...` : content,
            description: content
          }];
        }
      }
      
      // Проверка, что у нас есть массив задач
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.log('Creating default task from invalid task format');
        return [{
          id: generateId(),
          title: `📝 ${text.length > 30 ? text.substring(0, 30) + '...' : text}`,
          description: text,
          priority: 'medium',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: '',
          tags: [],
        }];
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
        
        // Нормализуем теги
        let tags: string[] = [];
        if (task.tags) {
          if (typeof task.tags === 'string') {
            // Если теги пришли строкой, разделяем по запятой
            tags = task.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          } else if (Array.isArray(task.tags)) {
            // Если теги уже массив, используем их
            tags = task.tags.map(tag => tag.toString().trim()).filter(tag => tag.length > 0);
          }
        }
        
        // Нормализуем категорию
        let category = '';
        if (task.category && typeof task.category === 'string') {
          category = task.category.trim();
        }
        
        // Нормализуем приоритет
        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (task.priority) {
          const priorityStr = task.priority.toString().toLowerCase().trim();
          if (['low', 'medium', 'high'].includes(priorityStr)) {
            priority = priorityStr as 'low' | 'medium' | 'high';
          }
        }
        
        // Собираем финальную задачу
        const processedTask: ProcessedTask = {
          id: generateId(),
          title: task.title || '',
          description: task.description || '',
          priority,
          dueDate,
          completed: false,
          createdAt: new Date().toISOString(),
          category,
          tags,
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
        id: generateId(),
        title: `📝 ${text.length > 30 ? text.substring(0, 30) + '...' : text}`,
        description: text,
        priority: 'medium',
        dueDate: new Date().toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
        category: '',
        tags: [],
      }];
    }
  } catch (error) {
    console.error('Error processing voice text:', error);
    // В случае любой ошибки возвращаем простую задачу с исходным текстом
    return [{
      id: generateId(),
      title: `📝 ${text.length > 30 ? text.substring(0, 30) + '...' : text}`,
      description: text,
      priority: 'medium',
      dueDate: new Date().toISOString(),
      completed: false,
      createdAt: new Date().toISOString(),
      category: '',
      tags: [],
    }];
  }
} 