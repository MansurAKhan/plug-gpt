import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const LEGACY_KEYS = ['pluggpt_users', 'pluggpt_session'];

function normalizeConfigValue(value) {
  return String(value || '').trim();
}

function configuredUrl() {
  return normalizeConfigValue(SUPABASE_URL);
}

function configuredKey() {
  return normalizeConfigValue(SUPABASE_ANON_KEY);
}

export function isSupabaseConfigured() {
  const url = configuredUrl();
  const key = configuredKey();
  return Boolean(url && key && !url.includes('YOUR-PROJECT') && !key.includes('YOUR_SUPABASE_ANON_KEY'));
}

export function getAppUrl(page = 'login.html') {
  const normalizedPage = String(page || 'login.html').replace(/^\//, '');
  return new URL(`../${normalizedPage}`, import.meta.url).href;
}

export function clearLegacyAuthState() {
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function hasRecoveryParams() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return query.get('type') === 'recovery' || hash.get('type') === 'recovery';
}

let supabase = null;

if (isSupabaseConfigured()) {
  supabase = createClient(configuredUrl(), configuredKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Update supabase-config.js with your project URL and anon key.');
  }
  return supabase;
}

export async function getSession() {
  return getSupabaseClient().auth.getSession();
}

export async function getCurrentUser() {
  const { data, error } = await getSession();
  if (error) {
    return { user: null, error };
  }
  return { user: data.session?.user || null, error: null };
}

export async function signUpWithEmail({ name, email, password }) {
  return getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: String(name || '').trim()
      },
      emailRedirectTo: getAppUrl('login.html')
    }
  });
}

export async function signInWithEmail({ email, password }) {
  return getSupabaseClient().auth.signInWithPassword({
    email,
    password
  });
}

export async function sendPasswordReset(email) {
  return getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: getAppUrl('login.html')
  });
}

export async function updatePassword(password) {
  return getSupabaseClient().auth.updateUser({
    password
  });
}

export async function signOutUser() {
  return getSupabaseClient().auth.signOut();
}

export function onAuthStateChange(handler) {
  return getSupabaseClient().auth.onAuthStateChange(handler);
}
