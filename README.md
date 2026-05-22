# Dagzo OS

Dagzo OS — Debian asosida remaster qilingan maxsus ta'lim operatsion tizimi.

> **Muhim:** Bu loyiha Linux/Debian kernelini noldan yaratmaydi. Debian minimal bazasini live-build orqali remaster qiladi va Dagzo brending, boot splash, Dagzo Learn o'quv dasturi va darslik tizimini qo'shadi.

---

## Loyiha tuzilmasi

```
dagzo-os/
├── assets/branding/          # Logo, boot splash, wallpaperlar (git'da yo'q — qo'lda qo'yiladi)
│   ├── icon.png              # 512x512 px — app icon
│   ├── boot.png              # 1920x1080 px — Plymouth / GRUB background
│   └── wallpapers/
│       ├── wallpaper-1.png   # 1920x1080 px
│       ├── wallpaper-2.png   # Default desktop fon (XFCE autostart)
│       └── ...wallpaper-10.png
├── os/                       # OS konfiguratsiya fayllari
│   ├── live-build/           # Debian live-build konfiguratsiyasi
│   ├── plymouth/             # Boot splash theme
│   ├── grub/                 # GRUB2 konfiguratsiyasi va theme
│   ├── desktop-files/        # .desktop fayllari
│   ├── autostart/            # XDG autostart
│   ├── systemd/              # systemd user service
│   └── branding-scripts/     # set-os-release.sh
├── apps/dagzo-learn/         # Electron 28 + React 18 + Vite 5 o'quv dasturi
│   ├── src/                  # React frontend (pages, components, styles)
│   ├── electron/             # Electron main.js, preload.js
│   └── backend/              # Wi-Fi API (Express + nmcli)
├── lesson-template/          # Darslik shablon va namuna
│   ├── app/                  # index.html, config.json, tests/
│   └── installer/            # NSIS Windows installer script
└── scripts/                  # Build va install scriptlari
    ├── build-os.sh           # ISO yaratish (sudo kerak)
    ├── build-app.sh          # Faqat React + Electron build
    ├── install-dagzo-learn.sh # Mavjud tizimga app o'rnatish
    └── install-branding.sh   # Mavjud tizimga branding o'rnatish
```

---

## Talablar

### Node.js versiyasi

**Node.js 18 yoki undan yuqori versiya talab etiladi.**

```bash
node -v   # v18.x.x yoki v20.x.x bo'lishi kerak
```

Agar Node.js 18+ o'rnatilmagan bo'lsa:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

> **Xato:** `build-os.sh` Node.js versiyasini tekshiradi va 18 dan past bo'lsa to'xtaydi.

### Kerakli tizim paketlari (Ubuntu/Debian build mashinasida)

```bash
sudo apt-get install -y \
  live-build \
  debootstrap \
  squashfs-tools \
  xorriso \
  isolinux \
  syslinux-common \
  grub-pc-bin \
  grub-efi-amd64-bin \
  nodejs \
  npm \
  wine64 \
  nsis \
  imagemagick
```

---

## Branding rasmlari qayerga qo'yiladi

Branding rasmlari git'da saqlanmaydi. Build qilishdan **oldin** quyidagi joylarga qo'yilishi kerak:

| Fayl | To'liq yo'l | Maqsad |
|------|-------------|--------|
| `icon.png` | `assets/branding/icon.png` | App icon, desktop shortcut, hicolor theme |
| `boot.png` | `assets/branding/boot.png` | Plymouth boot splash, GRUB background |
| `wallpaper-1.png` | `assets/branding/wallpapers/wallpaper-1.png` | Settings sahifasida tanlash mumkin |
| `wallpaper-2.png` | `assets/branding/wallpapers/wallpaper-2.png` | **Default** XFCE desktop fon rasmi |
| `wallpaper-3.png` … `wallpaper-10.png` | `assets/branding/wallpapers/` | Settings sahifasida tanlash mumkin |

**Tavsiya etilgan o'lchamlar:**
- `icon.png` — 512×512 px, PNG
- `boot.png` — 1920×1080 px, PNG
- `wallpaper-*.png` — 1920×1080 px, PNG

> **Windows build uchun:** `icon.ico` fayli `build-app.sh` tomonidan `icon.png` dan avtomatik yaratiladi. Buning uchun `imagemagick` o'rnatilgan bo'lishi shart. `icon.ico` topilmasa yoki `convert` yo'q bo'lsa Windows build skip qilinadi.

