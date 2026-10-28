@echo off
rem Origin: Tabiya scripts/upgrade-walk.cmd, adapted: the log's place.
rem Started by Explorer so it runs as the user, outside a session's sandbox.
rem See the comment at the top of upgrade-walk.ps1. Log: src-tauri\target\walk\upgrade-walk.log
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0upgrade-walk.ps1"
