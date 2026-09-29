export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
      <p>
        Privasi terjamin: Kami tidak pernah menyimpan atau mencatat riwayat URL Anda di server.
      </p>
      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">
        Rate limit: 10 permintaan per menit per IP untuk mencegah penyalahgunaan.
      </p>
    </footer>
  );
}
