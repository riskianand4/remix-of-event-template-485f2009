

# Rencana: Hapus Inventory, Rename ke Telnet PSBLink

## Ringkasan
Menghapus semua fitur inventory/produk/stok/aset dari aplikasi, menyisakan hanya fitur PSB dan Gangguan (Interruption). Rename aplikasi menjadi "Telnet PSBLink". Login langsung redirect ke halaman PSB.

## Daftar Perubahan

### 1. Rename Aplikasi
- **`index.html`** - Ubah title menjadi "Telnet PSBLink"
- **`src/components/auth/ModernLoginPage.tsx`** - Ubah branding dari "Telnet Inventory" ke "Telnet PSBLink", ubah deskripsi
- **`src/components/psb/PSBSidebar.tsx`** - Ubah label "Report PSB" ke "Telnet PSBLink", hapus tombol "Kembali ke Inventori"
- **`src/components/layout/WelcomeSection.tsx`** - Ubah deskripsi welcome dari inventori ke PSB

### 2. Ubah Routing - Login Langsung ke PSB
- **`src/App.tsx`** - Hapus semua route inventory (/, /products, /inventory, /aset, /orders, /alerts, /stock-movement, /stock-report, /database, /api-management, /settings, /audit-log, /security, /more, /supervisor). Route "/" langsung ke PSBLayout.
- **`src/pages/Index.tsx`** - Ubah agar redirect semua user ke /psb-report setelah login
- **`src/components/auth/ModernLoginPage.tsx`** - Navigate ke "/" yang sekarang adalah PSB

### 3. Hapus File Pages Inventory (17 file)
- `src/pages/AIStudioPage.tsx`
- `src/pages/AlertsPage.tsx`
- `src/pages/ApiManagementPage.tsx`
- `src/pages/AssetsPage.tsx`
- `src/pages/AuditLogPage.tsx`
- `src/pages/DatabasePage.tsx`
- `src/pages/DocumentationPage.tsx`
- `src/pages/InventoryPage.tsx`
- `src/pages/MorePage.tsx`
- `src/pages/OrdersPage.tsx`
- `src/pages/ProductsPage.tsx`
- `src/pages/SecurityPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/StockMovementPage.tsx`
- `src/pages/StockReportPage.tsx`
- `src/pages/SupervisorDashboard.tsx`
- `src/pages/VendorsPage.tsx`

### 4. Hapus Folder Komponen Inventory (11 folder)
- `src/components/advanced/`
- `src/components/ai/`
- `src/components/alerts/`
- `src/components/analytics/`
- `src/components/api/`
- `src/components/assets/`
- `src/components/audit/`
- `src/components/bulk/`
- `src/components/dashboard/`
- `src/components/filters/`
- `src/components/inventory/`
- `src/components/onboarding/`
- `src/components/optimized/`
- `src/components/products/`
- `src/components/reports/`
- `src/components/settings/`
- `src/components/setup/`
- `src/components/stock/`
- `src/components/suppliers/`
- `src/components/users/`
- `src/components/enhanced/`
- `src/components/responsive/`
- `src/components/performance/`

### 5. Hapus Layout Inventory
- `src/components/layout/AppSidebar.tsx` - Hapus (layout inventori)
- `src/components/layout/MainLayout.tsx` - Hapus (layout inventori)
- `src/components/layout/MobileBottomNav.tsx` - Hapus
- `src/components/layout/MobileMoreMenu.tsx` - Hapus
- `src/components/layout/QuickSearch.tsx` - Hapus
- `src/components/layout/WelcomeSection.tsx` - Hapus
- `src/components/layout/SyncStatusIndicator.tsx` - Hapus
- `src/components/layout/EnhancedQuickSearch.tsx` - Hapus
- `src/components/layout/ConnectionStatus.tsx` - Hapus

Yang TETAP di layout:
- `src/components/layout/NotificationCenter.tsx` (dipakai PSB & Gangguan)
- `src/components/layout/TechnicianLayout.tsx` (dipakai teknisi)
- `src/components/layout/TechnicianSidebar.tsx`
- `src/components/layout/TechnicianMobileBottomNav.tsx`

### 6. Hapus Services Inventory (15 file)
- `src/services/alertApi.ts`
- `src/services/analyticsApi.ts`
- `src/services/assetApi.ts`
- `src/services/assetsApi.ts`
- `src/services/customerApi.ts`
- `src/services/dashboardApi.ts`
- `src/services/inventoryApi.ts`
- `src/services/legacyApi.ts`
- `src/services/monitoringService.ts`
- `src/services/orderApi.ts`
- `src/services/productApi.ts`
- `src/services/settingsApi.ts`
- `src/services/skuValidationApi.ts`
- `src/services/stockMovementApi.ts`
- `src/services/supplierApi.ts`
- `src/services/systemApi.ts`

