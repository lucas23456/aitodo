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
    error: '#D32F2F',  // Error color for light theme
    gray: '#777777',
    lightGray: '#DDDDDD',
    border: '#EEEEEE',
    secondaryText: '#555555',
  },
  dark: {
    text: '#FFFFFF', // White text for dark mode
    background: '#121212', // Dark background (slightly lighter than pure black)
    card: '#242424', // Slightly lighter than background for cards
    primary: '#7DBBF5', // Light blue for primary color in dark mode
    secondary: '#BBBBBB', // Light gray for secondary elements
    success: '#4CAF50', // Brighter green for success
    danger: '#F44336', // Brighter red for danger
    warning: '#FFC107', // Amber yellow for warning
    error: '#EF5350',  // Error color for dark theme
    gray: '#888888', // Gray color
    lightGray: '#333333', // Light gray for dark theme
    border: '#333333', // Border color
    secondaryText: '#AAAAAA', // Secondary text
  },
};

// Обновлённые цвета для категорий, приоритетов и тегов можно тоже адаптировать.
// Ниже приведён пример, где для светлой темы (черный интерфейс) используются насыщенные темные тона,
// а для тёмной – яркие светлые оттенки.

// Пример для категорий (будут одинаковыми вне зависимости от темы, но вы можете расширить логику смены)
export const categoryColors = {
  Work: '#4A6FAA',
  Personal: '#6B82D1',
  Health: '#4CAF50',
  Shopping: '#8E67AB',
  Education: '#5D8ADE',
  Finance: '#3B8276',
  Travel: '#D68B60',
  Design: '#EB6777',
  Research: '#7E629A',
  Other: '#666666',
};

// Приоритеты – для светлой темы используем более тёмные оттенки, для тёмной – более яркие
export const priorityColors = {
  low: '#909090',      // Светло-серый для низкого приоритета
  medium: '#FFC107',   // Жёлтый для среднего
  high: '#F44336',     // Красный для высокого
};

// Теги – тоже можно настроить под стиль интерфейса
export const tagColors = {
  Urgent: '#F44336',
  Important: '#FFC107',
  Meeting: '#4A6FAA',
  Project: '#6B82D1',
  Reminder: '#4CAF50',
  Design: '#EB6777',
  Feedback: '#8E67AB',
  Color: '#D68B60',
  Layout: '#5D8ADE',
  Identity: '#7E629A',
  Moodboard: '#3B8276',
  Later: '#909090',
  InProgress: '#039BE5',
  Review: '#673AB7',
};

// Predefined colors to use for custom tags
export const customTagColors = [
  '#4285F4', // Google Blue
  '#0F9D58', // Google Green
  '#F4B400', // Google Yellow
  '#DB4437', // Google Red
  '#4A148C', // Deep Purple
  '#006064', // Teal
  '#E65100', // Orange
  '#C2185B', // Pink
  '#33691E', // Green
  '#01579B', // Light Blue
  '#3E2723', // Brown
  '#263238', // Blue Grey
  '#8E24AA', // Purple
  '#00796B', // Teal
  '#0097A7', // Cyan
];

// Function to get a color for a custom tag based on the tag name
export const getTagColor = (tag: string): string => {
  // First check if it's a predefined tag
  if (tagColors[tag as keyof typeof tagColors]) {
    return tagColors[tag as keyof typeof tagColors];
  }
  
  // Otherwise use a hash of the tag name to get a consistent color
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to pick a color from our predefined custom colors
  const colorIndex = Math.abs(hash) % customTagColors.length;
  return customTagColors[colorIndex];
};
