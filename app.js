const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Import file routes yang baru kita buat
const indexRouter = require('./routes/index');

// Setup View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// Middleware (Untuk membaca input form & file static)
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// PENGGUNAAN ROUTER
// ==========================================
// Gunakan indexRouter untuk semua URL yang dimulai dari '/'
app.use('/', indexRouter);

// ... (kode routes di atas) ...

app.use('/', indexRouter);

// --- TAMBAHKAN INI UNTUK 404 ---
app.use((req, res) => {
    res.status(404).send(`
        <h1 style="text-align:center; margin-top:50px;">404 - Halaman Tidak Ditemukan 😢</h1>
        <p style="text-align:center;"><a href="/">Kembali ke Home</a></p>
    `);
});


// Jalankan Server
app.listen(port, () => {
    console.log(`Aplikasi Tiket Kereta berjalan di http://localhost:${port}`);
});

// Jalankan Server