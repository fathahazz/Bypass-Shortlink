"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 py-4 dark:border-zinc-800">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Link Bypass
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Resolver shortlink cepat tanpa jeda iklan
        </p>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-zinc-200 bg-white p-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-600"
      >
        {mounted ? (
          isDark ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )
        ) : (
          <div className="h-4 w-4" />
        )}
      </button>
    </header>
  );
}
