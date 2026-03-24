import { initializeShell } from './shell.js?v=22';
import { getSavedItems, deleteItem } from './storage.js?v=22';

const state = {
  search: '',
  tag: null
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function renderText(content) {
  const { body, definitions } = extractFootnotes(content || '');
  const escaped = escapeHtml(body);
  const codeBlocks = [];
  const withCodePlaceholders = escaped.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, language, code) => {
    const index = codeBlocks.length;
    const languageClass = language ? ` class="code-block language-${language}"` : ' class="code-block"';
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
      parts.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.includes('|') && index + 1 < lines.length && isTableDelimiter(lines[index + 1])) {
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
      const currentTrimmed = lines[index].trim();
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

  let html = parts.join('').replace(/@@CODEBLOCK_(\d+)@@/g, (_match, blockIndex) => codeBlocks[Number(blockIndex)] || '');

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

function exportItem(item) {
  const blob = new Blob([item.content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function filteredItems(items) {
  return items.filter((item) => {
    const search = state.search.toLowerCase();
    const searchMatch =
      item.title.toLowerCase().includes(search) || item.content.toLowerCase().includes(search);
    const tagMatch = !state.tag || item.tags.includes(state.tag);
    return searchMatch && tagMatch;
  });
}

function renderTags(items) {
  const tagRow = document.getElementById('tag-row');
  if (!tagRow) {
    return;
  }

  const tags = Array.from(new Set(items.flatMap((item) => item.tags || [])));
  const allButtons = [
    `<button type="button" class="inline-btn ${state.tag === null ? 'active' : ''}" data-tag="">All</button>`
  ];

  tags.forEach((tag) => {
    allButtons.push(
      `<button type="button" class="inline-btn ${state.tag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`
    );
  });

  tagRow.innerHTML = allButtons.join('');
  tagRow.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.tag = button.dataset.tag || null;
      render();
    });
  });
}

function renderItems(items) {
  const list = document.getElementById('workspace-list');
  const empty = document.getElementById('workspace-empty');
  if (!list || !empty) {
    return;
  }

  const data = filteredItems(items);

  if (!data.length) {
    empty.style.display = 'block';
    list.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = data
    .map(
      (item) => `
      <article class="panel">
        <div class="saved-item-head">
          <div>
            <h2>${item.title}</h2>
            <p class="muted">${new Date(item.timestamp).toLocaleString()}</p>
            <p class="muted">${(item.tags || []).join(', ')}</p>
          </div>
          <div class="saved-actions">
            <button type="button" class="small-btn" data-action="export" data-id="${item.id}">Export</button>
            <button type="button" class="small-btn" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
        <div class="message-text saved-content">${renderText(item.content)}</div>
      </article>
    `
    )
    .join('');

  list.querySelectorAll('.saved-content').forEach((element) => {
    renderMathInElement(element);
  });

  list.querySelectorAll('button').forEach((button) => {
    const item = items.find((it) => it.id === button.dataset.id);
    if (!item) {
      return;
    }

    button.addEventListener('click', () => {
      if (button.dataset.action === 'export') {
        exportItem(item);
      }

      if (button.dataset.action === 'delete') {
        deleteItem(item.id);
        render();
      }
    });
  });
}

function render() {
  const items = getSavedItems();
  renderTags(items);
  renderItems(items);
}

(async function start() {
  await initializeShell();
  const search = document.getElementById('workspace-search');
  if (search) {
    search.addEventListener('input', () => {
      state.search = search.value || '';
      render();
    });
  }
  render();
})();
