# Use Node.js 20 LTS as base
FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY backend/ .

# Copy shared folder (required for schemas)
# Put it inside /app so it can find node_modules/zod
COPY shared/ ./shared

# Jalankan generate dengan dummy DATABASE_URL (hanya untuk build client)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema=./prisma/schema.prisma

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
