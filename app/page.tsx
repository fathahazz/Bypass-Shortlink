"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BypassForm } from "@/components/BypassForm";
import { ResultCard } from "@/components/ResultCard";
import { HistoryList } from "@/components/HistoryList";
import { ProviderList } from "@/components/ProviderList";
import { Footer } from "@/components/Footer";
import { BypassSuccessResponse, HistoryItem } from "@/lib/types";

const HISTORY_STORAGE_KEY = "bypass_history_v1";
const MAX_HISTORY_ITEMS = 20;

export default function HomePage() {
  const [currentResult, setCurrentResult] = useState<BypassSuccessResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed: HistoryItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Simpan hasil baru ke localStorage
  const handleSuccess = (result: BypassSuccessResponse) => {
    setCurrentResult(result);

    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalUrl: result.originalUrl,
      targetUrl: result.targetUrl,
      provider: result.provider,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Hilangkan duplikat URL asal yang identik dari riwayat sebelumnya
      const filtered = prev.filter((item) => item.originalUrl !== result.originalUrl);
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Fallback jika kuota localStorage penuh
      }
      return updated;
    });
  };

  const handleDeleteItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAll = () => {
    if (window.confirm("Hapus semua riwayat bypass?")) {
      setHistory([]);
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch {}
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 sm:px-6">
      <Header />

      <main className="flex-1 space-y-6 pt-6 pb-8">
        <section aria-label="Form Input Bypass">
          <BypassForm onSuccess={handleSuccess} />
        </section>

        {currentResult && (
          <section aria-label="Hasil Bypass Terbaru">
            <ResultCard result={currentResult} />
          </section>
        )}

        {isLoaded && (
          <HistoryList
            items={history}
            onDeleteItem={handleDeleteItem}
            onClearAll={handleClearAll}
          />
        )}

        <ProviderList />
      </main>

      <Footer />
    </div>
  );
}
