import { getApiBase } from './config.js?v=20';

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function getApiBases() {
  const local = window.location.origin
    ? `${window.location.origin}/api`
    : '';
  return unique([
    getApiBase(),
    '/api',
    local,
    'http://localhost:8000/api'
  ]);
}

async function post(path, payload) {
  let lastError = null;

  for (const base of getApiBases()) {
    try {
      const resp = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = data?.detail?.error || data?.error || `Request failed: ${resp.status}`;
        throw new Error(message);
      }

      return data;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  const details = lastError?.message || 'Network request failed';
  throw new Error(`Unable to reach API. ${details}. Check server is running on http://localhost:8000.`);
}

export function chat(payload) {
  return post('/chat', payload);
}

export function explain(payload) {
  return post('/tools/explain', payload);
}

export function breakdown(payload) {
  return post('/tools/breakdown', payload);
}

export function mathSolve(payload) {
  return post('/tools/math-solve', payload);
}

export function rewrite(payload) {
  return post('/tools/rewrite', payload);
}

export function grammarFix(payload) {
  return post('/tools/grammar-fix', payload);
}

export function essayBuilder(payload) {
  return post('/tools/essay-builder', payload);
}

export function ibTool(payload) {
  return post('/tools/ib-tool', payload);
}

export async function llmHealth() {
  let lastError = null;
  for (const base of getApiBases()) {
    try {
      const resp = await fetch(`${base}/llm/health`);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.detail?.error || `Request failed: ${resp.status}`);
      }
      return data;
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw new Error(lastError?.message || 'Unable to reach API health endpoint');
}
