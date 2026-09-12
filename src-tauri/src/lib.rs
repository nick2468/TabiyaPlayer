// Origin: London src-tauri/src/lib.rs, adapted: the folder name, the two messages, and the comments describe this app.
//! The Tauri shell around the Simple Chess web app.
//!
//! It does almost nothing on purpose. The app is the same web build that runs
//! in a browser; the only reason for the wrapper is a real window on Windows,
//! with real file dialogs behind Save game and Load game.
//!
//! The one thing it does do is choose where the window keeps its WebView2
//! profile. That profile holds the app's `localStorage`, which is where every
//! setting and the game in progress live (spec section 10), so the folder it
//! sits in is the folder a person would go looking for. Tauri's default is a
//! folder named after the bundle identifier, which would be
//! `%LOCALAPPDATA%\com.nick.simple-chess` for an app called Simple Chess. The
//! identifier itself deliberately does not change - NSIS keys the install on
//! the product name, and the identifier is invisible - so the folder is
//! pointed somewhere readable instead. Readable is NOT
//! `%LOCALAPPDATA%\Simple Chess`: that is the install folder, which belongs to
//! the installer.
//!
//! That is why the window is built here rather than left to `tauri.conf.json`.
//! Every setting still lives in the config: the window is declared there with
//! `"create": false`, and `WebviewWindowBuilder::from_config` reads that same
//! declaration back. Nothing is copied by hand, so nothing can drift.

use tauri::{Manager, WebviewWindowBuilder};

/// The app's own folder under the user's local data folder.
///
/// NOT `Simple Chess`, which is the INSTALL folder: a current-user NSIS install
/// puts the program itself in `%LOCALAPPDATA%\Simple Chess`. The window's
/// profile must not live inside it, because that folder goes on every
/// uninstall, and the settings and the game in progress are in the profile.
/// This folder goes only when the user ticks the box (spec 11.3).
///
/// The same literal is written in three places and they must agree: here,
/// `LOCAL_FOLDER` in `src/storage/paths.ts`, and `APP_LOCAL_FOLDER` in
/// `src-tauri/installer-hooks.nsh`, which is what an uninstall removes.
/// `src/storage/local-folder.test.ts` reads all three and holds them together.
const LOCAL_FOLDER: &str = "Simple Chess Data";

/// The browser profile inside it: cache, cookies and local storage.
const WEBVIEW_FOLDER: &str = "WebView2";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Cloned so the borrow of the config ends here: the builder below
            // wants the app handle, and holding both at once would not compile.
            let window = app
                .config()
                .app
                .windows
                .first()
                .cloned()
                .expect("tauri.conf.json declares the main window");

            let mut builder = WebviewWindowBuilder::from_config(app.handle(), &window)?;
            // A machine that cannot say where its local data folder is falls
            // back to Tauri's own choice, which is a folder named after the
            // identifier. Failing to open a window over a folder name would be
            // a worse trade than an untidy folder.
            if let Ok(local) = app.path().local_data_dir() {
                builder = builder.data_directory(local.join(LOCAL_FOLDER).join(WEBVIEW_FOLDER));
            }
            builder.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Simple Chess window");
}
