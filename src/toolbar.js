/**
 * DaoMark — Toolbar
 */

import { insertText, toggleLinePrefix } from './editor.js';
import { t, onLangChange } from './i18n.js';

const VIEW_MODES = ['split', 'editor-only', 'preview-only'];
let currentViewIndex = 0;

function bindButtons() {
  const actions = {
    'btn-bold':          () => insertText('**', '**', t('format.boldPlaceholder')),
    'btn-italic':        () => insertText('*', '*', t('format.italicPlaceholder')),
    'btn-strikethrough': () => insertText('~~', '~~', t('format.strikePlaceholder')),
    'btn-heading':       () => toggleLinePrefix('## '),
    'btn-quote':         () => toggleLinePrefix('> '),
    'btn-code':          () => insertText('`', '`', t('format.codePlaceholder')),
    'btn-codeblock':     () => insertText('\n```\n', '\n```\n', t('format.codePlaceholder')),
    'btn-ul':            () => toggleLinePrefix('- '),
    'btn-ol':            () => toggleLinePrefix('1. '),
    'btn-task':          () => toggleLinePrefix('- [ ] '),
    'btn-link':          () => insertText('[', '](url)', t('format.linkPlaceholder')),
    'btn-image':         () => insertText('![', '](url)', t('format.imagePlaceholder')),
    'btn-hr':            () => insertText('\n\n---\n\n'),
    'btn-table':         () => insertText(t('format.tableSample')),
    'btn-view-mode':     () => cycleViewMode(),
  };

  Object.entries(actions).forEach(([id, handler]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  });
}

function cycleViewMode() {
  currentViewIndex = (currentViewIndex + 1) % VIEW_MODES.length;
  const mode = VIEW_MODES[currentViewIndex];
  const container = document.getElementById('editor-container');
  if (container) container.setAttribute('data-view', mode);

  const btn = document.getElementById('btn-view-mode');
  if (btn) {
    const icons = {
      'split': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
      'editor-only': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>`,
      'preview-only': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h10"/></svg>`,
    };
    btn.innerHTML = icons[mode];
  }
}

function bindShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;
    const key = e.key.toLowerCase();

    if (e.shiftKey && key === 'k') { e.preventDefault(); insertText('\n```\n', '\n```\n', t('format.codePlaceholder')); return; }
    if (e.shiftKey && key === 'x') { e.preventDefault(); insertText('~~', '~~', t('format.strikePlaceholder')); return; }

    const shortcuts = {
      'b': () => insertText('**', '**', t('format.boldPlaceholder')),
      'i': () => insertText('*', '*', t('format.italicPlaceholder')),
      'k': () => insertText('[', '](url)', t('format.linkPlaceholder')),
      'e': () => insertText('`', '`', t('format.codePlaceholder')),
    };

    if (shortcuts[key]) { e.preventDefault(); shortcuts[key](); }
  });
}

export function initToolbar() {
  bindButtons();
  bindShortcuts();
}