> **Eslatma:** Rasmlar yo'q bo'lsa ISO build to'xtatilmaydi — ogohlantirish chiqadi va davom etadi. Lekin tizimda placeholder yoki bo'sh joy ko'rinadi.

---

## ISO build ketma-ketligi

### 1. Branding rasmlarini joylashtiring

```bash
cp /siz/rasmlari/icon.png       assets/branding/icon.png
cp /siz/rasmlari/boot.png       assets/branding/boot.png
cp /siz/rasmlari/wallpaper-*.png assets/branding/wallpapers/
```

### 2. npm paketlarni o'rnatish

```bash
cd apps/dagzo-learn
npm install      # devDependencies ham kerak (vite, electron-builder)
cd ../..
```

> **Xato:** `npm install --production` ishlatmang — `vite` va `electron-builder` devDependencies ichida, ular o'rnatilmay qoladi.

### 3. Dagzo Learn appni build qilish

```bash
bash scripts/build-app.sh
```

Bu qadam:
- Branding rasmlarini `apps/dagzo-learn/public/` ga ko'chiradi
- `icon.png` → `icon.ico` konvertatsiyasi (ImageMagick, Windows build uchun)
- React (Vite) build qiladi → `apps/dagzo-learn/dist/`
- Electron Linux build qiladi → `apps/dagzo-learn/dist-electron/linux-unpacked/` (**ISO uchun tavsiya etilgan format**)

### 4. ISO build (root kerak)

```bash
sudo bash scripts/build-os.sh
# Natija: dist/dagzo-os.iso
# Vaqt: 15–40 daqiqa
```

Build jarayoni avtomatik bajaradi:
- live-build sozlash (Debian Bookworm amd64, XFCE4)
- Branding, app va Plymouth theme fayllarni chroot ichiga inject qilish
- App inject tartibi: **linux-unpacked** birinchi (FUSE talab qilmaydi), AppImage faqat fallback
- 3 ta post-install hook ishga tushirish (os-release, Plymouth, Dagzo Learn setup)
- Autostart `/etc/xdg/autostart/dagzo-learn.desktop` orqali (systemd user service emas)
- ISO compress va package qilish

### 5. USB ga yozish

```bash
# /dev/sdX ni to'g'ri disk bilan almashtiring!
sudo dd if=dist/dagzo-os.iso of=/dev/sdX bs=4M status=progress
sudo sync
```

### 6. QEMU/VirtualBox da sinash

```bash
# QEMU
qemu-system-x86_64 -m 2048 -cdrom dist/dagzo-os.iso -boot d -vga std

# VirtualBox: New > Debian 64-bit > RAM 2GB+ > Storage > ISO ni ulang
```

---

## Mavjud tizimga o'rnatish

### Faqat app o'rnatish

```bash
sudo bash scripts/install-dagzo-learn.sh
# O'rnatiladi: /opt/dagzo/dagzo-learn/dagzo-learn
```

### Faqat branding o'rnatish

```bash
sudo bash scripts/install-branding.sh
# Plymouth, GRUB, wallpaper, icon, hostname
```

---

## Dagzo Learn ishga tushirish

### Development rejimida

```bash
cd apps/dagzo-learn
npm install
npm run electron    # React dev server + Electron
```

### Production (o'rnatilgan tizimda)

```bash
/opt/dagzo/dagzo-learn/dagzo-learn --no-sandbox
```

### Backend (Wi-Fi API)

Electron main process `apps/dagzo-learn/backend/server.js` ni avtomatik `child_process.fork()` orqali ishga tushiradi. Alohida ishga tushirish shart emas.

Manual test:
```bash
cd apps/dagzo-learn
node backend/server.js
# Port 3001 da ishga tushadi
```

---

## Darsliklar qanday qo'shiladi

### Usul 1: Papka sifatida (Dagzo OS ichida)

```bash
sudo cp -r mening-darsligim/ /opt/dagzo/apps/
```

Papka strukturasi:
```
mening-darsligim/
├── config.json      # Majburiy
├── index.html       # Asosiy sahifa
├── assets/          # Rasmlar, CSS, JS
├── lessons/         # .md darslar
├── books/           # .pdf kitoblar
├── videos/          # .mp4 videolar
└── tests/           # .json testlar
```

`config.json` namunasi:
```json
{
  "name": "Matematika 5",
  "publisher": "Dagzo",
  "version": "1.0.0",
  "icon": "assets/icon.png",
  "start": "index.html",
  "fullscreen": true,
  "kiosk": false
}
```

