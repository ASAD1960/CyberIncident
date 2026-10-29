'use client';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-xl space-y-4">
      <Alert tone="error">This page could not be loaded. Try again, and contact an administrator if it keeps happening.</Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
