export interface ResolverAdapter {
  id: string;
  canHandle(url: string): boolean;
  resolve(url: string, signal?: AbortSignal): Promise<string>;
}

export interface ResolverExecutionResult {
  targetUrl: string;
  source: "external" | "native";
  resolverId: string;
}
