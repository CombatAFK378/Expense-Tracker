export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-7 sm:px-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-800/70" />
      <div className="mt-6 h-6 w-40 animate-pulse rounded-lg bg-zinc-800/60" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="mt-4 h-12 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50" />
      ))}
    </main>
  );
}