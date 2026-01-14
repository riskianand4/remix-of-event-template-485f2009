import { apiClient } from '@/services/apiClient';
import { handleApiResponse, safeApiCall } from '@/services/apiResponseHandler';

export interface Technician {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  employeeId: string;
  cluster: string;
  skills: string[];
  certification?: string[];
  territory: string[];
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    updatedAt: Date;
  };
  performance: {
    completionRate: number;
    averageRating: number;
    totalCompletedJobs: number;
  };
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  equipment?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get all technicians
export const getAllTechnicians = async (filters?: {
  page?: number;
  limit?: number;
  cluster?: string;
  territory?: string;
  isAvailable?: boolean;
  search?: string;
}): Promise<{ technicians: Technician[]; total: number; pagination: any }> => {
  const queryParams = new URLSearchParams();
  
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.cluster) queryParams.append('cluster', filters.cluster);
  if (filters?.territory) queryParams.append('territory', filters.territory);
  if (filters?.isAvailable !== undefined) queryParams.append('isAvailable', filters.isAvailable.toString());
  if (filters?.search) queryParams.append('search', filters.search);

  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/technicians?${queryParams.toString()}`),
    'Failed to fetch technicians'
  );

  if (response.success && response.data) {
    return {
      technicians: response.data.data || [],
      total: response.data.pagination?.total || 0,
      pagination: response.data.pagination || {}
    };
  }

  return { technicians: [], total: 0, pagination: {} };
};

// Get technician by ID
export const getTechnicianById = async (id: string): Promise<Technician | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/technicians/${id}`),
    'Failed to fetch technician'
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Get available technicians by cluster
export const getAvailableTechniciansByCluster = async (cluster: string): Promise<Technician[]> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/technicians/available/${cluster}`),
    'Failed to fetch available technicians'
  );

  if (response.success && response.data) {
    return response.data.data || [];
  }

  return [];
};

// Update technician location
export const updateTechnicianLocation = async (
  id: string, 
  location: { lat: number; lng: number; accuracy?: number }
): Promise<boolean> => {
  const response = await safeApiCall<any>(
    () => apiClient.patch(`/api/technicians/${id}/location`, location),
    'Failed to update location'
  );

  return response.success;
};

// Get technician analytics
export const getTechnicianAnalytics = async (id: string): Promise<any> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/technicians/${id}/analytics`),
    'Failed to fetch technician analytics'
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Create new technician
export const createTechnician = async (technicianData: {
  userId: string;
  employeeId: string;
  cluster: string;
  skills: string[];
  certification?: string[];
  territory: string[];
  workingHours?: any;
  equipment?: string[];
  emergencyContact?: any;
  notes?: string;
}): Promise<Technician | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.post('/api/technicians', technicianData),
    'Failed to create technician'
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Update technician
export const updateTechnician = async (
  id: string, 
  updateData: Partial<Technician>
): Promise<Technician | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.put(`/api/technicians/${id}`, updateData),
    'Failed to update technician'
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Delete/deactivate technician
export const deleteTechnician = async (id: string): Promise<boolean> => {
  const response = await safeApiCall<boolean>(
    () => apiClient.delete(`/api/technicians/${id}`),
    'Failed to delete technician'
  );

  return response.success;
};

export default {
  getAllTechnicians,
  getTechnicianById,
  getAvailableTechniciansByCluster,
  updateTechnicianLocation,
  getTechnicianAnalytics,
  createTechnician,
  updateTechnician,
  deleteTechnician,
};