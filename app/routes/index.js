const express = require('express');
const router = express.Router();

let pesananDB = []; 

const db_jadwal = [
    // --- RUTE JAKARTA (GMR/PSE) KE SURABAYA (SGU/SBI) ---
    { id: 1, nama: "Argo Bromo Anggrek", kelas: "Luxury", asal: "GMR", tujuan: "SGU", berangkat: "08:20", tiba: "16:30", durasi: "8j 10m", harga: "Rp 1.250.000" },
    { id: 2, nama: "Argo Bromo Anggrek", kelas: "Eksekutif", asal: "GMR", tujuan: "SGU", berangkat: "08:20", tiba: "16:30", durasi: "8j 10m", harga: "Rp 650.000" },
    { id: 3, nama: "Sembrani", kelas: "Eksekutif", asal: "GMR", tujuan: "SGU", berangkat: "19:00", tiba: "04:30", durasi: "9j 30m", harga: "Rp 610.000" },
    { id: 4, nama: "Gumarang", kelas: "Bisnis", asal: "GMR", tujuan: "SGU", berangkat: "15:40", tiba: "02:00", durasi: "10j 20m", harga: "Rp 350.000" },
    { id: 5, nama: "Airlangga", kelas: "Ekonomi", asal: "GMR", tujuan: "SGU", berangkat: "11:10", tiba: "20:50", durasi: "9j 40m", harga: "Rp 104.000" },
    { id: 6, nama: "Kertajaya", kelas: "Ekonomi", asal: "GMR", tujuan: "SGU", berangkat: "14:10", tiba: "01:25", durasi: "11j 15m", harga: "Rp 265.000" },

    // --- RUTE JAKARTA (GMR) KE YOGYAKARTA (YK/LPN) ---
    { id: 7, nama: "Taksaka Pagi", kelas: "Eksekutif", asal: "GMR", tujuan: "YK", berangkat: "09:10", tiba: "15:35", durasi: "6j 25m", harga: "Rp 550.000" },
    { id: 8, nama: "Argo Dwipangga", kelas: "Luxury", asal: "GMR", tujuan: "YK", berangkat: "08:50", tiba: "15:00", durasi: "6j 10m", harga: "Rp 1.150.000" },
    { id: 9, nama: "Taksaka Malam", kelas: "Eksekutif", asal: "GMR", tujuan: "YK", berangkat: "21:30", tiba: "03:55", durasi: "6j 25m", harga: "Rp 530.000" },
    { id: 10, nama: "Fajar Utama YK", kelas: "Ekonomi Premium", asal: "GMR", tujuan: "YK", berangkat: "06:45", tiba: "14:30", durasi: "7j 45m", harga: "Rp 290.000" },
    { id: 11, nama: "Senja Utama YK", kelas: "Ekonomi Premium", asal: "GMR", tujuan: "YK", berangkat: "19:10", tiba: "03:00", durasi: "7j 50m", harga: "Rp 310.000" },

    // --- RUTE JAKARTA (GMR) KE BANDUNG (BD) ---
    { id: 12, nama: "Argo Parahyangan", kelas: "Eksekutif", asal: "GMR", tujuan: "BD", berangkat: "06:40", tiba: "09:20", durasi: "2j 40m", harga: "Rp 150.000" },
    { id: 13, nama: "Argo Parahyangan", kelas: "Ekonomi", asal: "GMR", tujuan: "BD", berangkat: "06:40", tiba: "09:20", durasi: "2j 40m", harga: "Rp 110.000" },
    { id: 14, nama: "Argo Parahyangan", kelas: "Eksekutif", asal: "GMR", tujuan: "BD", berangkat: "10:15", tiba: "13:00", durasi: "2j 45m", harga: "Rp 150.000" },
    { id: 15, nama: "Argo Parahyangan", kelas: "Luxury", asal: "GMR", tujuan: "BD", berangkat: "15:30", tiba: "18:15", durasi: "2j 45m", harga: "Rp 380.000" },

    // --- RUTE JAKARTA (GMR) KE SOLO (SLO) ---
    { id: 16, nama: "Argo Lawu", kelas: "Eksekutif", asal: "GMR", tujuan: "SLO", berangkat: "20:00", tiba: "04:00", durasi: "8j 00m", harga: "Rp 580.000" },
    { id: 17, nama: "Argo Lawu", kelas: "Luxury", asal: "GMR", tujuan: "SLO", berangkat: "20:00", tiba: "04:00", durasi: "8j 00m", harga: "Rp 1.300.000" },
    { id: 18, nama: "Mataram", kelas: "Ekonomi Premium", asal: "GMR", tujuan: "SLO", berangkat: "21:10", tiba: "06:00", durasi: "8j 50m", harga: "Rp 340.000" },

    // --- RUTE JAKARTA (GMR) KE SEMARANG (SMT) ---
    { id: 19, nama: "Argo Muria", kelas: "Eksekutif", asal: "GMR", tujuan: "SMT", berangkat: "07:00", tiba: "12:30", durasi: "5j 30m", harga: "Rp 400.000" },
    { id: 20, nama: "Argo Sindoro", kelas: "Eksekutif", asal: "GMR", tujuan: "SMT", berangkat: "16:15", tiba: "21:45", durasi: "5j 30m", harga: "Rp 420.000" },
    { id: 21, nama: "Tawang Jaya Premium", kelas: "Ekonomi", asal: "GMR", tujuan: "SMT", berangkat: "07:30", tiba: "14:15", durasi: "6j 45m", harga: "Rp 190.000" },

    // --- RUTE JAKARTA (GMR) KE MALANG (ML) ---
    { id: 22, nama: "Gajayana", kelas: "Eksekutif", asal: "GMR", tujuan: "ML", berangkat: "18:00", tiba: "07:00", durasi: "13j 00m", harga: "Rp 720.000" },
    { id: 23, nama: "Gajayana", kelas: "Luxury", asal: "GMR", tujuan: "ML", berangkat: "18:00", tiba: "07:00", durasi: "13j 00m", harga: "Rp 1.550.000" },
    { id: 24, nama: "Brawijaya", kelas: "Eksekutif", asal: "GMR", tujuan: "ML", berangkat: "15:40", tiba: "05:00", durasi: "13j 20m", harga: "Rp 680.000" },
    { id: 25, nama: "Jayabaya", kelas: "Ekonomi", asal: "GMR", tujuan: "ML", berangkat: "16:45", tiba: "06:20", durasi: "13j 35m", harga: "Rp 410.000" },

    // --- RUTE BANDUNG (BD) KE TIMUR (YK/SGU) ---
    { id: 26, nama: "Argo Wilis", kelas: "Eksekutif", asal: "BD", tujuan: "SGU", berangkat: "08:15", tiba: "18:10", durasi: "9j 55m", harga: "Rp 690.000" },
    { id: 27, nama: "Turangga", kelas: "Eksekutif", asal: "BD", tujuan: "SGU", berangkat: "18:10", tiba: "04:20", durasi: "10j 10m", harga: "Rp 660.000" },
    { id: 28, nama: "Lodaya Pagi", kelas: "Eksekutif", asal: "BD", tujuan: "YK", berangkat: "07:20", tiba: "15:00", durasi: "7j 40m", harga: "Rp 390.000" },
    { id: 29, nama: "Lodaya Pagi", kelas: "Ekonomi", asal: "BD", tujuan: "YK", berangkat: "07:20", tiba: "15:00", durasi: "7j 40m", harga: "Rp 230.000" },
    { id: 30, nama: "Mutiara Selatan", kelas: "Eksekutif", asal: "BD", tujuan: "SGU", berangkat: "20:30", tiba: "08:00", durasi: "11j 30m", harga: "Rp 590.000" }
];

