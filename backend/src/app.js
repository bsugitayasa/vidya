const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public static files (if any)
// app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Disabled for protection

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

const authRoutes = require('./routes/auth.routes');
const sisyaRoutes = require('./routes/sisya.routes');
const programAjahanRoutes = require('./routes/programAjahan.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const laporanRoutes = require('./routes/laporan.routes');
const konfigurasiRoutes = require('./routes/konfigurasi.routes');
const pembayaranRoutes = require('./routes/pembayaran.routes');
const telegramRoutes = require('./routes/telegram.routes');

app.use('/api/auth', authRoutes);
app.use('/api/sisya', sisyaRoutes);
app.use('/api/program-ajahan', programAjahanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/konfigurasi', konfigurasiRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/telegram', telegramRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Terjadi kesalahan pada server'
  });
});

module.exports = app;
