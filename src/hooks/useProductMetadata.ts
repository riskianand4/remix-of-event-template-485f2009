import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { logger } from '@/utils/logger';

interface ProductMetadata {
  categories: string[];
  units: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useProductMetadata = (): ProductMetadata => {
  const { apiService, isConfigured, isOnline } = useApi();
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    // If not configured or offline, use default values
    if (!isConfigured || !isOnline || !apiService) {
      setCategories([
        'Network Equipment',
        'Cables & Connectors',
        'Access Points',
        'Servers & Storage',
        'Security Equipment',
        'Power & UPS',
        'Tools & Accessories'
      ]);
      setUnits(['pcs', 'unit', 'meter', 'bungkus', 'batang', 'buah', 'kotak', 'haspel']);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch categories and units in parallel
      const [categoriesResponse, unitsResponse] = await Promise.all([
        apiService.get('/api/products/metadata/categories'),
        apiService.get('/api/products/metadata/units')
      ]);

      logger.debug('Metadata Response:', { categoriesResponse, unitsResponse });

      if (categoriesResponse?.success && Array.isArray(categoriesResponse.data)) {
        setCategories(categoriesResponse.data);
      }

      if (unitsResponse?.success && Array.isArray(unitsResponse.data)) {
        setUnits(unitsResponse.data);
      }
    } catch (err) {
      logger.error('Error fetching product metadata:', err);
      setError('Gagal mengambil metadata produk');
      
      // Fallback to default values
      setCategories([
        'Network Equipment',
        'Cables & Connectors',
        'Access Points',
        'Servers & Storage',
        'Security Equipment',
        'Power & UPS',
        'Tools & Accessories'
      ]);
      setUnits(['pcs', 'unit', 'meter', 'bungkus', 'batang', 'buah', 'kotak', 'haspel']);
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isConfigured, isOnline]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    categories,
    units,
    isLoading,
    error,
    refresh: fetchMetadata
  };
};
