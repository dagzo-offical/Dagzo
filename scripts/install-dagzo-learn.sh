#!/bin/bash
# Dagzo Learn — tizimga o'rnatish skripti
# Electron appni /opt/dagzo/dagzo-learn/ ga o'rnatadi va tizimga integratsiya qiladi
# Ishga tushirish: sudo ./scripts/install-dagzo-learn.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_ROOT/apps/dagzo-learn"
INSTALL_DIR="/opt/dagzo/dagzo-learn"
DAGZO_DIR="/opt/dagzo"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}╔════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Dagzo Learn — Install Script       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════╝${NC}"
echo ""

# Root tekshirish
if [[ $EUID -ne 0 ]]; then
    log_error "Root huquqi kerak: sudo $0"
fi

# Node.js tekshirish
check_node() {
    if ! command -v node &>/dev/null; then
        log_error "Node.js topilmadi. O'rnatish: apt-get install nodejs npm"
    fi
    local ver
    ver=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $ver -lt 16 ]]; then
        log_error "Node.js 16+ kerak. Joriy: $(node -v)"
    fi
    log_info "Node.js $(node -v), npm $(npm -v)"
}

# npm paketlar o'rnatish
install_npm_deps() {
    log_info "npm paketlar o'rnatilmoqda..."
    cd "$APP_DIR"
    npm install 2>&1 | tail -5
    log_success "npm paketlar tayyor"
}

# React build
build_react() {
    log_info "React app build qilinmoqda..."
    cd "$APP_DIR"
    npm run build
    log_success "React build: $APP_DIR/dist"
}

# Electron build
build_electron() {
    log_info "Electron Linux build qilinmoqda..."
    cd "$APP_DIR"

    if npm run dist:linux 2>&1 | tail -10; then
        log_success "Electron build tayyor: $APP_DIR/dist-electron"
        return 0
    else
        log_warn "Electron dist xato — dev rejimda ishga tushirishga o'tiladi"
        return 1
    fi
}

# O'rnatish papkalari
setup_dirs() {
    log_info "O'rnatish papkalari yaratilmoqda..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DAGZO_DIR/apps"
    mkdir -p "$DAGZO_DIR/branding/wallpapers"
    log_success "Papkalar tayyor"
}

# Electron binary / AppImage o'rnatish
install_binary() {
    # 1. AppImage
    local appimage
    appimage=$(ls "$APP_DIR/dist-electron/"*.AppImage 2>/dev/null | head -1)
    if [[ -n "$appimage" ]]; then
        cp "$appimage" "$INSTALL_DIR/dagzo-learn.AppImage"
        chmod +x "$INSTALL_DIR/dagzo-learn.AppImage"
        ln -sf "$INSTALL_DIR/dagzo-learn.AppImage" "$INSTALL_DIR/dagzo-learn"
        log_success "Dagzo Learn AppImage o'rnatildi: $INSTALL_DIR"
        return 0
    fi

    # 2. linux-unpacked binary
    if [[ -f "$APP_DIR/dist-electron/linux-unpacked/dagzo-learn" ]]; then
        cp -r "$APP_DIR/dist-electron/linux-unpacked/"* "$INSTALL_DIR/"
        chmod +x "$INSTALL_DIR/dagzo-learn"
        log_success "Dagzo Learn binary o'rnatildi: $INSTALL_DIR"
        return 0
    fi

    # 3. Dev mode fallback — electron ni to'g'ridan-to'g'ri chaqirish
    log_warn "Electron binary topilmadi — dev launcher yaratilmoqda"

    # React dist ni /opt/ ga ko'chirish
    if [[ -d "$APP_DIR/dist" ]]; then
        cp -r "$APP_DIR/dist" "$INSTALL_DIR/dist"
    fi
    cp -r "$APP_DIR/electron" "$INSTALL_DIR/electron"
    cp -r "$APP_DIR/backend"  "$INSTALL_DIR/backend"
    cp -r "$APP_DIR/node_modules" "$INSTALL_DIR/node_modules"
    cp "$APP_DIR/package.json" "$INSTALL_DIR/"

    # Launcher script
    cat > "$INSTALL_DIR/dagzo-learn" << LAUNCHER
#!/bin/bash
cd "$INSTALL_DIR"
exec node_modules/.bin/electron . --no-sandbox "\$@"
LAUNCHER
    chmod +x "$INSTALL_DIR/dagzo-learn"
    log_success "Dev launcher yaratildi: $INSTALL_DIR/dagzo-learn"
}

