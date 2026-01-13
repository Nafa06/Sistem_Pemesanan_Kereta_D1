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
);

-- 4. Tabel Pendukung: PENUMPANG (HARUS dibuat sebelum TIKET)
CREATE TABLE penumpang (
    id_penumpang INT AUTO_INCREMENT PRIMARY KEY,
    no_id VARCHAR(50) NOT NULL UNIQUE, 
    tipe_id ENUM('KTP', 'SIM', 'PASPOR') NOT NULL,
    nama_penumpang VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE, 
    kontak VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT 'default_password'
);

-- 5. Tabel Master: JADWAL (Template Perjalanan)
CREATE TABLE jadwal (
    id_jadwal INT AUTO_INCREMENT PRIMARY KEY,
    id_kereta INT,
    id_stasiun_asal INT,
    id_stasiun_tujuan INT,
    jam_berangkat TIME NOT NULL,
    jam_tiba TIME NOT NULL,
    harga DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (id_kereta) REFERENCES kereta(id_kereta),
    FOREIGN KEY (id_stasiun_asal) REFERENCES stasiun(id_stasiun),
    FOREIGN KEY (id_stasiun_tujuan) REFERENCES stasiun(id_stasiun)
);

-- 6. Tabel Utama: TIKET (dengan kolom kursi)
CREATE TABLE tiket (
    id_tiket INT AUTO_INCREMENT PRIMARY KEY,
    kode_booking VARCHAR(20) UNIQUE,
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
    kursi_tersedia INT DEFAULT 0,
    status ENUM('Menunggu Pembayaran', 'Lunas', 'Batal') DEFAULT 'Menunggu Pembayaran'
);

-- 7. Tabel Pendukung: TRANSAKSI
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

-- Insert Stasiun
INSERT INTO stasiun (nama_stasiun, kota, kode_stasiun) VALUES 
('Gambir', 'Jakarta', 'GMR'),
('Tugu Yogyakarta', 'Yogyakarta', 'YK'),
('Bandung Hall', 'Bandung', 'BD'),
('Surabaya Gubeng', 'Surabaya', 'SGU');

-- Insert Kereta
INSERT INTO kereta (nama_kereta, tipe_kereta) VALUES 
('Argo Bromo Anggrek', 'Eksekutif'),
('Taksaka Malam', 'Eksekutif'),
('Gajayana', 'Eksekutif'),
('Progo', 'Ekonomi');

-- Insert Penumpang
INSERT INTO penumpang (no_id, tipe_id, nama_penumpang, email, kontak) VALUES 
('20240140220', 'KTP', 'Muhammad Naufal Anggardi', 'naufal@mhs.umy.ac.id', '08123456789'),
('20240140197', 'SIM', 'Farhan Arkabima', 'farhan@mhs.umy.ac.id', '08129876543');

-- Insert Jadwal
INSERT INTO jadwal (id_kereta, id_stasiun_asal, id_stasiun_tujuan, jam_berangkat, jam_tiba, harga) VALUES 
-- Dari Gambir (1) ke Yogyakarta (2)
(2, 1, 2, '08:00:00', '14:30:00', 450000),
(3, 1, 2, '15:20:00', '21:50:00', 480000),
(2, 1, 2, '21:00:00', '03:30:00', 450000),
(4, 1, 2, '22:30:00', '06:00:00', 180000),
-- Dari Gambir (1) ke Bandung (3)
(1, 1, 3, '06:00:00', '08:45:00', 150000),
(1, 1, 3, '10:30:00', '13:15:00', 150000),
(4, 1, 3, '15:00:00', '18:30:00', 100000),
(1, 1, 3, '19:00:00', '21:45:00', 150000),
-- Dari Gambir (1) ke Surabaya (4)
(1, 1, 4, '08:20:00', '16:30:00', 650000),
(3, 1, 4, '17:00:00', '05:30:00', 700000),
(1, 1, 4, '20:30:00', '04:45:00', 650000),
(4, 1, 4, '11:10:00', '21:00:00', 250000);

