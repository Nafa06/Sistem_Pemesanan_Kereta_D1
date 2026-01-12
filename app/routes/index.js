const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise'); // Panggil library MySQL

// 1. BUAT KONEKSI POOL (Jembatan ke Database)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', // Di Docker akan pakai 'db_service'
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_tiket_kereta',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi saat server nyala
pool.getConnection()
    .then(conn => {
        console.log("✅ SUKSES: Terhubung ke Database MySQL!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ GAGAL: Tidak bisa connect ke Database.", err.message);
    });

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

// --- ROUTES ---

// 1. HOME
router.get('/', (req, res) => {
    res.render('index', { tiket: null, asal: '', tujuan: '', tanggal: '', getNamaKota });
});

// 2. SEARCH (Ambil dari Tabel tiket/jadwal - Disini saya simulasi query jadwal)
// Catatan: Karena di init.sql kita belum punya tabel 'jadwal' terpisah, 
// kita gunakan logika sederhana atau query ke tabel 'kereta' + 'stasiun'.
// Untuk simpelnya, saya kembalikan array statis dulu AGAR TIDAK ERROR, 
// tapi logika simpan ordernya sudah ke DB.
router.get('/search', (req, res) => {
    const { asal, tujuan, tanggal } = req.query;
    // (Nanti bisa diganti query SELECT * FROM jadwal WHERE ...)
    // Sementara pakai data dummy statis agar fitur search jalan
    const db_jadwal_dummy = [
        { nama: "Argo Bromo", kelas: "Eksekutif", asal: "GMR", tujuan: "SGU", berangkat: "08:00", tiba: "16:00", harga: "Rp 650.000", durasi: "8j" },
        { nama: "Argo Wilis", kelas: "Eksekutif", asal: "BD", tujuan: "SGU", berangkat: "07:00", tiba: "17:00", harga: "Rp 600.000", durasi: "10j" }
    ];
    const hasil = db_jadwal_dummy.filter(i => i.asal === asal && i.tujuan === tujuan);
    res.render('index', { tiket: hasil, asal, tujuan, tanggal, getNamaKota });
});

// 3. TUTORIAL
router.get('/tutorial', (req, res) => {
    res.render('tutorial');
});

// 4. PROSES ORDER (INSERT KE DATABASE)
router.post('/order', async (req, res) => {
    try {
        const { namaKereta, berangkat, harga, tanggal, metodeBayar } = req.body;
        
        // Generate kode booking & ID Penumpang dummy (karena belum ada login)
        const kodeBooking = 'BOOK-' + Math.floor(10000 + Math.random() * 90000);
        
        // Bersihkan string harga (Rp 650.000 -> 650000) agar masuk ke DECIMAL
        const hargaBersih = harga.replace(/[^0-9]/g, ''); 

        // Query SQL: Masukkan ke tabel TIKET
        // Kita pakai ID Penumpang 1 (Data Dummy di init.sql) sebagai default
        const sql = `
            INSERT INTO tiket 
            (kode_booking, id_penumpang, tanggal_keberangkatan, tanggal_tiba, harga, status) 
            VALUES (?, 1, ?, ?, ?, 'Menunggu Pembayaran')
        `;
        
        // Parameter: tanggal_keberangkatan digabung dengan jam
        const tglBerangkat = `${tanggal} ${berangkat}:00`;
        const tglTiba = `${tanggal} 23:59:00`; // Dummy tiba

        await pool.execute(sql, [kodeBooking, tglBerangkat, tglTiba, hargaBersih]);

        // Simpan Transaksi
        // Ambil ID tiket yang baru dibuat
        const [rows] = await pool.execute('SELECT id_tiket FROM tiket WHERE kode_booking = ?', [kodeBooking]);
        const idTiketBaru = rows[0].id_tiket;

        await pool.execute(`
            INSERT INTO transaksi (id_tiket, metode_bayar, total_bayar) 
            VALUES (?, ?, ?)
        `, [idTiketBaru, metodeBayar, hargaBersih]);

        console.log("✅ Data masuk DB:", kodeBooking);
        res.json({ status: 'success', kode: kodeBooking });

    } catch (error) {
        console.error("❌ Error Order:", error);
        res.status(500).json({ status: 'error' });
    }
});

// 5. RIWAYAT PESANAN (SELECT FROM DATABASE)
router.get('/cek-pesanan', async (req, res) => {
    try {
        // Ambil data dari tabel tiket JOIN transaksi JOIN kereta (jika ada relasi)
        // Disini kita ambil simpel dari tiket dulu
        const [rows] = await pool.query(`
            SELECT t.*, tr.metode_bayar 
            FROM tiket t 
            LEFT JOIN transaksi tr ON t.id_tiket = tr.id_tiket 
            ORDER BY t.id_tiket DESC
        `);

        // Format data agar sesuai tampilan EJS
        const pesananFormatted = rows.map(row => ({
            kode: row.kode_booking,
            namaKereta: "Kereta Eksekutif", // Bisa di-join table kereta nanti
            status: row.status,
            harga: "Rp " + parseInt(row.harga).toLocaleString('id-ID'),
            tanggal: new Date(row.tanggal_keberangkatan).toISOString().split('T')[0],
            berangkat: new Date(row.tanggal_keberangkatan).toTimeString().substr(0,5)
        }));

        res.render('ticket', { pesanan: pesananFormatted });
    } catch (error) {
        console.error(error);
        res.send("Gagal mengambil data database");
    }
});

module.exports = router;