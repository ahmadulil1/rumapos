# RumaPos — Aplikasi Kasir HP (POS) UMKM

Aplikasi kasir untuk HP Android (dibungkus dengan Capacitor) + panel admin web (Firebase).

## Struktur

- `kasir/` — aplikasi web asli (PWA). Bisa dibuka langsung di browser.
  - `index.html` — UI kasir (login, katalog, checkout, stok, laporan, data)
  - `app.js` — seluruh logika bisnis
  - `admin.html` — panel admin web (pantau multi-toko)
  - `sw.js` — service worker
  - `manifest.json` — PWA manifest
  - `test.js` — 15 tes otomatis: `node kasir/test.js`
  - `firestore.rules` — rules keamanan Firebase (belum dideploy)
  - `icon.svg` — ikon RumaPos
- `android-app/` — project Capacitor yang membungkus `kasir/` jadi APK
  - `www/` — salinan aplikasi web + integrasi plugin native
  - `android/` — project Android (Gradle)

## Plugin native (di `android-app`)

- `@capacitor-mlkit/barcode-scanning` — scan barcode kamera
- `@capacitor-community/bluetooth-le` — printer Bluetooth ESC/POS
- `@capacitor/preferences` — penyimpanan

## Build APK

```powershell
cd android-app
npm install
npx cap sync android
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleDebug
```

Hasil: `android\app\build\outputs\apk\debug\app-debug.apk`

Butuh: Node.js, Android Studio (SDK + JDK), AEHD driver untuk emulator.

## Firebase

Project: `kasir-v1-17fa7`. Config sudah ditanam di `index.html` & `admin.html`.

## Catatan

- `ponytail:` di kode = penyederhanaan disengaja, lihat komentar untuk kapan harus di-upgrade.
- Service worker tidak jalan di APK (WebView `file://`); localStorage tetap dipakai.
