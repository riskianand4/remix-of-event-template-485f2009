
# Upgrade Dashboard PSB & Gangguan - Modern Minimalist

## Tujuan
Redesign total kedua dashboard menjadi tampilan yang lebih modern, minimalis, dan profesional — dengan layout yang lebih clean, statistik yang lebih visual, dan chart yang lebih menarik.

## Perubahan yang Dilakukan

### 1. PSB Dashboard (`src/pages/psb/PSBDashboard.tsx`) — Redesign Total

**Layout Baru:**
- Hero stats section: 4 kartu stat utama dengan ikon besar, warna gradient yang bold, angka besar dan bold, dan progress indicator / persentase completion rate
- Kartu kedua baris: "Completion Rate" ring visual + Summary cepat cluster terbanyak + STO terbanyak (tanpa tabs, semua langsung terlihat)
- Chart section yang lebih clean:
  - Bar chart horizontal untuk Cluster Stats (lebih mudah dibaca label panjang)
  - Area chart untuk Trend Bulanan — lebih elegan
- Statistik Cluster: list card yang lebih sleek dengan progress bar horizontal per cluster
- Tombol Refresh dengan loading spinner yang proper
- Header section: gradient text, subtitle, dan last updated timestamp

**Visual Improvements:**
- Setiap stat card punya accent color bar di sisi kiri (border-l-4)
- Icon di background card sebagai watermark (opacity rendah, ukuran besar)
- Hover effects yang subtle tapi terasa
- Chart tooltip yang custom dan rapi
- Empty state yang lebih bagus
- Skeleton loading yang matching dengan layout baru

### 2. Interruption Dashboard (`src/pages/interruption/InterruptionDashboard.tsx`) — Redesign Total

**Layout Baru:**
- 5 stat cards di baris atas dengan layout yang lebih compact dan elegant:
  - Total Tiket (dengan icon Activity, border kiri biru)
  - Tiket Open (merah, dengan indicator "urgent")
  - Tiket Resolved (hijau)
  - Avg Handling Time (biru, dalam jam)
  - Performance Rate (ungu, dengan mini ring/progress)
- Chart section lebih clean:
  - Tab tetap dipertahankan tapi UI tabs-nya lebih modern (pill style)
  - Line chart trend bulanan yang lebih smooth dan colorful
  - Bar chart jenis gangguan yang lebih rapi dengan rounded bars
  - Technician performance dengan progress bar dan ranking badge
- Period selector: pindah ke dalam header section yang lebih compact
- Date range picker dengan UI yang lebih inline

**Visual Improvements:**
- Gradient subtle di setiap stat card
- Animated number counter effect (menggunakan existing framer-motion)
- Dot indicators untuk status
- Performance badge color coding yang lebih jelas (hijau/kuning/merah)

### 3. Komponen Baru: Stat Card Reusable

Buat komponen internal `StatCard` yang dipakai di kedua dashboard:
- Props: title, value, subtitle, icon, color, trend (opsional)
- Desain: border kiri berwarna, icon watermark di background, hover shadow

### Detail Visual Design

**Color Palette per Metrik:**
- Total/Neutral: biru (#3b82f6)
- Completed/Resolved: hijau (#22c55e)
- In Progress/Open: oranye (#f59e0b)
- Pending: abu (#94a3b8)
- Performance: ungu (#8b5cf6)

**Chart Improvements:**
- CartesianGrid stroke yang lebih subtle (opacity 30%)
- Custom Tooltip dengan background card yang proper
- Bar radius (rounded top) untuk Bar charts
- Dot size yang lebih besar pada Line charts
- Legend yang lebih clean di bagian bawah

**Typography:**
- Angka stat: text-3xl font-bold (lebih besar dari sekarang)
- Label: text-xs text-muted-foreground uppercase tracking-wide
- Header: font-semibold, bukan font-bold yang terlalu tebal

### File yang Diubah

| File | Aksi |
|------|------|
| `src/pages/psb/PSBDashboard.tsx` | Redesign total — layout, stat cards, charts, list cluster |
| `src/pages/interruption/InterruptionDashboard.tsx` | Redesign total — layout, stat cards, charts, performance list |

### Yang TIDAK Berubah
- Semua logic data fetching (`usePSBAnalytics`, `getInterruptionAnalytics`)
- Semua tipe data
- Semua route dan navigasi
- Layout wrapper (PSBLayout, InterruptionLayout)
- Komponen UI base (Card, Badge, dll)

### Estimasi
- 2 file yang diubah
- Tidak ada dependency baru
- Tidak ada perubahan backend sama sekali
