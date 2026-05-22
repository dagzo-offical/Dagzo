#!/bin/bash
# Dagzo OS — Branding install script
# Mavjud Debian/XFCE tizimiga Dagzo brandingini o'rnatadi
# Ishga tushirish: sudo ./scripts/install-branding.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

if [[ $EUID -ne 0 ]]; then
    log_error "Root huquqi kerak: sudo $0"
fi

# Papkalar
DAGZO_DIR="/opt/dagzo"
BRANDING_DIR="$DAGZO_DIR/branding"
WALLPAPER_DIR="$BRANDING_DIR/wallpapers"
APPS_DIR="$DAGZO_DIR/apps"
PLYMOUTH_DIR="/usr/share/plymouth/themes/dagzo"

install_branding_files() {
    log_info "Branding fayllari o'rnatilmoqda..."

    mkdir -p "$BRANDING_DIR" "$WALLPAPER_DIR" "$APPS_DIR" "$PLYMOUTH_DIR"

    # Icon — Fix #7: /opt/dagzo/branding/ VA hicolor themes ga ham ko'chirish
    if [[ -f "$PROJECT_ROOT/assets/branding/icon.png" ]]; then
        cp "$PROJECT_ROOT/assets/branding/icon.png" "$BRANDING_DIR/icon.png"

        # Tizim icon keshi uchun hicolor sizes
        for size in 16 24 32 48 64 128 256 512; do
            mkdir -p "/usr/share/icons/hicolor/${size}x${size}/apps"
        done
        cp "$PROJECT_ROOT/assets/branding/icon.png" \
           "/usr/share/icons/hicolor/256x256/apps/dagzo-learn.png"

        log_success "icon.png o'rnatildi (branding + hicolor)"
    else
        log_warn "icon.png topilmadi: $PROJECT_ROOT/assets/branding/icon.png"
    fi

    # Wallpaperlar
    local wcount=0
    for i in $(seq 1 10); do
        local src="$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png"
        if [[ -f "$src" ]]; then
            cp "$src" "$WALLPAPER_DIR/wallpaper-$i.png"
            ((wcount++))
        fi
    done
    log_success "$wcount ta wallpaper o'rnatildi"

    # Boot.png Plymouth uchun
    if [[ -f "$PROJECT_ROOT/assets/branding/boot.png" ]]; then
        cp "$PROJECT_ROOT/assets/branding/boot.png" "$BRANDING_DIR/boot.png"
        cp "$PROJECT_ROOT/assets/branding/boot.png" "$PLYMOUTH_DIR/boot.png"
        log_success "boot.png o'rnatildi"
    else
        log_warn "boot.png topilmadi"
    fi
}

install_plymouth() {
    log_info "Plymouth theme o'rnatilmoqda..."

    if ! command -v plymouth &>/dev/null; then
        log_warn "Plymouth o'rnatilmagan. O'rnatilmoqda..."
        apt-get install -y plymouth plymouth-themes
    fi

    cp "$PROJECT_ROOT/os/plymouth/dagzo/dagzo.plymouth" "$PLYMOUTH_DIR/"
    cp "$PROJECT_ROOT/os/plymouth/dagzo/dagzo.script" "$PLYMOUTH_DIR/"

    # Plymouth default theme
    if command -v update-alternatives &>/dev/null; then
        update-alternatives --install \
            /usr/share/plymouth/themes/default.plymouth \
            default.plymouth \
            "$PLYMOUTH_DIR/dagzo.plymouth" \
            100 2>/dev/null || true

        update-alternatives --set \
            default.plymouth \
            "$PLYMOUTH_DIR/dagzo.plymouth" 2>/dev/null || true
    fi

    # initramfs yangilash
    update-initramfs -u 2>/dev/null || log_warn "initramfs yangilanmadi"

    log_success "Plymouth theme o'rnatildi"
}

install_grub() {
    log_info "GRUB konfiguratsiyasi o'rnatilmoqda..."

    if [[ -d "/etc/default/grub.d" ]]; then
        cp "$PROJECT_ROOT/os/grub/grub-dagzo.cfg" /etc/default/grub.d/dagzo.cfg
        update-grub 2>/dev/null || log_warn "GRUB yangilanmadi"
        log_success "GRUB konfiguratsiyasi o'rnatildi"
    else
        log_warn "/etc/default/grub.d topilmadi — GRUB qo'lda sozlanishi kerak"
    fi

    # GRUB theme
    mkdir -p /boot/grub/themes/dagzo
    cp "$PROJECT_ROOT/os/grub/dagzo-grub-theme/theme.txt" /boot/grub/themes/dagzo/
    log_success "GRUB theme fayllari ko'chirildi"
}

