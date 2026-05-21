# Dagzo OS

Dagzo OS — Debian asosida remaster qilingan maxsus ta'lim operatsion tizimi.

> **Muhim:** Bu loyiha Linux/Debian kernelini noldan yaratmaydi. Debian minimal bazasini live-build orqali remaster qiladi va Dagzo brending, boot splash, Dagzo Learn o'quv dasturi va darslik tizimini qo'shadi.

---

## Loyiha tuzilmasi

```
dagzo-os/
├── assets/branding/          # Logo, boot splash, wallpaperlar
├── os/                       # OS konfiguratsiya fayllari
│   ├── live-build/           # Debian live-build konfiguratsiyasi
│   ├── plymouth/             # Boot splash theme
│   ├── grub/                 # GRUB konfiguratsiyasi
│   ├── desktop-files/        # .desktop fayllari
│   └── autostart/            # Autostart konfiguratsiyasi
├── apps/dagzo-learn/         # Electron/React o'quv dasturi
│   ├── src/                  # React frontend
│   ├── electron/             # Electron main process
│   └── backend/              # Wi-Fi API backend
├── lesson-template/          # Darslik shablon
└── scripts/                  # Build va install scriptlari
```

---

## Tezkor boshlash

### 1. Kerakli paketlar (Ubuntu/Debian build mashinasida)

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

### 2. Node.js paketlarni o'rnatish

```bash
cd apps/dagzo-learn
npm install
```

### 3. Dagzo Learn appni build qilish

```bash
scripts/build-app.sh
```

### 4. ISO build qilish

```bash
sudo scripts/build-os.sh
```

---

## Branding rasmlari qayerga qo'yiladi

| Fayl | Joyi | Maqsad |
|------|------|--------|
| boot.png | `assets/branding/boot.png` | Plymouth boot splash va GRUB background |
| icon.png | `assets/branding/icon.png` | Dagzo Learn ikonkasi |
| wallpaper-1.png ... wallpaper-10.png | `assets/branding/wallpapers/` | Desktop fon rasmlari |
| wallpaper-2.png | `assets/branding/wallpapers/wallpaper-2.png` | Default desktop fon rasmi |

**Tavsiya etilgan o'lchamlar:**
- boot.png: 1920x1080 px, PNG format
- icon.png: 512x512 px, PNG format
- wallpaper-*.png: 1920x1080 px, PNG format

---

## Dagzo Learn qanday ishga tushadi

### Development rejimida

```bash
cd apps/dagzo-learn
npm run dev          # React + Vite dev server
npm run electron     # Electron + React
```

### Production build

```bash
cd apps/dagzo-learn
npm run build        # React build
npm run dist         # Electron installer build
```

### Tizimga o'rnatish (Dagzo OS ichida)

```bash
sudo scripts/install-dagzo-learn.sh
```

---

## Darsliklar qanday qo'shiladi

### Usul 1: Papka sifatida qo'shish

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

config.json:
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
# AppImage o'rnatish
scripts/build-lesson-linux.sh --format appimage --lesson lesson-template/app
# .deb o'rnatish
scripts/build-lesson-linux.sh --format deb --lesson lesson-template/app
```

---

## Windows setup.exe qanday build qilinadi

Windows'da darsliklarni `setup.exe` sifatida chiqarish:

```bash
# Windows build uchun (Linux'da wine + nsis kerak)
scripts/build-lesson-windows.sh --lesson lesson-template/app --name "Matematika_5"
# Natija: dist/Matematika_5_Setup.exe
```

**Windows'da setup.exe o'rnatganda:**
- Darslik `C:\Program Files\Dagzo\Darsliklar\` ga o'rnatiladi
- Desktop shortcut yaratiladi
- Start Menu > Dagzo papkasi paydo bo'ladi
- Icon bosilganda darslik fullscreen ochiladi

---

## Linux AppImage/deb qanday build qilinadi

```bash
# AppImage
scripts/build-lesson-linux.sh --format appimage --lesson lesson-template/app --name "Matematika_5"
# Natija: dist/Matematika_5.AppImage

