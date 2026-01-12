-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS db_tiket_kereta;
USE db_tiket_kereta;

-- 2. Tabel Master: STASIUN
CREATE TABLE stasiun (
    id_stasiun INT AUTO_INCREMENT PRIMARY KEY,
    nama_stasiun VARCHAR(100) NOT NULL,
    kota VARCHAR(50) NOT NULL,
    kode_stasiun VARCHAR(10) UNIQUE
);

-- 3. Tabel Master: KERETA
CREATE TABLE kereta (
    id_kereta INT AUTO_INCREMENT PRIMARY KEY,
    nama_kereta VARCHAR(100) NOT NULL,
    tipe_kereta ENUM('Ekonomi', 'Eksekutif') NOT NULL
    -- KOMA SUDAH DIHAPUS DISINI, AMAN.
);

-- 4. Tabel Pendukung: PENUMPANG
CREATE TABLE penumpang (
    id_penumpang INT AUTO_INCREMENT PRIMARY KEY,
    no_id VARCHAR(50) NOT NULL UNIQUE, 
    tipe_id ENUM('KTP', 'SIM', 'PASPOR') NOT NULL,
    nama_penumpang VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE, 
    kontak VARCHAR(20) NOT NULL
);

-- 5. Tabel Utama: TIKET
CREATE TABLE tiket (
    id_tiket INT AUTO_INCREMENT PRIMARY KEY,
    kode_booking VARCHAR(20) UNIQUE NOT NULL,
    id_penumpang INT,
    FOREIGN KEY (id_penumpang) REFERENCES penumpang(id_penumpang) ON DELETE CASCADE,
    id_kereta INT,
    FOREIGN KEY (id_kereta) REFERENCES kereta(id_kereta),
    id_stasiun_asal INT,
    FOREIGN KEY (id_stasiun_asal) REFERENCES stasiun(id_stasiun),
    id_stasiun_tujuan INT,
    FOREIGN KEY (id_stasiun_tujuan) REFERENCES stasiun(id_stasiun),
    tanggal_keberangkatan DATETIME NOT NULL,
    tanggal_tiba DATETIME NOT NULL,
    harga DECIMAL(12, 2) NOT NULL,
    status ENUM('Menunggu Pembayaran', 'Lunas', 'Batal') DEFAULT 'Menunggu Pembayaran'
);

-- 6. Tabel Pendukung: TRANSAKSI
CREATE TABLE transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    id_tiket INT,
    tanggal_transaksi DATETIME DEFAULT CURRENT_TIMESTAMP,
    metode_bayar ENUM('Transfer Bank', 'E-Wallet', 'QRIS') NOT NULL,
    total_bayar DECIMAL(12, 2),
    FOREIGN KEY (id_tiket) REFERENCES tiket(id_tiket) ON DELETE CASCADE
);

-- =============================================
-- DATA DUMMY (SEEDING)
-- =============================================

INSERT INTO stasiun (nama_stasiun, kota, kode_stasiun) VALUES 
('Gambir', 'Jakarta', 'GMR'),
('Tugu Yogyakarta', 'Yogyakarta', 'YK'),
('Bandung Hall', 'Bandung', 'BD'),
('Surabaya Gubeng', 'Surabaya', 'SGU');

INSERT INTO kereta (nama_kereta, tipe_kereta) VALUES 
('Argo Bromo Anggrek', 'Eksekutif'),
('Taksaka Malam', 'Eksekutif'),
('Gajayana', 'Eksekutif'),
('Progo', 'Ekonomi');

INSERT INTO penumpang (no_id, tipe_id, nama_penumpang, email, kontak) VALUES 
('20240140220', 'KTP', 'Muhammad Naufal Anggardi', 'naufal@mhs.umy.ac.id', '08123456789'),
('20240140197', 'SIM', 'Farhan Arkabima', 'farhan@mhs.umy.ac.id', '08129876543');

INSERT INTO tiket (kode_booking, id_penumpang, id_kereta, id_stasiun_asal, id_stasiun_tujuan, tanggal_keberangkatan, tanggal_tiba, harga, status) VALUES 
('TKT-JAN-001', 1, 1, 1, 2, '2026-01-20 08:00:00', '2026-01-20 15:00:00', 450000, 'Lunas'),
('TKT-JAN-002', 2, 2, 2, 1, '2026-01-25 19:00:00', '2026-01-26 03:00:00', 380000, 'Menunggu Pembayaran');

INSERT INTO transaksi (id_tiket, metode_bayar, total_bayar) VALUES 
(1, 'Transfer Bank', 450000);