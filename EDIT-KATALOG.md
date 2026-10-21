# Cara mengedit katalog Nagamas Honda

## Mengelola lewat halaman admin

Buka `admin.html` untuk menambah produk, mengedit tipe/harga, menyembunyikan atau menampilkan produk, serta mengubah nama seri, kategori, dan foto. Admin mengikuti tampilan sederhana dan hanya meminta token GitHub.

Konfigurasi `GITHUB_CONFIG` pada bagian atas `assets/js/admin.js` sudah diisi untuk repository `nagamas-arista/Nagamas-Mojolaban` dengan branch `main`. Setelah mengunggah website, cukup tempel fine-grained token ke admin dan pilih **Hubungkan & muat produk**. Setiap perubahan produk, harga, foto, atau status tampil akan otomatis membuat commit baru yang memperbarui `assets/js/products.js`. GitHub Pages kemudian membangun ulang website.

Foto seri ditampilkan sebagai pratinjau di daftar admin. Saat menambah produk, pilih file foto opsional; foto akan digunakan untuk seri yang dipilih. Untuk seri baru, unggah foto pada form yang sama. File JPG, PNG, atau WebP maksimal 5 MB akan diunggah ke `assets/series/` di GitHub dan katalog otomatis diarahkan ke foto tersebut. Foto juga bisa diganti lewat **Edit seri**. Jika hanya mengubah kolom alamat foto tanpa memilih berkas, file gambarnya harus sudah ada di repository.

Untuk token, batasi aksesnya ke repository website ini saja dan beri izin **Contents: Read and write**. Token hanya disimpan di memori halaman admin, tidak di file situs maupun browser storage. Tutup atau muat ulang halaman admin untuk menghapus token dari sesi. Gunakan admin melalui HTTPS. Jangan bagikan token atau memasukkannya ke file kode.

Halaman admin belum memakai login. Siapa pun dapat membuka dan mengubah tampilan admin di browser mereka sendiri, tetapi hanya pemegang token yang dapat menyimpan ke repository. Jangan membagikan token kepada orang lain. Untuk penggunaan beberapa admin, tambahkan autentikasi/backend khusus.

Jika sinkronisasi gagal, pesan status di bawah tombol koneksi menjelaskan masalahnya. Perubahan tetap ada di browser sesi itu; hubungkan ulang token lalu lakukan kembali perubahan yang belum tersimpan.

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