-- Insert Tiket berdasarkan Jadwal (Multiple hari dengan kursi tersedia)
-- TIKET 13-31 JANUARI 2026
-- Dari Bandung ke Surabaya (13-31 Jan)
INSERT INTO tiket (id_kereta, id_stasiun_asal, id_stasiun_tujuan, tanggal_keberangkatan, tanggal_tiba, harga, kursi_tersedia, status) VALUES 
-- 13 Jan
(1, 3, 4, '2026-01-13 08:20:00', '2026-01-13 16:30:00', 650000, 15, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-13 17:00:00', '2026-01-14 05:30:00', 700000, 12, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-13 20:30:00', '2026-01-14 04:45:00', 650000, 10, 'Menunggu Pembayaran'),
-- 14 Jan
(1, 3, 4, '2026-01-14 08:20:00', '2026-01-14 16:30:00', 650000, 8, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-14 17:00:00', '2026-01-15 05:30:00', 700000, 14, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-14 20:30:00', '2026-01-15 04:45:00', 650000, 6, 'Menunggu Pembayaran'),
-- 15 Jan
(1, 3, 4, '2026-01-15 08:20:00', '2026-01-15 16:30:00', 650000, 13, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-15 17:00:00', '2026-01-16 05:30:00', 700000, 11, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-15 20:30:00', '2026-01-16 04:45:00', 650000, 9, 'Menunggu Pembayaran'),
-- 16-20 Jan
(1, 3, 4, '2026-01-16 08:20:00', '2026-01-16 16:30:00', 650000, 15, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-16 17:00:00', '2026-01-17 05:30:00', 700000, 12, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-17 08:20:00', '2026-01-17 16:30:00', 650000, 10, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-17 17:00:00', '2026-01-18 05:30:00', 700000, 14, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-18 08:20:00', '2026-01-18 16:30:00', 650000, 8, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-18 17:00:00', '2026-01-19 05:30:00', 700000, 13, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-19 08:20:00', '2026-01-19 16:30:00', 650000, 11, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-19 17:00:00', '2026-01-20 05:30:00', 700000, 9, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-20 08:20:00', '2026-01-20 16:30:00', 650000, 16, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-20 17:00:00', '2026-01-21 05:30:00', 700000, 10, 'Menunggu Pembayaran'),

-- Dari Jakarta ke Surabaya (13-31 Jan)
(1, 1, 4, '2026-01-13 08:20:00', '2026-01-13 16:30:00', 650000, 13, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-13 17:00:00', '2026-01-14 05:30:00', 700000, 11, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-14 08:20:00', '2026-01-14 16:30:00', 650000, 9, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-14 17:00:00', '2026-01-15 05:30:00', 700000, 12, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-15 08:20:00', '2026-01-15 16:30:00', 650000, 14, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-15 17:00:00', '2026-01-16 05:30:00', 700000, 10, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-16 08:20:00', '2026-01-16 16:30:00', 650000, 15, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-16 17:00:00', '2026-01-17 05:30:00', 700000, 11, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-17 08:20:00', '2026-01-17 16:30:00', 650000, 13, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-17 17:00:00', '2026-01-18 05:30:00', 700000, 9, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-18 08:20:00', '2026-01-18 16:30:00', 650000, 16, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-18 17:00:00', '2026-01-19 05:30:00', 700000, 12, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-19 08:20:00', '2026-01-19 16:30:00', 650000, 8, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-19 17:00:00', '2026-01-20 05:30:00', 700000, 14, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-20 08:20:00', '2026-01-20 16:30:00', 650000, 10, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-20 17:00:00', '2026-01-21 05:30:00', 700000, 13, 'Menunggu Pembayaran'),

-- Dari Jakarta ke Yogyakarta (13-31 Jan)
(2, 1, 2, '2026-01-13 08:00:00', '2026-01-13 14:30:00', 450000, 15, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-13 15:20:00', '2026-01-13 21:50:00', 480000, 12, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-14 08:00:00', '2026-01-14 14:30:00', 450000, 10, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-14 15:20:00', '2026-01-14 21:50:00', 480000, 14, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-15 08:00:00', '2026-01-15 14:30:00', 450000, 13, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-15 15:20:00', '2026-01-15 21:50:00', 480000, 11, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-16 08:00:00', '2026-01-16 14:30:00', 450000, 16, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-16 15:20:00', '2026-01-16 21:50:00', 480000, 9, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-17 08:00:00', '2026-01-17 14:30:00', 450000, 12, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-17 15:20:00', '2026-01-17 21:50:00', 480000, 10, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-18 08:00:00', '2026-01-18 14:30:00', 450000, 15, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-18 15:20:00', '2026-01-18 21:50:00', 480000, 13, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-19 08:00:00', '2026-01-19 14:30:00', 450000, 11, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-19 15:20:00', '2026-01-19 21:50:00', 480000, 14, 'Menunggu Pembayaran'),
(2, 1, 2, '2026-01-20 08:00:00', '2026-01-20 14:30:00', 450000, 8, 'Menunggu Pembayaran'),
(3, 1, 2, '2026-01-20 15:20:00', '2026-01-20 21:50:00', 480000, 16, 'Menunggu Pembayaran'),

-- Dari Jakarta ke Bandung (13-31 Jan)
(1, 1, 3, '2026-01-13 06:00:00', '2026-01-13 08:45:00', 150000, 18, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-13 10:30:00', '2026-01-13 13:15:00', 150000, 12, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-13 15:00:00', '2026-01-13 18:30:00', 100000, 25, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-14 06:00:00', '2026-01-14 08:45:00', 150000, 14, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-14 10:30:00', '2026-01-14 13:15:00', 150000, 16, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-14 15:00:00', '2026-01-14 18:30:00', 100000, 22, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-15 06:00:00', '2026-01-15 08:45:00', 150000, 19, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-15 10:30:00', '2026-01-15 13:15:00', 150000, 13, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-15 15:00:00', '2026-01-15 18:30:00', 100000, 24, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-16 06:00:00', '2026-01-16 08:45:00', 150000, 15, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-16 10:30:00', '2026-01-16 13:15:00', 150000, 17, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-16 15:00:00', '2026-01-16 18:30:00', 100000, 21, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-17 06:00:00', '2026-01-17 08:45:00', 150000, 12, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-17 10:30:00', '2026-01-17 13:15:00', 150000, 18, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-17 15:00:00', '2026-01-17 18:30:00', 100000, 23, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-18 06:00:00', '2026-01-18 08:45:00', 150000, 16, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-18 10:30:00', '2026-01-18 13:15:00', 150000, 14, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-18 15:00:00', '2026-01-18 18:30:00', 100000, 20, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-19 06:00:00', '2026-01-19 08:45:00', 150000, 11, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-19 10:30:00', '2026-01-19 13:15:00', 150000, 19, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-19 15:00:00', '2026-01-19 18:30:00', 100000, 25, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-20 06:00:00', '2026-01-20 08:45:00', 150000, 17, 'Menunggu Pembayaran'),
(1, 1, 3, '2026-01-20 10:30:00', '2026-01-20 13:15:00', 150000, 13, 'Menunggu Pembayaran'),
(4, 1, 3, '2026-01-20 15:00:00', '2026-01-20 18:30:00', 100000, 22, 'Menunggu Pembayaran'),

-- 21-31 Jan (tambahan untuk bulan lengkap)
(1, 3, 4, '2026-01-21 08:20:00', '2026-01-21 16:30:00', 650000, 14, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-21 17:00:00', '2026-01-22 05:30:00', 700000, 12, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-22 08:20:00', '2026-01-22 16:30:00', 650000, 11, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-22 17:00:00', '2026-01-23 05:30:00', 700000, 15, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-23 08:20:00', '2026-01-23 16:30:00', 650000, 9, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-23 17:00:00', '2026-01-24 05:30:00', 700000, 13, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-24 08:20:00', '2026-01-24 16:30:00', 650000, 16, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-24 17:00:00', '2026-01-25 05:30:00', 700000, 10, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-25 08:20:00', '2026-01-25 16:30:00', 650000, 12, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-25 17:00:00', '2026-01-26 05:30:00', 700000, 14, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-26 08:20:00', '2026-01-26 16:30:00', 650000, 8, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-26 17:00:00', '2026-01-27 05:30:00', 700000, 11, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-27 08:20:00', '2026-01-27 16:30:00', 650000, 15, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-27 17:00:00', '2026-01-28 05:30:00', 700000, 13, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-28 08:20:00', '2026-01-28 16:30:00', 650000, 10, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-28 17:00:00', '2026-01-29 05:30:00', 700000, 12, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-29 08:20:00', '2026-01-29 16:30:00', 650000, 14, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-29 17:00:00', '2026-01-30 05:30:00', 700000, 9, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-30 08:20:00', '2026-01-30 16:30:00', 650000, 16, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-30 17:00:00', '2026-01-31 05:30:00', 700000, 11, 'Menunggu Pembayaran'),
(1, 3, 4, '2026-01-31 08:20:00', '2026-01-31 16:30:00', 650000, 13, 'Menunggu Pembayaran'),
(3, 3, 4, '2026-01-31 17:00:00', '2026-02-01 05:30:00', 700000, 15, 'Menunggu Pembayaran'),

-- Dari Yogyakarta ke Jakarta (13-31 Jan) - Rute Balik
(2, 2, 1, '2026-01-13 08:00:00', '2026-01-13 14:30:00', 450000, 15, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-13 15:20:00', '2026-01-13 21:50:00', 480000, 12, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-13 21:00:00', '2026-01-14 03:30:00', 450000, 10, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-14 08:00:00', '2026-01-14 14:30:00', 450000, 14, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-14 15:20:00', '2026-01-14 21:50:00', 480000, 11, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-14 21:00:00', '2026-01-15 03:30:00', 450000, 13, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-15 08:00:00', '2026-01-15 14:30:00', 450000, 16, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-15 15:20:00', '2026-01-15 21:50:00', 480000, 9, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-15 21:00:00', '2026-01-16 03:30:00', 450000, 12, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-16 08:00:00', '2026-01-16 14:30:00', 450000, 15, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-16 15:20:00', '2026-01-16 21:50:00', 480000, 13, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-16 21:00:00', '2026-01-17 03:30:00', 450000, 11, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-17 08:00:00', '2026-01-17 14:30:00', 450000, 14, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-17 15:20:00', '2026-01-17 21:50:00', 480000, 10, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-17 21:00:00', '2026-01-18 03:30:00', 450000, 16, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-18 08:00:00', '2026-01-18 14:30:00', 450000, 12, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-18 15:20:00', '2026-01-18 21:50:00', 480000, 14, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-18 21:00:00', '2026-01-19 03:30:00', 450000, 8, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-19 08:00:00', '2026-01-19 14:30:00', 450000, 13, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-19 15:20:00', '2026-01-19 21:50:00', 480000, 11, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-19 21:00:00', '2026-01-20 03:30:00', 450000, 15, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-20 08:00:00', '2026-01-20 14:30:00', 450000, 10, 'Menunggu Pembayaran'),
(3, 2, 1, '2026-01-20 15:20:00', '2026-01-20 21:50:00', 480000, 16, 'Menunggu Pembayaran'),
(2, 2, 1, '2026-01-20 21:00:00', '2026-01-21 03:30:00', 450000, 9, 'Menunggu Pembayaran'),

-- Jakarta ke Surabaya (21-31 Jan)
(1, 1, 4, '2026-01-21 08:20:00', '2026-01-21 16:30:00', 650000, 12, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-21 17:00:00', '2026-01-22 05:30:00', 700000, 14, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-22 08:20:00', '2026-01-22 16:30:00', 650000, 11, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-22 17:00:00', '2026-01-23 05:30:00', 700000, 15, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-23 08:20:00', '2026-01-23 16:30:00', 650000, 9, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-23 17:00:00', '2026-01-24 05:30:00', 700000, 13, 'Menunggu Pembayaran'),
(1, 1, 4, '2026-01-24 08:20:00', '2026-01-24 16:30:00', 650000, 16, 'Menunggu Pembayaran'),
(3, 1, 4, '2026-01-24 17:00:00', '2026-01-25 05:30:00', 700000, 10, 'Menunggu Pembayaran');

-- Insert Transaksi (hanya untuk beberapa tiket dummy yang sudah dibayar)
INSERT INTO transaksi (id_tiket, metode_bayar, total_bayar) VALUES 
(1, 'Transfer Bank', 450000),
(9, 'E-Wallet', 150000);

-- Insert Test Account: pelanggan@gmail.com with password 12345678 (plain text for testing)
INSERT INTO penumpang (no_id, tipe_id, nama_penumpang, email, kontak, password) VALUES 
('12345678', 'KTP', 'Pelanggan Test', 'pelanggan@gmail.com', '081234567890', '12345678');