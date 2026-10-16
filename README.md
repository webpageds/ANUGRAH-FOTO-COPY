# ANUGRAH FOTO COPY

Website katalog dan pemesanan untuk Anugrah Foto Copy — responsive, tanpa framework/build step.

## Fitur
- Landing page modern dan responsive
- Katalog jasa berdasarkan brosur toko
- Pencarian dan filter kategori
- Keranjang interaktif, tambah/kurangi jumlah dan hapus item
- Keranjang tersimpan di browser menggunakan localStorage
- Checkout dengan nama, nomor pelanggan opsional, metode penerimaan, dan catatan
- Pesan order otomatis disusun lalu dibuka di WhatsApp admin
- Informasi kontak dan tautan petunjuk arah Google Maps

## Menjalankan secara lokal
Buka `index.html` pada browser. Untuk pengalaman terbaik, jalankan server lokal statis (misalnya Live Server di VS Code).

## Deploy dengan GitHub Pages
1. Buka repository **Settings → Pages**.
2. Di bagian **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
4. Tunggu workflow/deployment selesai, kemudian buka URL Pages yang ditampilkan GitHub.

## Konfigurasi yang perlu ditinjau pemilik toko
- Nomor WhatsApp dikonfigurasi di `script.js` sebagai `WHATSAPP_NUMBER`. Nilai saat ini: `6285722210313` (berdasarkan brosur).
- Harga pada katalog di `script.js` saat ini `null` karena daftar harga resmi belum diberikan. Setelah harga disepakati, ubah nilai `price` per layanan ke angka rupiah. Contoh: `price: 500` untuk Rp500.
- Alamat, email, dan daftar jasa berdasarkan brosur yang disediakan.
- Jam operasional, biaya pengiriman, metode pembayaran, dan estimasi pengerjaan belum dicantumkan karena informasinya belum tersedia.

## Cara checkout WhatsApp
Website membuka WhatsApp dengan pesan yang telah disusun. Pelanggan masih perlu menekan **Kirim** di WhatsApp; ini bukan pengiriman pesan otomatis di belakang layar. Tidak ada pembayaran online atau backend/database pesanan dalam versi statis ini.

## File
- `index.html` — struktur halaman dan markup checkout
- `style.css` — desain dan responsive layout
- `script.js` — katalog, cart, penyimpanan, checkout dan WhatsApp