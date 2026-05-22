#!/bin/bash
# Dagzo OS — tizim holati tekshiruvi
# Ishlatish: bash scripts/check-dagzo-system.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

OK=0
WARN=0
FAIL=0

pass()  { echo -e "  ${GREEN}✓${NC} $1"; ((OK++)); }
warn()  { echo -e "  ${YELLOW}△${NC} $1"; ((WARN++)); }
fail()  { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
check() { command -v "$1" &>/dev/null && pass "$1 topildi" || fail "$1 topilmadi"; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    Dagzo OS — Tizim tekshiruvi         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# --- Browser ---
echo -e "${CYAN}Browser:${NC}"
check firefox-esr
[[ -f /usr/bin/firefox-esr ]] && \
    update-alternatives --query x-www-browser 2>/dev/null | grep -q firefox \
    && pass "Firefox default browser" \
    || warn "Firefox default browser sozlanmagan"
echo ""

# --- Screenshot ---
echo -e "${CYAN}Desktop tools:${NC}"
check xfce4-screenshooter
check thunar
check xfce4-terminal
echo ""

# --- Python ---
echo -e "${CYAN}Python:${NC}"
check python3
python3 --version &>/dev/null && pass "python3 versiya: $(python3 --version 2>&1)" || fail "python3 ishlamayapti"
check pip3
[[ -f /usr/local/bin/dagzo-run-lesson ]] && pass "dagzo-run-lesson mavjud" || warn "dagzo-run-lesson topilmadi"
echo ""

# --- Network / Kali tools ---
echo -e "${CYAN}Network va Kali tools:${NC}"
check nmap
check net-tools
command -v ifconfig &>/dev/null && pass "ifconfig ishlaydi" || warn "ifconfig topilmadi (net-tools?)"
command -v route &>/dev/null && pass "route ishlaydi" || warn "route topilmadi"
check tcpdump
check curl
check wget
dpkg -l kali-linux-core &>/dev/null 2>&1 && pass "kali-linux-core o'rnatilgan" \
    || warn "kali-linux-core topilmadi (Kali repo ishlamasligi mumkin)"
echo ""

# --- Wine ---
echo -e "${CYAN}Wine (.exe fayllar):${NC}"
check wine
wine --version &>/dev/null && pass "Wine versiya: $(wine --version 2>&1)" || fail "Wine ishlamayapti"
echo ""

# --- Dagzo Learn ---
echo -e "${CYAN}Dagzo Learn:${NC}"
[[ -f /opt/dagzo/dagzo-learn/dagzo-learn ]] && pass "Binary mavjud: /opt/dagzo/dagzo-learn/dagzo-learn" \
    || fail "Binary topilmadi: /opt/dagzo/dagzo-learn/dagzo-learn"
[[ -x /opt/dagzo/dagzo-learn/dagzo-learn ]] && pass "Binary executable" \
    || fail "Binary executable emas"
[[ -f /usr/share/applications/dagzo-learn.desktop ]] && pass "dagzo-learn.desktop (applications) mavjud" \
    || warn "dagzo-learn.desktop topilmadi: /usr/share/applications/"
[[ -f /usr/share/applications/dagzo-learn.desktop ]] && pass "Desktop entry mavjud" \
    || warn "Desktop entry topilmadi"
echo ""

# --- /opt/dagzo/apps ---
echo -e "${CYAN}/opt/dagzo/apps:${NC}"
[[ -d /opt/dagzo/apps ]] && pass "/opt/dagzo/apps mavjud" || fail "/opt/dagzo/apps topilmadi"
if [[ -d /opt/dagzo/apps ]]; then
    touch /opt/dagzo/apps/.dagzo-test 2>/dev/null \
        && rm -f /opt/dagzo/apps/.dagzo-test \
        && pass "/opt/dagzo/apps yozish mumkin" \
        || warn "/opt/dagzo/apps yozish imkoni yo'q (chown dagzo:dagzo kerak)"
fi
LESSON_COUNT=$(ls /opt/dagzo/apps 2>/dev/null | wc -l)
[[ $LESSON_COUNT -gt 0 ]] && pass "$LESSON_COUNT ta darslik o'rnatilgan" \
    || warn "Hali darslik yo'q (/opt/dagzo/apps bo'sh)"
echo ""

# --- Branding ---
echo -e "${CYAN}Branding:${NC}"
[[ -f /opt/dagzo/branding/icon.png ]]   && pass "icon.png mavjud"   || warn "icon.png topilmadi"
[[ -f /opt/dagzo/branding/boot.png ]]   && pass "boot.png mavjud"   || warn "boot.png topilmadi"
[[ -f /opt/dagzo/branding/wallpapers/wallpaper-2.png ]] \
    && pass "wallpaper-2.png mavjud" || warn "wallpaper-2.png topilmadi"
echo ""

# --- Xulosa ---
TOTAL=$((OK + WARN + FAIL))
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✓ OK:${NC} $OK   ${YELLOW}△ Ogohlantirish:${NC} $WARN   ${RED}✗ Xato:${NC} $FAIL   (Jami: $TOTAL)"
echo ""
[[ $FAIL -eq 0 ]] \
    && echo -e "  ${GREEN}Dagzo OS to'liq tayyor!${NC}" \
    || echo -e "  ${RED}$FAIL ta muammo hal qilinishi kerak.${NC}"
echo ""
