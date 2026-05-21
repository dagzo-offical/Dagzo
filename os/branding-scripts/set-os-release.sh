#!/bin/bash
# /etc/os-release ni Dagzo OS uchun sozlash
# Bu script live-build hook sifatida ishlaydi

cat > /etc/os-release << 'EOF'
NAME="Dagzo OS"
VERSION="1.0"
ID=dagzo
ID_LIKE=debian
PRETTY_NAME="Dagzo OS 1.0"
VERSION_ID="1.0"
HOME_URL="https://dagzo.uz"
SUPPORT_URL="https://dagzo.uz/support"
BUG_REPORT_URL="https://dagzo.uz/issues"
PRIVACY_POLICY_URL="https://dagzo.uz/privacy"
VERSION_CODENAME=dagzo
LOGO=dagzo
EOF

# /etc/issue
echo "Dagzo OS 1.0 \n \l" > /etc/issue
echo "" >> /etc/issue

# /etc/issue.net
echo "Dagzo OS 1.0" > /etc/issue.net

# Hostname
echo "dagzo" > /etc/hostname

echo "[OK] OS branding o'rnatildi"