# .deb paket
scripts/build-lesson-linux.sh --format deb --lesson lesson-template/app --name "matematika-5"
# Natija: dist/matematika-5_1.0.0_amd64.deb
```

---

## Wi-Fi API qanday ishlaydi

Backend `apps/dagzo-learn/backend/server.js` da ishga tushadi.

```
GET  /api/wifi/list      — Mavjud tarmoqlar ro'yxati
POST /api/wifi/connect   — Tarmoqqa ulanish
     Body: { "ssid": "MyWiFi", "password": "12345678" }
GET  /api/wifi/status    — Joriy ulanish holati
POST /api/wifi/disconnect — Tarmoqdan uzilish
```

Backend nmcli (NetworkManager) orqali ishlaydi. nmcli o'rnatilgan bo'lishi kerak:
```bash
sudo apt-get install network-manager
```

---

## Autostart qanday yoqiladi/o'chiriladi

### Yoqish (default)
```bash
cp os/autostart/dagzo-learn.desktop ~/.config/autostart/
```

### O'chirish
```bash
rm ~/.config/autostart/dagzo-learn.desktop
```

### Systemd orqali (tizim darajasida)
```bash
sudo systemctl enable dagzo-learn-autostart.service
sudo systemctl disable dagzo-learn-autostart.service
```

---

## ISO qanday olinadi

### Build jarayoni

```bash
# 1. Branding rasmlarini joylashtiring
cp siz/boot.png assets/branding/boot.png
cp siz/wallpaper-*.png assets/branding/wallpapers/
cp siz/icon.png assets/branding/icon.png

# 2. Dagzo Learn appni build qiling
scripts/build-app.sh

# 3. ISO build qiling (root kerak)
sudo scripts/build-os.sh

# Natija: dist/dagzo-os.iso
```

### USB ga yozish

```bash
# /dev/sdX ni to'g'ri disk bilan almashtiring!
sudo dd if=dist/dagzo-os.iso of=/dev/sdX bs=4M status=progress sync
# yoki
sudo cp dist/dagzo-os.iso /dev/sdX
sudo sync
```

### VirtualBox da sinash

1. VirtualBox > New > Linux > Debian 64-bit
2. RAM: 2GB+, Disk: 20GB+
3. Settings > Storage > ISO ni ulang
4. Boot

### QEMU da sinash

```bash
qemu-system-x86_64 \
  -m 2048 \
  -cdrom dist/dagzo-os.iso \
  -boot d \
  -vga std
```

---

## Admin parol

Default admin parol: `dagzo2024`

Sozlamalar > Admin > Parol almashtirishdan o'zgartiriladi.

---

## Tizim ma'lumotlari

- **OS nomi:** Dagzo OS
- **Asos:** Debian 12 (Bookworm) minimal
- **Desktop:** XFCE4
- **Boot loader:** GRUB2
- **Boot splash:** Plymouth (dagzo theme)
- **O'quv dastur:** Dagzo Learn (Electron/React)
- **Wi-Fi:** NetworkManager + nmcli
- **Windows fayllari:** Wine orqali

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

---

## Yordam va muammo hal qilish

**Muammo:** Plymouth theme ko'rinmayapti  
**Yechim:** `sudo update-initramfs -u` va `sudo update-alternatives --set default.plymouth /usr/share/plymouth/themes/dagzo/dagzo.plymouth`

**Muammo:** Dagzo Learn ishga tushmayapti  
**Yechim:** `/opt/dagzo/dagzo-learn/dagzo-learn --no-sandbox` buyrug'ini sinang

**Muammo:** Wi-Fi API ishlamayapti  
**Yechim:** `nmcli` o'rnatilganini tekshiring: `which nmcli`

**Muammo:** .exe fayl ochilmayapti  
**Yechim:** Wine o'rnatilganini tekshiring: `wine --version`
