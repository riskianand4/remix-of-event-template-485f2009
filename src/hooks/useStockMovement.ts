import { useState, useCallback } from 'react';
import { StockMovement } from '@/types/stock-movement';
import { useToast } from '@/hooks/use-toast';

export const useStockMovement = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      setMovements([]);
    } catch (err) {
      const errorMessage = 'Failed to fetch stock movements';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createStockMovement = useCallback(async (movementData: Omit<StockMovement, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const newMovement: StockMovement = {
        ...movementData,
        id: `mov-${Date.now()}`,
        createdAt: new Date(),
      };

      setMovements(prev => [newMovement, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Stock movement created successfully',
      });

      return newMovement;
    } catch (err) {
      const errorMessage = 'Failed to create stock movement';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    movements,
    loading,
    error,
    fetchMovements,
    createStockMovement,
    updateStockMovement: async () => {},
    deleteStockMovement: async () => {},
    getMovementsByProduct: () => [],
    getMovementsByType: () => [],
    getMovementsByDateRange: () => [],
    getTotalMovements: () => ({ total: 0, inMovements: 0, outMovements: 0, adjustments: 0, transfers: 0 }),
    getStockBalance: () => 0,
  };
};