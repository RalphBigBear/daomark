/**
 * DaoMark — Print Module
 * 大道至简 — 调用原生打印
 */

export async function printDocument() {
  // Use Tauri Rust-side native print (window.print() doesn't work in WKWebView)
  if (window.__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('print_webview');
      return;
    } catch (e) {
      console.warn('Tauri print command failed:', e);
    }
  }
  // Fallback for web
  window.print();
}
