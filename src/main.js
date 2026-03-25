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
import { initFileOps, newDocument, openFile, saveFile, saveFileAs, exportHTML } from './file-ops.js';
import { initTheme } from './theme.js';
import { initSearch, openSearch, closeSearch } from './search.js';
import { showShortcuts, showAbout } from './help.js';
import { printDocument } from './print.js';

/** Listen for Tauri menu events */
async function initMenuListener() {
  if (!window.__TAURI_INTERNALS__) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    win.listen('menu-action', (event) => {
      // Only respond in the focused window to avoid duplicates across multi-window
      if (!document.hasFocus()) return;

      const action = event.payload;
      switch (action) {
        case 'file-new': newDocument(); break;
        case 'file-open': openFile(); break;
        case 'file-save': saveFile(); break;
        case 'file-save-as': saveFileAs(); break;
        case 'file-export': exportHTML(); break;
        case 'file-print': printDocument(); break;
        case 'edit-find': openSearch(false); break;
        case 'edit-replace': openSearch(true); break;
        case 'help-shortcuts': showShortcuts(); break;
        case 'help-about': showAbout(); break;
      }
    });
  } catch (e) {
    console.warn('Menu listener not available:', e);
  }
}

function init() {
  // Theme first to avoid flash
  initTheme();

  // i18n
  initI18n();

  // Core modules
  initEditor();
  initToolbar();
  initFileOps();
  initSearch();

  // Language toggle button
  const btnLang = document.getElementById('btn-lang');
  if (btnLang) btnLang.addEventListener('click', toggleLang);

  // Keyboard shortcuts (capture phase for Tauri WKWebView compatibility)
  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;

    switch (e.key) {
      case 'f':
        e.preventDefault();
        e.stopPropagation();
        openSearch(false);
        break;
      case 'h':
        e.preventDefault();
        e.stopPropagation();
        openSearch(true);
        break;
      case '/':
        e.preventDefault();
        e.stopPropagation();
        showShortcuts();
        break;
    }
  }, true);

  // Tauri menu events
  initMenuListener();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
