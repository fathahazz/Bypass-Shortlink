"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { BypassResponse, BypassSuccessResponse } from "@/lib/types";

interface BypassFormProps {
  onSuccess: (data: BypassSuccessResponse) => void;
}

export function BypassForm({ onSuccess }: BypassFormProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Bersihkan interval saat unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const startCountdown = (seconds: number) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setRetryCountdown(seconds);

    countdownIntervalRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setErrorMessage(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    if (retryCountdown !== null && retryCountdown > 0) {
      setErrorMessage(`Mohon tunggu ${retryCountdown} detik sebelum mencoba lagi.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: BypassResponse = await response.json();

      if (!response.ok || !data.success) {
        const customMessage = !data.success ? data.error.message : null;

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const waitTime = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
          startCountdown(waitTime);
          setErrorMessage(
            customMessage ||
              `Batas 10 request/menit tercapai. Tunggu ${waitTime} detik.`
          );
        } else {
          setErrorMessage(
            customMessage ||
              "Gagal memproses shortlink. Silakan coba sesaat lagi."
          );
        }
        return;
      }

      // Berhasil
      onSuccess(data);
    } catch {
      setErrorMessage(
        "Koneksi jaringan terputus atau server tidak merespons. Silakan periksa koneksi Anda."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMessage(null);
      }
    } catch {
      // Browser clipboard permission ditolak, tidak apa-apa
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div>
        <label
          htmlFor="bypass-url"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5"
        >
          Masukkan URL Shortlink
        </label>
        <div className="relative flex flex-col sm:flex-row gap-2">
          <input
            id="bypass-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            required
            disabled={isLoading || (retryCountdown !== null && retryCountdown > 0)}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="https://sfl.gl/..., https://linkvertise.com/..."
            className="w-full min-h-[44px] rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[16px] text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus-visible:ring-zinc-600 dark:disabled:bg-zinc-950 dark:disabled:text-zinc-600"
          />

          <div className="flex gap-2 shrink-0">
            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-600"
              >
                Tempel
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim() || (retryCountdown !== null && retryCountdown > 0)}
              className="inline-flex w-full sm:w-auto min-h-[44px] min-w-[110px] items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:opacity-90 dark:focus-visible:ring-zinc-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Bypass</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Countdown Rate Limit Banner */}
      {retryCountdown !== null && retryCountdown > 0 && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Rate limit aktif. Anda dapat mengirim permintaan lagi dalam{" "}
            <strong>{retryCountdown} detik</strong>.
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && retryCountdown === null && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}
    </form>
  );
}
