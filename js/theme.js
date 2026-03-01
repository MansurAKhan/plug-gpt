const STORAGE_KEY = 'theme';

export function initializeTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  document.documentElement.classList.toggle('dark', saved === 'dark');
  return saved;
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEY, theme);
  return theme;
}

export function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
