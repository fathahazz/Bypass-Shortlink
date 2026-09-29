# Link Resolver & Bypass Web

Aplikasi web Next.js 14+ (App Router) minimalis untuk melakukan resolving / bypass link shortener dan ad-link ke URL tujuan asli secara aman, cepat, dan siap deploy ke Vercel.

## Fitur Utama

- **Adapter Architecture**: Resolver eksternal sebagai primary, dengan fallback native per provider.
- **SSRF Prevention**: Validasi ketat di server (hanya HTTPS, tolak IP address, localhost, dan private network).
- **Zero Logging Policy**: URL input pengguna tidak pernah dicatat atau disimpan di server.
- **Rate Limiting**: 10 request/menit per IP via Upstash Redis (dengan in-memory fallback otomatis jika Redis belum diset).
- **Health Metrics**: Status operasional provider (*operational*, *degraded*, *down*, *unknown*) dihitung dari 20 request terakhir.
- **Desain Minimalis & Human-Made**: Tanpa gradien berlebih, font Inter/system font, mobile-first, min touch target 44px, safe area insets, dan mode gelap sebagai default.

---

## Struktur Folder

```text
link-resolver/
├── app/
│   ├── api/
│   │   ├── bypass/
│   │   │   └── route.ts         # POST /api/bypass
│   │   └── providers/
│   │       └── route.ts         # GET /api/providers
│   ├── globals.css              # Tailwind + CSS Variables + Safe Area
│   ├── layout.tsx               # Root Layout + Anti-FOUC inline script
│   └── page.tsx                 # Halaman utama (Input, Hasil, Riwayat, Providers)
├── components/
│   ├── BypassForm.tsx           # Form input, loading, countdown rate limit
│   ├── Footer.tsx               # Info privasi & rate limit
│   ├── Header.tsx               # Judul & toggle tema gelap/terang
│   ├── HistoryList.tsx          # Riwayat 20 item (localStorage) format kartu
│   ├── ProviderList.tsx         # Daftar provider aktif & badge status
│   └── ResultCard.tsx           # Kartu hasil resolusi + Salin & Buka
├── lib/
│   ├── metrics.ts               # Pencatatan sukses/gagal 20 request terakhir
│   ├── providers.ts             # Konfigurasi terpusat daftar provider
│   ├── ratelimit.ts             # Upstash Redis + in-memory fallback
│   ├── security.ts              # Validasi URL, HTTPS & anti-SSRF
│   ├── types.ts                 # TypeScript types & error codes
│   └── resolvers/
│       ├── external.ts          # Adapter API eksternal (Primary)
│       ├── index.ts             # Orchestrator (Timeout 15s + max 1 retry)
│       ├── types.ts             # Interface adapter
│       └── native/              # Fallback resolvers
│           ├── index.ts         # Registry native adapter
│           ├── linkvertise.ts   # Linkvertise fallback
│           ├── lootlabs.ts      # LootLabs fallback
│           ├── sfl.ts           # SFL.gl fallback
│           ├── utils.ts         # Safe redirect & parameter extractor
│           ├── workink.ts       # Work.ink fallback
│           └── yourls.ts        # YOURLS / generic shortener fallback
├── .env.example
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Panduan Menjalankan

### 1. Setup Lokal

1. Salin repositori atau masuk ke direktori proyek:
   ```bash
   cd link-resolver
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env.local` dari `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di peramban.

---

### 2. Deploy ke Vercel

1. Push kode ke repositori Git (GitHub/GitLab/Bitbucket).
2. Di dashboard **Vercel**, buat project baru dari repositori tersebut.
3. Tambahkan Environment Variables di tab **Settings > Environment Variables**:
   - `BYPASS_API_URL` (Opsional jika ingin menggunakan primary API)
   - `BYPASS_API_KEY` (Opsional)
   - `UPSTASH_REDIS_REST_URL` (Opsional, untuk persistent rate limit & metrics)
   - `UPSTASH_REDIS_REST_TOKEN` (Opsional)
4. Klik **Deploy**.

---

### 3. Cara Menambah Provider Baru

Cukup buka satu file: **`lib/providers.ts`**, dan tambahkan entri baru ke array `SUPPORTED_PROVIDERS`:

```typescript
// lib/providers.ts
export const SUPPORTED_PROVIDERS: ProviderConfig[] = [
  // ... provider lama
  {
    id: "namaprovider",
    name: "Nama Provider",
    domains: ["domain-provider.com", "alt-domain.net"],
    example: "https://domain-provider.com/xyz",
    description: "Deskripsi singkat provider",
  },
];
```

Jika provider tersebut memerlukan logika fallback native khusus, buat file baru di `lib/resolvers/native/namaprovider.ts` yang mengimplementasikan `ResolverAdapter` dan daftarkan di `lib/resolvers/native/index.ts`.

---

### 4. Cara Mengganti API Eksternal

Semua komunikasi dengan API eksternal diisolasi di dalam file: **`lib/resolvers/external.ts`**.

Jika API eksternal yang Anda gunakan memiliki format request atau response yang berbeda (misalnya menggunakan header khusus atau field response `json.data.target`), Anda hanya perlu mengedit fungsi `resolveExternal`:

```typescript
// lib/resolvers/external.ts
const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey, // Sesuaikan format autentikasi Anda
  },
  body: JSON.stringify({ url: targetUrl }), // Sesuaikan payload request
});

const data = await response.json();
// Sesuaikan mapping properti hasil URL tujuan
const destination = data.targetUrl || data.destination || data.data?.result;
```
