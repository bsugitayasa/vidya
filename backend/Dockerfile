# Use Node.js 20 LTS as base
FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy source code backend
COPY backend/ ./backend/

# Copy shared folder
COPY shared/ ./shared/

# Pindah ke folder backend untuk menjalankan aplikasi
WORKDIR /app/backend

# Jalankan generate dengan dummy DATABASE_URL
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema=./prisma/schema.prisma

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
