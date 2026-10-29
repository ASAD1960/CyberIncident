import type { Metadata } from 'next';
import { toggleCategoryAction } from '@/actions/admin';
import { SettingsForm } from '@/components/admin/admin-forms';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { requireRole } from '@/lib/auth/session';
import { getCategories, getSettings } from '@/lib/services/settings';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireRole('admin');
  const [settings, categories] = await Promise.all([getSettings(), getCategories({ includeInactive: true })]);

  return (
    <>
      <PageHeader title="Settings" description="Evidence access, upload limits, and which categories reporters can choose." />
      <div className="space-y-6">
        <section className="panel p-6" aria-labelledby="ev-h">
          <h2 id="ev-h" className="panel-title mb-4">Evidence</h2>
          <SettingsForm settings={settings} />
        </section>

        <section className="panel" aria-labelledby="cat-h">
          <div className="border-b border-line px-6 py-4">
            <h2 id="cat-h" className="panel-title">Incident categories</h2>
            <p className="text-sm text-muted">Turning a category off hides it from new reports. Existing incidents keep it.</p>
          </div>
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3 px-6 py-3">
                <div>
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted">{c.is_active ? 'Available to reporters' : 'Hidden from new reports'}</p>
                </div>
                <form action={toggleCategoryAction}>
                  <input type="hidden" name="key" value={c.key} />
                  <input type="hidden" name="active" value={String(!c.is_active)} />
                  <Button type="submit" variant="secondary" className="py-1.5">{c.is_active ? 'Turn off' : 'Turn on'}</Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
