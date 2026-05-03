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

fn read_file_payload(path_str: &str) -> Option<OpenFilePayload> {
    let path = Path::new(path_str);
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled")
        .to_string();
    let content = fs::read_to_string(path).ok()?;
    Some(OpenFilePayload {
        path: path_str.to_string(),
        name,
        content,
    })
}

#[tauri::command]
fn take_pending_file(state: tauri::State<PendingFile>) -> Option<OpenFilePayload> {
    let path = state.0.lock().ok().and_then(|mut g| g.take())?;
    read_file_payload(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(path) = argv.get(1) {
                if let Some(payload) = read_file_payload(path) {
                    let _ = app.emit("open-file", payload);
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
