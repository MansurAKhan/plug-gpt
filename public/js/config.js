import { API_BASE_URL } from './app-config.js';

let cachedUI = null;

export async function getUIConfig() {
  if (cachedUI) {
    return cachedUI;
  }

  const configUrl = new URL('../config/ui.json?v=22', import.meta.url);
  const resp = await fetch(configUrl, { cache: 'no-store' });
  if (!resp.ok) {
    throw new Error('Failed to load UI configuration');
  }

  cachedUI = await resp.json();
  return cachedUI;
}

export function getApiBase() {
  const configuredBase = String(API_BASE_URL || '').trim().replace(/\/$/, '');
  if (configuredBase) {
    return configuredBase;
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  return '/api';
}
