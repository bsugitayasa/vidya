# Use Node.js 20 LTS as base
FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install root dependencies (termasuk zod untuk shared schemas)
COPY package*.json ./
RUN npm install

# 2. Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# 3. Copy source code
COPY backend/ ./backend/
COPY shared/ ./shared/

# 4. Setup Prisma & Start
WORKDIR /app/backend
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000
CMD ["node", "server.js"]