// nama kota & stasiun
function getNamaKota(kode) {
    const kota = {
        'GMR': 'Jakarta (Gambir)',
        'PSE': 'Jakarta (Pasar Senen)',
        'BD': 'Bandung',
        'YK': 'Yogyakarta (Tugu)',
        'LPN': 'Yogyakarta (Lempuyangan)',
        'SGU': 'Surabaya (Gubeng)',
        'SBI': 'Surabaya (Pasar Turi)',
        'SMT': 'Semarang (Tawang)',
        'SLO': 'Solo (Balapan)',
        'ML': 'Malang (Kota)',
        'CN': 'Cirebon'
    };
    return kota[kode] || kode;
}


// ROUTES (Synchronous karena pakai Array)

router.get('/', (req, res) => {
    res.render('index', { tiket: null, asal: '', tujuan: '', tanggal: '', getNamaKota });
});

router.get('/search', (req, res) => {
    const { asal, tujuan, tanggal } = req.query;
    // Filter jadwal yang ada di array hardcoded
    const hasilPencarian = db_jadwal.filter(item => item.asal === asal && item.tujuan === tujuan);
    res.render('index', { tiket: hasilPencarian, asal, tujuan, tanggal, getNamaKota });
});

router.get('/tutorial', (req, res) => {
    res.render('tutorial', {
        title: 'Cara Pesan Tiket',
        // Jika navbar butuh data user, sertakan juga di sini
    });
});

