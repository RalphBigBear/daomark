/**
 * DaoMark — Editor Core
 * Live rendering · Scroll sync · Smart editing
 */

import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js';
import 'katex/dist/katex.min.css';
import { debounce, countWords, countLines, getCursorPosition } from './utils.js';
import { t, getLang, onLangChange } from './i18n.js';

let editorEl = null;
let previewEl = null;
let onChangeCallback = null;
let fileHandle = null;
let isDirty = false;

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  })
);

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
marked.setOptions({ gfm: true });

/**
 * Preprocess block math: normalize $$...$$ blocks with newlines.
 * Handles:  $$\n...\n$$  and  $$\n...\n$$  with varying whitespace.
 * Converts multiline $$ blocks into single-line $$...$$ so that
 * marked-katex-extension can parse them before paragraph splitting.
 */
function preprocessBlockMath(text) {
  // Match $$ on its own line (possibly with trailing spaces),
  // capture content until $$ on its own line
  return text.replace(/^\$\$\s*\n([\s\S]*?)\n\s*\$\$\s*$/gm, (match, content) => {
    // Trim each line and join with spaces for inline display
    const trimmed = content.trim();
    return `$$${trimmed}$$`;
  });
}

/** Render Markdown to preview */
function renderPreview() {
  const text = editorEl.value;
  if (!text.trim()) {
    previewEl.innerHTML = `
      <div class="preview-empty">
        <div class="dao-symbol">${t('app.emptyTitle')}</div>
        <div class="dao-verse">
          ${t('app.emptyVerse1')}<br/>
          ${t('app.emptyVerse2')}
        </div>
      </div>`;
    return;
  }
  previewEl.innerHTML = marked.parse(preprocessBlockMath(text));
}

/** Update status bar */
function updateStatus() {
  const text = editorEl.value;
  const wordsEl = document.getElementById('status-words');
  const linesEl = document.getElementById('status-lines');
  const cursorEl = document.getElementById('status-cursor');
  const hintEl = document.getElementById('status-hint');

  const wc = countWords(text);
  const lc = countLines(text);
  if (wordsEl) wordsEl.textContent = t('status.words', { n: wc });
  if (linesEl) linesEl.textContent = t('status.lines', { n: lc });

  const { line, col } = getCursorPosition(editorEl);
  if (cursorEl) cursorEl.textContent = t('status.cursor', { line, col });

  if (hintEl) {
    hintEl.textContent = isDirty ? t('status.unsaved') : t('status.brand');
    hintEl.style.color = isDirty ? 'var(--dao-gold)' : '';
  }
}

const debouncedRender = debounce(() => {
  renderPreview();
  updateStatus();
  if (onChangeCallback) onChangeCallback();
}, 120);

/** Scroll sync */
function syncScroll() {
  const editorScroll = editorEl.scrollTop;
  const editorHeight = editorEl.scrollHeight - editorEl.clientHeight;
  if (editorHeight <= 0) return;
  const ratio = editorScroll / editorHeight;
  const previewPane = previewEl.closest('.preview-pane');
  if (previewPane) {
    const previewHeight = previewPane.scrollHeight - previewPane.clientHeight;
    previewPane.scrollTop = ratio * previewHeight;
  }
}

const debouncedSync = debounce(syncScroll, 16);

/** Tab key */
function handleTab(e) {
  e.preventDefault();
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const text = editorEl.value;

  if (start === end) {
    editorEl.value = text.substring(0, start) + '  ' + text.substring(end);
    editorEl.selectionStart = editorEl.selectionEnd = start + 2;
  } else {
    const beforeSelection = text.substring(0, start);
    const lineStart = beforeSelection.lastIndexOf('\n') + 1;
    const selectedLines = text.substring(lineStart, end);

    if (e.shiftKey) {
      const dedented = selectedLines.replace(/^  /gm, '');
      const diff = selectedLines.length - dedented.length;
      editorEl.value = text.substring(0, lineStart) + dedented + text.substring(end);
      editorEl.selectionStart = start - (beforeSelection.substring(lineStart).startsWith('  ') ? 2 : 0);
      editorEl.selectionEnd = end - diff;
    } else {
      const indented = selectedLines.replace(/^/gm, '  ');
      const diff = indented.length - selectedLines.length;
      editorEl.value = text.substring(0, lineStart) + indented + text.substring(end);
      editorEl.selectionStart = start + 2;
      editorEl.selectionEnd = end + diff;
    }
  }
  isDirty = true;
  debouncedRender();
}

