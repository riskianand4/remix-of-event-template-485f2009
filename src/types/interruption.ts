export interface InterruptionReport {
  _id: string;
  no: number;
  serviceNumber: string;
  customerName: string;
  address: string;
  contactNumber: string;
  interruptionType: string;
  ticketStatus: string; // Changed from union type to allow any string (hybrid input)
  technician: {
    _id: string;
    name: string;
    email?: string;
  } | string;
  interruptionCause?: string;
  interruptionAction?: string;
  openTime: string;
  closeTime?: string;
  handlingDuration: number;
  ttr: number;
  performance: string; // Allow any string input including custom values like "-22323.%"
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

export interface InterruptionAnalytics {
  summary: {
    totalReports: number;
    openReports: number;
    resolvedReports: number;
    averageHandlingTime: number;
    performanceRate: string;
  };
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    count: number;
    resolved: number;
    avgHandlingTime: number;
  }>;
  typeBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  technicianPerformance: Array<{
    _id: string;
    name: string;
    totalReports: number;
    avgHandlingTime: number;
    performanceRate: number;
  }>;
}

export interface CreateInterruptionReport {
  serviceNumber: string;
  customerName: string;
  address: string;
  contactNumber: string;
  interruptionType: string;
  ticketStatus: string; // Changed from union type to allow any string (hybrid input)
  technician: string;
  interruptionCause?: string;
  interruptionAction?: string;
  openTime: string;
  closeTime?: string;
  ttr?: number;
}
