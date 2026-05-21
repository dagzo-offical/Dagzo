# Dagzo OS — Branding Fayllar

Bu papkaga quyidagi rasmlarni joylang:

## Kerakli fayllar

| Fayl | O'lcham | Format | Maqsad |
|------|---------|--------|--------|
| `boot.png` | 1920×1080 px | PNG | Plymouth boot splash, GRUB background |
| `icon.png` | 512×512 px | PNG | Dagzo Learn app icon |
| `wallpapers/wallpaper-1.png` | 1920×1080 px | PNG | Fon rasmi 1 |
| `wallpapers/wallpaper-2.png` | 1920×1080 px | PNG | **Default** fon rasmi |
| `wallpapers/wallpaper-3.png` | 1920×1080 px | PNG | Fon rasmi 3 |
| ... | ... | ... | ... |
| `wallpapers/wallpaper-10.png` | 1920×1080 px | PNG | Fon rasmi 10 |

## Dizayn tavsiyalari

### boot.png
- Dark, professional background
- Dagzo logosi yoki nomi markazda
- Rangli gradient (ko'k/siyona/binafsha)
- Progress bar joyi uchun pastda bo'sh joy qoldiring

### icon.png
- Transparent background
- Dagzo "D" harfi yoki logosi
- Dark/neon uslub

### wallpapers/
- Tech/cyber uslubida rasmlar
- Dark background (qora/to'q ko'k)
- Aurora, gradient, abstract shakllar
- wallpaper-2.png — eng chiroyli, default

## Placeholder rasmlar

Hozir bu papkada rasmlar yo'q.
`scripts/install-branding.sh` yoki `scripts/build-os.sh` shu nomlar bilan
rasmlarni izlaydi. Rasmlar yo'q bo'lsa, ular ogohlantirish chiqaradi
lekin davom etadi (placeholder ishlatiladi).

## Qo'shish usuli

```bash
# Rasmlarni to'g'ri joyga ko'chirish
cp siz_rasm.png assets/branding/boot.png
cp siz_icon.png assets/branding/icon.png
cp wp1.png assets/branding/wallpapers/wallpaper-1.png
# ...

# Keyin branding install qilish
sudo scripts/install-branding.sh
```
