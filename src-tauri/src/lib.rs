use serde::Serialize;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::Manager;
#[cfg(desktop)]
use tauri::Emitter;

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
        .invoke_handler(tauri::generate_handler![take_pending_file])
        .setup(|app| {
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
