// Indonesian translations for user-facing messages
export const INDONESIAN_MESSAGES = {
  // Authentication messages
  AUTH: {
    LOGIN_SUCCESS: 'Login berhasil',
    LOGIN_FAILED: 'Login gagal. Periksa email dan password Anda',
    LOGOUT_SUCCESS: 'Logout berhasil',
    SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali',
    UNAUTHORIZED: 'Anda tidak memiliki akses untuk halaman ini',
    INVALID_CREDENTIALS: 'Email atau password tidak valid',
  },
  
  // Network and API messages
  NETWORK: {
    CONNECTION_ERROR: 'Masalah koneksi jaringan. Periksa koneksi internet Anda',
    SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi nanti',
    TIMEOUT: 'Permintaan timeout. Silakan coba lagi',
    RATE_LIMIT: 'Terlalu banyak permintaan. Tunggu sebentar dan coba lagi',
    NOT_FOUND: 'Data yang dicari tidak ditemukan',
    BAD_REQUEST: 'Permintaan tidak valid. Periksa data yang Anda masukkan',
  },
  
  // Data operations
  DATA: {
    SAVE_SUCCESS: 'Data berhasil disimpan',
    SAVE_FAILED: 'Gagal menyimpan data',
    DELETE_SUCCESS: 'Data berhasil dihapus',
    DELETE_FAILED: 'Gagal menghapus data',
    UPDATE_SUCCESS: 'Data berhasil diperbarui',
    UPDATE_FAILED: 'Gagal memperbarui data',
    LOAD_FAILED: 'Gagal memuat data',
    VALIDATION_ERROR: 'Data yang dimasukkan tidak valid',
  },
  
  // Form validation
  VALIDATION: {
    REQUIRED_FIELD: 'Field ini wajib diisi',
    INVALID_EMAIL: 'Format email tidak valid',
    INVALID_PHONE: 'Nomor telepon tidak valid',
    PASSWORD_TOO_SHORT: 'Password minimal 8 karakter',
    PASSWORDS_DONT_MATCH: 'Password tidak cocok',
    INVALID_NUMBER: 'Harus berupa angka',
    INVALID_DATE: 'Format tanggal tidak valid',
    FILE_TOO_LARGE: 'Ukuran file terlalu besar',
    INVALID_FILE_TYPE: 'Tipe file tidak didukung',
  },
  
  // Inventory operations
  INVENTORY: {
    STOCK_LOW: 'Stok rendah',
    STOCK_OUT: 'Stok habis',
    STOCK_UPDATED: 'Stok berhasil diperbarui',
    PRODUCT_ADDED: 'Produk berhasil ditambahkan',
    PRODUCT_UPDATED: 'Produk berhasil diperbarui',
    PRODUCT_DELETED: 'Produk berhasil dihapus',
    INVALID_QUANTITY: 'Jumlah tidak valid',
    INSUFFICIENT_STOCK: 'Stok tidak mencukupi',
  },
  
  // PSB operations
  PSB: {
    ORDER_CREATED: 'Order PSB berhasil dibuat',
    ORDER_UPDATED: 'Order PSB berhasil diperbarui',
    ORDER_CANCELLED: 'Order PSB berhasil dibatalkan',
    ASSIGNMENT_SUCCESS: 'Teknisi berhasil ditugaskan',
    ACTIVATION_SUCCESS: 'Aktivasi berhasil',
    ACTIVATION_FAILED: 'Aktivasi gagal',
    SURVEY_COMPLETED: 'Survey berhasil diselesaikan',
    INSTALLATION_COMPLETED: 'Instalasi berhasil diselesaikan',
  },
  
  // System messages
  SYSTEM: {
    LOADING: 'Memuat...',
    PROCESSING: 'Memproses...',
    SAVING: 'Menyimpan...',
    DELETING: 'Menghapus...',
    UPLOADING: 'Mengunggah...',
    SEARCHING: 'Mencari...',
    NO_DATA: 'Tidak ada data',
    OFFLINE: 'Aplikasi sedang offline',
    ONLINE: 'Aplikasi kembali online',
    MAINTENANCE: 'Aplikasi sedang dalam pemeliharaan',
    UPDATE_AVAILABLE: 'Pembaruan tersedia',
  },
  
  // Error handling
  ERRORS: {
    UNEXPECTED_ERROR: 'Terjadi kesalahan yang tidak terduga',
    FEATURE_UNAVAILABLE: 'Fitur ini belum tersedia',
    PERMISSION_DENIED: 'Akses ditolak',
    PAGE_NOT_FOUND: 'Halaman tidak ditemukan',
    SERVICE_UNAVAILABLE: 'Layanan tidak tersedia',
    RELOAD_REQUIRED: 'Silakan muat ulang halaman',
  },
  
  // Confirmation messages
  CONFIRMATIONS: {
    DELETE_CONFIRM: 'Apakah Anda yakin ingin menghapus item ini?',
    LOGOUT_CONFIRM: 'Apakah Anda yakin ingin logout?',
    CANCEL_CONFIRM: 'Apakah Anda yakin ingin membatalkan?',
    DISCARD_CHANGES: 'Apakah Anda yakin ingin mengabaikan perubahan?',
    PROCEED_CONFIRM: 'Apakah Anda yakin ingin melanjutkan?',
  },
  
  // Performance messages
  PERFORMANCE: {
    SLOW_CONNECTION: 'Koneksi lambat terdeteksi',
    HIGH_MEMORY_USAGE: 'Penggunaan memori tinggi',
    PERFORMANCE_DEGRADED: 'Performa aplikasi menurun',
    RELOAD_RECOMMENDED: 'Disarankan untuk memuat ulang aplikasi',
  },
};

// Helper function to get translated message
export const getIndonesianMessage = (
  category: keyof typeof INDONESIAN_MESSAGES,
  key: string,
  fallback?: string
): string => {
  const categoryMessages = INDONESIAN_MESSAGES[category];
  if (categoryMessages && key in categoryMessages) {
    return (categoryMessages as any)[key];
  }
  return fallback || 'Pesan tidak ditemukan';
};

// Error message mapper for common errors
export const mapErrorToIndonesian = (error: Error | string): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Network errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
    return INDONESIAN_MESSAGES.NETWORK.CONNECTION_ERROR;
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return INDONESIAN_MESSAGES.NETWORK.TIMEOUT;
  }
  
  if (errorMessage.includes('Rate limit') || errorMessage.includes('Too Many Requests')) {
    return INDONESIAN_MESSAGES.NETWORK.RATE_LIMIT;
  }
  
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    return INDONESIAN_MESSAGES.AUTH.UNAUTHORIZED;
  }
  
  if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
    return INDONESIAN_MESSAGES.NETWORK.NOT_FOUND;
  }
  
  if (errorMessage.includes('Bad Request') || errorMessage.includes('400')) {
    return INDONESIAN_MESSAGES.NETWORK.BAD_REQUEST;
  }
  
  if (errorMessage.includes('Server Error') || errorMessage.includes('500')) {
    return INDONESIAN_MESSAGES.NETWORK.SERVER_ERROR;
  }
  
  // Validation errors
  if (errorMessage.includes('required') || errorMessage.includes('mandatory')) {
    return INDONESIAN_MESSAGES.VALIDATION.REQUIRED_FIELD;
  }
  
  if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
    return INDONESIAN_MESSAGES.VALIDATION.INVALID_EMAIL;
  }
  
  // Default fallback
  return INDONESIAN_MESSAGES.ERRORS.UNEXPECTED_ERROR;
};