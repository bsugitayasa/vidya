const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    // Generate nama file unik: timestamp-randomHex-originalname
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter jenis file (hanya gambar, PDF, dan Audio)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 
    'application/pdf',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya JPG, PNG, PDF, dan Audio (MP3/WAV) yang diperbolehkan.'), false);
  }
};

// Inisialisasi upload (maksimal 5MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB
  }
});

module.exports = upload;
