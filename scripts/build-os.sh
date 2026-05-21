#!/bin/bash
# Dagzo OS — ISO build script
# Debian live-build asosida Dagzo OS ISO yaratadi
# Ishga tushirish: sudo ./scripts/build-os.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
DIST_DIR="$PROJECT_ROOT/dist"
LB_DIR="$PROJECT_ROOT/os/live-build"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Root tekshirish
if [[ $EUID -ne 0 ]]; then
    log_error "Bu script root huquqi bilan ishga tushirilishi kerak: sudo $0"
fi

# Kerakli paketlar
check_deps() {
    log_info "Kerakli paketlar tekshirilmoqda..."
    local missing=()
    for pkg in live-build debootstrap squashfs-tools xorriso; do
        if ! dpkg -l "$pkg" &>/dev/null; then
            missing+=("$pkg")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_warn "Quyidagi paketlar o'rnatilmagan: ${missing[*]}"
        log_info "O'rnatilmoqda..."
        apt-get update -qq
        apt-get install -y "${missing[@]}"
    fi
    log_success "Barcha paketlar mavjud"
}

# Branding rasmlarini tekshirish
check_assets() {
    log_info "Branding rasmlar tekshirilmoqda..."
    local warn=0

    if [[ ! -f "$PROJECT_ROOT/assets/branding/boot.png" ]]; then
        log_warn "assets/branding/boot.png topilmadi — placeholder ishlatiladi"
        warn=1
    fi
    if [[ ! -f "$PROJECT_ROOT/assets/branding/icon.png" ]]; then
        log_warn "assets/branding/icon.png topilmadi — placeholder ishlatiladi"
        warn=1
    fi
    for i in $(seq 1 10); do
        if [[ ! -f "$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png" ]]; then
            log_warn "wallpaper-$i.png topilmadi"
            warn=1
        fi
    done

    if [[ $warn -eq 1 ]]; then
        log_warn "Ba'zi branding fayllar yo'q. Scriptlar davom etadi, lekin placeholder ko'rinishi chiqadi."
    else
        log_success "Barcha branding fayllari mavjud"
    fi
}

# Dagzo Learn appni build qilish
build_app() {
    log_info "Dagzo Learn app build qilinmoqda..."

    if [[ ! -d "$PROJECT_ROOT/apps/dagzo-learn/node_modules" ]]; then
        log_info "npm install ishga tushirilmoqda..."
        cd "$PROJECT_ROOT/apps/dagzo-learn"
        npm install --production
        cd "$PROJECT_ROOT"
    fi

    cd "$PROJECT_ROOT/apps/dagzo-learn"
    npm run build
    npm run dist:linux || log_warn "Electron dist xato (dist fayli bo'lsa davom etadi)"
    cd "$PROJECT_ROOT"

    log_success "Dagzo Learn app tayyor"
}

# live-build sozlash
setup_livebuild() {
    log_info "live-build konfiguratsiyasi sozlanmoqda..."

    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"

    # Oldingi build tozalash
    lb clean --purge 2>/dev/null || true

    # auto/config nusxalash
    mkdir -p auto
    cp "$LB_DIR/auto/config" auto/config
    chmod +x auto/config

    # Paket ro'yxati
    mkdir -p config/package-lists
    cp "$LB_DIR/config/package-lists/dagzo.list.chroot" config/package-lists/

    # lb config ishga tushirish
    bash auto/config

    log_success "live-build sozlandi"
}

