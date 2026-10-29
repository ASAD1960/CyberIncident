import { ShieldAlert } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_30rem]">
      <section className="hidden bg-rail p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <ShieldAlert className="h-6 w-6" aria-hidden /> {APP_NAME}
        </div>
        <div className="max-w-lg">
          <h2 className="font-display text-4xl font-semibold leading-tight">See something odd? Say so, and we’ll take it from there.</h2>
          <p className="mt-4 text-lg text-white/75">
            Report phishing, strange sign-ins, malware, or a possible data leak. Every report gets an owner, a status, and a record of what was done.
          </p>
        </div>
        <p className="text-sm text-white/60">Reports are visible only to you and the security team.</p>
      </section>
      <main id="main" className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
