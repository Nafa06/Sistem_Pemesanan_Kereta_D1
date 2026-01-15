const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Pastikan path ini benar

// --- MIDDLEWARE AUTH ---
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        // Cek apakah request adalah API call (fetch) atau page request biasa
        // Deteksi dari content-type atau accept header
        const contentType = req.headers['content-type'] || '';
        const accept = req.headers['accept'] || '';

        // API call biasanya:
        // 1. Mengirim content-type: application/json
        // 2. Menerima accept: application/json atau */*
        // 3. Atau path dimulai dengan /api/ atau method POST/PUT/DELETE tanpa form content type
        const isApiCall = contentType.includes('application/json') ||
            accept.includes('application/json') ||
            (req.method === 'POST' && !contentType.includes('application/x-www-form-urlencoded'));

        console.log(`🔐 Auth Check:`, {
            path: req.path,
            method: req.method,
            contentType,
            accept,
            isApiCall
        });

        if (isApiCall) {
            // Untuk API call, kirim response JSON
            return res.status(401).json({
                status: 'error',
                message: 'Silakan login terlebih dahulu untuk melakukan pemesanan'
            });
        } else {
            // Untuk page request biasa, lakukan redirect
            res.redirect('/login');
        }
    }
}

// Helper: Nama Kota
function getNamaKota(kode) {
    const kota = {
        'GMR': 'Jakarta (Gambir)', 'PSE': 'Jakarta (Pasar Senen)',
        'BD': 'Bandung', 'YK': 'Yogyakarta (Tugu)',
        'SGU': 'Surabaya (Gubeng)', 'SMT': 'Semarang (Tawang)',
        'SLO': 'Solo (Balapan)', 'ML': 'Malang'
    };
    return kota[kode] || kode;
}

// --- ROUTES AUTH (LOGIN/REGISTER) ---

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

