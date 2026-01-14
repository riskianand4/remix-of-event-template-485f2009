// Asset types synchronized with backend Mongoose model

// Location can be string (for UI) or object (from backend)
export type AssetLocation = string | {
  department?: string;
  room?: string;
  building?: string;
};

export interface Asset {
  id: string;
  _id?: string; // MongoDB ObjectId
  name: string;
  code: string; // Unique asset code
  category: string;
  description?: string;
  purchasePrice: number;
  currentValue?: number;
  quantity: number;
  purchaseDate: Date | string;
  warrantyExpiry?: Date | string;
  // Location can be string or object
  location?: AssetLocation;
  // assignedTo matches backend schema (replaces borrowedBy)
  assignedTo?: {
    user?: string;
    assignedDate?: Date | string;
    returnDate?: Date | string;
  };
  // Condition includes 'damaged' to match backend
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  // Status matches backend enum values
  status: 'available' | 'in_use' | 'borrowed' | 'maintenance' | 'retired' | 'lost' | 'stolen' | 'damaged';
  // Maintenance schedule matches backend
  maintenanceSchedule?: {
    frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none';
    lastMaintenance?: Date | string;
    nextMaintenance?: Date | string;
  };
  specifications?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    specifications?: Record<string, string>;
  };
  images?: Array<{
    url: string;
    alt?: string;
    uploadDate?: Date | string;
  }>;
  documents?: Array<{
    name: string;
    url: string;
    type: 'manual' | 'warranty' | 'invoice' | 'certificate' | 'other';
    uploadDate?: Date | string;
  }>;
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Legacy fields for backward compatibility with UI
  image?: string;
  picId?: string;
  picName?: string;
  borrowedBy?: {
    userId: string;
    userName: string;
    borrowDate: Date | string;
    expectedReturnDate: Date | string;
    actualReturnDate?: Date | string;
    notes?: string;
  };
  maintenanceHistory?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'inspection';
  description: string;
  cost: number;
  performedBy: string;
  performedAt: Date | string;
  nextMaintenanceDate?: Date | string;
}

export interface AssetBorrowRequest {
  assetId: string;
  borrowerUserId: string;
  borrowerUserName: string;
  expectedReturnDate: Date | string;
  purpose: string;
  notes?: string;
}

export interface AssetStats {
  totalAssets: number;
  totalValue: number;
  availableAssets: number;
  borrowedAssets: number;
  maintenanceAssets: number;
  assetsByCondition: Record<string, number>;
  assetsByCategory: Record<string, number>;
}

// Helper to get location as string for display
export const getLocationString = (location?: AssetLocation): string => {
  if (!location) return '-';
  if (typeof location === 'string') {
    return location || '-';
  }
  const parts = [
    location.room,
    location.department,
    location.building
  ].filter(Boolean);
  return parts.join(', ') || '-';
};
