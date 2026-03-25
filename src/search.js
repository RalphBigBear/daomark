/**
 * DaoMark — Search & Replace Module
 * ⌘F = Search, ⌘H = Search + Replace
 */

import { t } from './i18n.js';

let panel = null;
let searchInput = null;
let replaceInput = null;
let replaceRow = null;
let matchCountEl = null;
let editor = null;
let matches = [];
let currentMatchIndex = -1;

/** Initialize search module */
export function initSearch() {
  editor = document.getElementById('editor');
}

/** Open search panel */
export function openSearch(withReplace = false) {
  if (!editor) editor = document.getElementById('editor');
  if (!panel) createPanel();

  panel.classList.add('visible');
  if (withReplace) {
    replaceRow.classList.add('visible');
  }
  searchInput.focus();

  // Pre-fill with selected text
  const selected = editor.value.substring(editor.selectionStart, editor.selectionEnd);
  if (selected && !selected.includes('\n')) {
    searchInput.value = selected;
    doSearch();
  }
}

/** Close search panel */
export function closeSearch() {
  if (!panel) return;
  panel.classList.remove('visible');
  replaceRow?.classList.remove('visible');
  clearHighlights();
  matches = [];
  currentMatchIndex = -1;
  editor?.focus();
}

/** Toggle replace row */
function toggleReplace() {
  replaceRow.classList.toggle('visible');
  if (replaceRow.classList.contains('visible')) {
    replaceInput.focus();
  }
}

/** Perform search */
function doSearch() {
  const query = searchInput.value;
  matches = [];
  currentMatchIndex = -1;

  if (!query || !editor) {
    updateMatchCount();
    return;
  }

  const text = editor.value;
  let idx = 0;
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  while (idx < lowerText.length) {
    const found = lowerText.indexOf(lowerQuery, idx);
    if (found === -1) break;
    matches.push({ start: found, end: found + query.length });
    idx = found + 1;
  }

  if (matches.length > 0) {
    currentMatchIndex = 0;
    scrollToMatch(); // Don't steal focus during typing
  }
  updateMatchCount();
}

/** Navigate to next match */
function nextMatch() {
  if (matches.length === 0) return;
  currentMatchIndex = (currentMatchIndex + 1) % matches.length;
  highlightCurrent(true);
  updateMatchCount();
}

/** Navigate to previous match */
function prevMatch() {
  if (matches.length === 0) return;
  currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
  highlightCurrent(true);
  updateMatchCount();
}

/** Scroll editor to current match (without stealing focus) */
function scrollToMatch() {
  if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
  const m = matches[currentMatchIndex];
  const text = editor.value.substring(0, m.start);
  const lines = text.split('\n').length;
  const lineHeight = parseInt(getComputedStyle(editor).lineHeight) || 28;
  editor.scrollTop = Math.max(0, (lines - 3) * lineHeight);
}

/** Highlight current match and optionally focus editor */
function highlightCurrent(focusEditor = false) {
  if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
  const m = matches[currentMatchIndex];
  scrollToMatch();
  if (focusEditor) {
    editor.focus();
  }
  editor.setSelectionRange(m.start, m.end);
}

function clearHighlights() {
  // Reset selection
}

/** Undoable text replacement — preserves browser undo stack */
function undoableReplace(start, end, replacement) {
  editor.focus();
  editor.setSelectionRange(start, end);
  // execCommand integrates with the browser's undo history
  document.execCommand('insertText', false, replacement);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Replace current match */
function replaceCurrent() {
  if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
  const m = matches[currentMatchIndex];
  const replacement = replaceInput.value;
  const diff = replacement.length - (m.end - m.start);

  undoableReplace(m.start, m.end, replacement);

  // Update subsequent match offsets
  for (let i = currentMatchIndex + 1; i < matches.length; i++) {
    matches[i].start += diff;
    matches[i].end += diff;
  }
  matches.splice(currentMatchIndex, 1);

  if (matches.length > 0) {
    if (currentMatchIndex >= matches.length) currentMatchIndex = 0;
    highlightCurrent();
  } else {
    currentMatchIndex = -1;
  }
  updateMatchCount();
  searchInput.focus(); // Return focus to search
}

/** Replace all matches */
function replaceAll() {
  if (matches.length === 0) return;
  const replacement = replaceInput.value;

  // Replace from end to start to preserve offsets
  const sorted = [...matches].sort((a, b) => b.start - a.start);
  editor.focus();
  for (const m of sorted) {
    editor.setSelectionRange(m.start, m.end);
    document.execCommand('insertText', false, replacement);
  }
  editor.dispatchEvent(new Event('input', { bubbles: true }));

  matches = [];
  currentMatchIndex = -1;
  updateMatchCount();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Update match count display */
function updateMatchCount() {
  if (!matchCountEl) return;
  if (matches.length === 0) {
    matchCountEl.textContent = searchInput.value ? t('search.noMatch') : '';
  } else {
    matchCountEl.textContent = `${currentMatchIndex + 1} / ${matches.length}`;
  }
}

/** Create the search panel DOM */
function createPanel() {
  panel = document.createElement('div');
  panel.className = 'search-panel';
  panel.id = 'search-panel';

  // Search row
  const searchRow = document.createElement('div');
  searchRow.className = 'search-row';

  searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'search-input';
  searchInput.placeholder = t('search.placeholder');
  searchInput.addEventListener('input', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.shiftKey ? prevMatch() : nextMatch();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  });

  matchCountEl = document.createElement('span');
  matchCountEl.className = 'search-match-count';

  const btnPrev = createSearchBtn('↑', prevMatch, t('search.prev'));
  const btnNext = createSearchBtn('↓', nextMatch, t('search.next'));
  const btnToggle = createSearchBtn('⇅', toggleReplace, t('search.toggleReplace'));
  btnToggle.className += ' search-btn-toggle';
  const btnClose = createSearchBtn('×', closeSearch, t('search.close'));

  searchRow.appendChild(searchInput);
  searchRow.appendChild(matchCountEl);
  searchRow.appendChild(btnPrev);
  searchRow.appendChild(btnNext);
  searchRow.appendChild(btnToggle);
  searchRow.appendChild(btnClose);

  // Replace row
  replaceRow = document.createElement('div');
  replaceRow.className = 'search-row search-replace-row';

  replaceInput = document.createElement('input');
  replaceInput.type = 'text';
  replaceInput.className = 'search-input';
  replaceInput.placeholder = t('search.replacePlaceholder');
  replaceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); replaceCurrent(); }
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
  });

  const btnReplace = createSearchBtn(t('search.replaceBtn'), replaceCurrent);
  btnReplace.className += ' search-btn-text';
  const btnReplaceAll = createSearchBtn(t('search.replaceAllBtn'), replaceAll);
  btnReplaceAll.className += ' search-btn-text';

  replaceRow.appendChild(replaceInput);
  replaceRow.appendChild(btnReplace);
  replaceRow.appendChild(btnReplaceAll);

  panel.appendChild(searchRow);
  panel.appendChild(replaceRow);

  // Insert at top of editor pane
  const editorPane = document.getElementById('editor-pane');
  if (editorPane) {
    editorPane.insertBefore(panel, editorPane.firstChild);
  }
}

function createSearchBtn(text, onClick, title) {
  const btn = document.createElement('button');
  btn.className = 'search-btn';
  btn.textContent = text;
  if (title) btn.title = title;
  btn.addEventListener('click', onClick);
  return btn;
}
