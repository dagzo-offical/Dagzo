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

if [[ $EUID -ne 0 ]]; then
    log_error "Bu script root huquqi bilan ishga tushirilishi kerak: sudo $0"
fi

# Kerakli paketlar
check_deps() {
    log_info "Kerakli paketlar tekshirilmoqda..."
    local missing=()
    for pkg in live-build debootstrap squashfs-tools xorriso nodejs npm; do
        dpkg -l "$pkg" &>/dev/null || missing+=("$pkg")
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_warn "O'rnatilmagan paketlar: ${missing[*]}"
        apt-get update -qq
        apt-get install -y "${missing[@]}"
    fi

    # Node.js versiyasini tekshirish
    local node_ver
    node_ver=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ -z "$node_ver" || $node_ver -lt 18 ]]; then
        log_error "Node.js 18+ kerak. Joriy: $(node -v 2>/dev/null || echo 'yo'\''q'). \
Yuklab olish: https://nodejs.org yoki: curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    fi
    log_success "Node.js $(node -v) — OK"
}

# Fix #6: branding fayllar yo'q bo'lsa ogohlantir, to'xtatma
check_assets() {
    log_info "Branding rasmlar tekshirilmoqda..."
    local missing=()

    [[ ! -f "$PROJECT_ROOT/assets/branding/boot.png" ]] && missing+=("assets/branding/boot.png")
    [[ ! -f "$PROJECT_ROOT/assets/branding/icon.png" ]] && missing+=("assets/branding/icon.png")
    for i in $(seq 1 10); do
        [[ ! -f "$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png" ]] \
            && missing+=("assets/branding/wallpapers/wallpaper-$i.png")
    done

    if [[ ${#missing[@]} -eq 0 ]]; then
        log_success "Barcha 12 ta branding fayl mavjud"
    else
        log_warn "${#missing[@]} ta fayl topilmadi (ISO placeholder bilan chiqadi):"
        for f in "${missing[@]}"; do
            echo -e "     ${RED}✗${NC} $f"
        done
        echo ""
        log_warn "Rasmlarni qo'shish uchun README.md ni o'qing."
    fi
    # Skript to'xtatilmaydi — rasmlar bo'lmasa ham ISO build davom etadi
}

# Fix #1: npm install --production → npm install (devDependencies kerak)
build_app() {
    log_info "Dagzo Learn app build qilinmoqda..."
    bash "$PROJECT_ROOT/scripts/build-app.sh" linux
    log_success "Dagzo Learn build yakunlandi"
}

# live-build sozlash
setup_livebuild() {
    log_info "live-build sozlanmoqda..."
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"

    lb clean --purge 2>/dev/null || true

    mkdir -p auto
    cp "$LB_DIR/auto/config" auto/config
    chmod +x auto/config

    mkdir -p config/package-lists
    cp "$LB_DIR/config/package-lists/dagzo.list.chroot" config/package-lists/

    bash auto/config
    log_success "live-build sozlandi"
}

# Branding fayllarni chroot ichiga ko'chirish
inject_branding() {
    log_info "Branding fayllari inject qilinmoqda..."
    local ci="$BUILD_DIR/config/includes.chroot"

    mkdir -p \
        "$ci/opt/dagzo/branding/wallpapers" \
        "$ci/opt/dagzo/apps" \
        "$ci/usr/share/plymouth/themes/dagzo" \
        "$ci/usr/share/icons/hicolor/256x256/apps" \
        "$ci/etc/xdg/autostart" \
        "$ci/usr/share/applications"

    # Boot splash
    [[ -f "$PROJECT_ROOT/assets/branding/boot.png" ]] && {
        cp "$PROJECT_ROOT/assets/branding/boot.png" "$ci/opt/dagzo/branding/"
        cp "$PROJECT_ROOT/assets/branding/boot.png" "$ci/usr/share/plymouth/themes/dagzo/"
    }

    # Icon — Fix #7: hicolor themes ga ham ko'chirish
    [[ -f "$PROJECT_ROOT/assets/branding/icon.png" ]] && {
        cp "$PROJECT_ROOT/assets/branding/icon.png" "$ci/opt/dagzo/branding/"
        cp "$PROJECT_ROOT/assets/branding/icon.png" \
           "$ci/usr/share/icons/hicolor/256x256/apps/dagzo-learn.png"
    }

    # Wallpaperlar
    for i in $(seq 1 10); do
        [[ -f "$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png" ]] && \
            cp "$PROJECT_ROOT/assets/branding/wallpapers/wallpaper-$i.png" \
               "$ci/opt/dagzo/branding/wallpapers/"
    done

    # Plymouth theme fayllari
    cp "$PROJECT_ROOT/os/plymouth/dagzo/dagzo.plymouth" "$ci/usr/share/plymouth/themes/dagzo/"
    cp "$PROJECT_ROOT/os/plymouth/dagzo/dagzo.script"   "$ci/usr/share/plymouth/themes/dagzo/"

    # Desktop fayllari
    cp "$PROJECT_ROOT/os/desktop-files/dagzo-learn.desktop" "$ci/usr/share/applications/"
    cp "$PROJECT_ROOT/os/autostart/dagzo-learn.desktop"     "$ci/etc/xdg/autostart/"

    # Systemd user service
    mkdir -p "$ci/etc/systemd/user"
    cp "$PROJECT_ROOT/os/systemd/dagzo-learn-autostart.service" "$ci/etc/systemd/user/"

    # LightDM autologin — dagzo user, XFCE session
    mkdir -p "$ci/etc/lightdm/lightdm.conf.d"
    cat > "$ci/etc/lightdm/lightdm.conf.d/50-dagzo-autologin.conf" << 'LIGHTDM'
[Seat:*]
autologin-user=dagzo
autologin-user-timeout=0
user-session=xfce
LIGHTDM
    log_success "LightDM autologin config inject qilindi (user: dagzo, session: xfce)"

    log_success "Branding fayllari inject qilindi"
}

# Dagzo Learn app ni chroot ichiga joylashtirish
# Afzallik: linux-unpacked (FUSE talab qilmaydi) > AppImage (fallback)
inject_app() {
    log_info "Dagzo Learn app inject qilinmoqda..."
    local ci="$BUILD_DIR/config/includes.chroot"
    local app_dist="$PROJECT_ROOT/apps/dagzo-learn/dist-electron"

    mkdir -p "$ci/opt/dagzo/dagzo-learn"

    # 1. linux-unpacked — ISO uchun eng ishonchli variant (FUSE talab qilmaydi)
    if [[ -d "$app_dist/linux-unpacked" ]]; then
        cp -r "$app_dist/linux-unpacked/." "$ci/opt/dagzo/dagzo-learn/"
        chmod +x "$ci/opt/dagzo/dagzo-learn/dagzo-learn"
        log_success "linux-unpacked binary inject qilindi: $app_dist/linux-unpacked"

        # Binary va .desktop Exec tekshirish
        local binary="$ci/opt/dagzo/dagzo-learn/dagzo-learn"
        if [[ ! -f "$binary" ]]; then
            log_error "inject xato: $binary topilmadi (linux-unpacked noto'g'ri?)"
        fi
        if [[ ! -x "$binary" ]]; then
            chmod +x "$binary"
            log_warn "binary executable emas edi — ruxsat berildi"
        fi
        local desktop="$ci/usr/share/applications/dagzo-learn.desktop"
        if [[ -f "$desktop" ]]; then
            local actual_exec expected_exec="Exec=/opt/dagzo/dagzo-learn/dagzo-learn --no-sandbox"
            actual_exec=$(grep "^Exec=" "$desktop" | head -1)
            if [[ "$actual_exec" != "$expected_exec" ]]; then
                log_warn ".desktop Exec noto'g'ri: '$actual_exec'"
                sed -i "s|^Exec=.*|$expected_exec|" "$desktop"
                log_warn ".desktop Exec to'g'irlandi: $expected_exec"
            else
                log_success ".desktop Exec to'g'ri: $actual_exec"
            fi
        fi

    # 2. AppImage — fallback (libfuse2 kerak, package listga qo'shilgan)
    elif appimage=$(ls "$app_dist/"*.AppImage 2>/dev/null | head -1) && [[ -n "$appimage" ]]; then
        cp "$appimage" "$ci/opt/dagzo/dagzo-learn/dagzo-learn.AppImage"
        chmod +x "$ci/opt/dagzo/dagzo-learn/dagzo-learn.AppImage"
        ln -sf /opt/dagzo/dagzo-learn/dagzo-learn.AppImage \
               "$ci/opt/dagzo/dagzo-learn/dagzo-learn"
        log_warn "AppImage inject qilindi (linux-unpacked topilmadi): $(basename "$appimage")"
        log_warn "AppImage libfuse2 talab qiladi — package listga qo'shilgan"

    else
        log_warn "Dagzo Learn dist topilmadi — ISO'da app bo'lmaydi"
        log_warn "Avval: scripts/build-app.sh && keyin qayta build qiling"
    fi
}

# Fix #9: Chroot ichida bajariladigan post-install hooklari
inject_chroot_hooks() {
    log_info "Chroot hooklari yaratilmoqda..."
    local hooks="$BUILD_DIR/config/hooks/normal"
    mkdir -p "$hooks"

    # Hook 1: OS branding (os-release, hostname, issue)
    cp "$PROJECT_ROOT/os/branding-scripts/set-os-release.sh" \
       "$hooks/9997-dagzo-os-release.hook.chroot"
    chmod +x "$hooks/9997-dagzo-os-release.hook.chroot"

    # Hook 2: Plymouth, icon cache, desktop database
    cat > "$hooks/9998-dagzo-postinstall.hook.chroot" << 'HOOK'
#!/bin/bash
set -e
echo "[dagzo] Post-install hook ishga tushdi..."

# Plymouth default theme
if command -v update-alternatives &>/dev/null && \
   [[ -f /usr/share/plymouth/themes/dagzo/dagzo.plymouth ]]; then
    update-alternatives --install \
        /usr/share/plymouth/themes/default.plymouth \
        default.plymouth \
        /usr/share/plymouth/themes/dagzo/dagzo.plymouth \
        100 2>/dev/null || true
    update-alternatives --set \
        default.plymouth \
        /usr/share/plymouth/themes/dagzo/dagzo.plymouth 2>/dev/null || true
    echo "[dagzo] Plymouth theme: dagzo"
fi

# initramfs (Plymouth uchun)
update-initramfs -u 2>/dev/null || echo "[dagzo] initramfs yangilanmadi (kechiktirilgan)"

# GTK icon cache — Fix #7
if command -v gtk-update-icon-cache &>/dev/null; then
    gtk-update-icon-cache -f /usr/share/icons/hicolor 2>/dev/null || true
    echo "[dagzo] GTK icon cache yangilandi"
fi

# Desktop database
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
    echo "[dagzo] Desktop database yangilandi"
fi

# dagzo foydalanuvchi yaratish (agar yo'q bo'lsa)
if ! id dagzo &>/dev/null; then
    useradd -m -s /bin/bash -G sudo,audio,video,netdev dagzo 2>/dev/null || true
    echo "dagzo:dagzo" | chpasswd 2>/dev/null || true
    echo "[dagzo] dagzo foydalanuvchi yaratildi"
fi

# Desktop papkasi
mkdir -p /home/dagzo/Desktop
cp /usr/share/applications/dagzo-learn.desktop \
   /home/dagzo/Desktop/Dagzo-Learn.desktop 2>/dev/null || true
chmod +x /home/dagzo/Desktop/Dagzo-Learn.desktop 2>/dev/null || true

# XFCE default wallpaper konfiguratsiyasi
XFCE_CFG_DIR="/etc/skel/.config/xfce4/xfconf/xfce-perchannel-xml"
mkdir -p "$XFCE_CFG_DIR"
cat > "$XFCE_CFG_DIR/xfce4-desktop.xml" << 'WALLPAPER_XML'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-desktop" version="1.0">
  <property name="backdrop" type="empty">
    <property name="screen0" type="empty">
      <property name="monitor0" type="empty">
        <property name="workspace0" type="empty">
          <property name="last-image" type="string" value="/opt/dagzo/branding/wallpapers/wallpaper-2.png"/>
          <property name="image-style" type="int" value="5"/>
        </property>
      </property>
      <property name="monitor1" type="empty">
        <property name="workspace0" type="empty">
          <property name="last-image" type="string" value="/opt/dagzo/branding/wallpapers/wallpaper-2.png"/>
          <property name="image-style" type="int" value="5"/>
        </property>
      </property>
    </property>
  </property>
</channel>
WALLPAPER_XML
echo "[dagzo] XFCE wallpaper config /etc/skel ga yozildi"

# /home/dagzo ga ham ko'chirish (agar mavjud bo'lsa)
if [[ -d "/home/dagzo" ]]; then
    DAGZO_XFCE_DIR="/home/dagzo/.config/xfce4/xfconf/xfce-perchannel-xml"
    mkdir -p "$DAGZO_XFCE_DIR"
    cp "$XFCE_CFG_DIR/xfce4-desktop.xml" "$DAGZO_XFCE_DIR/xfce4-desktop.xml"
    chown -R dagzo:dagzo /home/dagzo/.config 2>/dev/null || true
    echo "[dagzo] XFCE wallpaper config /home/dagzo ga ko'chirildi"
fi

chown -R dagzo:dagzo /home/dagzo/ 2>/dev/null || true

# /opt/dagzo papkalari
mkdir -p /opt/dagzo/apps /opt/dagzo/branding/wallpapers

echo "[dagzo] Post-install hook yakunlandi"
HOOK
    chmod +x "$hooks/9998-dagzo-postinstall.hook.chroot"

    # Hook 3: Dagzo Learn binary symlink va permissions
    cat > "$hooks/9999-dagzo-learn-setup.hook.chroot" << 'HOOK'
#!/bin/bash
set -e

INSTALL_DIR="/opt/dagzo/dagzo-learn"

if [[ ! -d "$INSTALL_DIR" ]]; then
    echo "[dagzo] Dagzo Learn topilmadi — skip"
    exit 0
fi

# AppImage mavjud bo'lsa symlink yaratish
if [[ -f "$INSTALL_DIR/dagzo-learn.AppImage" ]]; then
    chmod +x "$INSTALL_DIR/dagzo-learn.AppImage"
    ln -sf "$INSTALL_DIR/dagzo-learn.AppImage" "$INSTALL_DIR/dagzo-learn" 2>/dev/null || true
    echo "[dagzo] AppImage symlink yaratildi"
elif [[ -f "$INSTALL_DIR/dagzo-learn" ]]; then
    chmod +x "$INSTALL_DIR/dagzo-learn"
    echo "[dagzo] dagzo-learn binary ruxsati berildi"
fi

# Autostart XDG .desktop orqali (/etc/xdg/autostart) ishlaydi.
# systemctl enable chroot ichida noto'g'ri ishlashi mumkin — skip.
# systemctl enable dagzo-learn-autostart.service 2>/dev/null || true

echo "[dagzo] Dagzo Learn setup yakunlandi"
HOOK
    chmod +x "$hooks/9999-dagzo-learn-setup.hook.chroot"

    log_success "3 ta chroot hook yaratildi"
}

# ISO build
build_iso() {
    log_info "ISO build qilinmoqda (bu 15-40 daqiqa olishi mumkin)..."
    cd "$BUILD_DIR"

    lb build 2>&1 | tee "$BUILD_DIR/build.log"

    local iso
    iso=$(ls "$BUILD_DIR/"*.iso 2>/dev/null | head -1)
    if [[ -n "$iso" ]]; then
        mkdir -p "$DIST_DIR"
        mv "$iso" "$DIST_DIR/dagzo-os.iso"
        log_success "ISO tayyor: $DIST_DIR/dagzo-os.iso"
        ls -lh "$DIST_DIR/dagzo-os.iso"
    else
        log_error "ISO yaratilmadi. Log faylini tekshiring: $BUILD_DIR/build.log"
    fi
}

# Main
main() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║    Dagzo OS — ISO Build Script        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
    echo ""

    check_deps
    check_assets     # to'xtatmaydi, faqat ogohlantiradi
    build_app
    setup_livebuild
    inject_branding
    inject_app
    inject_chroot_hooks   # Fix #9
    build_iso

    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Build muvaffaqiyatli yakunlandi!    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    echo -e "  ISO joyi: ${CYAN}$DIST_DIR/dagzo-os.iso${NC}"
    echo ""
}

main "$@"