# Desktop integration
install_desktop_integration() {
    log_info "Desktop integratsiyasi o'rnatilmoqda..."

    # .desktop fayl
    cp "$PROJECT_ROOT/os/desktop-files/dagzo-learn.desktop" \
       /usr/share/applications/dagzo-learn.desktop

    # Autostart (barcha foydalanuvchilar uchun)
    mkdir -p /etc/xdg/autostart
    cp "$PROJECT_ROOT/os/autostart/dagzo-learn.desktop" \
       /etc/xdg/autostart/dagzo-learn.desktop

    # dagzo foydalanuvchi desktop
    if [[ -d "/home/dagzo/Desktop" ]]; then
        cp "$PROJECT_ROOT/os/desktop-files/dagzo-learn.desktop" \
           "/home/dagzo/Desktop/Dagzo-Learn.desktop"
        chmod +x "/home/dagzo/Desktop/Dagzo-Learn.desktop"
        chown dagzo:dagzo "/home/dagzo/Desktop/Dagzo-Learn.desktop" 2>/dev/null || true
    fi

    # Systemd user service
    mkdir -p /etc/systemd/user
    cp "$PROJECT_ROOT/os/systemd/dagzo-learn-autostart.service" \
       /etc/systemd/user/dagzo-learn-autostart.service

    # Icon kesh yangilash
    update-desktop-database /usr/share/applications 2>/dev/null || true

    log_success "Desktop integratsiyasi o'rnatildi"
}

# Branding fayllarni tekshirish va o'rnatish
install_branding() {
    log_info "Branding fayllari tekshirilmoqda..."

    local icon_src="$PROJECT_ROOT/assets/branding/icon.png"
    if [[ -f "$icon_src" ]]; then
        cp "$icon_src" "$DAGZO_DIR/branding/icon.png"
        log_success "icon.png o'rnatildi"
    else
        log_warn "icon.png topilmadi — keyin o'rnating: assets/branding/icon.png"
    fi

    # Wallpaperlar
    local wcount=0
    for i in $(seq 1 10); do
        local src="$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png"
        if [[ -f "$src" ]]; then
            cp "$src" "$DAGZO_DIR/branding/wallpapers/wallpaper-$i.png"
            ((wcount++)) || true
        fi
    done
    [[ $wcount -gt 0 ]] && log_success "$wcount ta wallpaper o'rnatildi"
}

# Xulosa
print_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Dagzo Learn muvaffaqiyatli o'rnatildi! ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Ishga tushirish:  ${CYAN}$INSTALL_DIR/dagzo-learn${NC}"
    echo -e "  Darsliklar joyi:  ${CYAN}$DAGZO_DIR/apps/${NC}"
    echo -e "  Branding joyi:    ${CYAN}$DAGZO_DIR/branding/${NC}"
    echo ""
    echo -e "  Autostart:        ${CYAN}/etc/xdg/autostart/dagzo-learn.desktop${NC}"
    echo -e "  Desktop fayl:     ${CYAN}/usr/share/applications/dagzo-learn.desktop${NC}"
    echo ""
    echo -e "  ${YELLOW}Eslatma:${NC} Tizimni qayta ishga tushirganda Dagzo Learn avtomatik ochiladi."
    echo ""
}

# Main
check_node
setup_dirs
install_npm_deps
build_react
build_electron || true
install_binary
install_desktop_integration
install_branding
print_summary