Yang TETAP:
- `src/services/api.ts`, `apiClient.ts`, `apiResponseHandler.ts` (core)
- `src/services/psbApi.ts`, `psbActivationApi.ts` (PSB)
- `src/services/technicianApi.ts` (Teknisi)
- `src/services/interruptionApi.ts` (Gangguan)
- `src/services/userApi.ts` (auth)
- `src/services/emailVerificationApi.ts` (auth)
- `src/services/pdfService.ts` (PDF PSB)
- `src/services/roleMapper.ts` (roles)
- `src/services/apiKeyService.ts` (API keys)

### 7. Hapus Hooks Inventory (20+ file)
- `src/hooks/useAnalyticsData.ts`
- `src/hooks/useApiData.ts`
- `src/hooks/useAssetManager.ts`
- `src/hooks/useAssetMetadata.ts`
- `src/hooks/useAuditLog.ts`
- `src/hooks/useAutoAlerts.ts`
- `src/hooks/useConnectionMonitor.ts`
- `src/hooks/useConsolidatedProductManager.ts`
- `src/hooks/useDashboardData.ts`
- `src/hooks/useDataPersistence.ts`
- `src/hooks/useEnhancedAssetManager.ts`
- `src/hooks/useEnhancedProductManager.ts`
- `src/hooks/useEnhancedStockManager.ts`
- `src/hooks/useHybridData.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useOptimizedAlerts.ts`
- `src/hooks/useOptimizedAutoAlerts.ts`
- `src/hooks/useOptimizedConnectionMonitor.ts`
- `src/hooks/useOptimizedDashboard.ts`
- `src/hooks/useOptimizedDashboardData.ts`
- `src/hooks/useOptimizedStockAlerts.ts`
- `src/hooks/usePerformanceMonitor.ts`
- `src/hooks/usePerformanceOptimization.ts`
- `src/hooks/useProductManager.ts`
- `src/hooks/useProductMetadata.ts`
- `src/hooks/useRealTimeSync.ts`
- `src/hooks/useStockAlerts.ts`
- `src/hooks/useStockMovement.ts`
- `src/hooks/useSuperAdminDashboard.ts`
- `src/hooks/useUserManager.ts`

Yang TETAP:
- `src/hooks/useAuth.ts`, `useAuthManager.ts` (auth)
- `src/hooks/usePSBData.ts`, `usePSBAnalytics.ts`, `usePSBActivationAnalytics.ts`, `usePSBRealtimeNotifications.ts` (PSB)
- `src/hooks/useTechnicianData.ts` (Teknisi)
- `src/hooks/useApi.ts` (core)
- `src/hooks/useErrorHandler.ts` (core)
- `src/hooks/use-mobile.tsx`, `use-toast.ts` (UI)

### 8. Hapus Types & Utils Inventory
Types hapus:
- `src/types/inventory.ts`
- `src/types/inventory-extended.ts`
- `src/types/assets.ts`
- `src/types/orders.ts`
- `src/types/alert-settings.ts`
- `src/types/analytics.ts`
- `src/types/stock-movement.ts`
- `src/types/settings.ts`

Utils hapus:
- `src/utils/globalProductCache.ts`
- `src/utils/productStatusHelpers.ts`
- `src/utils/stockValidation.ts`
- `src/utils/performanceOptimizer.ts`
- `src/utils/productionOptimizer.ts`
- `src/utils/requestThrottler.ts`
- `src/utils/circuitBreaker.ts`
- `src/utils/circuitBreakerOptimized.ts`
- `src/utils/connectionManager.ts`
- `src/utils/systemMonitor.ts`
- `src/utils/build-optimizer.ts`
- `src/data/constants.ts`
- `src/data/mockSettings.ts`

Contexts hapus:
- `src/contexts/ProductContext.tsx`
- `src/contexts/ApiContext.tsx`

### 9. Update AppContext
- `src/contexts/AppContext.tsx` - Hapus referensi ke `InventoryApiService`, simplify context

### 10. Update main.tsx
- Hapus import `performanceOptimizer`, `productionSecurity` yang tidak perlu

### 11. Struktur Routing Baru

```text
/                    -> Login / Redirect ke PSB
/psb-report/*        -> PSB Layout (CS, Superadmin)
/interruption/*      -> Gangguan Layout (semua role)
/technician/*        -> Teknisi Layout (teknisi)
```

## Yang TIDAK Diubah (Tetap Utuh)
- Semua file di `src/components/psb/` 
- Semua file di `src/components/interruption/`
- Semua file di `src/components/technician/`
- Semua file di `src/pages/psb/`
- Semua file di `src/pages/interruption/`
- Semua file di `src/pages/technician/`
- `src/components/auth/` (login, protected route)
- `src/components/ui/` (UI components)
- `src/components/feedback/` (error boundary)
- Backend folder (tidak diubah)

## Estimasi
- Menghapus 80+ file yang tidak diperlukan
- Meng-update 5-8 file inti
- Hasil: Aplikasi lebih ringan, fokus hanya PSB dan Gangguan

