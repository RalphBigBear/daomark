// DaoMark — The Way of Markdown
// 道韵笔记 — 大道至简

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem},
    Manager,
    Emitter,
};

/// Create a new DaoMark window
fn create_new_window(handle: &tauri::AppHandle) {
    let label = format!("daomark_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis());
    if let Err(e) = tauri::WebviewWindowBuilder::new(
        handle,
        &label,
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("DaoMark")
    .inner_size(1200.0, 780.0)
    .min_inner_size(680.0, 480.0)
    .center()
    .build()
    {
        eprintln!("Failed to create new window: {}", e);
    }
}

/// Print the current webview content via native API
#[tauri::command]
fn print_webview(webview_window: tauri::WebviewWindow) -> Result<(), String> {
    webview_window.print().map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![print_webview])
        .setup(|app| {
            // ── Build Menu ──

            // File menu
            let file_new_window = MenuItemBuilder::with_id("new-window", "New Window")
                .accelerator("CmdOrCtrl+Shift+N")
                .build(app)?;
            let file_new = MenuItemBuilder::with_id("file-new", "New")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let file_open = MenuItemBuilder::with_id("file-open", "Open…")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let file_save = MenuItemBuilder::with_id("file-save", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;
            let file_save_as = MenuItemBuilder::with_id("file-save-as", "Save As…")
                .accelerator("CmdOrCtrl+Shift+S")
                .build(app)?;
            let file_export = MenuItemBuilder::with_id("file-export", "Export HTML")
                .build(app)?;
            let file_print = MenuItemBuilder::with_id("file-print", "Print…")
                .accelerator("CmdOrCtrl+P")
                .build(app)?;
            let file_close = MenuItemBuilder::with_id("file-close", "Close Window")
                .accelerator("CmdOrCtrl+W")
                .build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&file_new_window)
                .separator()
                .item(&file_new)
                .item(&file_open)
                .separator()
                .item(&file_save)
                .item(&file_save_as)
                .item(&file_export)
                .separator()
                .item(&file_print)
                .separator()
                .item(&file_close)
                .build()?;

            // Edit menu
            let edit_find = MenuItemBuilder::with_id("edit-find", "Find")
                .accelerator("CmdOrCtrl+F")
                .build(app)?;
            let edit_replace = MenuItemBuilder::with_id("edit-replace", "Find & Replace")
                .accelerator("CmdOrCtrl+H")
                .build(app)?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .item(&PredefinedMenuItem::undo(app, None)?)
                .item(&PredefinedMenuItem::redo(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::cut(app, None)?)
                .item(&PredefinedMenuItem::copy(app, None)?)
                .item(&PredefinedMenuItem::paste(app, None)?)
                .item(&PredefinedMenuItem::select_all(app, None)?)
                .separator()
                .item(&edit_find)
                .item(&edit_replace)
                .build()?;

            // Window menu
            let window_menu = SubmenuBuilder::new(app, "Window")
                .item(&PredefinedMenuItem::minimize(app, None)?)
                .item(&PredefinedMenuItem::maximize(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::fullscreen(app, None)?)
                .build()?;

            // Help menu
            let help_shortcuts = MenuItemBuilder::with_id("help-shortcuts", "Keyboard Shortcuts")
                .accelerator("CmdOrCtrl+/")
                .build(app)?;
            let help_about = MenuItemBuilder::with_id("help-about", "About DaoMark")
                .build(app)?;

            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&help_shortcuts)
                .separator()
                .item(&help_about)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&file_menu)
                .item(&edit_menu)
                .item(&window_menu)
                .item(&help_menu)
                .build()?;

            app.set_menu(menu)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().0.as_str();
            match id {
                "new-window" => {
                    create_new_window(&app.clone());
                }
                "file-print" => {
                    let windows = app.webview_windows();
                    for (_label, window) in windows {
                        if let Err(e) = window.print() {
                            eprintln!("Print error: {}", e);
                        }
                        break;
                    }
                }
                "file-close" => {
                    let windows = app.webview_windows();
                    if let Some((_label, window)) = windows.into_iter().next() {
                        let _ = window.close();
                    }
                }
                _ => {
                    let windows = app.webview_windows();
                    for (_label, window) in windows {
                        let _ = window.emit("menu-action", id);
                    }
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building DaoMark")
        .run(|app_handle, event| {
            // macOS only: click dock icon → reopen window if none visible
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { has_visible_windows, .. } = event {
                if !has_visible_windows {
                    create_new_window(app_handle);
                }
            }
            let _ = (app_handle, event); // suppress unused warnings on non-macOS
        });
}
