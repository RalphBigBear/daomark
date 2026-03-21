/**
 * DaoMark — File Operations
 * Supports both Tauri native dialog and Web File System Access API
 */

import { getContent, setContent, markClean, getIsDirty, getFileHandle, setFileHandle } from './editor.js';
import { downloadFile } from './utils.js';
import { t, getLang, onLangChange } from './i18n.js';

/** Detect Tauri runtime */
const isTauri = () => !!(window.__TAURI_INTERNALS__);

/** Lazy-load Tauri APIs */
let tauriDialog = null;
let tauriFs = null;
let tauriWindow = null;

async function loadTauriAPIs() {
  if (!isTauri()) return false;
  try {
    if (!tauriDialog) tauriDialog = await import('@tauri-apps/plugin-dialog');
    if (!tauriFs) tauriFs = await import('@tauri-apps/plugin-fs');
    if (!tauriWindow) tauriWindow = await import('@tauri-apps/api/window');
    return true;
  } catch (e) {
    console.warn('Tauri APIs not available:', e);
    return false;
  }
}

/** Track state */
let currentFilePath = null;
const QUICK_SAVE_KEY = 'daomark-quick-save';
let quickSaveEnabled = localStorage.getItem(QUICK_SAVE_KEY) === 'true';

/** Quick save toggle */
export function isQuickSave() { return quickSaveEnabled; }
export function toggleQuickSave() {
  quickSaveEnabled = !quickSaveEnabled;
  localStorage.setItem(QUICK_SAVE_KEY, quickSaveEnabled);
  updateQuickSaveButton();
}

function updateQuickSaveButton() {
  const btn = document.getElementById('btn-quick-save');
  if (!btn) return;
  btn.classList.toggle('active', quickSaveEnabled);
}

/** Set native window title (Tauri) or document.title (Web) */
async function setWindowTitle(title) {
  document.title = title;
  if (isTauri()) {
    try {
      const api = tauriWindow || await import('@tauri-apps/api/window');
      tauriWindow = api;
      const win = api.getCurrentWindow();
      await win.setTitle(title);
    } catch (e) { /* ignore */ }
  }
}

function updateTitle(filename) {
  const appName = t('app.name');
  setWindowTitle(filename ? `${filename} — ${appName}` : appName);
}

export async function newDocument() {
  if (getIsDirty()) {
    const hasTauri = await loadTauriAPIs();
    let ok;
    if (hasTauri) {
      ok = await tauriDialog.ask(t('dialog.unsavedConfirm'), {
        title: t('app.name'),
        kind: 'warning'
      });
    } else {
      ok = confirm(t('dialog.unsavedConfirm'));
    }
    if (!ok) return;
  }
  setContent('', true);
  setFileHandle(null);
  currentFilePath = null;
  updateTitle();
  markClean();
}

export async function openFile() {
  try {
    const hasTauri = await loadTauriAPIs();

    if (hasTauri) {
      const selected = await tauriDialog.open({
        multiple: false,
        filters: [{
          name: t('dialog.mdFiles'),
          extensions: ['md', 'markdown', 'mdown', 'mkd']
        }, {
          name: t('dialog.textFiles'),
          extensions: ['txt']
        }]
      });
      if (!selected) return;
      const text = await tauriFs.readTextFile(selected);
      currentFilePath = selected;
      setFileHandle(null);
      setContent(text, true);
      updateTitle(getFileName(selected));
      markClean();

    } else if ('showOpenFilePicker' in window) {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: t('dialog.mdFiles'),
          accept: { 'text/markdown': ['.md', '.markdown', '.mdown', '.mkd'] }
        }, {
          description: t('dialog.textFiles'),
          accept: { 'text/plain': ['.txt'] }
        }],
        multiple: false
      });
      const file = await handle.getFile();
      const text = await file.text();
      setFileHandle(handle);
      currentFilePath = null;
      setContent(text, true);
      updateTitle(file.name);
      markClean();

    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.mdown,.mkd,.txt';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        setFileHandle(null);
        currentFilePath = null;
        setContent(text, true);
        updateTitle(file.name);
        markClean();
      };
      input.click();
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Open file error:', err);
  }
}

export async function saveFile() {
  try {
    // Quick save mode — download directly
    if (quickSaveEnabled) {
      downloadFile(getContent(), 'untitled.md', 'text/markdown');
      markClean();
      showSaveHint();
      return;
    }

    const hasTauri = await loadTauriAPIs();

    // Tauri: write to current path if known
    if (hasTauri && currentFilePath) {
      await tauriFs.writeTextFile(currentFilePath, getContent());
      markClean();
      showSaveHint();
      return;
    }

    // Web: write to current handle
    const handle = getFileHandle();
    if (handle && 'createWritable' in handle) {
      const writable = await handle.createWritable();
      await writable.write(getContent());
      await writable.close();
      markClean();
      showSaveHint();
      return;
    }

    await saveFileAs();
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Save error:', err);
  }
}

