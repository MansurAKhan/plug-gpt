import { initializeShell } from './shell.js?v=22';
import { getSavedItems, deleteItem } from './storage.js?v=22';

const state = {
  search: '',
  tag: null
};

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
        <pre>${item.content}</pre>
      </article>
    `
    )
    .join('');

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
