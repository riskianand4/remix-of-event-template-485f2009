// Fixed: Complete interfaces with all required properties
export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  productCode?: string;
  currentStock: number;
  minimumStock: number;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  threshold?: number;
  timestamp?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface CostAnalysis {
  productId: string;
  productName: string;
  totalCost: number;
  averageCost: number;
  movementCount: number;
  period: string;
  currentValue?: number;
  profit?: number;
  profitMargin?: number;
  carryingCost?: number;
  turnoverRate?: number;
}

export interface StockVelocity {
  productId: string;
  productName: string;
  productCode?: string;
  velocity: number;
  turnoverRate: number;
  daysOnHand: number;
  classification: 'fast' | 'medium' | 'slow';
  averageDailyUsage?: number;
  averageWeeklyUsage?: number;
  averageMonthlyUsage?: number;
  daysOfSupply?: number;
  reorderPoint?: number;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalValue: number;
  averageDeliveryTime: number;
  qualityRating: number;
  reliability: number;
  onTimePercentage?: number;
  averageLeadTime?: number;
  onTimeDeliveries?: number;
  activeProducts?: number;
  lastOrderDate?: Date;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalValue: number;
  averageDeliveryTime: number;
  qualityRating: number;
  reliability: number;
}

// Comprehensive API type definitions to replace 'any' usage

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

export interface SelectChangeHandler {
  (value: string): void;
}

export interface VoiceCommandParameters {
  [key: string]: string | number | boolean;
}

export interface VoiceCommand {
  action: string;
  parameters?: VoiceCommandParameters;
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface FilterUpdateHandler<T = unknown> {
  (key: string, value: T): void;
}

// Fixed: Removed price field from BulkOperationData
export interface BulkOperationData {
  category?: string;
  status?: string;
  unit?: string;        // Added unit field
  minStock?: number;
  maxStock?: number;
  location?: string;
  supplier?: string;    // Added supplier field
  description?: string; // Added description field
}

export interface PICUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

// Fixed: Removed price field from ProductUpdateData
export interface ProductUpdateData {
  name?: string;
  category?: string;
  unit?: string;        // Added unit field
  minStock?: number;
  maxStock?: number;
  location?: string;
  description?: string;
  supplier?: string;    // Added supplier field
  barcode?: string;     // Added barcode field
  tags?: string[];      // Added tags field
  images?: Array<{      // Added images field
    url: string;
    isPrimary?: boolean;
  }>;
}

// Fixed: Removed totalValue and price-related fields from StatsData
export interface StatsData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;        // Added categories count
  suppliersCount: number;         // Added suppliers count
  topProducts: Array<{
    id: string;
    name: string;
    stock: number;
    unit: string;                 // Added unit
    category: string;             // Added category
    stockStatus: string;          // Added stock status
  }>;
  stockAlerts: Array<{            // Added stock alerts
    id: string;
    name: string;
    currentStock: number;
    minimumStock: number;
    stockStatus: string;
  }>;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

// Additional interfaces for the new backend structure

export interface ProductLocation {
  warehouse?: string;
  shelf?: string;
  bin?: string;
}

export interface ProductSupplier {
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
}

export interface ProductStock {
  current: number;
  minimum: number;
  maximum: number;
}

export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  alt?: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  description?: string;
  stock: ProductStock;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  location?: ProductLocation;
  supplier?: ProductSupplier;
  barcode?: string;
  tags?: string[];
  images?: ProductImage[];
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface StockMovement {
  id: string;
  _id?: string;
  product: string | Product;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'count';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  cost?: number;
  supplier?: ProductSupplier;
  status: 'pending' | 'completed' | 'cancelled';
  movementDate?: Date; // Custom movement date
  createdAt: Date;
  createdBy?: string;
}

export interface Asset {
  id: string;
  _id?: string;
  assetCode: string;
  name: string;
  category: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired' | 'lost' | 'stolen';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  purchasePrice: number;
  currentValue?: number;
  depreciation?: number;
  ageInMonths?: number;
  location?: {
    department?: string;
    room?: string;
    building?: string;
  };
  assignedTo?: {
    user: string | PICUser;
    assignedDate: Date;
  };
  specifications?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
  };
  maintenanceSchedule?: {
    frequency?: string;
    lastMaintenance?: Date;
    nextMaintenance?: Date;
  };
  purchaseDate: Date;
  warrantyExpiry?: Date;
  createdAt: Date;
  createdBy?: string;
}

// Report interfaces to match the backend reports API

export interface InventoryReportItem {
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  stockStatus: string;
  location: {
    warehouse: string;
    shelf: string;
    bin: string;
  };
  supplier: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovementReportItem {
  date: Date;
  product: {
    sku: string;
    name: string;
    category: string;
    unit: string;
  };
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  difference: number;
  reason: string;
  reference: string;
  cost: number;
  supplier: string;
  createdBy: string;
  status: string;
}

export interface LowStockReportItem {
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  shortfall: number;
  stockStatus: string;
  supplier: string;
  supplierContact: string;
  location: {
    warehouse: string;
    shelf: string;
  };
  lastUpdated: Date;
  suggestedOrderQuantity: number;
}

export interface ABCAnalysisReportItem {
  product: {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
  };
  analysis: {
    totalQuantityMoved: number;
    totalCostValue: number;
    movementFrequency: number;
    analysisValue: number;
    cumulativePercentage: number;
    classification: 'A' | 'B' | 'C';
    method: 'volume' | 'frequency' | 'cost';
  };
}

export interface ReportResponse<T> {
  success: boolean;
  data: {
    report: T[];
    summary: Record<string, unknown>;
    generatedAt: Date;
    filters?: Record<string, unknown>;
    period?: {
      days: number;
      startDate: Date;
      endDate: Date;
    };
  };
}