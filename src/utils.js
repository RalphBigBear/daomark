/**
 * DaoMark — Utility Functions
 */

/** Debounce */
export function debounce(fn, delay = 150) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/** Count words (CJK characters + English words) */
export function countWords(text) {
  if (!text || !text.trim()) return 0;
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
  const eng = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  return cjk + eng;
}

/** Count lines */
export function countLines(text) {
  if (!text) return 0;
  return text.split('\n').length;
}

/** Get cursor position as {line, col} */
export function getCursorPosition(textarea) {
  const text = textarea.value;
  const pos = textarea.selectionStart;
  const beforeCursor = text.substring(0, pos);
  const line = (beforeCursor.match(/\n/g) || []).length + 1;
  const lastNewline = beforeCursor.lastIndexOf('\n');
  const col = pos - lastNewline;
  return { line, col };
}

/** Download file */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