# Branding fayllarni chroot ichiga ko'chirish
inject_branding() {
    log_info "Branding fayllari chroot ichiga ko'chirilmoqda..."

    local chroot_includes="$BUILD_DIR/config/includes.chroot"
    mkdir -p "$chroot_includes/opt/dagzo/branding/wallpapers"
    mkdir -p "$chroot_includes/opt/dagzo/apps"
    mkdir -p "$chroot_includes/usr/share/plymouth/themes/dagzo"
    mkdir -p "$chroot_includes/etc/xdg/autostart"
    mkdir -p "$chroot_includes/usr/share/applications"

    # Branding rasmlar
    [[ -f "$PROJECT_ROOT/assets/branding/boot.png" ]] && \
        cp "$PROJECT_ROOT/assets/branding/boot.png" "$chroot_includes/opt/dagzo/branding/"
    [[ -f "$PROJECT_ROOT/assets/branding/icon.png" ]] && \
        cp "$PROJECT_ROOT/assets/branding/icon.png" "$chroot_includes/opt/dagzo/branding/"

    for i in $(seq 1 10); do
        [[ -f "$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png" ]] && \
            cp "$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png" \
               "$chroot_includes/opt/dagzo/branding/wallpapers/"
    done

    # Plymouth theme
    cp "$PROJECT_ROOT/os/plymouth/dagzo/dagzo.plymouth" \
       "$chroot_includes/usr/share/plymouth/themes/dagzo/"
    cp "$PROJECT_ROOT/os/plymouth/dagzo/dagzo.script" \
       "$chroot_includes/usr/share/plymouth/themes/dagzo/"
    [[ -f "$PROJECT_ROOT/assets/branding/boot.png" ]] && \
        cp "$PROJECT_ROOT/assets/branding/boot.png" \
           "$chroot_includes/usr/share/plymouth/themes/dagzo/"

    # Desktop fayllari
    cp "$PROJECT_ROOT/os/desktop-files/dagzo-learn.desktop" \
       "$chroot_includes/usr/share/applications/"
    cp "$PROJECT_ROOT/os/autostart/dagzo-learn.desktop" \
       "$chroot_includes/etc/xdg/autostart/"

    # Systemd service
    mkdir -p "$chroot_includes/etc/systemd/user"
    cp "$PROJECT_ROOT/os/systemd/dagzo-learn-autostart.service" \
       "$chroot_includes/etc/systemd/user/"

    # OS branding script chroot hookiga
    mkdir -p "$BUILD_DIR/config/hooks/normal"
    cp "$PROJECT_ROOT/os/branding-scripts/set-os-release.sh" \
       "$BUILD_DIR/config/hooks/normal/9999-dagzo-branding.hook.chroot"
    chmod +x "$BUILD_DIR/config/hooks/normal/9999-dagzo-branding.hook.chroot"

    log_success "Branding fayllari ko'chirildi"
}

# Dagzo Learn appni chroot ichiga joylashtirish
inject_app() {
    log_info "Dagzo Learn app chroot ichiga ko'chirilmoqda..."

    local chroot_includes="$BUILD_DIR/config/includes.chroot"
    local app_dist="$PROJECT_ROOT/apps/dagzo-learn/dist-electron"

    mkdir -p "$chroot_includes/opt/dagzo/dagzo-learn"

    if [[ -d "$app_dist" ]]; then
        cp -r "$app_dist/"* "$chroot_includes/opt/dagzo/dagzo-learn/" 2>/dev/null || true
        log_success "Dagzo Learn ko'chirildi"
    else
        log_warn "Dagzo Learn dist topilmadi — app avval build qilinishi kerak"
    fi
}

# ISO build
build_iso() {
    log_info "ISO build qilinmoqda (bu uzoq vaqt olishi mumkin)..."
    cd "$BUILD_DIR"

    lb build 2>&1 | tee "$BUILD_DIR/build.log"

    if [[ -f "$BUILD_DIR/live-image-amd64.hybrid.iso" ]]; then
        mkdir -p "$DIST_DIR"
        mv "$BUILD_DIR/live-image-amd64.hybrid.iso" "$DIST_DIR/dagzo-os.iso"
        log_success "ISO tayyor: $DIST_DIR/dagzo-os.iso"
        ls -lh "$DIST_DIR/dagzo-os.iso"
    else
        log_error "ISO yaratilmadi. Log: $BUILD_DIR/build.log"
    fi
}

# Main
main() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Dagzo OS — ISO Build Script      ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════╝${NC}"
    echo ""

    check_deps
    check_assets
    build_app
    setup_livebuild
    inject_branding
    inject_app
    build_iso

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Build muvaffaqiyatli yakunlandi! ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════╝${NC}"
    echo -e "  ISO joyi: ${CYAN}$DIST_DIR/dagzo-os.iso${NC}"
    echo ""
}

main "$@"
