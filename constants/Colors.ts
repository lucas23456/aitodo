export default {
  light: {
    // На белом фоне основное содержимое – черное
    text: '#000000', 
    background: '#FFFFFF', // Pure white background
    // Карточка и элементы интерфейса – почти чистый черный с нюансами (например, немного приглушённый) для комфорта
    card: '#FFFFFF', // White card background
    primary: '#000000', 
    secondary: '#222222',
    // Для позитивных статусов можно использовать насыщенные оттенки – например, для успеха темно-зелёный
    success: '#006400', 
    // Для предупреждений – насыщенный тёмно-красный
    danger: '#8B0000', 
    warning: '#444444',
    gray: '#777777',
    lightGray: '#DDDDDD',
    border: '#EEEEEE',
    secondaryText: '#555555',
  },
  dark: {
    // На тёмном фоне используем белое для текста
    text: '#000000', // Keep text black in dark mode
    background: '#FFFFFF', // Same white background for dark mode
    // Карточки и элементы интерфейса насыщенного белого цвета с небольшим затемнением для выделения блоков
    card: '#FFFFFF', // White card background in dark mode too
    primary: '#000000', 
    secondary: '#222222',
    // Позитив – светло-зелёный, более заметный на тёмном фоне
    success: '#006400', 
    // Опасность – яркий красный для хорошего контраста
    danger: '#8B0000', 
    warning: '#444444',
    gray: '#777777',
    lightGray: '#DDDDDD',
    border: '#EEEEEE',
    secondaryText: '#555555',
  },
};

// Обновлённые цвета для категорий, приоритетов и тегов можно тоже адаптировать.
// Ниже приведён пример, где для светлой темы (черный интерфейс) используются насыщенные темные тона,
// а для тёмной – яркие светлые оттенки.

// Пример для категорий (будут одинаковыми вне зависимости от темы, но вы можете расширить логику смены)
export const categoryColors = {
  Work: '#444444',
  Personal: '#555555',
  Health: '#666666',
  Shopping: '#777777',
  Education: '#888888',
  Finance: '#999999',
  Travel: '#AAAAAA',
  Design: '#444444',
  Research: '#555555',
  Other: '#777777',
};

// Приоритеты – для светлой темы используем более тёмные оттенки, для тёмной – более яркие
export const priorityColors = {
  low: '#999999',
  medium: '#555555',
  high: '#222222',
};

// Теги – тоже можно настроить под стиль интерфейса
export const tagColors = {
  Urgent: '#222222',
  Important: '#444444',
  Meeting: '#555555',
  Project: '#666666',
  Reminder: '#777777',
  Design: '#444444',
  Feedback: '#555555',
  Color: '#666666',
  Layout: '#555555',
  Identity: '#444444',
  Moodboard: '#555555',
  Later: '#777777',
  InProgress: '#666666',
  Review: '#555555',
};
