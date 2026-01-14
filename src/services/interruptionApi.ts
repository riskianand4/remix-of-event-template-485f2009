import { apiClient } from "@/services/apiClient";
import { handleApiResponse, safeApiCall } from "@/services/apiResponseHandler";
import {
  InterruptionReport,
  InterruptionAnalytics,
  CreateInterruptionReport,
} from "@/types/interruption";

// Get all interruption reports
export const getAllInterruptionReports = async (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  technician?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  reports: InterruptionReport[];
  total: number;
  pagination: any;
}> => {
  const queryParams = new URLSearchParams();

  if (filters?.page) queryParams.append("page", filters.page.toString());
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.technician) queryParams.append("technician", filters.technician);
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.startDate) queryParams.append("startDate", filters.startDate);
  if (filters?.endDate) queryParams.append("endDate", filters.endDate);

  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/interruption-reports?${queryParams.toString()}`),
    "Failed to fetch interruption reports"
  );

  if (response.success) {
    const reports = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
    const total = response.data?.pagination?.total || reports.length || 0;

    console.log("✅ Parsed interruption reports:", reports);
    return { reports, total, pagination: response.data?.pagination || {} };
  }

  return { reports: [], total: 0, pagination: {} };
};

// Get single interruption report
export const getInterruptionReportById = async (
  id: string
): Promise<InterruptionReport | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/interruption-reports/${id}`),
    "Failed to fetch interruption report"
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Lookup service number from PSB
export const lookupServiceNumber = async (
  serviceNumber: string
): Promise<{
  serviceNumber: string;
  customerName: string;
  address: string;
  contactNumber: string;
} | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/interruption-reports/lookup/${serviceNumber}`),
    "Service number not found"
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Get technicians
export const getTechnicians = async (): Promise<
  Array<{ _id: string; name: string; email?: string }>
> => {
  console.log("🔍 Fetching technicians from API...");

  const response = await safeApiCall<any>(
    () => apiClient.get("/api/interruption-reports/meta/technicians"),
    "Failed to fetch technicians"
  );

  console.log("📡 Technician API Response:", response);

  if (response.success) {
    const technicians = response.data?.data || response.data || [];
    console.log("✅ Technicians loaded:", technicians);
    return technicians;
  }

  console.warn("⚠️ No technicians found or API failed");
  return [];
};

// Get interruption types
export const getInterruptionTypes = async (): Promise<string[]> => {
  const response = await safeApiCall<any>(
    () => apiClient.get("/api/interruption-reports/meta/types"),
    "Failed to fetch interruption types"
  );

  if (response.success && response.data) {
    return response.data.data || [];
  }

  return [];
};

// Get ticket statuses
export const getTicketStatuses = async (): Promise<string[]> => {
  const response = await safeApiCall<any>(
    () => apiClient.get("/api/interruption-reports/meta/statuses"),
    "Failed to fetch ticket statuses"
  );

  if (response.success && response.data) {
    return response.data.data || [];
  }

  return [];
};

// Get analytics
export const getInterruptionAnalytics = async (filters?: {
  period?: "today" | "week" | "month" | "year" | "5years";
  startDate?: string;
  endDate?: string;
}): Promise<InterruptionAnalytics | null> => {
  const queryParams = new URLSearchParams();

  if (filters?.period) queryParams.append("period", filters.period);
  if (filters?.startDate) queryParams.append("startDate", filters.startDate);
  if (filters?.endDate) queryParams.append("endDate", filters.endDate);

  const response = await safeApiCall<any>(
    () =>
      apiClient.get(
        `/api/interruption-reports/analytics/dashboard?${queryParams.toString()}`
      ),
    "Failed to fetch analytics"
  );

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

// Create interruption report
export const createInterruptionReport = async (
  reportData: CreateInterruptionReport
): Promise<InterruptionReport | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.post("/api/interruption-reports", reportData),
    "Failed to create interruption report"
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Update interruption report
export const updateInterruptionReport = async (
  id: string,
  updateData: Partial<CreateInterruptionReport>
): Promise<InterruptionReport | null> => {
  // Client-side validation
  if (updateData.closeTime && updateData.openTime) {
    const openTime = new Date(updateData.openTime);
    const closeTime = new Date(updateData.closeTime);

    if (closeTime <= openTime) {
      throw new Error("Waktu selesai harus lebih besar dari waktu open");
    }
  }

  if (updateData.ttr !== undefined && updateData.ttr <= 0) {
    throw new Error("TTR harus lebih besar dari 0");
  }

  const response = await safeApiCall<any>(
    () => apiClient.put(`/api/interruption-reports/${id}`, updateData),
    "Failed to update interruption report"
  );

  if (response.success && response.data) {
    return response.data.data;
  }

  return null;
};

// Delete interruption report
export const deleteInterruptionReport = async (
  id: string
): Promise<boolean> => {
  const response = await safeApiCall<boolean>(
    () => apiClient.delete(`/api/interruption-reports/${id}`),
    "Failed to delete interruption report"
  );

  return response.success;
};

export default {
  getAllInterruptionReports,
  getInterruptionReportById,
  lookupServiceNumber,
  getTechnicians,
  getInterruptionTypes,
  getTicketStatuses,
  getInterruptionAnalytics,
  createInterruptionReport,
  updateInterruptionReport,
  deleteInterruptionReport,
};
