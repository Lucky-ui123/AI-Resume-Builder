'use server'

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();

  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    const cookieStore = await cookies();
    cookieStore.set('mock_user_name', fullName || 'User', { path: '/' });
    cookieStore.set('mock_user_email', email || 'demo@example.com', { path: '/' });
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard', 'layout');
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: email || undefined,
    data: {
      full_name: fullName
    }
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}
