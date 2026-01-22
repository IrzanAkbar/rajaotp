------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cara Mengambil API Key:

1. Login ke Website RUMAHOTP
Buka link berikut dan login dengan akun Anda:
https://rumahotp.com

2. Buka Menu Profle
Setelah login, klik menu profile/ikon profile anda.
Pilih menu APIKEYS dari daftar yang muncul.

3. Salin API Key
Di halaman API, salin API Key yang tertera untuk digunakan dalam integrasi bot atau aplikasi Anda.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Cara Setting API RUMAHOTP Di Script Buy Nokos

1. Buka file config.js

2. Isi bagian berikut sesuai data kamu:

RUMAHOTP: "ISI APIKEYMU DISINI" // APIKEY RUMAH OTP

UNTUNG_NOKOS: 1000 // biaya admin saat pembelian nomor

UNTUNG_DEPOSIT: 500 // biaya admin saat deposit

type_ewallet_RUMAHOTP: "dana", // isi tujuan pencairan ke ewalet apa, Hanya Nerima Dana, Gopay, Ovo, ShopeePay, Link Aja ( Ovo, ShopeePay, Link Aja Belom Gw Coba Si😂 )

nomor_pencairan_RUMAHOTP: "ISI NOMOR SESUAI EWALET DIATAS", // Misal isi Type Ewalet dana berarti isi nomor dana, Gunakn Awalan 08 bukan 628

3. Simpan file, lalu jalankan ulang bot
