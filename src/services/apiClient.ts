import { ENV, API_ENDPOINTS } from "@/config/environment";
import { logger } from "@/utils/logger";
import {
  apiCircuitBreakers,
  requestDeduplicator,
} from "@/utils/circuitBreaker";
import { globalRequestThrottler } from "@/utils/requestThrottler";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse extends ApiResponse {
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    permissions?: string[];
  };
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public endpoint?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  private config: ApiClientConfig;
  private token: string | null = null;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseURL: ENV.API_BASE_URL,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };

    // 🟢 Load token automatically from localStorage on init
    try {
      const stored = localStorage.getItem("auth-token");
      if (stored) {
        this.token = stored;
        console.log(
          "[API CLIENT] Loaded token from localStorage:",
          this.token.substring(0, 15) + "..."
        );
      } else {
        console.warn("[API CLIENT] No token found in localStorage");
      }
    } catch (err) {
      console.error("[API CLIENT] Failed to load token:", err);
    }
    // 🔁 Verify token if exists (optional safety check)
    if (this.token) {
      this.verifyToken().catch(() => {
        console.warn("[API CLIENT] Stored token invalid, clearing...");
        this.setToken(null);
      });
    }
  }

  // Add request interceptor to catch and fix incorrect alert paths
  private interceptEndpoint(endpoint: string, method: string): string {
    // Fix any incorrect /alerts paths to /api/alerts
    if (endpoint.includes("/alerts") && !endpoint.includes("/api/alerts")) {
      const correctedEndpoint = endpoint.replace(/^\/alerts/, "/api/alerts");
      logger.warn(`API Path Auto-Corrected [${method}]`, {
        original: endpoint,
        corrected: correctedEndpoint,
        stack: new Error().stack?.split("\n").slice(1, 4).join("\n"),
      });
      return correctedEndpoint;
    }
    return endpoint;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) localStorage.setItem("auth-token", token);
    else localStorage.removeItem("auth-token");
  }

  getToken(): string | null {
    if (!this.token) {
      const stored = localStorage.getItem("auth-token");
      if (stored) {
        this.token = stored;
        console.log("[API CLIENT] Token restored from localStorage");
      }
    }
    return this.token;
  }

  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<ApiResponse<T>> {
    // Check global rate limiting
    if (!globalRequestThrottler.canMakeRequest(endpoint)) {
      throw new ApiClientError(
        "Rate limit exceeded",
        429,
        "RATE_LIMITED",
        endpoint
      );
    }

    globalRequestThrottler.recordRequest(endpoint);

    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (response.status === 401) {
        // Try to refresh token first
        if (!endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
          try {
            logger.info("Attempting token refresh due to 401", { endpoint });
            const refreshResponse = await this.post(API_ENDPOINTS.AUTH.REFRESH);
            
            if (refreshResponse.success && refreshResponse.data && typeof refreshResponse.data === 'object' && 'token' in refreshResponse.data) {
              const token = (refreshResponse.data as { token: string }).token;
              this.setToken(token);
              logger.info("Token refreshed successfully, retrying original request");
              // Retry original request with new token
              return this.makeRequest(endpoint, options, 1);
            }
          } catch (refreshError) {
            logger.warn("Token refresh failed, clearing session", { refreshError });
          }
        }
        
        // Only clear auth if refresh failed or on auth endpoints
        this.token = null;
        localStorage.removeItem("auth-token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastLoginTime");
        logger.info("401 Unauthorized - session cleared");
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        
        throw new ApiClientError(
          "Authentication required",
          401,
          "UNAUTHORIZED",
          endpoint
        );
      }

      if (response.status === 403) {
        throw new ApiClientError(
          "Access forbidden",
          403,
          "FORBIDDEN",
          endpoint
        );
      }

      if (response.status === 429) {
        // Rate limited - implement exponential backoff
        if (attempt <= this.config.retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.makeRequest(endpoint, options, attempt + 1);
        }
        throw new ApiClientError(
          "Too many requests",
          429,
          "RATE_LIMITED",
          endpoint
        );
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          const responseText = await response.text();
          // Check if response is JSON
          if (responseText.startsWith("{") || responseText.startsWith("[")) {
            errorData = JSON.parse(responseText);
          } else {
            // Server returned HTML or plain text (likely error page)
            throw new ApiClientError(
              `Server error: ${response.status} ${response.statusText}. Server returned HTML instead of JSON.`,
              response.status,
              "HTML_RESPONSE",
              endpoint
            );
          }
        } catch (parseError) {
          if (parseError instanceof ApiClientError) {
            throw parseError;
          }
          throw new ApiClientError(
            `HTTP ${response.status}: ${response.statusText} (Invalid JSON response)`,
            response.status,
            "INVALID_JSON",
            endpoint
          );
        }

        throw new ApiClientError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          endpoint,
          errorData
        );
      }

      let result: any;
      try {
        const responseText = await response.text();
        if (responseText.startsWith("{") || responseText.startsWith("[")) {
          result = JSON.parse(responseText);
        } else {
          throw new ApiClientError(
            "Server returned HTML instead of JSON. Check server configuration.",
            200,
            "HTML_RESPONSE",
            endpoint
          );
        }
      } catch (parseError) {
        if (parseError instanceof ApiClientError) {
          throw parseError;
        }
        throw new ApiClientError(
          "Invalid JSON response from server",
          200,
          "INVALID_JSON",
          endpoint
        );
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError(
          `Request timeout: ${endpoint}`,
          408,
          "TIMEOUT",
          endpoint
        );
      }

      // Network error - retry if possible
      if (
        attempt <= this.config.retries &&
        !(error instanceof ApiClientError)
      ) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        return this.makeRequest(endpoint, options, attempt + 1);
      }

      throw new ApiClientError(
        error instanceof Error ? error.message : "Unknown error",
        undefined,
        "NETWORK_ERROR",
        endpoint
      );
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    endpoint = this.interceptEndpoint(endpoint, "GET");
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    // Stable key per endpoint + token to properly deduplicate concurrent calls
    const requestKey = `GET:${endpoint}:${
      this.token?.substring(0, 10) || "anonymous"
    }`;

    return requestDeduplicator.deduplicate(requestKey, () =>
      circuitBreaker.execute(() =>
        this.makeRequest<T>(endpoint, { method: "GET" })
      )
    );
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    endpoint = this.interceptEndpoint(endpoint, "POST");
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    endpoint = this.interceptEndpoint(endpoint, "PUT");
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    endpoint = this.interceptEndpoint(endpoint, "PATCH");
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    endpoint = this.interceptEndpoint(endpoint, "DELETE");
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, { method: "DELETE" })
    );
  }

  private getCircuitBreaker(endpoint: string) {
    if (endpoint.includes("/products")) return apiCircuitBreakers.products;
    if (endpoint.includes("/analytics")) return apiCircuitBreakers.analytics;
    if (endpoint.includes("/auth")) return apiCircuitBreakers.auth;
    return apiCircuitBreakers.products; // default
  }

  // Health check with exponential backoff
  async healthCheck(): Promise<ApiResponse> {
    try {
      // Skip circuit breaker for health checks but add retry logic
      return await this.makeRequest(API_ENDPOINTS.HEALTH, { method: "GET" }, 1);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "RATE_LIMITED") {
        // Don't spam health checks when rate limited
        throw new ApiClientError(
          "Health check rate limited - please wait",
          429,
          "HEALTH_RATE_LIMITED"
        );
      }
      throw error;
    }
  }

  // Auth methods (disable retry for auth)
  async login(
    email: string,
    password: string,
    deviceFingerprint?: any
  ): Promise<LoginResponse> {
    // Reset circuit breakers on login attempt
    Object.values(apiCircuitBreakers).forEach((cb) => cb.reset());

    return this.makeRequest(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      1
    ); // Single attempt, no retries
  }

  async refreshToken(): Promise<ApiResponse> {
    return this.post(API_ENDPOINTS.AUTH.REFRESH);
  }

  async verifyToken(): Promise<ApiResponse> {
    return this.get(API_ENDPOINTS.AUTH.VERIFY);
  }
}

// Default client instance
export const apiClient = new ApiClient();
export default apiClient;
