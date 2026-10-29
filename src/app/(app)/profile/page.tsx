import type { Metadata } from 'next';
import { ProfileForm } from '@/components/admin/admin-forms';
import { PageHeader } from '@/components/ui/page-header';
import { requireUser } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Profile" description={`${ROLE_LABELS[user.profile.role]} · member since ${formatDate(user.profile.created_at)}`} />
      <div className="panel p-6">
        <ProfileForm profile={user.profile} />
      </div>
    </>
  );
}
