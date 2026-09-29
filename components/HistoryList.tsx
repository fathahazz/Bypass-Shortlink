"use client";

import { useState } from "react";
import { Trash2, ExternalLink, Copy, Check, Clock } from "lucide-react";
import { HistoryItem } from "@/lib/types";

interface HistoryListProps {
  items: HistoryItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryList({
  items,
  onDeleteItem,
  onClearAll,
}: HistoryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // fallback
    }
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      }).format(date);
    } catch {
      return "";
    }
  };

  return (
    <section aria-labelledby="history-heading" className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          <h2
            id="history-heading"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
          >
            Riwayat Tersimpan ({items.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="min-h-[44px] px-2 text-xs font-medium text-zinc-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-red-400 dark:focus-visible:ring-zinc-600"
        >
          Hapus Semua
        </button>
      </div>

      {/* Kartu bertumpuk (Stacked Cards), rapi di mobile & desktop tanpa horizontal scroll */}
      <ul className="space-y-2.5" role="list">
        {items.map((item) => {
          const isCopied = copiedId === item.id;

          return (
            <li
              key={item.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 shadow-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.provider}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.targetUrl)}
                    aria-label="Salin URL tujuan"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-600"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>

                  <a
                    href={item.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Buka URL tujuan di tab baru"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label="Hapus item ini dari riwayat"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400 dark:focus-visible:ring-zinc-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-1 space-y-1">
                <p className="break-anywhere break-all font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.targetUrl}
                </p>
                <p className="break-anywhere break-all text-[11px] text-zinc-400 dark:text-zinc-500">
                  Asal: {item.originalUrl}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
