
# Rencana: Migrasi PDF Generation ke Backend (Puppeteer)

## Ringkasan
Menghapus generate PDF di sisi client (jsPDF + html2canvas) dan memindahkan ke backend menggunakan Puppeteer. Membuat template HTML Berita Acara yang lebih rapi dan profesional.

## Perubahan yang Dilakukan

### 1. Backend - Tambah Route Generate PDF
Buat file baru `backend/routes/generatePdf.js` yang:
- Endpoint: `POST /api/psb-activations/:id/generate-pdf`
- Mengambil data activation dari database berdasarkan ID
- Juga menerima data tambahan dari request body (formData seperti ontSerial, signatures, dll) untuk override data yang mungkin belum tersimpan
- Render HTML template profesional menggunakan Puppeteer
- Return PDF sebagai response binary (`application/pdf`)

### 2. Backend - Template HTML Berita Acara (Rapi & Profesional)
Template yang akan di-render oleh Puppeteer:
- Font: Times New Roman (sesuai template saat ini)
- Layout A4 dengan margin yang tepat
- Logo TelNet Fiber di header
- Semua field terisi rapi: Layanan (checkbox), Jenis Layanan, Paket, Speed Test, Data Pelanggan, DATEK (tabel), Device (ONT, Router, STB), Disclaimer, Tanda Tangan
- Tidak ada field kosong/placeholder yang jelek - field kosong ditampilkan dengan garis bawah rapi
- Signature sebagai image base64

### 3. Backend - Install Puppeteer
Update `backend/package.json` untuk menambahkan dependency `puppeteer`.

### 4. Backend - Register Route di server.js
Tambahkan route baru di `backend/server.js`.

### 5. Frontend - Update TechnicianSignatureReport.tsx
- Hapus import `generateInstallationReportPDF` dari `psbActivationPdfGenerator`
- Ubah `handleGeneratePDF` untuk memanggil backend API `/api/psb-activations/:id/generate-pdf`
- Kirim formData (ontSerial, signatures, speed test, dll) sebagai request body
- Download response blob sebagai file PDF

### 6. Frontend - Update TechnicianReportsPage.tsx
- Hapus import `PDFService` dari `pdfService`
- Ubah `handleGeneratePDF` untuk memanggil backend API
- Kirim data activation ke backend untuk generate PDF

### 7. Hapus File Client-Side PDF
- Hapus `src/services/pdfService.ts` (726 baris - jsPDF + html2canvas)
- Hapus `src/utils/psbActivationPdfGenerator.ts` (578 baris - jsPDF + html2canvas)

### 8. Cleanup Dependencies
- Hapus `jspdf` dan `html2canvas` dari `package.json` frontend (mengurangi bundle size)
- Puppeteer sudah ada di package.json frontend tapi tidak dipakai di client, tetap di backend saja

## Detail Teknis

### Endpoint API Baru
```text
POST /api/psb-activations/:id/generate-pdf
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "formData": {
    "downloadSpeed": "50",
    "uploadSpeed": "25",
    "ping": "5",
    "serviceType": "pasang_baru",
    "packageSpeed": "50",
    "fastelNumber": "...",
    "contactPerson": "...",
    "ontType": "ZTE F660",
    "ontSerial": "ZTEG12345678",
    "routerType": "...",
    "routerSerial": "...",
    "stbId": "...",
    "area": "...",
    "odc": "...",
    "odp": "...",
    "port": "...",
    "dc": "...",
    "soc": "..."
  },
  "signatures": {
    "technician": "data:image/png;base64,...",
    "customer": "data:image/png;base64,..."
  }
}

Response: application/pdf (binary)
```

### Alur Kerja Setelah Perubahan
1. Teknisi isi semua form data (speed test, device, datek, dll)
2. Teknisi isi tanda tangan teknisi dan pelanggan
3. Teknisi simpan data (ke backend)
4. Teknisi klik "Generate Berita Acara PDF"
5. Frontend kirim request POST ke backend dengan formData + signatures
6. Backend ambil data activation dari database, merge dengan formData
7. Backend render HTML template dengan Puppeteer
8. Backend generate PDF dan kirim kembali ke frontend
9. Frontend download PDF otomatis

### File yang Diubah/Dibuat

| File | Aksi |
|------|------|
| `backend/routes/generatePdf.js` | BUAT BARU - route + template HTML + Puppeteer |
| `backend/server.js` | UPDATE - register route baru |
| `backend/package.json` | UPDATE - tambah puppeteer dependency |
| `src/pages/technician/TechnicianSignatureReport.tsx` | UPDATE - panggil backend API |
| `src/pages/technician/TechnicianReportsPage.tsx` | UPDATE - panggil backend API |
| `src/services/pdfService.ts` | HAPUS |
| `src/utils/psbActivationPdfGenerator.ts` | HAPUS |
| `src/components/technician/InstallationReportGenerator.tsx` | UPDATE - hapus client-side PDF, gunakan backend |
| `package.json` | UPDATE - hapus jspdf, html2canvas |

### Catatan Penting
- Puppeteer perlu diinstall di server backend (`npm install puppeteer` di folder backend)
- Untuk server production, mungkin perlu `puppeteer-core` + chromium yang sudah terinstall
- Template HTML akan di-render langsung di memory (tidak perlu file terpisah)
- Logo TelNet Fiber akan di-embed sebagai base64 di template agar tidak perlu load dari file
