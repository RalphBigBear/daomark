/**
 * DaoMark — Help Module
 * About + Keyboard Shortcuts Reference
 */

import { t, getLang } from './i18n.js';

/** Show keyboard shortcuts panel */
export function showShortcuts() {
  if (document.getElementById('dao-shortcuts-overlay')) return;

  const shortcuts = [
    ['⌘N', 'shortcut.new'],
    ['⌘O', 'shortcut.open'],
    ['⌘S', 'shortcut.save'],
    ['⌘⇧S', 'shortcut.saveAs'],
    ['⌘P', 'shortcut.print'],
    ['⌘W', 'shortcut.close'],
    ['⌘⇧N', 'shortcut.newWindow'],
    ['', ''],
    ['⌘F', 'shortcut.find'],
    ['⌘H', 'shortcut.replace'],
    ['', ''],
    ['⌘B', 'shortcut.bold'],
    ['⌘I', 'shortcut.italic'],
    ['⌘K', 'shortcut.link'],
    ['⌘E', 'shortcut.code'],
    ['⌘⇧K', 'shortcut.codeblock'],
    ['⌘⇧X', 'shortcut.strikethrough'],
    ['', ''],
    ['⌘/', 'shortcut.shortcuts'],
  ];

  const overlay = createOverlay('dao-shortcuts-overlay');
  const panel = document.createElement('div');
  panel.className = 'dao-modal dao-shortcuts-modal';

  const title = document.createElement('h2');
  title.textContent = t('help.shortcuts');
  panel.appendChild(title);

  const list = document.createElement('div');
  list.className = 'shortcut-list';

  for (const [key, labelKey] of shortcuts) {
    if (!key && !labelKey) {
      const sep = document.createElement('div');
      sep.className = 'shortcut-separator';
      list.appendChild(sep);
      continue;
    }
    const row = document.createElement('div');
    row.className = 'shortcut-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'shortcut-label';
    labelEl.textContent = t(labelKey);

    const keyEl = document.createElement('kbd');
    keyEl.className = 'shortcut-key';
    keyEl.textContent = key;

    row.appendChild(labelEl);
    row.appendChild(keyEl);
    list.appendChild(row);
  }

  panel.appendChild(list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('visible'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(overlay); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { closeOverlay(overlay); document.removeEventListener('keydown', esc); }
  });
}

/** Show About panel */
export function showAbout() {
  if (document.getElementById('dao-about-overlay')) return;

  const overlay = createOverlay('dao-about-overlay');
  const panel = document.createElement('div');
  panel.className = 'dao-modal dao-about-modal';

  panel.innerHTML = `
    <div class="about-icon">道</div>
    <h2>DaoMark</h2>
    <p class="about-subtitle">道韵笔记</p>
    <p class="about-version">v0.2.0</p>
    <p class="about-tagline">${t('app.tagline')}</p>
    <div class="about-divider"></div>
    <p class="about-copy">© 2026 MIT License</p>
    <a class="about-link" href="https://github.com/RalphBigBear/daomark" target="_blank">GitHub</a>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('visible'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(overlay); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { closeOverlay(overlay); document.removeEventListener('keydown', esc); }
  });
}

function createOverlay(id) {
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'dao-overlay';
  return overlay;
}

function closeOverlay(overlay) {
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 200);
}
