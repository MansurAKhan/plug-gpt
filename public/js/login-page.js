import {
  clearLegacyAuthState,
  getAppUrl,
  getCurrentUser,
  hasRecoveryParams,
  isSupabaseConfigured,
  onAuthStateChange,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updatePassword
} from './supabase-client.js';

const state = {
  view: 'login',
  recovery: false
};

function setFeedback(message, type = 'error') {
  const feedback = document.getElementById('auth-feedback');
  if (!feedback) {
    return;
  }
  feedback.textContent = message || '';
  feedback.classList.toggle('is-success', type === 'success');
}

function updateHeader(view) {
  const eyebrow = document.getElementById('auth-eyebrow');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');

  const copy = {
    login: ['Welcome back', 'Log in to PlugGPT', 'Access your saved chats and workspace.'],
    signup: ['New account', 'Create your account', 'Use email and password to create your PlugGPT account.'],
    forgot: ['Reset access', 'Forgot your password?', 'Enter your email and we will send you a reset link.'],
    reset: ['Recovery mode', 'Set a new password', 'Choose a new password for your account.']
  }[view];

  if (eyebrow) {
    eyebrow.textContent = copy[0];
  }
  if (title) {
    title.textContent = copy[1];
  }
  if (subtitle) {
    subtitle.textContent = copy[2];
  }
}

function setView(view) {
  state.view = view;
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const modeSwitch = document.querySelector('.mode-switch');
  const panels = document.querySelectorAll('[data-auth-panel]');

  const signupView = view === 'signup';
  loginTab?.classList.toggle('is-active', view === 'login');
  signupTab?.classList.toggle('is-active', signupView);

  if (modeSwitch) {
    modeSwitch.style.display = view === 'forgot' || view === 'reset' ? 'none' : 'grid';
  }

  panels.forEach((panel) => {
    const active = panel.dataset.authPanel === view;
    panel.classList.toggle('auth-form-hidden', !active);
    panel.setAttribute('aria-hidden', active ? 'false' : 'true');
  });

  updateHeader(view);
  setFeedback('');
}

async function redirectIfAuthenticated() {
  const { user } = await getCurrentUser();
  if (user && !hasRecoveryParams()) {
    window.location.replace(getAppUrl('chat.html'));
    return true;
  }
  return false;
}

function bindModeButtons() {
  document.getElementById('login-tab')?.addEventListener('click', () => setView('login'));
  document.getElementById('signup-tab')?.addEventListener('click', () => setView('signup'));
  document.getElementById('forgot-password-link')?.addEventListener('click', () => setView('forgot'));
  document.getElementById('forgot-back-link')?.addEventListener('click', () => setView('login'));
}

function bindLoginForm() {
  const form = document.getElementById('login-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector('input[name="email"]')?.value || '';
    const password = form.querySelector('input[name="password"]')?.value || '';

    try {
      const { error } = await signInWithEmail({ email, password });
      if (error) {
        throw error;
      }
      setFeedback('Login successful. Opening your workspace...', 'success');
      window.setTimeout(() => {
        window.location.replace(getAppUrl('chat.html'));
      }, 700);
    } catch (error) {
      setFeedback(error.message || 'Unable to log in.');
    }
  });
}

function bindSignupForm() {
  const form = document.getElementById('signup-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = form.querySelector('input[name="name"]')?.value || '';
    const email = form.querySelector('input[name="email"]')?.value || '';
    const password = form.querySelector('input[name="password"]')?.value || '';
    const termsConsent = form.querySelector('input[name="termsConsent"]')?.checked;

    if (!termsConsent) {
      setFeedback('You must agree to the terms and conditions to create an account.');
      return;
    }

    try {
      const { data, error } = await signUpWithEmail({ name, email, password });
      if (error) {
        throw error;
      }
      if (data.session) {
        setFeedback('Account created. Opening your workspace...', 'success');
        window.setTimeout(() => {
          window.location.replace(getAppUrl('chat.html'));
        }, 700);
        return;
      }
      setFeedback('Account created. Check your email to confirm your account.', 'success');
    } catch (error) {
      setFeedback(error.message || 'Unable to create account.');
    }
  });
}

function bindForgotForm() {
  const form = document.getElementById('forgot-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector('input[name="email"]')?.value || '';

    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        throw error;
      }
      setFeedback('Reset email sent. Check your inbox for the password reset link.', 'success');
    } catch (error) {
      setFeedback(error.message || 'Unable to send reset email.');
    }
  });
}

function bindResetForm() {
  const form = document.getElementById('reset-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = form.querySelector('input[name="password"]')?.value || '';
    const confirmPassword = form.querySelector('input[name="confirmPassword"]')?.value || '';

    if (!password.trim()) {
      setFeedback('Enter a new password.');
      return;
    }
    if (password !== confirmPassword) {
      setFeedback('Passwords do not match.');
      return;
    }

    try {
      const { error } = await updatePassword(password);
      if (error) {
        throw error;
      }
      setFeedback('Password updated. Opening your workspace...', 'success');
      window.setTimeout(() => {
        window.location.replace(getAppUrl('chat.html'));
      }, 700);
    } catch (error) {
      setFeedback(error.message || 'Unable to update your password.');
    }
  });
}

async function start() {
  clearLegacyAuthState();

  if (!isSupabaseConfigured()) {
    setFeedback('Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.');
    setView('login');
    return;
  }

  bindModeButtons();
  bindLoginForm();
  bindSignupForm();
  bindForgotForm();
  bindResetForm();

  onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      state.recovery = true;
      setView('reset');
      setFeedback('Recovery link accepted. Enter your new password.', 'success');
    }

    if (event === 'SIGNED_IN' && !state.recovery && state.view !== 'forgot' && state.view !== 'reset') {
      window.location.replace(getAppUrl('chat.html'));
    }
  });

  if (hasRecoveryParams()) {
    state.recovery = true;
    setView('reset');
    return;
  }

  if (await redirectIfAuthenticated()) {
    return;
  }

  setView('login');
}

start();
