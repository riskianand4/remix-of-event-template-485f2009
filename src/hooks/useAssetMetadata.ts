import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export const useAssetMetadata = () => {
  const { apiService, isConfigured, isOnline } = useApp();
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isConfigured && isOnline && apiService) {
        const response = await apiService.get("/api/assets/metadata/categories");
        
        if (response.success && response.data) {
          const categoryData = Array.isArray(response.data) ? response.data : [];
          setCategories(categoryData);
          localStorage.setItem("assetCategories", JSON.stringify(categoryData));
          return categoryData;
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem("assetCategories");
      const localCategories = saved ? JSON.parse(saved) : [
        "Tools",
        "Power Tools",
        "Testing Equipment",
        "Safety Equipment",
        "Power Equipment",
        "Network Equipment",
        "Measuring Tools",
        "Vehicle",
        "Computer Equipment",
        "Other"
      ];
      setCategories(localCategories);
      return localCategories;
    } catch (error) {
      console.error("Error fetching asset categories:", error);
      
      // Fallback to default categories
      const defaultCategories = [
        "Tools",
        "Power Tools",
        "Testing Equipment",
        "Safety Equipment",
        "Power Equipment",
        "Network Equipment",
        "Measuring Tools",
        "Vehicle",
        "Computer Equipment",
        "Other"
      ];
      setCategories(defaultCategories);
      return defaultCategories;
    } finally {
      setIsLoading(false);
    }
  }, [apiService, isConfigured, isOnline]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    refresh: fetchCategories
  };
};
