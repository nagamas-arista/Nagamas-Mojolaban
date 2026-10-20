# Cara mengedit katalog Nagamas Honda

## Mengelola lewat halaman admin

Buka `admin.html` untuk menambah produk, mengedit tipe/harga, menyembunyikan atau menampilkan produk, serta mengubah nama seri, kategori, dan foto.

Perubahan tersimpan di penyimpanan browser admin. Untuk memperbarui file website, klik **Ekspor ke website**, lalu ganti `assets/js/products.js` dengan file hasil unduhan. Website statis tidak memiliki server atau login admin. Halaman admin ini sebaiknya tidak dipublikasikan terbuka.

## Mengedit file katalog langsung

Daftar seri, tipe, harga, dan foto ada di:

`assets/js/products.js`

Setiap blok produk mewakili satu seri. Di dalamnya:

- `title` adalah nama seri yang tampil di kartu katalog.
- `category` harus salah satu dari `matic`, `bebek`, `sport`, atau `listrik`.
- `image` adalah alamat foto. Foto setiap seri tersimpan terpisah di `assets/series/`.
- `variants` berisi nama tipe dan harga dalam angka rupiah. Contoh: `21270000` akan tampil sebagai `Rp 21.270.000`.

Untuk menambah tipe dalam seri, tambahkan baris `{ name: 'Nama tipe', price: 25000000 }` ke bagian `variants` seri itu. Untuk membuat seri baru, salin satu blok seri dan ubah isinya.

`assets/js/catalog.js` mengatur tampilan kartu, pencarian, dan filter kategori. Biasanya file itu tidak perlu diedit saat memperbarui produk.