// A. PROSES ORDER (SIMPAN KE ARRAY)
// A. PROSES ORDER (SIMPAN KE ARRAY)
router.post('/order', (req, res) => {
    try {
        // TAMBAHAN: Ambil 'metodeBayar' dari req.body
        const { namaKereta, berangkat, harga, tanggal, metodeBayar } = req.body;
        
        const kodeBooking = 'BOOK-' + Math.floor(10000 + Math.random() * 90000);

        // Buat objek data baru
        const pesananBaru = {
            kode: kodeBooking,
            namaKereta: namaKereta,
            berangkat: berangkat,
            harga: harga,
            tanggal: tanggal,
            metodeBayar: metodeBayar, // Simpan metode bayar disini
            status: 'Menunggu Pembayaran'
        };

        pesananDB.push(pesananBaru);

        console.log("✅ Data tersimpan:", kodeBooking, "| Via:", metodeBayar);
        res.json({ status: 'success', kode: kodeBooking });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error' });
    }
});
// B. LIHAT RIWAYAT (BACA DARI ARRAY)
router.get('/cek-pesanan', (req, res) => {
    try {
        // Langsung ambil dari variabel array
        // Kita balik urutannya biar yang terbaru di atas (reverse)
        const allPesanan = [...pesananDB].reverse(); 

        res.render('ticket', { pesanan: allPesanan });
    } catch (error) {
        console.error(error);
        res.send("Error mengambil data");
    }
});

// C. BAYAR (UPDATE DI ARRAY)
router.post('/pay-order', (req, res) => {
    try {
        const { kode } = req.body;
        
        // Cari index data di array
        const index = pesananDB.findIndex(item => item.kode === kode);

        if (index !== -1) {
            // Update statusnya
            pesananDB[index].status = 'Lunas';
            res.json({ status: 'success' });
        } else {
            res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan' });
        }
    } catch (error) {
        res.json({ status: 'error' });
    }
});

// D. BATALKAN (HAPUS DARI ARRAY)
router.post('/cancel-order', (req, res) => {
    try {
        const { kode } = req.body;
        
        // Cek dulu apakah ada
        const adaData = pesananDB.some(item => item.kode === kode);

        if (adaData) {
            // Filter array untuk membuang data yang kodenya sama
            pesananDB = pesananDB.filter(item => item.kode !== kode);
            console.log("✅ Terhapus dari Memory:", kode);
            res.json({ status: 'success' });
        } else {
            res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

module.exports = router;