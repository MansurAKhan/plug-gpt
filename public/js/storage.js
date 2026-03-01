const STORAGE_KEY = 'pluggpt_saved_items';

export function getSavedItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

export function saveItem({ title, content, subject = 'general', mode = 'chat', tags = [] }) {
  const items = getSavedItems();
  const next = {
    id: Date.now().toString(),
    title,
    content,
    subject,
    mode,
    tags,
    timestamp: new Date().toISOString()
  };

  items.unshift(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return next;
}

export function deleteItem(id) {
  const next = getSavedItems().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
