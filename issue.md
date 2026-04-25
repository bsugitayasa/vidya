# 📋 Planning: Sistem Akademis Yayasan Hindu

> **Project**: Sistem Informasi Akademik Yayasan Hindu  
> **Target Deploy**: VPS (Self-hosted)  
> **Pendekatan**: Monorepo, REST API, Iteratif per Release  
> **Dokumen ini** dirancang untuk diimplementasikan oleh junior programmer atau AI model.

---

## 🗂️ Struktur Dokumen

1. [Tech Stack & Arsitektur](#tech-stack)
2. [Planning Frontend](#planning-frontend)
3. [Planning UI/UX & Flow](#planning-uiux)
4. [Planning Backend](#planning-backend)
5. [Release 1 — Registrasi & Dashboard](#release-1)
6. [Release 2 — Absensi Per Mata Kuliah](#release-2)
7. [Struktur GitHub Issues](#github-issues)
8. [Struktur Folder Proyek](#struktur-folder)
9. [Deployment VPS](#deployment)

---

## 1. Tech Stack & Arsitektur {#tech-stack}

### Frontend
| Komponen | Pilihan | Alasan |
|---|---|---|
| Framework | **React + Vite** | Ringan, cepat build, ekosistem luas |
| UI Library | **Tailwind CSS + shadcn/ui** | Komponen siap pakai, mudah dikustomisasi |
| Routing | **React Router v6** | Standar SPA routing |
| State/Data | **TanStack Query (React Query)** | Manajemen server-state & caching |
| Charts | **Recharts** | Ringan, mudah dipakai junior dev |
| Export Excel | **SheetJS (xlsx)** | Client-side export tanpa backend |
| Form | **React Hook Form + Zod** | Validasi form kuat dan ringan |
| File Upload UI | **react-dropzone** | Drag & drop upload, preview file |
| HTTP Client | **Axios** | Mudah dikonfigurasi interceptor |

### Backend
| Komponen | Pilihan | Alasan |
|---|---|---|
| Runtime | **Node.js** | Ekosistem besar, familiar |
| Framework | **Express.js** | Sederhana, cocok untuk junior dev |
| Database | **PostgreSQL** | Relasional, stabil untuk data akademis |
| ORM | **Prisma** | Schema-first, auto-generate type |
| Auth | **JWT + bcrypt** | Stateless, cukup untuk admin panel |
| Validasi | **Zod** | Shared schema bisa dipakai FE & BE |
| File Upload | **Multer** | Middleware upload file ke disk VPS |
| File/Export | **exceljs** | Generate Excel di server jika diperlukan |

### DevOps / Infrastruktur
| Komponen | Pilihan |
|---|---|
| VPS OS | Ubuntu 22.04 LTS |
| Reverse Proxy | Nginx |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Certbot) |
| Version Control | GitHub (monorepo) |
| CI/CD (opsional) | GitHub Actions |
| Container (opsional) | Docker Compose |

### Struktur Monorepo
```
/
├── frontend/          ← React + Vite app
├── backend/           ← Express.js API
├── shared/            ← Shared types/schema (Zod)
├── docs/              ← Dokumentasi & planning
└── docker-compose.yml
```

---