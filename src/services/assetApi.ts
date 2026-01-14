import { apiClient } from '@/services/apiClient';
import { safeApiCall } from '@/services/apiResponseHandler';
import { Asset } from '@/types/assets';

export interface AssetFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
}

export interface AssetResponse {
  success: boolean;
  data: Asset[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
  };
  error?: string;
}

// Get all assets with filters
export const getAllAssets = async (filters: AssetFilters = {}): Promise<AssetResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  const endpoint = `/api/assets${queryString ? `?${queryString}` : ''}`;

  const response = await safeApiCall<AssetResponse>(
    () => apiClient.get(endpoint),
    'Failed to fetch assets'
  );

  return response.success ? response.data || { success: false, data: [], error: 'Invalid response' } : 
    { success: false, data: [], error: response.error || 'Failed to fetch assets' };
};

// Get asset by ID
export const getAssetById = async (id: string): Promise<{ success: boolean; data?: Asset; error?: string }> => {
  const response = await safeApiCall<Asset>(
    () => apiClient.get(`/api/assets/${id}`),
    'Failed to fetch asset'
  );

  return response.success ? { success: true, data: response.data } : 
    { success: false, error: response.error || 'Failed to fetch asset' };
};

// Create new asset
export const createAsset = async (assetData: Partial<Asset>): Promise<{ success: boolean; data?: Asset; error?: string }> => {
  const response = await safeApiCall<Asset>(
    () => apiClient.post('/api/assets', assetData),
    'Failed to create asset'
  );

  return response.success ? { success: true, data: response.data } : 
    { success: false, error: response.error || 'Failed to create asset' };
};

// Update asset
export const updateAsset = async (id: string, assetData: Partial<Asset>): Promise<{ success: boolean; data?: Asset; error?: string }> => {
  const response = await safeApiCall<Asset>(
    () => apiClient.put(`/api/assets/${id}`, assetData),
    'Failed to update asset'
  );

  return response.success ? { success: true, data: response.data } : 
    { success: false, error: response.error || 'Failed to update asset' };
};

// Delete asset
export const deleteAsset = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const response = await safeApiCall<void>(
    () => apiClient.delete(`/api/assets/${id}`),
    'Failed to delete asset'
  );

  return response.success ? { success: true } : 
    { success: false, error: response.error || 'Failed to delete asset' };
};

// Assign asset to user
export const assignAsset = async (assetId: string, userId: string, notes?: string): Promise<{ success: boolean; data?: Asset; error?: string }> => {
  const response = await safeApiCall<Asset>(
    () => apiClient.post(`/api/assets/${assetId}/assign`, { userId, notes }),
    'Failed to assign asset'
  );

  return response.success ? { success: true, data: response.data } : 
    { success: false, error: response.error || 'Failed to assign asset' };
};

// Return asset
export const returnAsset = async (assetId: string, condition?: string, notes?: string): Promise<{ success: boolean; data?: Asset; error?: string }> => {
  const response = await safeApiCall<Asset>(
    () => apiClient.post(`/api/assets/${assetId}/return`, { condition, notes }),
    'Failed to return asset'
  );

  return response.success ? { success: true, data: response.data } : 
    { success: false, error: response.error || 'Failed to return asset' };
};

// Get asset categories
export const getAssetCategories = async (): Promise<{ success: boolean; data?: string[]; error?: string }> => {
  const response = await safeApiCall<string[]>(
    () => apiClient.get('/api/assets/categories/list'),
    'Failed to fetch categories'
  );

  return response.success ? { success: true, data: response.data } : 
    { success: false, error: response.error || 'Failed to fetch categories' };
};

export default {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  getAssetCategories
};