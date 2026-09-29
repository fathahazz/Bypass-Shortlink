import { NextResponse } from "next/server";
import { getAllProviders } from "@/lib/providers";
import { getProviderHealth } from "@/lib/metrics";
import { ProvidersApiResponse, ProviderStatusItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = getAllProviders();

  const providerStatuses: ProviderStatusItem[] = await Promise.all(
    providers.map(async (p) => {
      const health = await getProviderHealth(p.id);
      return {
        id: p.id,
        name: p.name,
        domains: p.domains,
        example: p.example,
        status: health.status,
        successRate: health.successRate,
        totalSamples: health.totalSamples,
      };
    })
  );

  const response: ProvidersApiResponse = {
    providers: providerStatuses,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
