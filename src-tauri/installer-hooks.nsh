; Origin: London src-tauri/installer-hooks.nsh, adapted: one folder, because this app has no roaming data folder.
; Installer hooks for Simply Chess.
;
; One hook only: the one NSIS runs at the end of an uninstall, immediately
; after its own data-removal block.
;
; WHY IT EXISTS. That stock block removes $APPDATA\${BUNDLEID} and
; $LOCALAPPDATA\${BUNDLEID}, the two folders named after the bundle identifier.
; This app keeps nothing in either of them: it has one folder,
; $LOCALAPPDATA\Simply Chess Data, holding the window's browser profile, and
; the settings and the game in progress are the local storage inside it. So the
; uninstaller's offer to remove application data would be removing nothing that
; exists. An offer that does not do what it says is worse than no offer at all.
;
; THE GUARD IS NOT OPTIONAL, and it is not this file's invention. It is copied
; character for character from the stock block three lines above where this
; macro is inserted, and it means the same two things there and here:
;
;   $DeleteAppDataCheckboxState = 1
;       The user ticked "delete application data" on the confirm page. That
;       page is the only thing that ever sets this variable, and a silent or
;       passive uninstall skips it, so the variable stays 0 and nothing is
;       removed.
;
;   $UpdateMode <> 1
;       This uninstall is not the one an UPGRADE runs on its way past. Tauri's
;       updater appends /UPDATE to the old uninstaller's command line, and the
;       old uninstaller can still show its confirm page while doing it. Without
;       this half of the guard, a routine version bump would delete the user's
;       settings and the game in progress.
;
; So this hook is exactly as safe as Tauri's own block, and unsafe in exactly
; the same cases, of which there are none.
;
; The folder name is a literal. It matches LOCAL_FOLDER in
; src-tauri/src/lib.rs, which is what the window actually writes to, and
; LOCAL_FOLDER in src/storage/paths.ts; src/storage/local-folder.test.ts reads
; all three and holds them together. It is deliberately NOT ${PRODUCTNAME}: the
; folder name and the product name are the same words today by choice rather
; than by construction, and a deletion that followed a renamed product would be
; a deletion of the wrong folder. It is also not the install folder, which is
; $LOCALAPPDATA\Simply Chess without the "Data" and goes on every uninstall.
;
; The !ifndef is what lets scripts/check-uninstall-hook.mjs compile this same
; macro text against a scratch folder and run all four cases for real. Nothing
; in a build defines it, so a build gets the literal.

!ifndef APP_LOCAL_FOLDER
  !define APP_LOCAL_FOLDER "$LOCALAPPDATA\Simply Chess Data"
!endif

!macro NSIS_HOOK_POSTUNINSTALL
  ${If} $DeleteAppDataCheckboxState = 1
  ${AndIf} $UpdateMode <> 1
    ; The stock block sets this inside its own guard, so it is set again here
    ; rather than inherited: this folder belongs to the current user.
    SetShellVarContext current
    RMDir /r "${APP_LOCAL_FOLDER}"
  ${EndIf}
!macroend
