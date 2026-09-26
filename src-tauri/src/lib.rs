use serde::Serialize;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
#[cfg(desktop)]
use tauri::Emitter;
use tauri::Manager;

#[cfg(target_os = "linux")]
mod linux_theme {
    use gio::prelude::*;
    use std::cell::RefCell;
    use tauri::{Manager, Theme};

    thread_local! {
        static SETTINGS: RefCell<Option<gio::Settings>> = const { RefCell::new(None) };
    }

    pub fn follow_gnome_color_scheme(app: &tauri::App) {
        let Some(schema) = gio::SettingsSchemaSource::default()
            .and_then(|source| source.lookup("org.gnome.desktop.interface", true))
        else {
            return;
        };
        if !schema.has_key("color-scheme") {
            return;
        }

        let Some(window) = app.get_webview_window("main") else {
            return;
        };
        let settings = gio::Settings::new("org.gnome.desktop.interface");
        let update_theme = move |settings: &gio::Settings| {
            let theme = match settings.string("color-scheme").as_str() {
                "prefer-dark" => Theme::Dark,
                _ => Theme::Light,
            };
            if let Err(error) = window.set_theme(Some(theme)) {
                eprintln!("failed to update window theme: {error}");
            }
        };
        update_theme(&settings);
        settings.connect_changed(Some("color-scheme"), move |settings, _| {
            update_theme(settings)
        });
        // Keep the GSettings subscription alive for the lifetime of the GTK main thread.
        SETTINGS.with(|slot| *slot.borrow_mut() = Some(settings));
    }
}

#[derive(Clone, Serialize)]
struct OpenFilePayload {
    path: String,
    name: String,
    content: String,
}

#[derive(Default)]
struct PendingFile(Mutex<Option<String>>);

fn read_file_payload(path_str: &str) -> Result<OpenFilePayload, String> {
    let path = Path::new(path_str);
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled")
        .to_string();
    let content = fs::read_to_string(path)
        .map_err(|e| format!("failed to read '{}': {}", path_str, e))?;
    Ok(OpenFilePayload {
        path: path_str.to_string(),
        name,
        content,
    })
}

#[tauri::command]
fn take_pending_file(
    state: tauri::State<PendingFile>,
) -> Result<Option<OpenFilePayload>, String> {
    let path = match state
        .0
        .lock()
        .map_err(|_| "PendingFile mutex poisoned".to_string())?
        .take()
    {
        Some(p) => p,
        None => return Ok(None),
    };
    read_file_payload(&path).map(Some)
}

#[tauri::command]
fn read_dropped_files(paths: Vec<String>) -> Vec<OpenFilePayload> {
    let mut files = Vec::new();
    for path in paths {
        let supported = Path::new(&path)
            .extension()
            .and_then(|extension| extension.to_str())
            .is_some_and(|extension| {
                ["md", "markdown", "mdx", "txt"]
                    .iter()
                    .any(|allowed| extension.eq_ignore_ascii_case(allowed))
            });
        if !supported {
            continue;
        }
        match read_file_payload(&path) {
            Ok(file) => files.push(file),
            Err(error) => eprintln!("file drop skipped: {}", error),
        }
    }
    files
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            if let Some(path) = argv.get(1) {
                match read_file_payload(path) {
                    Ok(payload) => {
                        let _ = app.emit("open-file", payload);
                    }
                    Err(e) => eprintln!("open-file dropped: {}", e),
                }
            }
        }));
    }

    builder
        .manage(PendingFile::default())
        .invoke_handler(tauri::generate_handler![take_pending_file, read_dropped_files])
        .setup(|app| {
            #[cfg(target_os = "linux")]
            linux_theme::follow_gnome_color_scheme(app);

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            if let Some(path) = std::env::args().nth(1) {
                let state = app.state::<PendingFile>();
                *state.0.lock().expect("PendingFile mutex poisoned") = Some(path);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