install_desktop_files() {
    log_info "Desktop fayllari o'rnatilmoqda..."

    # Application menu
    cp "$PROJECT_ROOT/os/desktop-files/dagzo-learn.desktop" \
       /usr/share/applications/dagzo-learn.desktop

    # Autostart (barcha foydalanuvchilar uchun)
    mkdir -p /etc/xdg/autostart
    cp "$PROJECT_ROOT/os/autostart/dagzo-learn.desktop" \
       /etc/xdg/autostart/dagzo-learn.desktop

    # Desktop icon (dagzo foydalanuvchisi uchun)
    local desktop_dir="/home/dagzo/Desktop"
    if [[ -d "$desktop_dir" ]]; then
        cp "$PROJECT_ROOT/os/desktop-files/dagzo-learn.desktop" \
           "$desktop_dir/Dagzo-Learn.desktop"
        chmod +x "$desktop_dir/Dagzo-Learn.desktop"
        chown dagzo:dagzo "$desktop_dir/Dagzo-Learn.desktop" 2>/dev/null || true
    fi

    # Desktop va icon caches yangilash — Fix #7
    update-desktop-database /usr/share/applications 2>/dev/null || true
    gtk-update-icon-cache -f /usr/share/icons/hicolor 2>/dev/null || true
    xdg-icon-resource forceupdate 2>/dev/null || true

    log_success "Desktop fayllari o'rnatildi"
}

set_wallpaper() {
    log_info "XFCE wallpaper sozlanmoqda..."

    local wallpaper="$WALLPAPER_DIR/wallpaper-2.png"

    if [[ ! -f "$wallpaper" ]]; then
        log_warn "wallpaper-2.png topilmadi, o'tkazib yuborildi"
        return
    fi

    # XFCE wallpaper sozlash (agar XFCE ishlaётgan bo'lsa)
    if command -v xfconf-query &>/dev/null; then
        # Barcha monitorlar uchun
        for monitor in 0 1; do
            xfconf-query -c xfce4-desktop \
                -p "/backdrop/screen0/monitor$monitor/workspace0/last-image" \
                -s "$wallpaper" 2>/dev/null || true
            xfconf-query -c xfce4-desktop \
                -p "/backdrop/screen0/monitor$monitor/workspace0/image-style" \
                -s 5 2>/dev/null || true  # 5 = Zoomed
        done
        log_success "XFCE wallpaper sozlandi"
    else
        log_warn "xfconf-query topilmadi — wallpaper qo'lda sozlanishi kerak"
    fi

    # LightDM background
    if [[ -f "/etc/lightdm/lightdm-gtk-greeter.conf" ]]; then
        sed -i "s|^#*background=.*|background=$wallpaper|" \
            /etc/lightdm/lightdm-gtk-greeter.conf 2>/dev/null || true
        log_success "LightDM background sozlandi"
    fi
}

set_hostname() {
    log_info "Hostname dagzo ga o'rnatilmoqda..."
    echo "dagzo" > /etc/hostname
    # /etc/hosts yangilash
    if ! grep -q "dagzo" /etc/hosts; then
        echo "127.0.1.1    dagzo" >> /etc/hosts
    fi
    log_success "Hostname o'rnatildi: dagzo"
}

set_os_release() {
    log_info "OS branding o'rnatilmoqda..."
    bash "$PROJECT_ROOT/os/branding-scripts/set-os-release.sh"
}

install_wine_association() {
    log_info ".exe fayl assotsiatsiyasi o'rnatilmoqda..."

    # .exe fayl assotsiatsiyasi uchun handler
    cat > /usr/share/applications/wine-exe-handler.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Wine Windows Program Loader
Exec=wine '%f'
MimeType=application/x-ms-dos-executable;application/x-msdos-program;
NoDisplay=true
EOF

    update-desktop-database /usr/share/applications 2>/dev/null || true
    log_success ".exe handler o'rnatildi"
}

# Main
main() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Dagzo OS — Branding Install Script  ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════╝${NC}"
    echo ""

    install_branding_files
    install_plymouth
    install_grub
    install_desktop_files
    set_wallpaper
    set_hostname
    set_os_release
    install_wine_association

    echo ""
    echo -e "${GREEN}╔═════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Branding muvaffaqiyatli o'rnatildi! ║${NC}"
    echo -e "${GREEN}╚═════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Plymouth: ${CYAN}$PLYMOUTH_DIR${NC}"
    echo -e "  Branding: ${CYAN}$BRANDING_DIR${NC}"
    echo -e "  Wallpaperlar: ${CYAN}$WALLPAPER_DIR${NC}"
    echo ""
    log_info "Tizimni qayta ishga tushirish tavsiya etiladi."
}

main "$@"
