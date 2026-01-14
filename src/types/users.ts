export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'superadmin' | 'teknisi' | 'cs';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  department: string;
  position: string;
  createdAt: Date;
  lastLogin?: Date;
  permissions: Permission[];
  technicianInfo?: TechnicianInfo;
  emailVerified?: boolean;
}

export interface TechnicianInfo {
  employeeId?: string;
  cluster?: string;
  skills?: ('survey' | 'installation' | 'maintenance' | 'troubleshooting' | 'ont_config')[];
  certification?: string;
  territory?: string[];
  isAvailable?: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'superadmin' | 'teknisi' | 'cs';
  phone?: string;
  department?: string;
  position?: string;
  permissions?: string[];
  technicianInfo?: Partial<TechnicianInfo>;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}