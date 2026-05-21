#!/bin/bash
# Dagzo Learn — App build script
# Electron/React appni build qiladi
# Ishga tushirish: ./scripts/build-app.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")/apps/dagzo-learn"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

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
    log_info "Electron Windows build qilinmoqda (cross-compile)..."
    cd "$APP_DIR"

    if ! command -v wine &>/dev/null; then
        log_info "Wine o'rnatilmagan — Windows build o'tkazib yuboriladi"
        return
    fi

    npm run dist:win || log_info "Windows build xato — Linux buildiga o'tildi"
}

# Main
TARGET="${1:-linux}"

echo ""
echo -e "${CYAN}╔═══════════════════════════════╗${NC}"
echo -e "${CYAN}║  Dagzo Learn — Build Script    ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════╝${NC}"
echo ""

check_node
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
