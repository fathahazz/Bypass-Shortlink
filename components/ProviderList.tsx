"use client";

import { useEffect, useState } from "react";
import { ProviderStatusItem, ProviderStatus } from "@/lib/types";

export function ProviderList() {
  const [providers, setProviders] = useState<ProviderStatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await fetch("/api/providers");
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        }
      } catch {
        // Abaikan jika gagal memuat, list akan tetap menampilkan state default
      } finally {
        setLoading(false);
      }
    }

    loadProviders();
  }, []);

  const getStatusBadge = (status: ProviderStatus, rate: number | null) => {
    switch (status) {
      case "operational":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Normal {rate !== null && `(${rate}%)`}
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Terganggu {rate !== null && `(${rate}%)`}
          </span>
        );
      case "down":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Gangguan {rate !== null && `(${rate}%)`}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Standby
          </span>
        );
    }
  };

  return (
    <section aria-labelledby="providers-heading" className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h2
          id="providers-heading"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
        >
          Provider yang Didukung
        </h2>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Status dihitung dari 20 request terakhir
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {p.name}
              </span>
              {getStatusBadge(p.status, p.successRate)}
            </div>

            <div className="mt-2 space-y-1">
              <p className="break-anywhere text-[11px] text-zinc-500 dark:text-zinc-400">
                {p.domains.join(", ")}
              </p>
              <p className="break-anywhere font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                Contoh: {p.example}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="col-span-full py-4 text-center text-xs text-zinc-400">
            Memuat daftar provider...
          </div>
        )}
      </div>
    </section>
  );
}
