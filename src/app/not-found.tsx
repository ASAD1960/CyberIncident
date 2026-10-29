import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 text-muted">
        It may have been moved, or you may not have access to it. Check the address, or go back to your dashboard.
      </p>
      <Link href="/dashboard" className="mt-6 w-fit rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
        Go to dashboard
      </Link>
    </main>
  );
}
