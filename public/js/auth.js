import { getAppUrl, getCurrentUser, signInWithEmail, signOutUser, signUpWithEmail } from './supabase-client.js?v=20';

export async function redirectIfAuthenticated() {
  const { user } = await getCurrentUser();
  if (user) {
    window.location.replace(getAppUrl('chat.html'));
    return true;
  }
  return false;
}

export async function ensureAuthenticated() {
  const { user } = await getCurrentUser();
  if (!user) {
    window.location.replace(getAppUrl('login.html'));
    throw new Error('Authentication required');
  }
  return user;
}

export async function loginUser(payload) {
  return signInWithEmail(payload);
}

export async function createUser(payload) {
  return signUpWithEmail(payload);
}

export async function signOut() {
  await signOutUser();
  window.location.replace(getAppUrl('login.html'));
}