/** Enter key — auto-continue lists */
function handleEnter(e) {
  const start = editorEl.selectionStart;
  const text = editorEl.value;
  const beforeCursor = text.substring(0, start);
  const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
  const currentLine = beforeCursor.substring(currentLineStart);

  const ulMatch = currentLine.match(/^(\s*)([-*+])\s/);
  const olMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
  const taskMatch = currentLine.match(/^(\s*)([-*+])\s\[[ x]\]\s/);

  let prefix = '';
  if (taskMatch) {
    if (currentLine.trim() === `${taskMatch[2]} [ ]` || currentLine.trim() === `${taskMatch[2]} [x]`) {
      e.preventDefault();
      editorEl.value = text.substring(0, currentLineStart) + '\n' + text.substring(start);
      editorEl.selectionStart = editorEl.selectionEnd = currentLineStart + 1;
      isDirty = true;
      debouncedRender();
      return;
    }
    prefix = `${taskMatch[1]}${taskMatch[2]} [ ] `;
  } else if (olMatch) {
    const content = currentLine.replace(/^\s*\d+\.\s/, '').trim();
    if (!content) {
      e.preventDefault();
      editorEl.value = text.substring(0, currentLineStart) + '\n' + text.substring(start);
      editorEl.selectionStart = editorEl.selectionEnd = currentLineStart + 1;
      isDirty = true;
      debouncedRender();
      return;
    }
    prefix = `${olMatch[1]}${parseInt(olMatch[2]) + 1}. `;
  } else if (ulMatch) {
    const content = currentLine.replace(/^\s*[-*+]\s/, '').trim();
    if (!content) {
      e.preventDefault();
      editorEl.value = text.substring(0, currentLineStart) + '\n' + text.substring(start);
      editorEl.selectionStart = editorEl.selectionEnd = currentLineStart + 1;
      isDirty = true;
      debouncedRender();
      return;
    }
    prefix = `${ulMatch[1]}${ulMatch[2]} `;
  }

  if (prefix) {
    e.preventDefault();
    const insertion = '\n' + prefix;
    editorEl.value = text.substring(0, start) + insertion + text.substring(start);
    editorEl.selectionStart = editorEl.selectionEnd = start + insertion.length;
    isDirty = true;
    debouncedRender();
  }
}

/** Auto-pair characters */
const PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
  '\uff08': '\uff09',
  '\u300c': '\u300d',
  '\u300e': '\u300f',
  '\u201c': '\u201d',
  '\u2018': '\u2019',
};

function handleAutoPair(e) {
  const char = e.key;
  if (!(char in PAIRS)) return;

  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const text = editorEl.value;

  if (start !== end) {
    e.preventDefault();
    const selected = text.substring(start, end);
    const wrapped = char + selected + PAIRS[char];
    editorEl.value = text.substring(0, start) + wrapped + text.substring(end);
    editorEl.selectionStart = start + 1;
    editorEl.selectionEnd = end + 1;
    isDirty = true;
    debouncedRender();
    return;
  }

  if (char === "'" || char === '"') {
    if (start > 0 && /\w/.test(text[start - 1])) return;
  }

  e.preventDefault();
  const pair = char + PAIRS[char];
  editorEl.value = text.substring(0, start) + pair + text.substring(end);
  editorEl.selectionStart = editorEl.selectionEnd = start + 1;
  isDirty = true;
  debouncedRender();
}

/** Insert text at cursor */
export function insertText(before, after = '', placeholder = '') {
  if (!editorEl) return;
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const text = editorEl.value;
  const selected = text.substring(start, end) || placeholder;

  editorEl.value = text.substring(0, start) + before + selected + after + text.substring(end);
  editorEl.selectionStart = start + before.length;
  editorEl.selectionEnd = start + before.length + selected.length;
  editorEl.focus();
  isDirty = true;
  debouncedRender();
}

/** Toggle line prefix */
export function toggleLinePrefix(prefix) {
  if (!editorEl) return;
  const start = editorEl.selectionStart;
  const text = editorEl.value;
  const beforeCursor = text.substring(0, start);
  const lineStart = beforeCursor.lastIndexOf('\n') + 1;
  const lineEnd = text.indexOf('\n', start);
  const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

  if (line.startsWith(prefix)) {
    const newLine = line.substring(prefix.length);
    editorEl.value = text.substring(0, lineStart) + newLine + text.substring(lineEnd === -1 ? text.length : lineEnd);
    editorEl.selectionStart = editorEl.selectionEnd = start - prefix.length;
  } else {
    editorEl.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    editorEl.selectionStart = editorEl.selectionEnd = start + prefix.length;
  }
  editorEl.focus();
  isDirty = true;
  debouncedRender();
}

export function getContent() { return editorEl ? editorEl.value : ''; }

export function setContent(content, clean = false) {
  if (!editorEl) return;
  editorEl.value = content;
  isDirty = !clean;
  renderPreview();
  updateStatus();
}

export function markClean() { isDirty = false; updateStatus(); }
export function getIsDirty() { return isDirty; }
export function getFileHandle() { return fileHandle; }
export function setFileHandle(handle) { fileHandle = handle; }

/** Initialize editor */
export function initEditor(onChange) {
  editorEl = document.getElementById('editor');
  previewEl = document.getElementById('preview');
  onChangeCallback = onChange;

  if (!editorEl || !previewEl) return;

  renderPreview();
  updateStatus();

  editorEl.addEventListener('input', () => { isDirty = true; debouncedRender(); });

  editorEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') handleTab(e);
    else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) handleEnter(e);
    else if (e.key in PAIRS) handleAutoPair(e);
  });

  editorEl.addEventListener('click', updateStatus);
  editorEl.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) updateStatus();
  });

  editorEl.addEventListener('scroll', debouncedSync);
  initResizeHandle();

  // Re-render on language change
  onLangChange(() => { renderPreview(); updateStatus(); });

  window.addEventListener('beforeunload', (e) => {
    if (isDirty) { e.preventDefault(); e.returnValue = ''; }
  });
}

function initResizeHandle() {
  const handle = document.getElementById('resize-handle');
  const container = document.getElementById('editor-container');
  const editorPane = document.getElementById('editor-pane');
  const previewPane = document.getElementById('preview-pane');
  if (!handle || !container) return;

  let isDragging = false;

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    handle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    editorPane.style.flex = `0 0 ${clamped * 100}%`;
    previewPane.style.flex = `0 0 ${(1 - clamped) * 100}%`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      handle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}
