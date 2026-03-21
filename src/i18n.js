/**
 * DaoMark — i18n 国际化模块
 * 轻量自实现，大道至简
 */

import zhLocale from './locales/zh.json';
import enLocale from './locales/en.json';

const STORAGE_KEY = 'daomark-lang';
const locales = { zh: zhLocale, en: enLocale };
let currentLang = 'zh';
let onLangChangeCallbacks = [];

/** 获取嵌套路径的值 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : path), obj);
}

/** 翻译函数 */
export function t(key, params = {}) {
  let text = getNestedValue(locales[currentLang], key);
  if (typeof text !== 'string') return key;
  // 替换 {param} 占位符
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return text;
}

/** 获取当前语言 */
export function getLang() {
  return currentLang;
}

/** 切换语言 */
export function setLang(lang) {
  if (!locales[lang]) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyDOMTranslations();
  onLangChangeCallbacks.forEach(cb => cb(lang));
}

/** 切换中英文 */
export function toggleLang() {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
}

/** 注册语言变更回调 */
export function onLangChange(cb) {
  onLangChangeCallbacks.push(cb);
}

/** 将翻译应用到 DOM 中带 data-i18n 属性的元素 */
function applyDOMTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text !== key) el.textContent = text;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const text = t(key);
    if (text !== key) el.setAttribute('title', text);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text !== key) el.setAttribute('placeholder', text);
  });
}

/** 初始化 i18n */
export function initI18n() {
  // 优先 localStorage，其次浏览器语言
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && locales[saved]) {
    currentLang = saved;
  } else {
    const browserLang = navigator.language || navigator.userLanguage || 'zh';
    currentLang = browserLang.startsWith('zh') ? 'zh' : 'en';
  }
  applyDOMTranslations();
}
