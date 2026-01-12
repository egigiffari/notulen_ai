# Notulen AI

Aplikasi web berbasis AI untuk merekam rapat dan menghasilkan notulen otomatis.

## Tech Stack
- **Frontend**: Nuxt 4 (Vue 3 + Nitro)
- **Backend**: Fastify (Node.js)
- **Database**: SQLite (Prisma ORM)
- **AI**: OpenAI Whisper + GPT-4o-mini
- **Process Manager**: PM2

## Project Structure (Monorepo Workspaces)

Project ini menggunakan NPM Workspaces dengan output build tersentralisasi:

```
/ (root)
├── app/              # Source Frontend (Nuxt)
├── server/           # Source Backend (Fastify)
├── dist/             # Centralized Build Output
│   ├── backend/      # Hasil build TSC
│   └── frontend/     # Hasil build Nitro
├── ecosystem.config.js # Konfigurasi PM2
└── package.json      # Root scripts
```

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Setup env vars
cp .env.example .env

# 3. Setup database
npm run db:generate
npm run db:push

# 4. Run development (both FE & BE)
npm run dev
```

## Production Deployment

### 1. Prerequisites (Server)
- Node.js LTS (v20+)
- PM2 (`npm install -g pm2`)
- Nginx (Reverse Proxy)
- FFmpeg (Required for audio processing)

### 2. Build for Production

Project ini memiliki pipeline build terpusat. Jalankan command berikut dari root:

```bash
# Build Backend & Frontend
npm run build
```

Ini akan menjalankan:
1.  `tsc` untuk Backend -> Output ke `dist/backend`
2.  `nuxt build` untuk Frontend -> Output ke `dist/frontend`

### 3. Setup Database Production

```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 4. Running with PM2

Gunakan konfigurasi `ecosystem.config.js` yang sudah disediakan:

```bash
# Start services
pm2 start ecosystem.config.js

# Save configuration for restart
pm2 save
pm2 startup
```

Service yang berjalan:
- `notulen-backend`: Port 3001
- `notulen-frontend`: Port 3000

### 5. Nginx Configuration (Example)

```nginx
# Backend API (api.example.com)
server {
    server_name api.example.com;
    client_max_body_size 50M; # Penting untuk upload audio
    location / {
        proxy_pass http://localhost:3001;
        proxy_buffering off; # Penting untuk SSE
    }
}

# Frontend (example.com)
server {
    server_name example.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## Documentation
Lihat [docs/](./docs) untuk dokumentasi teknis mendalam.
