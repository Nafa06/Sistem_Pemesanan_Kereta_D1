const express = require('express');
const path = require('path');
const app = express();
const port = process.env.APP_PORT || 3000;

// Import file routes yang baru kita buat
const indexRouter = require('./routes/index');

// Setup View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// Middleware (Untuk membaca input form & JSON & file static)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// PENGGUNAAN ROUTER
// ==========================================
// Gunakan indexRouter untuk semua URL yang dimulai dari '/'
app.use('/', indexRouter);

// --- 404 ERROR HANDLER ---
app.use((req, res) => {
    res.status(404).render('404', {});
});

// Jalankan Server
app.listen(port, () => {
    console.log(`✅ Aplikasi Tiket Kereta berjalan di http://localhost:${port}`);
});