export async function saveFileAs() {
  try {
    // Quick save mode
    if (quickSaveEnabled) {
      downloadFile(getContent(), 'untitled.md', 'text/markdown');
      markClean();
      showSaveHint();
      return;
    }

    const hasTauri = await loadTauriAPIs();

    if (hasTauri) {
      const filePath = await tauriDialog.save({
        defaultPath: 'untitled.md',
        filters: [{ name: t('dialog.mdFiles'), extensions: ['md'] }]
      });
      if (!filePath) return;
      await tauriFs.writeTextFile(filePath, getContent());
      currentFilePath = filePath;
      updateTitle(getFileName(filePath));
      markClean();
      showSaveHint();

    } else if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'untitled.md',
        types: [{ description: t('dialog.mdFiles'), accept: { 'text/markdown': ['.md'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(getContent());
      await writable.close();
      setFileHandle(handle);
      updateTitle(handle.name);
      markClean();
      showSaveHint();

    } else {
      downloadFile(getContent(), 'untitled.md', 'text/markdown');
      markClean();
      showSaveHint();
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Save-as error:', err);
  }
}

export async function exportHTML() {
  const preview = document.getElementById('preview');
  if (!preview) return;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DaoMark Export</title>
  <link href="https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 40px 24px; font-family: 'LXGW WenKai', Georgia, serif; font-size: 16px; line-height: 1.85; color: #3d3830; background: #f8f6f2; }
    h1, h2, h3, h4, h5, h6 { font-weight: 700; margin-top: 1.8em; margin-bottom: 0.6em; }
    h1 { font-size: 1.85em; border-bottom: 1px solid #e5e0d5; padding-bottom: 0.4em; }
    h2 { font-size: 1.45em; border-bottom: 0.5px solid rgba(0,0,0,0.06); padding-bottom: 0.3em; }
    a { color: #5b7a8c; text-decoration: none; }
    blockquote { border-left: 3px solid #5a8a6e; padding: 0.8em 1.2em; margin: 1.2em 0; background: rgba(90,138,110,0.05); color: #7a7265; font-style: italic; border-radius: 0 5px 5px 0; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 0.88em; padding: 0.15em 0.45em; background: rgba(42,37,32,0.05); color: #b85c5c; border-radius: 4px; }
    pre { background: #faf8f4; border: 0.5px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 1em 1.2em; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
    hr { border: none; height: 1px; background: linear-gradient(90deg, transparent, #d4cec0 20%, #a8a08e 50%, #d4cec0 80%, transparent); margin: 2.5em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1.2em 0; }
    th, td { padding: 0.65em 1em; border: 0.5px solid #e5e0d5; text-align: left; }
    th { background: rgba(42,37,32,0.05); font-weight: 700; }
    img { max-width: 100%; border-radius: 8px; }
  </style>
</head>
<body>${preview.innerHTML}</body>
</html>`;

  try {
    // Quick save mode
    if (quickSaveEnabled) {
      downloadFile(html, 'daomark-export.html', 'text/html');
      return;
    }

    const hasTauri = await loadTauriAPIs();
    if (hasTauri) {
      const filePath = await tauriDialog.save({
        defaultPath: 'daomark-export.html',
        filters: [{ name: 'HTML', extensions: ['html'] }]
      });
      if (!filePath) return;
      await tauriFs.writeTextFile(filePath, html);
      showSaveHint();
    } else {
      downloadFile(html, 'daomark-export.html', 'text/html');
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Export error:', err);
  }
}

function getFileName(path) {
  return path.split('/').pop().split('\\').pop();
}

function showSaveHint() {
  const hint = document.getElementById('status-hint');
  if (!hint) return;
  hint.textContent = t('status.saved');
  hint.style.color = 'var(--dao-green)';
  setTimeout(() => { hint.textContent = t('status.brand'); hint.style.color = ''; }, 2000);
}

export function initFileOps() {
  const btnNew = document.getElementById('btn-new');
  const btnOpen = document.getElementById('btn-open');
  const btnSave = document.getElementById('btn-save');
  const btnExport = document.getElementById('btn-export');
  const btnQuickSave = document.getElementById('btn-quick-save');

  if (btnNew) btnNew.addEventListener('click', newDocument);
  if (btnOpen) btnOpen.addEventListener('click', openFile);
  if (btnSave) btnSave.addEventListener('click', saveFile);
  if (btnExport) btnExport.addEventListener('click', exportHTML);
  if (btnQuickSave) {
    btnQuickSave.addEventListener('click', toggleQuickSave);
    updateQuickSaveButton();
  }

  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;
    switch (e.key.toLowerCase()) {
      case 's': e.preventDefault(); e.shiftKey ? saveFileAs() : saveFile(); break;
      case 'n': e.preventDefault(); newDocument(); break;
      case 'o': e.preventDefault(); openFile(); break;
    }
  });

  // Update title on language change
  onLangChange(() => {
    const filename = currentFilePath ? getFileName(currentFilePath) : null;
    updateTitle(filename);
  });

  // Set initial title
  updateTitle();
}
