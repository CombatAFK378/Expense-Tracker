export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <div className="mt-7 grid gap-4 lg:grid-cols-[380px_1fr] lg:gap-6">
        <div className="flex flex-col gap-4">
          <div className="h-44 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/70" />
          <div className="h-56 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
      </div>
    </main>
  );
}