### Usul 2: Linux paket sifatida

```bash
bash scripts/build-lesson-linux.sh --format appimage --lesson lesson-template/app
bash scripts/build-lesson-linux.sh --format deb     --lesson lesson-template/app
```

### Windows setup.exe

```bash
bash scripts/build-lesson-windows.sh --lesson lesson-template/app --name "Matematika_5"
# Natija: dist/Matematika_5_Setup.exe
```

### Windows uchun Dagzo Learn `.exe` build

Windows build qilishdan oldin `imagemagick` o'rnatilgan bo'lishi kerak — `build-app.sh` `icon.png` → `icon.ico` konvertatsiyasini avtomatik bajaradi:

```bash
# Talab: imagemagick (icon.ico uchun) + wine (cross-compile uchun)
sudo apt-get install imagemagick wine64

# Windows build
bash scripts/build-app.sh win
# Natija: apps/dagzo-learn/dist-electron/Dagzo-Learn-Setup-*.exe
```

**Xato:** `[WARN] ImageMagick 'convert' topilmadi` — `imagemagick` o'rnatilmagan.  
**Xato:** `[WARN] icon.png topilmadi` — `assets/branding/icon.png` qo'yilmagan.  
Ikki holda ham Windows build avtomatik skip qilinadi (Linux build davom etadi).

---

## Wi-Fi API

Backend Express serveri port `3001` da, faqat `127.0.0.1` da tinglaydi (xavfsiz).

| Endpoint | Metod | Tavsif |
|----------|-------|--------|
| `/api/wifi/list` | GET | Mavjud tarmoqlar ro'yxati |
| `/api/wifi/connect` | POST | Tarmoqqa ulanish (`{ ssid, password }`) |
| `/api/wifi/status` | GET | Joriy ulanish holati |
| `/api/wifi/disconnect` | POST | Tarmoqdan uzilish |

NetworkManager (`nmcli`) kerak:
```bash
sudo apt-get install network-manager
```

---

## Tizim ma'lumotlari

