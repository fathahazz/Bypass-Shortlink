export type ErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED"
  | "RATE_LIMITED"
  | "UPSTREAM_FAILED"
  | "TIMEOUT";

export type ProviderStatus = "operational" | "degraded" | "down" | "unknown";

export interface ProviderConfig {
  id: string;
  name: string;
  domains: string[];
  pattern?: RegExp;
  example: string;
  description?: string;
}

export interface BypassRequest {
  url: string;
}

export interface BypassSuccessResponse {
  success: true;
  targetUrl: string;
  originalUrl: string;
  provider: string;
  source: "external" | "native";
}

export interface BypassErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type BypassResponse = BypassSuccessResponse | BypassErrorResponse;

export interface HistoryItem {
  id: string;
  originalUrl: string;
  targetUrl: string;
  provider: string;
  timestamp: number;
}

export interface ProviderStatusItem {
  id: string;
  name: string;
  domains: string[];
  example: string;
  status: ProviderStatus;
  successRate: number | null;
  totalSamples: number;
}

export interface ProvidersApiResponse {
  providers: ProviderStatusItem[];
}
