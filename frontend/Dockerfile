# Stage 1: Build
FROM node:20-slim AS build
ARG VITE_API_URL
WORKDIR /app

# Copy package files frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source code frontend
COPY frontend/ ./frontend/

# Copy shared folder
COPY shared/ ./shared/

WORKDIR /app/frontend
RUN echo "VITE_API_URL=$VITE_API_URL" > .env
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Add custom nginx config for SPA routing and aggressive caching
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