// PROCESS REGISTER
router.post('/register', async (req, res) => {
    try {
        const { nama, email, password } = req.body;
        if (!nama || !email || !password) return res.status(400).json({ status: 'error', message: 'Semua field harus diisi' });

        const [existing] = await pool.query('SELECT id_penumpang FROM penumpang WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });

        // Set no_id dan kontak kosong (user harus melengkapi di halaman akun)
        const [result] = await pool.execute(
            'INSERT INTO penumpang (no_id, tipe_id, nama_penumpang, email, kontak, password) VALUES (?, ?, ?, ?, ?, ?)',
            ['', 'KTP', nama, email, '', password]
        );

        req.session.userId = result.insertId;
        req.session.nama = nama;
        req.session.email = email;
        res.json({ status: 'success', message: 'Daftar berhasil' });
    } catch (error) {
        console.error("❌ Error Register:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PROCESS LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [existing] = await pool.query('SELECT id_penumpang, nama_penumpang, password FROM penumpang WHERE email = ?', [email]);

        if (existing.length === 0 || password !== existing[0].password) {
            return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
        }

        const user = existing[0];
        req.session.userId = user.id_penumpang;
        req.session.nama = user.nama_penumpang;
        req.session.email = email;
        res.json({ status: 'success', message: 'Login berhasil' });
    } catch (error) {
        console.error("❌ Error Login:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTES TRANSAKSI (ORDER/CANCEL/REFUND) ---

// CANCEL ORDER
router.post('/cancel-order', requireLogin, async (req, res) => {
    try {
        const { kode } = req.body;
        const idPenumpang = req.session.userId;
        const [tiketData] = await pool.query('SELECT id_tiket FROM tiket WHERE kode_booking = ? AND id_penumpang = ?', [kode, idPenumpang]);

        if (tiketData.length === 0) return res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan' });

        const tiket = tiketData[0];
        await pool.execute('UPDATE tiket SET kode_booking = NULL, id_penumpang = NULL, kursi_tersedia = kursi_tersedia + 1, status = ? WHERE id_tiket = ?', ['Menunggu Pembayaran', tiket.id_tiket]);
        await pool.execute('DELETE FROM transaksi WHERE id_tiket = ?', [tiket.id_tiket]);

        res.json({ status: 'success', message: 'Tiket berhasil dibatalkan' });
    } catch (error) {
        console.error("❌ Error Cancel:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// REFUND ORDER
router.post('/refund-order', requireLogin, async (req, res) => {
    try {
        const { kode } = req.body;
        const idPenumpang = req.session.userId;
        const [tiketData] = await pool.query('SELECT id_tiket, status, kursi_tersedia FROM tiket WHERE kode_booking = ? AND id_penumpang = ?', [kode, idPenumpang]);

        if (tiketData.length === 0) return res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan' });
        if (tiketData[0].status !== 'Lunas') return res.status(409).json({ status: 'error', message: 'Tiket belum lunas' });

        // Hapus tiket seperti batalkan: Set kode_booking, id_penumpang, status ke NULL, kembalikan kursi
        const tiket = tiketData[0];
        await pool.execute('UPDATE tiket SET kode_booking = NULL, id_penumpang = NULL, kursi_tersedia = kursi_tersedia + 1, status = ? WHERE id_tiket = ?', ['Menunggu Pembayaran', tiket.id_tiket]);
        await pool.execute('DELETE FROM transaksi WHERE id_tiket = ?', [tiket.id_tiket]);

        res.json({ status: 'success', message: 'Refund berhasil diproses. Dana akan dikembalikan dalam 3-5 hari kerja.' });
    } catch (error) {
        console.error("❌ Error Refund:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// CONFIRM PAYMENT
router.post('/confirm-payment', requireLogin, async (req, res) => {
    try {
        const { kode, metode } = req.body;
        const idPenumpang = req.session.userId;
        const metodeMap = { 'bank': 'Transfer Bank', 'ewallet': 'E-Wallet', 'qris': 'QRIS' };
        const metodeDB = metodeMap[metode] || metode;

        const [tiketData] = await pool.query('SELECT id_tiket FROM tiket WHERE kode_booking = ? AND id_penumpang = ?', [kode, idPenumpang]);
        if (tiketData.length === 0) return res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan' });

        await pool.execute('UPDATE tiket SET status = ? WHERE id_tiket = ?', ['Lunas', tiketData[0].id_tiket]);
        await pool.execute('UPDATE transaksi SET metode_bayar = ? WHERE id_tiket = ?', [metodeDB, tiketData[0].id_tiket]);

        res.json({ status: 'success', message: 'Pembayaran berhasil' });
    } catch (error) {
        console.error("❌ Error Payment:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// --- ROUTES UTAMA (HOME/SEARCH) ---

// 1. HOME
router.get('/', (req, res) => {
    res.render('index', {
        tiket: null,
        asal: '',
        tujuan: '',
        tanggal: '',
        getNamaKota,
        error: null,
        session: req.session || {} // Pass session data to view
    });
});

// 2. SEARCH (PERBAIKAN UTAMA: Query SQL disesuaikan dengan DB Baru)
router.get('/search', async (req, res) => {
    const { asal, tujuan, tanggal } = req.query;

    if (!asal || !tujuan || !tanggal) {
        return res.render('index', { tiket: null, asal: '', tujuan: '', tanggal: '', getNamaKota, error: 'Mohon lengkapi data pencarian.', session: req.session || {} });
    }

    try {
        console.log(`🔍 Mencari: ${asal} -> ${tujuan} pada ${tanggal}`);

        // QUERY INI SUDAH DIPERBAIKI
        const query = `
            SELECT 
                t.id_tiket,
                t.harga,
                t.kursi_tersedia,
                TIME(t.tanggal_keberangkatan) as jam_berangkat,
                TIME(t.tanggal_tiba) as jam_tiba,
                t.tanggal_keberangkatan,
                k.nama_kereta,
                k.tipe_kereta,
                s_asal.nama_stasiun as nama_asal,
                s_asal.kode_stasiun as kode_asal,
                s_tujuan.nama_stasiun as nama_tujuan,
                s_tujuan.kode_stasiun as kode_tujuan
            FROM tiket t
            JOIN kereta k ON t.id_kereta = k.id_kereta
            JOIN stasiun s_asal ON t.id_stasiun_asal = s_asal.id_stasiun
            JOIN stasiun s_tujuan ON t.id_stasiun_tujuan = s_tujuan.id_stasiun
            WHERE 
                s_asal.kode_stasiun = ? 
                AND s_tujuan.kode_stasiun = ? 
                AND DATE(t.tanggal_keberangkatan) = ?
                AND t.status = 'Menunggu Pembayaran'
            ORDER BY TIME(t.tanggal_keberangkatan) ASC
        `;

        console.log(`📝 Query params: asal=${asal}, tujuan=${tujuan}, tanggal=${tanggal}`);

        const [rows] = await pool.query(query, [asal, tujuan, tanggal]);

        console.log(`📊 Hasil pencarian: ${rows.length} tiket ditemukan`);

        const hasil = rows.map(row => ({
            id_tiket: row.id_tiket,
            nama: row.nama_kereta,
            kelas: row.tipe_kereta,
            asal: row.kode_asal,
            namaAsal: row.nama_asal,
            tujuan: row.kode_tujuan,
            namaTujuan: row.nama_tujuan,
            // Format jam agar hanya HH:MM (buang detik)
            berangkat: row.jam_berangkat.substring(0, 5),
            tiba: row.jam_tiba.substring(0, 5),
            tanggalTiba: tanggal,
            harga: parseInt(row.harga),
            hargaFormat: "Rp " + parseInt(row.harga).toLocaleString('id-ID'),
            kursiTersedia: row.kursi_tersedia,
            tersedia: row.kursi_tersedia > 0,
            tanggalBerangkat: tanggal
        }));

        res.render('index', { tiket: hasil, asal, tujuan, tanggal, getNamaKota, error: null, session: req.session || {} });

    } catch (error) {
        console.error("❌ Error Search:", error);
        res.render('index', { tiket: null, asal, tujuan, tanggal, getNamaKota, error: "Terjadi kesalahan pada database.", session: req.session || {} });
    }
});

// 3. TUTORIAL
router.get('/tutorial', (req, res) => res.render('tutorial'));

// 3.0 API: CHECK PROFILE COMPLETENESS
router.get('/api/check-profile', requireLogin, async (req, res) => {
    try {
        const idPenumpang = req.session.userId;
        const [userData] = await pool.query(
            'SELECT kontak, no_id FROM penumpang WHERE id_penumpang = ?',
            [idPenumpang]
        );

        if (userData.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        const user = userData[0];
        // Profil lengkap jika kontak dan no_id tidak kosong
        const isComplete = user.kontak && user.kontak.trim() !== '' && user.no_id && user.no_id.trim() !== '';

        res.json({ status: 'success', isComplete });
    } catch (error) {
        console.error('❌ Error Check Profile:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 3.1 AKUN (Account Page)
router.get('/akun', requireLogin, (req, res) => {
    res.render('akun');
});

// 3.2 API: GET USER PROFILE
router.get('/api/user-profile', requireLogin, async (req, res) => {
    try {
        const idPenumpang = req.session.userId;
        const [userData] = await pool.query(
            'SELECT id_penumpang, no_id, tipe_id, nama_penumpang, email, kontak FROM penumpang WHERE id_penumpang = ?',
            [idPenumpang]
        );

        if (userData.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        res.json({ status: 'success', user: userData[0] });
    } catch (error) {
        console.error('❌ Error Get Profile:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 3.3 API: UPDATE USER PROFILE
router.post('/api/update-profile', requireLogin, async (req, res) => {
    try {
        const { nama, email, kontak, tipe_id, no_id } = req.body;
        const idPenumpang = req.session.userId;

        // Validasi input
        if (!nama || !email || !kontak || !tipe_id || !no_id) {
            return res.status(400).json({ status: 'error', message: 'Semua field harus diisi' });
        }

        // Validasi email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: 'error', message: 'Format email tidak valid' });
        }

        // Validasi no HP
        if (!kontak.startsWith('08') || kontak.length < 10) {
            return res.status(400).json({ status: 'error', message: 'No HP harus dimulai dengan 08 dan minimal 10 digit' });
        }

        // Validasi NIK jika tipe_id adalah KTP
        if (tipe_id === 'KTP' && no_id.length !== 16) {
            return res.status(400).json({ status: 'error', message: 'NIK KTP harus 16 digit' });
        }

        // Cek apakah email sudah digunakan oleh user lain
        const [existingEmail] = await pool.query(
            'SELECT id_penumpang FROM penumpang WHERE email = ? AND id_penumpang != ?',
            [email, idPenumpang]
        );

        if (existingEmail.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email sudah digunakan oleh akun lain' });
        }

        // Update data
        await pool.execute(
            'UPDATE penumpang SET nama_penumpang = ?, email = ?, kontak = ?, tipe_id = ?, no_id = ? WHERE id_penumpang = ?',
            [nama, email, kontak, tipe_id, no_id, idPenumpang]
        );

        // Update session
        req.session.nama = nama;
        req.session.email = email;

        res.json({ status: 'success', message: 'Data akun berhasil diperbarui' });
    } catch (error) {
        console.error('❌ Error Update Profile:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 4. PROSES ORDER (Create Booking)
router.post('/order', requireLogin, async (req, res) => {
    try {
        const { idTiket, metodeBayar } = req.body;
        const idPenumpang = req.session.userId;
        const metodeMap = { 'bank': 'Transfer Bank', 'ewallet': 'E-Wallet', 'qris': 'QRIS' };
        const metodeDB = metodeMap[metodeBayar] || 'Transfer Bank';

        // CEK KELENGKAPAN DATA DIRI
        const [userData] = await pool.query('SELECT kontak, no_id FROM penumpang WHERE id_penumpang = ?', [idPenumpang]);
        if (userData.length > 0) {
            const user = userData[0];
            if (!user.kontak || user.kontak.trim() === '' || !user.no_id || user.no_id.trim() === '') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Harap lengkapi data diri Anda terlebih dahulu di halaman Rincian Akun',
                    code: 'PROFILE_INCOMPLETE'
                });
            }
        }

        const [tiketData] = await pool.query('SELECT * FROM tiket WHERE id_tiket = ?', [idTiket]);
        if (tiketData.length === 0 || tiketData[0].kursi_tersedia <= 0) {
            return res.status(409).json({ status: 'error', message: 'Tiket habis atau tidak ditemukan' });
        }

        const tiket = tiketData[0];
        const kodeBooking = 'BK-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

        // Update Tiket: Assign ke User
        await pool.execute(
            'UPDATE tiket SET kode_booking = ?, id_penumpang = ?, kursi_tersedia = kursi_tersedia - 1, status = ? WHERE id_tiket = ?',
            [kodeBooking, idPenumpang, 'Menunggu Pembayaran', idTiket]
        );

        // Buat Transaksi
        await pool.execute(
            'INSERT INTO transaksi (id_tiket, metode_bayar, total_bayar) VALUES (?, ?, ?)',
            [idTiket, metodeDB, tiket.harga]
        );

        res.json({ status: 'success', kode: kodeBooking });

    } catch (error) {
        console.error("❌ Error Order:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 5. RIWAYAT PESANAN (Cek Tiket Saya)
router.get('/cek-pesanan', requireLogin, async (req, res) => {
    try {
        const idPenumpang = req.session.userId;
        // Query disesuaikan dengan kolom DB Baru (jam_berangkat diekstrak dari tanggal_keberangkatan)
        const query = `
            SELECT 
                t.id_tiket, t.kode_booking, t.status, t.harga,
                t.tanggal_keberangkatan, TIME(t.tanggal_keberangkatan) as jam_berangkat,
                k.nama_kereta, s_asal.nama_stasiun as asal, s_tujuan.nama_stasiun as tujuan
            FROM tiket t
            JOIN kereta k ON t.id_kereta = k.id_kereta
            JOIN stasiun s_asal ON t.id_stasiun_asal = s_asal.id_stasiun
            JOIN stasiun s_tujuan ON t.id_stasiun_tujuan = s_tujuan.id_stasiun
            WHERE t.id_penumpang = ? AND t.kode_booking IS NOT NULL
            ORDER BY t.id_tiket DESC
        `;

        const [rows] = await pool.query(query, [idPenumpang]);

        const formatted = rows.map(row => ({
            kode: row.kode_booking,
            namaKereta: row.nama_kereta,
            status: row.status,
            harga: "Rp " + parseInt(row.harga).toLocaleString('id-ID'),
            tanggal: new Date(row.tanggal_keberangkatan).toISOString().split('T')[0],
            berangkat: row.jam_berangkat.substring(0, 5), // Ambil HH:MM
            asal: row.asal,
            tujuan: row.tujuan
        }));

        res.render('ticket', { pesanan: formatted });
    } catch (error) {
        console.error("❌ Error Cek Pesanan:", error);
        res.send("Gagal memuat tiket.");
    }
});

// Route /tickets (Alias untuk cek-pesanan, biar aman jika ada link lama)
router.get('/tickets', (req, res) => res.redirect('/cek-pesanan'));

module.exports = router;