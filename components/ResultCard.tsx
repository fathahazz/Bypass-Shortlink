"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { BypassSuccessResponse } from "@/lib/types";

interface ResultCardProps {
  result: BypassSuccessResponse;
}

export function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback manual jika navigator clipboard gagal
      const textarea = document.createElement("textarea");
      textarea.value = result.targetUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      aria-label="Hasil Bypass"
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          URL Tujuan Terbuka
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {result.provider}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {result.source === "external" ? "API" : "Native"}
          </span>
        </div>
      </div>

      <div className="my-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-850 dark:bg-zinc-950">
        <p className="break-anywhere break-all font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {result.targetUrl}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Tersalin ke papan klip" : "Salin URL tujuan"}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-750 dark:focus-visible:ring-zinc-600"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Tersalin
              </span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
              <span>Salin URL</span>
            </>
          )}
        </button>

        <a
          href={result.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:opacity-90 dark:focus-visible:ring-zinc-400"
        >
          <span>Buka Link</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
