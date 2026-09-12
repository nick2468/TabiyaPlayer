// Origin: London src-tauri/src/main.rs, adapted: the lib it calls.
// Windows release builds open no console window: this is a desktop app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    simply_chess_lib::run()
}
