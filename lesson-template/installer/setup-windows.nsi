; Dagzo Lesson — Windows NSIS Installer Script
; NSIS (Nullsoft Scriptable Install System) bilan kompilyatsiya qilinadi

!define LESSON_NAME "Matematika 5-sinf"
!define LESSON_VERSION "1.0.0"
!define LESSON_PUBLISHER "Dagzo Education"
!define LESSON_FOLDER "Matematika_5"
!define INSTALLER_NAME "Matematika_5_Setup"

Name "${LESSON_NAME}"
OutFile "${INSTALLER_NAME}.exe"
InstallDir "$PROGRAMFILES\Dagzo\${LESSON_FOLDER}"
InstallDirRegKey HKCU "Software\Dagzo\${LESSON_FOLDER}" ""
RequestExecutionLevel admin
SetCompressor /SOLID lzma

; Pages
Page directory
Page instfiles

UninstPage uninstConfirm
UninstPage instfiles

; Version info
VIProductVersion "${LESSON_VERSION}.0"
VIAddVersionKey "ProductName" "${LESSON_NAME}"
VIAddVersionKey "CompanyName" "${LESSON_PUBLISHER}"
VIAddVersionKey "FileDescription" "${LESSON_NAME} Installer"
VIAddVersionKey "FileVersion" "${LESSON_VERSION}"

Section "Asosiy o'rnatish" SecMain
    SetOutPath "$INSTDIR"

    ; Barcha fayllarni o'rnatish
    File /r "app\*.*"

    ; Elektron binary (agar mavjud bo'lsa)
    ; File "electron\dagzo-lesson.exe"

    ; Uninstall ma'lumotlari
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Dagzo_${LESSON_FOLDER}" \
        "DisplayName" "${LESSON_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Dagzo_${LESSON_FOLDER}" \
        "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Dagzo_${LESSON_FOLDER}" \
        "Publisher" "${LESSON_PUBLISHER}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Dagzo_${LESSON_FOLDER}" \
        "DisplayVersion" "${LESSON_VERSION}"
SectionEnd

Section "Desktop shortcut" SecDesktop
    ; Desktop shortcut yaratish
    CreateShortCut "$DESKTOP\${LESSON_NAME}.lnk" \
        "$INSTDIR\index.html" "" \
        "$INSTDIR\assets\icon.ico" 0
SectionEnd

Section "Start Menu" SecStartMenu
    CreateDirectory "$SMPROGRAMS\Dagzo"
    CreateShortCut "$SMPROGRAMS\Dagzo\${LESSON_NAME}.lnk" \
        "$INSTDIR\index.html" "" \
        "$INSTDIR\assets\icon.ico" 0
    CreateShortCut "$SMPROGRAMS\Dagzo\${LESSON_NAME} (O'chirish).lnk" \
        "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
    RMDir /r "$INSTDIR"
    Delete "$DESKTOP\${LESSON_NAME}.lnk"
    Delete "$SMPROGRAMS\Dagzo\${LESSON_NAME}.lnk"
    RMDir "$SMPROGRAMS\Dagzo"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Dagzo_${LESSON_FOLDER}"
SectionEnd
