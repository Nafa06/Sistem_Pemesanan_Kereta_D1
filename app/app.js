// Membaca file .env di awal aplikasi (PENTING)
require('dotenv').config(); 

const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const port = process.env.APP_PORT || 3000;

// Import database untuk cek koneksi sebelum start server
const pool = require('./config/database');

// Function untuk retry koneksi database
async function waitForDatabase(maxRetries = 30, retryDelay = 2000) {
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            console.log(`🔄 Mencoba koneksi ke database... (attempt ${retries + 1}/${maxRetries})`);
            const connection = await pool.getConnection();
            connection.release();
            console.log("✅ Database siap! Memulai aplikasi...");
            return true;
        } catch (err) {
            retries++;
            if (retries < maxRetries) {
                console.log(`⏳ Database belum siap. Menunggu ${retryDelay / 1000} detik...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    console.error("❌ Gagal koneksi ke database setelah " + maxRetries + " percobaan");
    process.exit(1);
}

// Import file routes
const indexRouter = require('./routes/index');

// Setup View Engine (EJS)
// Pastikan folder bernama 'view' (tanpa s) sesuai kode kamu, 
// atau ubah jadi 'views' jika folder kamu bernama 'views'
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view')); 

// Middleware Session
app.use(session({
    secret: 'traveltrain_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 jam
}));

// Middleware (Untuk membaca input form & JSON & file static)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// PENGGUNAAN ROUTER
// ==========================================
app.use('/', indexRouter);

// --- 404 ERROR HANDLER ---
app.use((req, res) => {
    // Pastikan ada file view/404.ejs, jika tidak ada, kirim text biasa
    res.status(404);
    try {
        res.render('404', {});
    } catch (e) {
        res.send("<h1>404 - Halaman Tidak Ditemukan</h1>");
    }
});

// Jalankan Server (tapi tunggu database siap dulu)
async function startServer() {
    await waitForDatabase();
    
    app.listen(port, () => {
        console.log(`✅ Aplikasi Tiket Kereta berjalan di http://localhost:${port}`);
    });
}

startServer().catch(err => {
    console.error("❌ Gagal memulai aplikasi:", err);
    process.exit(1);
});