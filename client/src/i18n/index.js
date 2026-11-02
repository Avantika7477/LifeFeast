import en from './en.js';
import hi from './hi.js';
import es from './es.js';
import fr from './fr.js';
import de from './de.js';
import pt from './pt.js';
import ar from './ar.js';
import zh from './zh.js';
import ja from './ja.js';

export const DEFAULT_LANG = 'en';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', locale: 'en-US', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', locale: 'hi-IN', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', locale: 'es-ES', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', locale: 'fr-FR', dir: 'ltr' },
  { code: 'de', name: 'German', native: 'Deutsch', locale: 'de-DE', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português', locale: 'pt-BR', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', locale: 'ar', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', native: '中文', locale: 'zh-CN', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', locale: 'ja-JP', dir: 'ltr' },
];

export const LANG_CODES = LANGUAGES.map((l) => l.code);

const RAW = { en, hi, es, fr, de, pt, ar, zh, ja };

function deepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(over)) {
    const value = over[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(base?.[key] || {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const DICTS = Object.fromEntries(LANG_CODES.map((code) => [code, code === 'en' ? en : deepMerge(en, RAW[code] || {})]));

export function isLang(code) {
  return LANG_CODES.includes(code);
}

export function langMeta(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function fill(str, vars = {}) {
  return String(str).replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])));
}

export function tWithLang(code, key, vars) {
  const lang = isLang(code) ? code : DEFAULT_LANG;
  const raw = getPath(DICTS[lang], key) ?? getPath(en, key) ?? key;
  return fill(raw, vars);
}

export function tStored(key, vars) {
  let code = DEFAULT_LANG;
  try {
    code = localStorage.getItem('lq_lang') || DEFAULT_LANG;
  } catch {
    /* ignore */
  }
  return tWithLang(code, key, vars);
}

const CAT_KEYS = {
  Health: 'habits.catHealth',
  Fitness: 'habits.catFitness',
  Study: 'habits.catStudy',
  Coding: 'habits.catCoding',
  Finance: 'habits.catFinance',
  Meditation: 'habits.catMeditation',
  Reading: 'habits.catReading',
  Business: 'habits.catBusiness',
  Personal: 'habits.catPersonal',
};

const DIFF_KEYS = { Easy: 'habits.easy', Medium: 'habits.medium', Hard: 'habits.hard' };

export function catLabel(t, cat) {
  return CAT_KEYS[cat] ? t(CAT_KEYS[cat]) : cat;
}

export function diffLabel(t, diff) {
  return DIFF_KEYS[diff] ? t(DIFF_KEYS[diff]) : diff;
}
