import type { Metadata } from 'next';
import { randomUUID } from 'node:crypto';
import { IncidentForm } from '@/components/incidents/incident-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireUser } from '@/lib/auth/session';
import { getCategories, getSettings } from '@/lib/services/settings';

export const metadata: Metadata = { title: 'Report an incident' };
export const dynamic = 'force-dynamic';

export default async function NewIncidentPage() {
  await requireUser();
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Report an incident"
        description="Tell us what you saw. The security team reviews every report and will update you here."
      />
      <div className="panel max-w-3xl p-6">
        <IncidentForm
          categories={categories.map((c) => ({ key: c.key, label: c.label }))}
          idempotencyKey={randomUUID()}
          maxFileSizeMb={settings.maxFileSizeMb}
        />
      </div>
    </>
  );
}
