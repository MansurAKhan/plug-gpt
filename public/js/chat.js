import { initializeShell } from './shell.js?v=22';
import { getUIConfig } from './config.js?v=22';
import { chat, llmHealth } from './api.js?v=22';
import { saveItem } from './storage.js?v=22';

const SUBJECT_STORAGE_KEY = 'pluggpt_subject';
const DEV_MODE_KEY = 'pluggpt_developer_mode';

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get('subject') || '',
    mode: params.get('mode') || 'chat'
  };
}

function formatSubject(subject) {
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatInline(value) {
  return value
    .replace(/\[color=(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\]([\s\S]*?)\[\/color\]/g, (_match, color, text) => `<span style="color:${color}">${text}</span>`)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
    .replace(/<u>([\s\S]*?)<\/u>/g, '<u>$1</u>')
    .replace(/\*\*([^\n*][\s\S]*?[^\n*]?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(?!\s)([^*\n]+?)\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function isTableDelimiter(line) {
  return /^\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(line.trim());
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => formatInline(cell.trim()));
}

function extractFootnotes(content) {
  const definitions = new Map();
  const bodyLines = [];

  for (const line of String(content || '').split('\n')) {
    const match = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (match) {
      definitions.set(match[1], match[2]);
      continue;
    }
    bodyLines.push(line);
  }

  return {
    body: bodyLines.join('\n'),
    definitions
  };
}

function renderMathInElement(element) {
  if (!element || typeof window.renderMathInElement !== 'function') {
    return;
  }

  window.renderMathInElement(element, {
    throwOnError: false,
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false }
    ]
  });
}

function renderDesmosGraphs(element) {
  if (!element) {
    return;
  }

  element.querySelectorAll('[data-desmos-expressions]').forEach((container) => {
    if (container.dataset.desmosReady === 'true') {
      return;
    }

    if (!window.Desmos?.GraphingCalculator) {
      if (!container.querySelector('.desmos-loading')) {
        container.innerHTML = '<div class="desmos-loading">Loading graph...</div>';
      }

      const attempt = Number(container.dataset.desmosAttempt || '0');
      if (attempt < 20) {
        container.dataset.desmosAttempt = String(attempt + 1);
        window.setTimeout(() => {
          renderDesmosGraphs(element);
        }, 250);
      } else {
        container.innerHTML = '<div class="desmos-loading">Graph could not be loaded right now.</div>';
      }
      return;
    }

    let expressions = [];
    try {
      expressions = JSON.parse(container.dataset.desmosExpressions || '[]');
    } catch (_error) {
      expressions = [];
    }

    container.innerHTML = '';
    const calculatorRoot = document.createElement('div');
    calculatorRoot.className = 'desmos-graph-canvas';
    container.appendChild(calculatorRoot);

    const calculator = window.Desmos.GraphingCalculator(calculatorRoot, {
      expressions: true,
      settingsMenu: false,
      zoomButtons: true,
      expressionsCollapsed: false
    });

    expressions
      .filter(Boolean)
      .forEach((expression, index) => {
        calculator.setExpression({
          id: `expr-${index + 1}`,
          latex: expression
        });
      });

    container.dataset.desmosReady = 'true';
  });
}

function enhanceRenderedContent(element) {
  renderMathInElement(element);
  renderDesmosGraphs(element);
}

function renderText(content) {
  const { body, definitions } = extractFootnotes(content || '');
  const escaped = escapeHtml(body);
  const codeBlocks = [];
  const withCodePlaceholders = escaped.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, language, code) => {
    const index = codeBlocks.length;
    const normalizedLanguage = String(language || '').trim().toLowerCase();
    if (normalizedLanguage === 'desmos') {
      const expressions = code
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      codeBlocks.push(`
        <section class="desmos-graph-block">
          <div class="desmos-graph-header">
            <strong>Interactive Graph</strong>
            <span>Drag, zoom, and inspect the graph.</span>
          </div>
          <div class="desmos-graph-shell" data-desmos-expressions="${escapeAttribute(JSON.stringify(expressions))}"></div>
        </section>
      `);
      return `@@CODEBLOCK_${index}@@`;
    }

    const languageClass = normalizedLanguage ? ` class="code-block language-${normalizedLanguage}"` : ' class="code-block"';
    codeBlocks.push(`<pre${languageClass}><code>${code.trim()}</code></pre>`);
    return `@@CODEBLOCK_${index}@@`;
  });

  const lines = withCodePlaceholders.split('\n');
  const parts = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^@@CODEBLOCK_\d+@@$/.test(trimmed)) {
      parts.push(trimmed);
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      parts.push('<hr/>');
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const tag = `h${level}`;
      parts.push(`<${tag}>${formatInline(headingMatch[2])}</${tag}>`);
      index += 1;
      continue;
    }

    if (
      trimmed.includes('|') &&
      index + 1 < lines.length &&
      isTableDelimiter(lines[index + 1])
    ) {
      const headers = parseTableRow(lines[index]);
      const rows = [];
      index += 2;

      while (index < lines.length) {
        const rowTrimmed = lines[index].trim();
        if (!rowTrimmed || !rowTrimmed.includes('|')) {
          break;
        }
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      parts.push(`
        <div class="table-wrap">
          <table>
            <thead>
              <tr>${headers.map((cell) => `<th>${cell}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      `);
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      const blockquoteLines = [];
      while (index < lines.length && /^>\s+/.test(lines[index].trim())) {
        blockquoteLines.push(lines[index].trim().replace(/^>\s+/, ''));
        index += 1;
      }
      parts.push(`<blockquote>${blockquoteLines.map(formatInline).join('<br/>')}</blockquote>`);
      continue;
    }

    if (/^([-*])\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^([-*])\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      parts.push(`<ul>${items.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      parts.push(`<ol>${items.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();
      if (
        !currentTrimmed ||
        /^@@CODEBLOCK_\d+@@$/.test(currentTrimmed) ||
        /^---+$/.test(currentTrimmed) ||
        /^(#{1,6})\s+/.test(currentTrimmed) ||
        /^>\s+/.test(currentTrimmed) ||
        /^[-*]\s+/.test(currentTrimmed) ||
        /^\d+\.\s+/.test(currentTrimmed) ||
        (currentTrimmed.includes('|') && index + 1 < lines.length && isTableDelimiter(lines[index + 1]))
      ) {
        break;
      }
      paragraphLines.push(currentTrimmed);
      index += 1;
    }
    parts.push(`<p>${formatInline(paragraphLines.join('<br/>'))}</p>`);
  }

  let html = parts
    .join('')
    .replace(/@@CODEBLOCK_(\d+)@@/g, (_match, blockIndex) => codeBlocks[Number(blockIndex)] || '');

  if (definitions.size) {
    html = html.replace(/\[\^([^\]]+)\]/g, (_match, id) => {
      if (!definitions.has(id)) {
        return _match;
      }
      return `<sup class="footnote-ref"><a href="#footnote-${id}" id="footnote-ref-${id}">[${id}]</a></sup>`;
    });

    const footnotes = Array.from(definitions.entries())
      .map(([id, text]) => `
        <li id="footnote-${id}">
          <span>${formatInline(text)}</span>
          <a href="#footnote-ref-${id}" class="footnote-backref">↩</a>
        </li>
      `)
      .join('');

    html += `
      <section class="footnotes">
        <hr/>
        <ol>${footnotes}</ol>
      </section>
    `;
  }

  return html;
}

function makeMessageRow(role, content, options = {}) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (role === 'assistant') {
    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = 'PlugGPT';
    bubble.appendChild(label);
  }

  const text = document.createElement('div');
  text.className = 'message-text';
  text.innerHTML = renderText(content);
  enhanceRenderedContent(text);
  bubble.appendChild(text);

  if (role === 'assistant' && options.withActions) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const copyButton = document.createElement('button');
    copyButton.className = 'small-btn';
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(content || '');
    });

    const saveButton = document.createElement('button');
    saveButton.className = 'small-btn';
    saveButton.type = 'button';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => {
      const title = (content || '').slice(0, 60) || 'Saved Response';
      saveItem({
        title,
        content,
        subject: options.subject,
        mode: options.mode,
        tags: [options.subject || 'general', options.mode || 'chat']
      });
      saveButton.textContent = 'Saved';
      setTimeout(() => {
        saveButton.textContent = 'Save';
      }, 900);
    });

    actions.appendChild(copyButton);
    actions.appendChild(saveButton);
    bubble.appendChild(actions);
  }

  row.appendChild(bubble);
  return row;
}

function disableChatInput(input, send, disabled) {
  input.disabled = disabled;
  send.disabled = disabled;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeAssistantMessage(row, fullContent, options = {}) {
  const textEl = row.querySelector('.message-text');
  if (!textEl) {
    return;
  }

  const normalized = String(fullContent || '');
  const total = normalized.length;
  const delay = total > 900 ? 8 : total > 300 ? 12 : 18;

  textEl.classList.add('typing-cursor');
  textEl.textContent = '';

  for (let i = 0; i <= total; i++) {
    textEl.textContent = normalized.slice(0, i);
    if (i % 4 === 0) {
      await sleep(delay);
    }
  }

  textEl.classList.remove('typing-cursor');
  textEl.innerHTML = renderText(normalized);
  enhanceRenderedContent(textEl);

  if (options.withActions) {
    const bubble = row.querySelector('.message-bubble');
    if (!bubble) {
      return;
    }

    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const copyButton = document.createElement('button');
    copyButton.className = 'small-btn';
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(normalized);
    });

    const saveButton = document.createElement('button');
    saveButton.className = 'small-btn';
    saveButton.type = 'button';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => {
      const title = normalized.slice(0, 60) || 'Saved Response';
      saveItem({
        title,
        content: normalized,
        subject: options.subject,
        mode: options.mode,
        tags: [options.subject || 'general', options.mode || 'chat']
      });
      saveButton.textContent = 'Saved';
      setTimeout(() => {
        saveButton.textContent = 'Save';
      }, 900);
    });

    actions.appendChild(copyButton);
    actions.appendChild(saveButton);
    bubble.appendChild(actions);
  }
}

function updateConnectionBadge(data, err) {
  const badge = document.getElementById('connection-badge');
  if (!badge) {
    return;
  }

  const developerMode = localStorage.getItem(DEV_MODE_KEY) === 'true';
  badge.style.display = developerMode ? 'inline-flex' : 'none';
  if (!developerMode) {
    return;
  }

  badge.classList.remove('ok', 'warn', 'error');

  if (err) {
    badge.classList.add('error');
    badge.textContent = `LLM offline: ${err.message}`;
    return;
  }

  const providers = data?.providers || {};
  const available = Object.entries(providers).find(([, info]) => info?.status === 'ok' || info?.status === 'degraded');

  if (!available) {
    badge.classList.add('error');
    badge.textContent = 'LLM offline: no provider currently available';
    return;
  }

  const [name, info] = available;
  if (info.status === 'degraded') {
    badge.classList.add('warn');
    badge.textContent = `LLM connected (degraded): ${name} • ${info.selected_model || 'unknown model'}`;
    return;
  }

  badge.classList.add('ok');
  badge.textContent = `LLM connected: ${name} • ${info.selected_model || 'unknown model'}`;
}

function buildSubjectModal(subjects, preselectedId) {
  const modal = document.getElementById('subject-modal');
  const optionsEl = document.getElementById('subject-options');
  const confirmBtn = document.getElementById('subject-confirm');

  if (!modal || !optionsEl || !confirmBtn) {
    return { open: () => {}, selected: () => null, close: () => {} };
  }

  let selectedSubjectId = preselectedId || '';

  function renderCards() {
    optionsEl.innerHTML = subjects
      .map((subject) => {
        const activeClass = subject.id === selectedSubjectId ? 'active' : '';
        return `
          <button type="button" class="subject-card subject-choice ${activeClass}" data-subject-id="${subject.id}">
            <div class="subject-icon" style="background:${subject.color};">${subject.icon}</div>
            <h3>${subject.name}</h3>
          </button>
        `;
      })
      .join('');

    optionsEl.querySelectorAll('[data-subject-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedSubjectId = btn.getAttribute('data-subject-id') || '';
        renderCards();
        confirmBtn.disabled = !selectedSubjectId;
      });
    });
  }

  renderCards();
  confirmBtn.disabled = !selectedSubjectId;

  return {
    open: () => modal.classList.remove('hidden'),
    close: () => modal.classList.add('hidden'),
    selected: () => selectedSubjectId,
    onConfirm: (handler) => {
      confirmBtn.addEventListener('click', () => {
        if (!selectedSubjectId) {
          return;
        }
        handler(selectedSubjectId);
      });
    }
  };
}

(async function start() {
  await initializeShell();
  const ui = await getUIConfig();
  try {
    const health = await llmHealth();
    updateConnectionBadge(health, null);
  } catch (err) {
    updateConnectionBadge(null, err);
  }

  window.addEventListener('pluggpt:developer-mode-changed', async () => {
    try {
      const health = await llmHealth();
      updateConnectionBadge(health, null);
    } catch (err) {
      updateConnectionBadge(null, err);
    }
  });

  const { subject: querySubject, mode } = parseParams();
  const storedSubject = localStorage.getItem(SUBJECT_STORAGE_KEY) || '';

  const subjects = Array.isArray(ui.subjects) ? ui.subjects : [];
  const validSubjectIds = new Set(subjects.map((s) => s.id));

  const preselected = validSubjectIds.has(querySubject)
    ? querySubject
    : (validSubjectIds.has(storedSubject) ? storedSubject : '');

  const title = document.getElementById('chat-title');
  const messagesEl = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  if (!messagesEl || !form || !input || !send || !title) {
    return;
  }

  let currentSubject = '';

  disableChatInput(input, send, true);

  const modal = buildSubjectModal(subjects, preselected);
  modal.open();

  modal.onConfirm((subjectId) => {
    currentSubject = subjectId;
    localStorage.setItem(SUBJECT_STORAGE_KEY, subjectId);
    title.textContent = `${formatSubject(currentSubject)} Chat`;
    messagesEl.innerHTML = '';
    messagesEl.appendChild(
      makeMessageRow('assistant', `Subject locked to ${formatSubject(currentSubject)}. You can begin chatting now.`, { withActions: false })
    );
    modal.close();
    disableChatInput(input, send, false);
    input.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || !currentSubject) {
      return;
    }

    send.disabled = true;
    input.disabled = true;

    messagesEl.appendChild(makeMessageRow('user', text));
    const pending = makeMessageRow('assistant', 'Thinking...', { withActions: false });
    messagesEl.appendChild(pending);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    input.value = '';

    try {
      const response = await chat({
        message: text,
        subject: currentSubject,
        mode,
        context: ''
      });
      try {
        const health = await llmHealth();
        updateConnectionBadge(health, null);
      } catch (_err) {
      }

      const finalRow = makeMessageRow('assistant', '', { withActions: false });
      pending.replaceWith(finalRow);
      await typeAssistantMessage(
        finalRow,
        response.message || 'No response from server.',
        {
          withActions: true,
          subject: currentSubject,
          mode
        }
      );
    } catch (error) {
      pending.replaceWith(
        makeMessageRow('assistant', `Error contacting server: ${error.message}`, { withActions: false })
      );
    } finally {
      send.disabled = false;
      input.disabled = false;
      input.focus();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  });
})();
