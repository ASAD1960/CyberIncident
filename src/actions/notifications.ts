'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { markRead } from '@/lib/services/notifications';

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  await markRead(id.data);
  revalidatePath('/', 'layout');
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await requireUser();
  await markRead();
  revalidatePath('/', 'layout');
}
