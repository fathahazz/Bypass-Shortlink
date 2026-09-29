import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Link Bypass — Resolver Shortlink Cepat & Aman",
  description:
    "Bypass dan unshorten berbagai jenis shortlink dan ad-link ke URL tujuan asli secara instan tanpa iklan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <head>
        {/* Script pencegah flash tema (FOUC). Menjalankan mode gelap sebagai DEFAULT. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-200 selection:text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-zinc-800 dark:selection:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
