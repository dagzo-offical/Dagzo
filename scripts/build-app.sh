#!/bin/bash
# Dagzo Learn — App build script
# Electron/React appni build qiladi
# Ishga tushirish: ./scripts/build-app.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_ROOT/apps/dagzo-learn"
BRANDING_DIR="$PROJECT_ROOT/assets/branding"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Windows build uchun zarur shart (create_ico tekshiradi)
CAN_BUILD_WIN=true

# Node.js tekshirish
check_node() {
    if ! command -v node &>/dev/null; then
        log_error "Node.js o'rnatilmagan. https://nodejs.org dan yuklab oling."
    fi
    if ! command -v npm &>/dev/null; then
        log_error "npm o'rnatilmagan."
    fi

    local node_ver
    node_ver=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_ver -lt 16 ]]; then
        log_error "Node.js 16+ kerak. Joriy versiya: $(node -v)"
    fi
    log_info "Node.js $(node -v), npm $(npm -v)"
}

# icon.png → icon.ico (Windows build uchun, ImageMagick convert kerak)
create_ico() {
    local icon_src="$BRANDING_DIR/icon.png"
    local ico_dest="$APP_DIR/public/icon.ico"

    if [[ ! -f "$icon_src" ]]; then
        log_warn "icon.png topilmadi ($icon_src) — icon.ico yaratilmadi, Windows build skip"
        CAN_BUILD_WIN=false
        return
    fi

    if ! command -v convert &>/dev/null; then
        log_warn "ImageMagick 'convert' topilmadi — icon.ico yaratib bo'lmaydi"
        log_warn "O'rnatish: sudo apt-get install imagemagick"
        log_warn "Windows build skip qilinadi"
        CAN_BUILD_WIN=false
        return
    fi

    # Multi-size ICO: 256, 128, 64, 48, 32, 16 px
    convert "$icon_src" \
        -define icon:auto-resize=256,128,64,48,32,16 \
        "$ico_dest" 2>/dev/null

    if [[ -f "$ico_dest" ]]; then
        log_success "icon.ico yaratildi (256/128/64/48/32/16 px): $ico_dest"
    else
        log_warn "icon.ico yaratishda xato — Windows build skip qilinadi"
        CAN_BUILD_WIN=false
    fi
}

# Branding fayllarini public/ ga ko'chirish (Electron build uchun)
copy_branding() {
    log_info "Branding fayllar public/ ga ko'chirilmoqda..."
    mkdir -p "$APP_DIR/public/wallpapers"

    # App icon
    if [[ -f "$BRANDING_DIR/icon.png" ]]; then
        cp "$BRANDING_DIR/icon.png" "$APP_DIR/public/icon.png"
        log_success "icon.png → public/icon.png"
    else
        log_info "icon.png topilmadi (${BRANDING_DIR}/icon.png) — skip"
    fi

    # Wallpaperlar (Settings sahifasi uchun thumbnail)
    local wcount=0
    for i in $(seq 1 10); do
        local src="$BRANDING_DIR/wallpapers/wallpaper-$i.png"
        if [[ -f "$src" ]]; then
            cp "$src" "$APP_DIR/public/wallpapers/wallpaper-$i.png"
            ((wcount++)) || true
        fi
    done
    [[ $wcount -gt 0 ]] && log_success "$wcount ta wallpaper → public/wallpapers/"
}

# npm install
install_deps() {
    log_info "npm paketlari o'rnatilmoqda..."
    cd "$APP_DIR"
    npm install
    log_success "Paketlar o'rnatildi"
}

# React build
build_react() {
    log_info "React app build qilinmoqda..."
    cd "$APP_DIR"
    npm run build
    log_success "React build tayyor: $APP_DIR/dist"
}

# Electron Linux build
build_electron_linux() {
    log_info "Electron Linux build qilinmoqda..."
    cd "$APP_DIR"
    npm run dist:linux
    log_success "Electron Linux build tayyor: $APP_DIR/dist-electron"
}

# Electron Windows build (Linux'da cross-compile)
build_electron_win() {
    if [[ "$CAN_BUILD_WIN" == false ]]; then
        log_warn "Windows build skip: icon.ico yo'q yoki ImageMagick topilmadi"
        log_warn "Yechim: sudo apt-get install imagemagick && assets/branding/icon.png ni qo'ying"
        return
    fi

    log_info "Electron Windows build qilinmoqda (cross-compile)..."
    cd "$APP_DIR"

    if ! command -v wine &>/dev/null; then
        log_warn "Wine o'rnatilmagan — Windows build o'tkazib yuboriladi"
        return
    fi

    npm run dist:win || log_warn "Windows build xato — Linux buildiga o'tildi"
}

# Main
TARGET="${1:-linux}"

echo ""
echo -e "${CYAN}╔═══════════════════════════════╗${NC}"
echo -e "${CYAN}║  Dagzo Learn — Build Script    ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════╝${NC}"
echo ""

check_node
create_ico
copy_branding
install_deps
build_react

case "$TARGET" in
    linux)
        build_electron_linux
        ;;
    win|windows)
        build_electron_win
        ;;
    all)
        build_electron_linux
        build_electron_win
        ;;
    react-only)
        log_info "Faqat React build (Electron yo'q)"
        ;;
    *)
        log_error "Noma'lum target: $TARGET. linux | win | all | react-only"
        ;;
esac

echo ""
echo -e "${GREEN}Build muvaffaqiyatli yakunlandi!${NC}"
echo ""
