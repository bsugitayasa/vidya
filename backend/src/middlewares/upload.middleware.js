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

// Filter jenis file (gambar, PDF, Audio, dan Video)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 
    'application/pdf',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.webm', '.avi'];
  const extension = path.extname(file.originalname || '').toLowerCase();
  const genericMimeWithValidExtension = ['application/octet-stream', 'binary/octet-stream', ''].includes(file.mimetype) && allowedExtensions.includes(extension);
  if (allowedMimeTypes.includes(file.mimetype) || genericMimeWithValidExtension) {
    cb(null, true);
  } else {
    const error = new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, PDF, Audio (MP3/WAV), atau Video (MP4/MOV/WebM).');
    error.code = 'UNSUPPORTED_FILE_TYPE';
    cb(error, false);
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
