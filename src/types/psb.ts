export interface PSBOrder {
  _id: string;
  no: number;
  date: string;
  cluster: string;
  sto: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  package: string;
  status:
    | "Pending"
    | "Assigned"
    | "Accepted"
    | "Survey"
    | "Installation"
    | "Completed"
    | "Cancelled"
    | "Failed";
  technician?:
    | string
    | {
        technicianId?: string;
        name: string;
        assignedAt?: Date;
        acceptedAt?: Date;
        territory?: string;
      };
  assignedAt?: string;
  surveyNotes?: string;
  installationNotes?: string;
  fieldReadiness?: {
    odpStatus: "available" | "full" | "damaged" | "not_available";
    towerDistance?: number;
    materialCheck: "complete" | "partial" | "missing";
    signalStrength?: number;
  };
  installationDetails?: {
    installedAt?: string;
    ontSerialNumber?: string;
    cableLength?: number;
    installationType: "aerial" | "underground" | "indoor";
  };
  priority: "low" | "normal" | "high" | "urgent";
  notes?: string;
  technicianStatus?: "pending" | "failed" | "complete";
  technicianStatusReason?: string;
  technicianStatusUpdatedAt?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PSBAnalytics {
  summary: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completionRate: string;
  };
  clusterStats: Array<{
    _id: string;
    count: number;
    completed: number;
  }>;
  stoStats: Array<{
    _id: string;
    count: number;
    completed: number;
  }>;
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    count: number;
    completed: number;
  }>;
}

export interface CreatePSBOrderRequest {
  cluster: string;
  sto: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  package: string;
  status?:
    | "Pending"
    | "Assigned"
    | "Accepted"
    | "Survey"
    | "Installation"
    | "Completed"
    | "Cancelled"
    | "Failed";
  technician?: string;
  assignedAt?: string;
  surveyNotes?: string;
  installationNotes?: string;
  fieldReadiness?: {
    odpStatus?: "available" | "full" | "damaged" | "not_available";
    towerDistance?: number;
    materialCheck?: "complete" | "partial" | "missing";
    signalStrength?: number;
  };
  installationDetails?: {
    installedAt?: string;
    ontSerialNumber?: string;
    cableLength?: number;
    installationType?: "aerial" | "underground" | "indoor";
  };
  priority?: "low" | "normal" | "high" | "urgent";
  notes?: string;
}

export interface PSBActivation {
  _id: string;
  psbOrderId?: string;
  customerName: string; // Nama pemilik layanan
  serviceNumber: string; // Nomor layanan unik
  pppoeUsername: string; // Username PPPoE (format: nomor@telnet.net.id)
  pppoePassword: string; // Password PPPoE
  oltName: string; // Jenis perangkat OLT (ZTE, VSOL-4P, dll)
  ponPort: string; // Port di OLT (PON:x)
  onuNumber: string; // Nomor ONU (ONU:y)
  signalLevel: number; // Redaman dalam dBm (-15 to -25 dBm)
  activationDate: string; // Tanggal pemasangan/pengecekan
  ontStatus: "configured" | "pending" | "failed"; // Status konfigurasi ONT
  cluster: string; // Wilayah/lokasi pemasangan
  technician: string; // Nama teknisi yang melakukan instalasi
  notes?: string;
  reportGenerated?: boolean; // Flag untuk menandai bahwa PDF sudah di-generate
  reportGeneratedAt?: string; // Timestamp kapan PDF di-generate
  installationReport?: {
    speedTest?: {
      download?: number;
      upload?: number;
      ping?: number;
    };
    device?: {
      ontType?: string;
      ontSerial?: string;
      routerType?: string;
      routerSerial?: string;
      stbId?: string;
    };
    datek?: {
      area?: string;
      odc?: string;
      odp?: string;
      port?: string;
      dc?: string;
      soc?: string;
    };
    serviceType?: "pasang_baru" | "cabut" | "upgrade" | "downgrade" | "pda";
    packageSpeed?: 20 | 30 | 40 | 50 | 100;
    fastelNumber?: string;
    contactPerson?: string;
    signatures?: {
      technician?: string; // base64
      customer?: string; // base64
      signedAt?: string;
    };
    reportGenerated?: boolean;
    reportGeneratedAt?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePSBActivationRequest {
  psbOrderId?: string;
  customerName: string;
  serviceNumber: string;
  pppoeUsername: string;
  pppoePassword: string;
  oltName: string;
  ponPort: string;
  onuNumber: string;
  signalLevel: number;
  activationDate: string;
  ontStatus: "configured" | "pending" | "failed";
  cluster: string;
  technician: string;
  notes?: string;
  technicianId?: string;
  reportGenerated?: boolean;
  reportGeneratedAt?: string;
  installationReport?: {
    speedTest?: {
      download?: number;
      upload?: number;
      ping?: number;
    };
    device?: {
      ontType?: string;
      ontSerial?: string;
      routerType?: string;
      routerSerial?: string;
      stbId?: string;
    };
    datek?: {
      area?: string;
      odc?: string;
      odp?: string;
      port?: string;
      dc?: string;
      soc?: string;
    };
    serviceType?: "pasang_baru" | "cabut" | "upgrade" | "downgrade" | "pda";
    packageSpeed?: 20 | 30 | 40 | 50 | 100;
    fastelNumber?: string;
    contactPerson?: string;
    signatures?: {
      technician?: string;
      customer?: string;
      signedAt?: string;
    };
    reportGenerated?: boolean;
    reportGeneratedAt?: string;
  };
}

export interface PSBActivationAnalytics {
  summary: {
    totalActivations: number;
    configuredONT: number;
    pendingONT: number;
    failedONT: number;
    averageSignalLevel: number;
    configurationRate: string;
  };
  clusterStats: Array<{
    _id: string;
    count: number;
    configured: number;
    averageSignal: number;
  }>;
  oltStats: Array<{
    _id: string;
    count: number;
    configured: number;
    averageSignal: number;
  }>;
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    count: number;
    configured: number;
    averageSignal: number;
  }>;
}
