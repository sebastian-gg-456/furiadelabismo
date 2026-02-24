// src/services/translations.js
const PROJECT_ID = import.meta.env.VITE_TRADUCILA_PROJECT_ID || import.meta.env.VITE_TRADUCILA_PROJECT || null;
let translations = null;

export async function getTranslations(lang, callback) {
  translations = null;
  // default Spanish (es) does not require fetching
  if (!lang || lang === 'es') {
    if (callback) callback();
    return;
  }

  if (!PROJECT_ID) {
    console.warn('VITE_TRADUCILA_PROJECT_ID not set. Cannot fetch translations.');
    if (callback) callback();
    return;
  }

  try {
    const res = await fetch(`https://traducila.vercel.app/api/translations/${PROJECT_ID}/${lang}`);
    const data = await res.json();
    translations = data;
    try { localStorage.setItem('translations', JSON.stringify(data)); } catch(e) {}
    if (callback) callback();
  } catch (e) {
    console.warn('Failed to fetch translations', e);
    if (callback) callback();
  }
}

export function getPhrase(key) {
  if (!key) return '';
  if (!translations) {
    try {
      const locals = localStorage.getItem('translations');
      translations = locals ? JSON.parse(locals) : null;
    } catch (e) {
      translations = null;
    }
  }

  let phrase = key;
  const keys = translations?.data?.words;
  if (keys && Array.isArray(keys)) {
    const translation = keys.find((item) => item.key === key);
    if (translation && translation.translate) {
      phrase = translation.translate;
    }
  }

  return phrase;
}
