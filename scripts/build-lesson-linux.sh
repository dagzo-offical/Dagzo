#!/bin/bash
# Dagzo — Linux darslik builder (AppImage / .deb / opt)
# Ishga tushirish: ./scripts/build-lesson-linux.sh --lesson lesson-template/app --name matematika-5 --format appimage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"

LESSON_DIR=""
LESSON_NAME="dagzo-darslik"
LESSON_VERSION="1.0.0"
FORMAT="opt"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

while [[ $# -gt 0 ]]; do
    case $1 in
        --lesson)  LESSON_DIR="$2"; shift 2 ;;
        --name)    LESSON_NAME="$2"; shift 2 ;;
        --version) LESSON_VERSION="$2"; shift 2 ;;
        --format)  FORMAT="$2"; shift 2 ;;
        --help)
            echo "Foydalanish: $0 --lesson <papka> --name <nom> [--format appimage|deb|opt] [--version <ver>]"
            echo "  --format appimage  — AppImage yaratish"
            echo "  --format deb       — .deb paket yaratish (dpkg kerak)"
            echo "  --format opt       — /opt/dagzo/apps/ ga to'g'ridan-to'g'ri o'rnatish (sudo kerak)"
            exit 0 ;;
        *) log_error "Noma'lum argument: $1. --help ni ko'ring." ;;
    esac
done

if [[ -z "$LESSON_DIR" ]]; then
    log_error "--lesson argumenti kerak. Misol: $0 --lesson lesson-template/app --name matematika-5"
fi

LESSON_DIR="$(realpath "$LESSON_DIR")"

if [[ ! -d "$LESSON_DIR" ]]; then
    log_error "Darslik papkasi topilmadi: $LESSON_DIR"
fi

