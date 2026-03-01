import { getUIConfig } from './config.js?v=22';
import { initializeTheme, toggleTheme, currentTheme } from './theme.js?v=20';
import { clearLegacyAuthState, getAppUrl, getCurrentUser, isSupabaseConfigured, signOutUser } from './supabase-client.js?v=20';

const SIDEBAR_STATE_KEY = 'pluggpt_sidebar_hidden';
const DEV_MODE_KEY = 'pluggpt_developer_mode';
const NAV_ICONS = {
  home: 'H',
  chat: '+',
  workspace: 'W'
};

function normalizePath(pathname) {
  if (pathname === '/index.html') {
    return '/';
  }
  return pathname;
}

function resolveAppHref(href) {
  if (href === '/' || href === '/index.html') {
    return getAppUrl('index.html');
  }
  return getAppUrl(String(href || '').replace(/^\//, ''));
}

function sameRoute(linkHref, pagePath) {
  const left = normalizePath(new URL(resolveAppHref(linkHref)).pathname);
  const right = normalizePath(pagePath);

  if (left === right) {
    return true;
  }

  if (left === '/chat.html' && right === '/chat.html') {
    return true;
  }

  return false;
}

function logoForTheme(theme) {
  return theme === 'dark'
    ? new URL('../logos/BlackBGMain.png', import.meta.url).href
    : new URL('../logos/WhiteBGMain.png', import.meta.url).href;
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';
}

function settingsModalHtml(theme, developerMode) {
  return `
    <div id="settings-modal" class="settings-overlay hidden" role="dialog" aria-modal="true">
      <div class="settings-modal-card">
        <div class="settings-modal-head">
          <div>
            <p class="muted settings-kicker">PlugGPT</p>
            <h2>Settings</h2>
          </div>
          <button id="settings-close" class="settings-close" type="button" aria-label="Close settings">×</button>
        </div>
        <div class="settings-option-row">
          <span>Light / Dark Theme</span>
          <button id="settings-theme-toggle" class="settings-switch ${theme === 'dark' ? 'is-on' : ''}" type="button" aria-pressed="${theme === 'dark' ? 'true' : 'false'}">
            <span class="settings-switch-knob"></span>
          </button>
        </div>
        <div class="settings-option-row">
          <span>Developer Mode</span>
          <button id="settings-dev-toggle" class="settings-switch ${developerMode ? 'is-on' : ''}" type="button" aria-pressed="${developerMode ? 'true' : 'false'}">
            <span class="settings-switch-knob"></span>
          </button>
        </div>
        <button id="settings-logout" class="settings-logout-btn" type="button">Log Out</button>
      </div>
    </div>
  `;
}

export async function initializeShell() {
  clearLegacyAuthState();
  const theme = initializeTheme();
  const ui = await getUIConfig();
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    return ui;
  }
  if (!isSupabaseConfigured()) {
    window.location.replace(getAppUrl('login.html'));
    return ui;
  }

  const sidebarHidden = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
  const developerMode = localStorage.getItem(DEV_MODE_KEY) === 'true';
  const { user } = await getCurrentUser();
  if (!user) {
    window.location.replace(getAppUrl('login.html'));
    return ui;
  }
  sidebar.classList.toggle('collapsed', sidebarHidden);
  document.getElementById('settings-modal')?.remove();

  const navHtml = ui.nav
    .map((item) => {
      const active = sameRoute(item.href, window.location.pathname) ? 'active' : '';
      const icon = NAV_ICONS[item.id] || item.label.charAt(0).toUpperCase();
      const resolvedHref = resolveAppHref(item.href);
      return `
        <a class="nav-link ${active}" href="${resolvedHref}" aria-label="${item.label}" title="${item.label}">
          <span class="nav-icon ${item.id === 'chat' ? 'nav-icon-plus' : ''}" aria-hidden="true">${icon}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      `;
    })
    .join('');

  sidebar.innerHTML = `
    <div class="sidebar-head">
      <div class="logo-wrap">
        <img id="brand-logo" src="${logoForTheme(theme)}" alt="The Academic Plug" />
      </div>
      <button id="sidebar-toggle" class="sidebar-toggle" type="button" aria-label="Hide sidebar">
        ${sidebarHidden ? '→' : '←'}
      </button>
    </div>
    <nav class="nav-group">${navHtml}</nav>
    <button id="theme-toggle" class="theme-toggle" type="button" aria-label="${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}" title="${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}">
      <span class="nav-icon" aria-hidden="true">${theme === 'dark' ? 'L' : 'D'}</span>
      <span class="nav-label">${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
    <div class="sidebar-user">
      <div class="sidebar-user-meta">
        <div class="sidebar-user-avatar">${getInitials(user?.user_metadata?.full_name || user?.email)}</div>
        <div class="sidebar-user-text">
          <strong>${user?.user_metadata?.full_name || user?.email || 'PlugGPT User'}</strong>
        </div>
      </div>
      <button id="settings-open" class="sidebar-settings-btn" type="button" aria-label="Open settings">⚙</button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', settingsModalHtml(theme, developerMode));

  const themeButton = document.getElementById('theme-toggle');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const settingsOpen = document.getElementById('settings-open');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');
  const settingsThemeToggle = document.getElementById('settings-theme-toggle');
  const settingsDevToggle = document.getElementById('settings-dev-toggle');
  const settingsLogout = document.getElementById('settings-logout');
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const nextTheme = toggleTheme();
      themeButton.setAttribute('aria-label', nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode');
      themeButton.setAttribute('title', nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode');
      themeButton.innerHTML = `
        <span class="nav-icon" aria-hidden="true">${nextTheme === 'dark' ? 'L' : 'D'}</span>
        <span class="nav-label">${nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      `;
      const logo = document.getElementById('brand-logo');
      if (logo) {
        logo.src = logoForTheme(currentTheme());
      }
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      const nextHidden = !sidebar.classList.contains('collapsed');
      sidebar.classList.toggle('collapsed', nextHidden);
      sidebarToggle.textContent = nextHidden ? '→' : '←';
      sidebarToggle.setAttribute('aria-label', nextHidden ? 'Expand sidebar' : 'Collapse sidebar');
      localStorage.setItem(SIDEBAR_STATE_KEY, String(nextHidden));
    });
  }

  settingsOpen?.addEventListener('click', () => {
    settingsModal?.classList.remove('hidden');
  });

  settingsClose?.addEventListener('click', () => {
    settingsModal?.classList.add('hidden');
  });

  settingsModal?.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  settingsThemeToggle?.addEventListener('click', () => {
    const nextTheme = toggleTheme();
    const isOn = nextTheme === 'dark';
    settingsThemeToggle.classList.toggle('is-on', isOn);
    settingsThemeToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    themeButton?.setAttribute('aria-label', isOn ? 'Light Mode' : 'Dark Mode');
    themeButton?.setAttribute('title', isOn ? 'Light Mode' : 'Dark Mode');
    if (themeButton) {
      themeButton.innerHTML = `
        <span class="nav-icon" aria-hidden="true">${isOn ? 'L' : 'D'}</span>
        <span class="nav-label">${isOn ? 'Light Mode' : 'Dark Mode'}</span>
      `;
    }
    const logo = document.getElementById('brand-logo');
    if (logo) {
      logo.src = logoForTheme(currentTheme());
    }
  });

  settingsDevToggle?.addEventListener('click', () => {
    const nextValue = !(localStorage.getItem(DEV_MODE_KEY) === 'true');
    localStorage.setItem(DEV_MODE_KEY, String(nextValue));
    settingsDevToggle.classList.toggle('is-on', nextValue);
    settingsDevToggle.setAttribute('aria-pressed', nextValue ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('pluggpt:developer-mode-changed', { detail: { enabled: nextValue } }));
  });

  settingsLogout?.addEventListener('click', () => {
    signOutUser().finally(() => {
      window.location.href = getAppUrl('login.html');
    });
  });

  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  return ui;
}
