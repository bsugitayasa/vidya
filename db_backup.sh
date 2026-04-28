#!/bin/bash

# Konfigurasi
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_vidya_$TIMESTAMP.sql"
CONTAINER_NAME="vidya_db"
DB_USER="vidya_admin"
DB_NAME="vidya_db"

# Buat folder backup jika belum ada
mkdir -p $BACKUP_DIR

echo "🚀 Memulai backup database $DB_NAME..."

# Jalankan pg_dump di dalam container dan simpan ke file di host
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Cek apakah berhasil
if [ $? -eq 0 ]; then
  echo "✅ Backup berhasil disimpan di: $BACKUP_FILE"
  
  # Opsional: Hapus backup yang lebih lama dari 7 hari untuk hemat ruang
  find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete
  echo "清理: Backup lama (7 hari+) telah dibersihkan."
else
  echo "❌ Terjadi kesalahan saat melakukan backup!"
  exit 1
fi
