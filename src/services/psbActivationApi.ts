import { apiClient } from "./apiClient";
import {
  PSBActivation,
  PSBActivationAnalytics,
  CreatePSBActivationRequest,
} from "@/types/psb";
import { API_ENDPOINTS } from "@/config/environment";
import { globalRequestThrottler } from "@/utils/requestThrottler";

export const psbActivationApi = {
  // Get all PSB activations with pagination and filters
  getActivations: async (params?: {
    page?: number;
    limit?: number;
    cluster?: string;
    oltName?: string;
    ontStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
    technician?: string;
  }): Promise<{
    success: boolean;
    data: PSBActivation[];
    pagination?: any;
    stats?: any;
    meta?: any;
  }> => {
    const endpoint = API_ENDPOINTS.PSB.ACTIVATIONS;

    if (!globalRequestThrottler.canMakeRequest(endpoint)) {
      console.warn("🚫 PSB Activations request throttled");
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }

    try {
      globalRequestThrottler.recordRequest(endpoint);

      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const url = `${endpoint}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await apiClient.get(url);
      return response as {
        success: boolean;
        data: PSBActivation[];
        pagination: any;
        stats?: any;
        meta?: any;
      };
    } catch (error) {
      console.error("PSB Activation API: Error fetching activations:", error);
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }
  },

  // Get PSB activation analytics
  getAnalytics: async (): Promise<{
    success: boolean;
    data: PSBActivationAnalytics;
  }> => {
    const endpoint = API_ENDPOINTS.PSB.ACTIVATION_ANALYTICS;

    if (!globalRequestThrottler.canMakeRequest(endpoint)) {
      console.warn(
        "🚫 PSB Activation Analytics request throttled, returning cached fallback"
      );
      return {
        success: true,
        data: {
          summary: {
            totalActivations: 0,
            configuredONT: 0,
            pendingONT: 0,
            failedONT: 0,
            averageSignalLevel: 0,
            configurationRate: "0",
          },
          clusterStats: [],
          oltStats: [],
          monthlyTrends: [],
        },
      };
    }

    try {
      globalRequestThrottler.recordRequest(endpoint);

      const response = await apiClient.get(endpoint);
      return response.data as {
        success: boolean;
        data: PSBActivationAnalytics;
      };
    } catch (error) {
      console.error("PSB Activation API: Error fetching analytics:", error);
      // Return mock analytics data as fallback
      return {
        success: true,
        data: {
          summary: {
            totalActivations: 0,
            configuredONT: 0,
            pendingONT: 0,
            failedONT: 0,
            averageSignalLevel: 0,
            configurationRate: "0",
          },
          clusterStats: [],
          oltStats: [],
          monthlyTrends: [],
        },
      };
    }
  },

  // Create new PSB activation
  createActivation: async (
    activationData: CreatePSBActivationRequest
  ): Promise<{ success: boolean; data: PSBActivation }> => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const technicianId =
        storedUser?.id || storedUser?._id || storedUser?.user?.id || null;

      // 🟢 Pastikan psbOrderId dikirim dari form atau order yang dipilih
      const psbOrderId =
        (activationData as any)?.psbOrderId ||
        (activationData as any)?.orderId ||
        null;

      // Validate required fields before sending
      if (!activationData.serviceNumber) {
        throw new Error("400: Service number is required");
      }
      if (!psbOrderId) {
        throw new Error("400: PSB Order ID is required");
      }

      if (!activationData.technician) {
        throw new Error("400: Technician name is required");
      }
      if (!activationData.customerName) {
        throw new Error("400: Customer name is required");
      }
      if (!activationData.pppoeUsername || !activationData.pppoePassword) {
        throw new Error("400: PPPoE credentials are required");
      }
      if (
        !activationData.oltName ||
        !activationData.ponPort ||
        !activationData.onuNumber
      ) {
        throw new Error("400: OLT, PON Port, and ONU Number are required");
      }

      // 🔧 Gabungkan payload akhir
      const payload = {
        ...activationData,
        technicianId,
        psbOrderId,
      };

      console.log("🚀 [PSB Activation API] Payload yang dikirim:", payload);

      const response = await apiClient.post(
        API_ENDPOINTS.PSB.ACTIVATIONS,
        payload
      );
      console.log("✅ [PSB Activation API] Create response:", response.data);

      return response.data as { success: boolean; data: PSBActivation };
    } catch (error: any) {
      console.error(
        "❌ [PSB Activation API] Error creating activation:",
        error
      );

      if (error.status === 409 || error.message?.includes("409:")) {
        const errorMessage =
          error.data?.details ||
          error.message?.replace("409: ", "") ||
          `Service number ${activationData.serviceNumber} already exists`;
        throw new Error(`409: ${errorMessage}`);
      } else if (error.status === 400 || error.message?.includes("400:")) {
        const errorMessage =
          error.data?.details ||
          error.message?.replace("400: ", "") ||
          "Invalid data provided";
        throw new Error(`400: ${errorMessage}`);
      }

      throw error;
    }
  },

  // Update PSB activation
  updateActivation: async (
    id: string,
    activationData: Partial<CreatePSBActivationRequest>
  ): Promise<{ success: boolean; data: PSBActivation }> => {
    try {
      console.log(
        "PSB Activation API: Updating activation:",
        id,
        activationData
      );
      const response = await apiClient.put(
        `${API_ENDPOINTS.PSB.ACTIVATIONS}/${id}`,
        activationData
      );
      console.log("PSB Activation API: Update response:", response.data);

      // Handle direct activation response (backend returns activation directly, not wrapped)
      if (
        response.data &&
        typeof response.data === "object" &&
        "_id" in response.data
      ) {
        return {
          success: true,
          data: response.data as PSBActivation,
        };
      }

      // Handle wrapped response format
      return response.data as { success: boolean; data: PSBActivation };
    } catch (error) {
      console.error("PSB Activation API: Error updating activation:", error);
      throw error;
    }
  },

  // Delete PSB activation
  deleteActivation: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("PSB Activation API: Deleting activation:", id);
      const response = await apiClient.delete(
        `${API_ENDPOINTS.PSB.ACTIVATIONS}/${id}`
      );
      console.log("PSB Activation API: Delete response:", response.data);

      // Handle case where response.data might be undefined
      if (!response.data) {
        // If response is successful but no data, assume success based on no error thrown
        return {
          success: true,
          message: "PSB activation deleted successfully",
        };
      }

      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error("PSB Activation API: Error deleting activation:", error);
      throw error;
    }
  },

  // Get next available service number
  getNextServiceNumber: async (): Promise<{
    success: boolean;
    data: {
      nextServiceNumber: string;
      lastServiceNumber: string | null;
    };
  }> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PSB.ACTIVATIONS}/next-service-number`
      );
      return response as {
        success: boolean;
        data: {
          nextServiceNumber: string;
          lastServiceNumber: string | null;
        };
      };
    } catch (error) {
      console.error(
        "PSB Activation API: Error fetching next service number:",
        error
      );
      // Return default fallback
      return {
        success: true,
        data: {
          nextServiceNumber: "2988372626",
          lastServiceNumber: null,
        },
      };
    }
  },

  // Get last credentials for auto-increment
  getLastCredentials: async (): Promise<{
    success: boolean;
    data: {
      serviceNumber: string;
      email: string;
      password: string;
    };
  }> => {
    try {
      const response = await psbActivationApi.getActivations({
        limit: 1,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const lastActivation = response.data?.[0];

      if (lastActivation) {
        return {
          success: true,
          data: {
            serviceNumber: lastActivation.serviceNumber,
            email: lastActivation.pppoeUsername,
            password: lastActivation.pppoePassword,
          },
        };
      }

      // Default fallback
      return {
        success: true,
        data: {
          serviceNumber: "2988372626",
          email: "2988372626@telnet.co.id",
          password: "2988372626",
        },
      };
    } catch (error) {
      console.error(
        "PSB Activation API: Error fetching last credentials:",
        error
      );
      return {
        success: true,
        data: {
          serviceNumber: "2988372626",
          email: "2988372626@telnet.co.id",
          password: "2988372626",
        },
      };
    }
  },

  // Get activation by ID
  getActivationById: async (
    id: string
  ): Promise<{ success: boolean; data: PSBActivation }> => {
    try {
      console.log("PSB Activation API: Fetching activation by ID:", id);
      const response = await apiClient.get(
        `${API_ENDPOINTS.PSB.ACTIVATIONS}/${id}`
      );
      console.log(
        "PSB Activation API: Activation by ID response:",
        response.data
      );
      return response.data as { success: boolean; data: PSBActivation };
    } catch (error) {
      console.error(
        "PSB Activation API: Error fetching activation by ID:",
        error
      );
      throw error;
    }
  },

  // Submit signatures for activation (Teknisi only)
  submitSignature: async (
    id: string,
    signatureData: {
      technicianSignature: string;
      customerSignature: string;
      installationReport?: {
        speedTest?: { download?: number; upload?: number; ping?: number };
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
      };
    }
  ): Promise<{ success: boolean; data: PSBActivation }> => {
    try {
      console.log(
        "PSB Activation API: Submitting signature:",
        id,
        signatureData
      );
      const response = await apiClient.post(
        `${API_ENDPOINTS.PSB.ACTIVATIONS}/${id}/signature`,
        signatureData
      );
      console.log("PSB Activation API: Signature response:", response.data);
      return response.data as { success: boolean; data: PSBActivation };
    } catch (error) {
      console.error("PSB Activation API: Error submitting signature:", error);
      throw error;
    }
  },

  // Update installation report (CS/SuperAdmin only)
  updateInstallationReport: async (
    id: string,
    reportData: {
      speedTest?: { download?: number; upload?: number; ping?: number };
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
      packageSpeed?: number;
      fastelNumber?: string;
      contactPerson?: string;
    }
  ): Promise<{ success: boolean; data: PSBActivation }> => {
    try {
      console.log(
        "PSB Activation API: Updating installation report:",
        id,
        reportData
      );
      const response = await apiClient.put(
        `${API_ENDPOINTS.PSB.ACTIVATIONS}/${id}/installation-report`,
        reportData
      );
      console.log(
        "PSB Activation API: Installation report updated:",
        response.data
      );
      return response.data as { success: boolean; data: PSBActivation };
    } catch (error) {
      console.error(
        "PSB Activation API: Error updating installation report:",
        error
      );
      throw error;
    }
  },
};
