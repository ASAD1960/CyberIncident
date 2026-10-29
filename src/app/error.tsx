'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">The page could not be loaded. Try again, and contact an administrator if it keeps happening.</p>
      <button
        onClick={reset}
        className="mt-6 w-fit rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Try again
      </button>
    </main>
  );
}
