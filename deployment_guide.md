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

### Install Node.js (Versi 20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## 2. Setup Database (PostgreSQL)

### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### Konfigurasi Database
1. Masuk ke prompt postgres: `sudo -i -u postgres psql`
2. Buat database: `CREATE DATABASE vidya_db;`
3. Buat user: `CREATE USER vidya_user WITH PASSWORD 'password_anda_disini';`
4. Beri akses: `GRANT ALL PRIVILEGES ON DATABASE vidya_db TO vidya_user;`
5. Berikan hak akses skema (untuk Prisma): 
   ```sql
   \c vidya_db
   GRANT ALL ON SCHEMA public TO vidya_user;
   ```
6. Keluar: `\q`

---

## 3. Persiapan Folder & Repo

### Clone Repositori
Masuk ke folder `/var/www` dan clone project:
```bash
cd /var/www
git clone https://github.com/bsugitayasa/vidya.git
cd vidya
```

### Setup Folder Upload
Pastikan folder upload tersedia dan bisa ditulis oleh sistem:
```bash
mkdir -p backend/uploads
chmod -R 775 backend/uploads
```

---

## 4. Setup Backend

### Install Dependensi & Konfigurasi
```bash
cd /var/www/vidya/backend
npm install
```

### Buat File `.env`
Gunakan `nano .env` dan isi dengan konfigurasi berikut:
```env
PORT=5000
DATABASE_URL="postgresql://vidya_user:password_anda_disini@localhost:5432/vidya_db?schema=public"
JWT_SECRET="buat_secret_random_panjang"
NODE_ENV=production
```

### Jalankan Prisma (Migrasi Database)
```bash
npx prisma generate
npx prisma migrate deploy
```

### Jalankan Backend dengan PM2
```bash
pm2 start server.js --name "vidya-backend"
pm2 save
```

---

## 5. Setup Frontend

### Build Production
```bash
cd /var/www/vidya/frontend
npm install
```

### Buat File `.env` Frontend
Sesuaikan URL API dengan domain/IP server Anda:
```bash
nano .env
```
Isi dengan:
```env
VITE_API_URL="https://domain-anda.com/api"
```

### Build Aplikasi
```bash
npm run build
```
Hasil build akan berada di folder `/var/www/vidya/frontend/dist`.

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

    # Frontend (Static Files)
    location / {
        root /var/www/vidya/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy ke Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proteksi Akses Langsung Uploads
    location /uploads {
        alias /var/www/vidya/backend/uploads;
        # Hanya bisa diakses lewat aplikasi (opsional)
        # allow 127.0.0.1;
        # deny all;
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

1. **Cek Log Backend**: `pm2 logs vidya-backend`
2. **Restart App**: `pm2 restart vidya-backend`
3. **Update Code Baru**:
   ```bash
   git pull origin main
   # Di backend: npm install && npx prisma generate && pm2 restart vidya-backend
   # Di frontend: npm install && npm run build
   ```
4. **Status Nginx**: `sudo systemctl status nginx`

---
