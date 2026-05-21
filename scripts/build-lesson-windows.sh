#!/bin/bash
# Dagzo — Windows setup.exe builder
# Darslikni Windows installer (NSIS) formatida chiqaradi
# Ishga tushirish: ./scripts/build-lesson-windows.sh --lesson lesson-template/app --name "Matematika_5"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"

# Default qiymatlar
LESSON_DIR=""
LESSON_NAME="Dagzo_Darslik"
LESSON_VERSION="1.0.0"
LESSON_PUBLISHER="Dagzo Education"

# Argumentlarni parse qilish
while [[ $# -gt 0 ]]; do
    case $1 in
        --lesson)  LESSON_DIR="$2"; shift 2 ;;
        --name)    LESSON_NAME="$2"; shift 2 ;;
        --version) LESSON_VERSION="$2"; shift 2 ;;
        *) echo "Noma'lum argument: $1"; exit 1 ;;
    esac
done

if [[ -z "$LESSON_DIR" ]]; then
    echo "Xato: --lesson argumenti kerak"
    echo "Misol: $0 --lesson lesson-template/app --name Matematika_5"
    exit 1
fi

LESSON_DIR="$(realpath "$LESSON_DIR")"

if [[ ! -d "$LESSON_DIR" ]]; then
    echo "Xato: Darslik papkasi topilmadi: $LESSON_DIR"
    exit 1
fi

# config.json o'qish
if [[ -f "$LESSON_DIR/config.json" ]]; then
    if command -v python3 &>/dev/null; then
        LESSON_NAME_CFG=$(python3 -c "import json,sys; d=json.load(open('$LESSON_DIR/config.json')); print(d.get('name',''))" 2>/dev/null || echo "")
        LESSON_VERSION=$(python3 -c "import json,sys; d=json.load(open('$LESSON_DIR/config.json')); print(d.get('version','1.0.0'))" 2>/dev/null || echo "1.0.0")
        [[ -n "$LESSON_NAME_CFG" ]] && LESSON_NAME="${LESSON_NAME_CFG// /_}"
    fi
fi

echo "Darslik: $LESSON_NAME v$LESSON_VERSION"
echo "Manba: $LESSON_DIR"

# Electron app shakli (HTML wrapper + Electron)
TEMP_DIR=$(mktemp -d)
ELECTRON_APP="$TEMP_DIR/electron-lesson"

mkdir -p "$ELECTRON_APP/app"
cp -r "$LESSON_DIR/"* "$ELECTRON_APP/app/"

# Minimal Electron wrapper
cat > "$ELECTRON_APP/main.js" << 'ELECTRON_EOF'
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1920, height: 1080,
        fullscreen: true,
        frame: false,
        icon: path.join(__dirname, 'app/assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
    })
    win.loadFile(path.join(__dirname, 'app/index.html'))
})

app.on('window-all-closed', () => app.quit())
ELECTRON_EOF

cat > "$ELECTRON_APP/package.json" << PKGJSON
{
  "name": "$(echo $LESSON_NAME | tr '[:upper:]' '[:lower:]' | tr ' ' '-')",
  "version": "$LESSON_VERSION",
  "description": "$LESSON_NAME — Dagzo Education",
  "main": "main.js",
  "author": "$LESSON_PUBLISHER",
  "license": "MIT",
  "build": {
    "appId": "uz.dagzo.lesson.$(echo $LESSON_NAME | tr '[:upper:]' '[:lower:]' | tr -d ' ')",
    "productName": "$LESSON_NAME",
    "win": {
      "target": "nsis",
      "icon": "app/assets/icon.ico"
    },
    "nsis": {
      "oneClick": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "$LESSON_NAME",
      "installerIcon": "app/assets/icon.ico",
      "uninstallerIcon": "app/assets/icon.ico",
      "menuCategory": "Dagzo"
    },
    "directories": {
      "output": "dist"
    }
  }
}
PKGJSON

# npm install va build
cd "$ELECTRON_APP"
npm install electron electron-builder --save-dev 2>/dev/null
npx electron-builder --win 2>/dev/null || {
    echo "[WARN] Electron-builder Windows build xato. NSIS o'rnatilgan bo'lishi kerak."
}

# Natijani dist/ ga ko'chirish
mkdir -p "$DIST_DIR"
if ls "$ELECTRON_APP/dist/"*.exe &>/dev/null; then
    cp "$ELECTRON_APP/dist/"*.exe "$DIST_DIR/${LESSON_NAME}_Setup.exe"
    echo "[OK] Setup.exe tayyor: $DIST_DIR/${LESSON_NAME}_Setup.exe"
else
    echo "[WARN] .exe fayl topilmadi. Manuell Electron setup kerak."
fi

# Tozalash
rm -rf "$TEMP_DIR"

echo "Build yakunlandi."
