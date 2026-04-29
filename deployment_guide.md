# 🚀 Panduan Deployment Project VIDYA di VPS

Panduan ini ditujukan untuk melakukan deployment aplikasi **VIDYA** (React Frontend & Node.js/Express Backend) ke server VPS kosongan (Ubuntu 22.04 LTS).

---

## 1. Persiapan Server (Awal)

Setelah login ke VPS melalui SSH (`ssh root@ip_server`), lakukan langkah-langkah berikut:

### Update Sistem & Install Library Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx
```

### Install Docker & Docker Compose
Ikuti langkah resmi untuk install Docker di Ubuntu:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Tambahkan user ke group docker (opsional agar tidak perlu sudo)
sudo usermod -aG docker $USER
# Logout dan login kembali agar perubahan group berlaku
```

---

## 2. Konfigurasi Environment & Keamanan

Sebelum menjalankan Docker, kita perlu menyiapkan variabel lingkungan agar database dan aplikasi bisa berkomunikasi.

### Buat File `.env` Utama (di Root Folder)
File ini akan digunakan oleh `docker-compose.yml`.
```env
# Database
DB_USER=vidya_admin
DB_PASSWORD=buat_password_kuat_disini
DB_NAME=vidya_db

# Backend
JWT_SECRET=buat_secret_random_panjang_sekali
VITE_API_URL=https://domain-anda.com/api

# Telegram (Optional but Recommended)
TELEGRAM_BOT_TOKEN=8798540841:AAHCWvA7M6S0GEDghEPX2M9xTlFuXafX6d8
TELEGRAM_CHANNEL_ID=@pdpnVidyaAdmin
TELEGRAM_WEBHOOK_SECRET=vidya_secret_token_2026
TELEGRAM_ALLOWED_CHAT_IDS=195257231
```

---

## 3. Persiapan Folder & Repo

### Clone Repositori
Masuk ke folder `/var/www` dan clone project:
```bash
cd /var/www
git clone https://github.com/bsugitayasa/vidya.git
cd vidya
```

### Setup Folder Upload & Data
Pastikan folder upload dan volume database memiliki izin yang benar:
```bash
mkdir -p backend/uploads
chmod -R 775 backend/uploads
```

---

## 4. Menjalankan Aplikasi dengan Docker

Dengan Docker, kita tidak perlu menginstall Node.js atau PostgreSQL secara manual di VPS. Semuanya sudah terbungkus dalam `docker-compose.yml`.

### Jalankan Semua Layanan
```bash
# Build dan jalankan di background
docker compose up -d --build
```

Langkah ini akan:
1. Menjalankan container database PostgreSQL.
2. Membangun image backend & menjalankan migrasi database.
3. Membangun image frontend (React) dan menyajikannya via Nginx internal Docker.

### Cek Status Container
Pastikan semua container dalam status `Up`:
```bash
docker compose ps
```

---

## 5. Inisialisasi Database (Pertama Kali)

Setelah container backend berjalan, kita perlu menjalankan migrasi Prisma di dalam container:
```bash
docker compose exec backend npx prisma migrate deploy
```

---

## 6. Konfigurasi Web Server (Nginx)

### Buat Konfigurasi Situs
```bash
sudo nano /etc/nginx/sites-available/vidya
```

### Isi Konfigurasi Nginx
```nginx
server {
    listen 80;
    server_name domain-anda.com; # Ganti dengan domain atau IP

    # Frontend (Proxy ke Container Frontend)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Proxy ke Backend (Container Backend)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 15M; # Perbesar batas upload (default 1MB terlalu kecil)
    }

    # ⛔ BLOKIR akses langsung ke folder uploads
    # File dokumen sisya (KTP, foto, bukti bayar) adalah data pribadi.
    # Akses hanya boleh melalui endpoint API terproteksi JWT:
    # GET /api/sisya/files/:filename [AUTH]
    location /uploads/ {
        deny all;
        return 403;
    }
}
```

### Aktifkan Konfigurasi
```bash
sudo ln -s /etc/nginx/sites-available/vidya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Keamanan & SSL (HTTPS)

Gunakan Certbot untuk mendapatkan SSL gratis dari Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com
```

---

## 8. Tips Maintenance untuk Junior Dev

1. **Cek Log**: `docker compose logs -f` (atau `docker compose logs backend`)
2. **Restart Layanan**: `docker compose restart`
3. **Update Code Baru**:
   ```bash
   git pull origin main
   # Build ulang agar perubahan kode masuk ke image baru
   docker compose up -d --build
   # Jalankan migrasi jika ada perubahan schema DB
   docker compose exec backend npx prisma migrate deploy
   ```
4. **Status Nginx**: `sudo systemctl status nginx`
5. **Bersihkan Image Lama**: `docker system prune -f` (untuk hemat disk space)

---