| Komponent | Versiya / Tavsif |
|-----------|-----------------|
| OS asos | Debian 12 (Bookworm) minimal |
| Desktop | XFCE4 |
| Boot loader | GRUB2 (custom dark theme) |
| Boot splash | Plymouth (dagzo script theme) |
| O'quv dastur | Dagzo Learn — Electron 28 + React 18 + Vite 5 |
| Wi-Fi | NetworkManager + nmcli + Express API |
| Windows fayllar | Wine orqali |
| Node.js (build) | 18+ talab etiladi |
| Admin parol | `dagzo2024` (Settings > Admin dan o'zgartirish mumkin) |

---

## Eng ko'p uchraydigan xatolar

### Plymouth boot splash ko'rinmayapti

```bash
# Diagnoz
sudo update-alternatives --config default.plymouth

# Yechim
sudo update-alternatives --install \
  /usr/share/plymouth/themes/default.plymouth default.plymouth \
  /usr/share/plymouth/themes/dagzo/dagzo.plymouth 100
sudo update-alternatives --set \
  default.plymouth \
  /usr/share/plymouth/themes/dagzo/dagzo.plymouth
sudo update-initramfs -u
```

### Dagzo Learn ishga tushmayapti

ISO ichida tavsiya etilgan format — **linux-unpacked** (`/opt/dagzo/dagzo-learn/dagzo-learn` binary).  
AppImage faqat linux-unpacked topilmasa fallback sifatida ishlatiladi va `libfuse2` talab qiladi.

```bash
# 1. Terminal orqali sinash — xato xabarini ko'rish
/opt/dagzo/dagzo-learn/dagzo-learn --no-sandbox

# 2. Live ISO loglarini ko'rish
ls /var/log/live/
cat /var/log/live/boot.log 2>/dev/null || journalctl -b | grep dagzo

# 3. Binary mavjudligini tekshirish
ls -la /opt/dagzo/dagzo-learn/dagzo-learn
file /opt/dagzo/dagzo-learn/dagzo-learn

# 4. AppImage fallback bo'lsa va FUSE xatosi bo'lsa
sudo apt-get install libfuse2
# yoki extracted rejimda:
/opt/dagzo/dagzo-learn/dagzo-learn.AppImage --appimage-extract-and-run

# 5. Binary yo'q bo'lsa — qayta inject qiling va ISO qayta build qiling
#    yoki mavjud tizimga o'rnatish:
sudo bash scripts/install-dagzo-learn.sh
```

### Wi-Fi API ishlamayapti

```bash
# nmcli bor-yo'qligini tekshirish
which nmcli
nmcli device status

# NetworkManager ishga tushirish
sudo systemctl start NetworkManager
sudo systemctl enable NetworkManager

# Backend alohida sinash
cd apps/dagzo-learn && node backend/server.js
curl http://127.0.0.1:3001/api/wifi/status
```

### npm install xatosi (vite topilmadi)

```bash
# Xato: sh: vite: not found
# Sabab: npm install --production ishlatilgan
cd apps/dagzo-learn
rm -rf node_modules
npm install          # --production ISHLATMANG
```

### AppImage FUSE xatosi

```bash
# Xato: fuse: device not found
sudo apt-get install libfuse2
# yoki AppImage ni extracted rejimda ishlatish:
/opt/dagzo/dagzo-learn/dagzo-learn.AppImage --appimage-extract
./squashfs-root/dagzo-learn --no-sandbox
```

### live-build eski holat xatosi

```bash
# Xato: lb_build: already built / config exists
cd build/
sudo lb clean --purge
cd ..
sudo bash scripts/build-os.sh
```

### Ikonka ko'rinmayapti (GTK icon cache)

```bash
sudo gtk-update-icon-cache -f /usr/share/icons/hicolor
sudo update-desktop-database /usr/share/applications
xdg-icon-resource forceupdate
```

### Dagzo Learn autostart ishlamayapti

```bash
# XDG autostart fayl bor-yo'qligini tekshirish
ls /etc/xdg/autostart/dagzo-learn.desktop

# Systemd service orqali yoqish
sudo systemctl enable dagzo-learn-autostart.service

# Foydalanuvchi autostart
mkdir -p ~/.config/autostart
cp /etc/xdg/autostart/dagzo-learn.desktop ~/.config/autostart/
```

---

## Final tekshiruv

Build qilishdan oldin quyidagi tekshiruvlarni bajaring:

### 1. Script sintaksisini tekshirish

```bash
bash -n scripts/build-app.sh
bash -n scripts/build-os.sh
bash -n scripts/install-dagzo-learn.sh
bash -n scripts/install-branding.sh
```

### 2. App build tekshirish

```bash
bash scripts/build-app.sh
# Kutilayotgan chiqish:
# [OK] icon.ico yaratildi (256/128/64/48/32/16 px)
# [OK] React build tayyor
# [OK] Electron Linux build tayyor: apps/dagzo-learn/dist-electron
ls apps/dagzo-learn/dist-electron/linux-unpacked/dagzo-learn
```

### 3. ISO build

```bash
sudo bash scripts/build-os.sh
# Kutilayotgan chiqish:
# [OK] linux-unpacked binary inject qilindi
# [OK] .desktop Exec to'g'ri: Exec=/opt/dagzo/dagzo-learn/dagzo-learn --no-sandbox
# [OK] ISO tayyor: dist/dagzo-os.iso
```

### 4. ISO ichida Dagzo Learn ochilmasa — nima tekshirish kerak

```bash
# Terminal orqali to'g'ridan-to'g'ri ishga tushirish (xato ko'rish uchun)
/opt/dagzo/dagzo-learn/dagzo-learn --no-sandbox

# Live boot loglari
ls /var/log/live/
cat /var/log/live/boot.log

# Systemd journal (user session)
journalctl --user -n 50
journalctl -b | grep -i "dagzo\|electron"

# XFCE session xatolari
cat ~/.xsession-errors | tail -30

# Binary tekshirish
ls -la /opt/dagzo/dagzo-learn/dagzo-learn
file /opt/dagzo/dagzo-learn/dagzo-learn

# Autostart fayl mavjudligi
ls /etc/xdg/autostart/dagzo-learn.desktop
cat /etc/xdg/autostart/dagzo-learn.desktop
```

---

## Litsenziya

Dagzo OS — Dagzo ta'lim platformasi tomonidan yaratilgan custom education OS.

Bu tizim quyidagi open-source loyihalar asosida qurilgan:
- Linux Kernel (GPL v2)
- Debian GNU/Linux (various licenses)
- XFCE Desktop (LGPL/GPL)
- Electron (MIT)
- React (MIT)

Dagzo brending, Dagzo Learn dasturi va darslik tizimi Dagzo mulki hisoblanadi.
