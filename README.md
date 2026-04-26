# FATEzou V1 — OTP Blast by Da1chi

## Struktur File

```
fatezou/
├── vercel.json          ← routing config Vercel
├── package.json         ← dependencies (node-fetch)
├── README.md            ← panduan ini
├── api/
│   ├── blast.js         ← serverless function: blast 50 API serentak
│   └── cooldown.js      ← cek sisa cooldown per nomor
└── public/
    └── index.html       ← UI frontend (loading + gate + main app)
```

## Cara Deploy ke Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login Vercel
```bash
vercel login
```

### 3. Upload project ke GitHub dulu (opsional tapi direkomendasikan)
```bash
git init
git add .
git commit -m "FATEzou V1"
git remote add origin https://github.com/USERNAME/fatezou.git
git push -u origin main
```

### 4. Deploy via GitHub (cara termudah)
- Buka https://vercel.com/new
- Import repo GitHub kamu
- Klik Deploy → selesai!

### ATAU deploy langsung via CLI:
```bash
cd fatezou
vercel --prod
```

## Cara Kerja

### Flow Blast:
```
User klik Deploy
    ↓
Frontend kirim POST /api/blast { nomor }
    ↓
Server (Vercel) cek cooldown
    ↓ (jika tidak cooldown)
Server blast 50 API SERENTAK dengan Promise.all()
    ↓
Server return hasil ke frontend
    ↓
Frontend tampilkan hasil di log
    ↓
Cooldown 2 menit WAJIB
    ↓
Interval 30s/60s (pilihan user)
    ↓
Blast round berikutnya
```

### Kenapa server-side?
- **Tidak ada CORS error** — request dari server ke server tidak ada CORS
- **Lebih cepat** — Vercel server punya koneksi internet cepat
- **Cooldown lebih aman** — tidak bisa di-bypass dari browser

## Catatan
- Cooldown 2 menit per nomor disimpan di memory per Vercel instance
- Untuk production scale bisa ganti dengan Vercel KV (Redis)
- Gunakan hanya untuk nomor sendiri / testing
