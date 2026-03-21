/**
 * DaoMark — App Entry
 *
 * The Dao that can be told is not the eternal Dao.
 * 大道至简。
 */

import './styles/index.css';
import { initI18n, toggleLang } from './i18n.js';
import { initEditor } from './editor.js';
import { initToolbar } from './toolbar.js';
import { initFileOps } from './file-ops.js';
import { initTheme } from './theme.js';

function init() {
  // Theme first to avoid flash
  initTheme();

  // i18n
  initI18n();

  // Core modules
  initEditor();
  initToolbar();
  initFileOps();

  // Language toggle button
  const btnLang = document.getElementById('btn-lang');
  if (btnLang) btnLang.addEventListener('click', toggleLang);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