# config.json dan ma'lumot o'qish
if [[ -f "$LESSON_DIR/config.json" ]]; then
    if command -v python3 &>/dev/null; then
        CFG_NAME=$(python3 -c "
import json, sys
try:
    d = json.load(open('$LESSON_DIR/config.json'))
    print(d.get('name', '').replace(' ', '_'))
except: print('')
" 2>/dev/null)
        CFG_VER=$(python3 -c "
import json, sys
try:
    d = json.load(open('$LESSON_DIR/config.json'))
    print(d.get('version', '1.0.0'))
except: print('1.0.0')
" 2>/dev/null)
        [[ -n "$CFG_NAME" ]] && LESSON_NAME="$CFG_NAME"
        [[ -n "$CFG_VER" ]]  && LESSON_VERSION="$CFG_VER"
    fi
fi

DISPLAY_NAME="${LESSON_NAME//-/ }"
DISPLAY_NAME="${DISPLAY_NAME//_/ }"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Dagzo Lesson Linux Builder        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════╝${NC}"
echo ""
log_info "Darslik:  $DISPLAY_NAME v$LESSON_VERSION"
log_info "Manba:    $LESSON_DIR"
log_info "Format:   $FORMAT"
echo ""

# Usul 1: /opt/dagzo/apps/ ga to'g'ridan-to'g'ri o'rnatish
install_to_opt() {
    if [[ $EUID -ne 0 ]]; then
        log_warn "Root huquqi tavsiya etiladi. sudo bilan ishga tushiring yoki $LESSON_NAME ni ~/dagzo-apps/ ga o'rnatamiz."
        OPT_DIR="$HOME/dagzo-apps/$LESSON_NAME"
    else
        OPT_DIR="/opt/dagzo/apps/$LESSON_NAME"
    fi

    log_info "$OPT_DIR ga o'rnatilmoqda..."
    mkdir -p "$OPT_DIR"
    cp -r "$LESSON_DIR/"* "$OPT_DIR/"

    # Desktop fayl yaratish
    DESKTOP_FILE="/usr/share/applications/dagzo-lesson-$LESSON_NAME.desktop"
    [[ $EUID -ne 0 ]] && DESKTOP_FILE="$HOME/.local/share/applications/dagzo-lesson-$LESSON_NAME.desktop"
    mkdir -p "$(dirname "$DESKTOP_FILE")"

    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$DISPLAY_NAME
Comment=Dagzo darslik: $DISPLAY_NAME
Exec=/opt/dagzo/dagzo-learn/dagzo-learn --lesson $LESSON_NAME --no-sandbox
Icon=$OPT_DIR/assets/icon.png
Terminal=false
Categories=Education;
Keywords=dagzo;darslik;education;
EOF

    update-desktop-database "$(dirname "$DESKTOP_FILE")" 2>/dev/null || true
    log_success "O'rnatildi: $OPT_DIR"
    log_success "Desktop fayl: $DESKTOP_FILE"
}

# Usul 2: AppImage yaratish
build_appimage() {
    TEMP_DIR=$(mktemp -d)
    APP_DIR="$TEMP_DIR/AppDir"

    mkdir -p "$APP_DIR/usr/share/dagzo-lessons/$LESSON_NAME"
    mkdir -p "$APP_DIR/usr/share/applications"
    mkdir -p "$APP_DIR/usr/share/icons/hicolor/256x256/apps"

    cp -r "$LESSON_DIR/"* "$APP_DIR/usr/share/dagzo-lessons/$LESSON_NAME/"

    # AppRun
    cat > "$APP_DIR/AppRun" << APPRUN
#!/bin/bash
export LESSON_PATH="/usr/share/dagzo-lessons/$LESSON_NAME"
exec /opt/dagzo/dagzo-learn/dagzo-learn --lesson "$LESSON_NAME" --no-sandbox "\$@"
APPRUN
    chmod +x "$APP_DIR/AppRun"

    # .desktop
    cat > "$APP_DIR/$LESSON_NAME.desktop" << DESKTOP
[Desktop Entry]
Type=Application
Name=$DISPLAY_NAME
Comment=Dagzo darslik
Exec=AppRun
Icon=$LESSON_NAME
Categories=Education;
DESKTOP

    # Icon
    if [[ -f "$LESSON_DIR/assets/icon.png" ]]; then
        cp "$LESSON_DIR/assets/icon.png" \
           "$APP_DIR/usr/share/icons/hicolor/256x256/apps/$LESSON_NAME.png"
        cp "$LESSON_DIR/assets/icon.png" "$APP_DIR/$LESSON_NAME.png"
    fi

    mkdir -p "$DIST_DIR"

    if command -v appimagetool &>/dev/null; then
        ARCH=x86_64 appimagetool "$APP_DIR" "$DIST_DIR/$LESSON_NAME.AppImage"
        chmod +x "$DIST_DIR/$LESSON_NAME.AppImage"
        log_success "AppImage tayyor: $DIST_DIR/$LESSON_NAME.AppImage"
    else
        log_warn "appimagetool topilmadi."
        log_info "O'rnatish: wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage -O appimagetool && chmod +x appimagetool && sudo mv appimagetool /usr/local/bin/"
        log_info "Uning o'rniga --format opt ishlatilmoqda..."
        install_to_opt
    fi

    rm -rf "$TEMP_DIR"
}

# Usul 3: .deb paket yaratish
build_deb() {
    if ! command -v dpkg-deb &>/dev/null; then
        log_error "dpkg-deb topilmadi. apt install dpkg"
    fi

    TEMP_DIR=$(mktemp -d)
    PKG_NAME="dagzo-lesson-$LESSON_NAME"
    PKG_DIR="$TEMP_DIR/$PKG_NAME"

    mkdir -p "$PKG_DIR/DEBIAN"
    mkdir -p "$PKG_DIR/opt/dagzo/apps/$LESSON_NAME"
    mkdir -p "$PKG_DIR/usr/share/applications"

    cp -r "$LESSON_DIR/"* "$PKG_DIR/opt/dagzo/apps/$LESSON_NAME/"

    # DEBIAN/control
    cat > "$PKG_DIR/DEBIAN/control" << CONTROL
Package: $PKG_NAME
Version: $LESSON_VERSION
Section: education
Priority: optional
Architecture: all
Maintainer: Dagzo Education <support@dagzo.uz>
Homepage: https://dagzo.uz
Description: Dagzo darslik: $DISPLAY_NAME
 Dagzo OS ta'lim platformasi uchun darslik to'plami.
 O'rnatilgandan keyin Dagzo Learn ichida ko'rinadi.
CONTROL

    # postinst — desktop fayl yaratish va update
    cat > "$PKG_DIR/DEBIAN/postinst" << 'POSTINST'
#!/bin/bash
set -e
LESSON_NAME="LESSON_NAME_PLACEHOLDER"
DISPLAY_NAME="DISPLAY_NAME_PLACEHOLDER"

cat > "/usr/share/applications/dagzo-lesson-${LESSON_NAME}.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=${DISPLAY_NAME}
Comment=Dagzo darslik
Exec=/opt/dagzo/dagzo-learn/dagzo-learn --lesson ${LESSON_NAME} --no-sandbox
Icon=/opt/dagzo/apps/${LESSON_NAME}/assets/icon.png
Terminal=false
Categories=Education;
EOF

update-desktop-database /usr/share/applications 2>/dev/null || true
echo "Dagzo darslik o'rnatildi: ${DISPLAY_NAME}"
POSTINST

    # Placeholder almashtirilishi
    sed -i "s/LESSON_NAME_PLACEHOLDER/$LESSON_NAME/g" "$PKG_DIR/DEBIAN/postinst"
    sed -i "s/DISPLAY_NAME_PLACEHOLDER/$DISPLAY_NAME/g" "$PKG_DIR/DEBIAN/postinst"
    chmod +x "$PKG_DIR/DEBIAN/postinst"

    # prerm — uninstall
    cat > "$PKG_DIR/DEBIAN/prerm" << PRERM
#!/bin/bash
rm -f "/usr/share/applications/dagzo-lesson-$LESSON_NAME.desktop"
update-desktop-database /usr/share/applications 2>/dev/null || true
PRERM
    chmod +x "$PKG_DIR/DEBIAN/prerm"

    mkdir -p "$DIST_DIR"
    dpkg-deb --build "$PKG_DIR" \
        "$DIST_DIR/${PKG_NAME}_${LESSON_VERSION}_all.deb"

    log_success ".deb tayyor: $DIST_DIR/${PKG_NAME}_${LESSON_VERSION}_all.deb"
    log_info "O'rnatish: sudo dpkg -i $DIST_DIR/${PKG_NAME}_${LESSON_VERSION}_all.deb"

    rm -rf "$TEMP_DIR"
}

# Format tanlash
case "$FORMAT" in
    appimage|AppImage) build_appimage ;;
    deb|DEB)           build_deb ;;
    opt)               install_to_opt ;;
    *)
        log_error "Noma'lum format: '$FORMAT'. Quyidagilardan birini tanlang: appimage | deb | opt"
        ;;
esac

echo ""
echo -e "${GREEN}Build muvaffaqiyatli yakunlandi!${NC}"
echo ""
