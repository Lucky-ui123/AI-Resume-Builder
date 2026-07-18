'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const isMockAuthAllowed = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';

export async function login(formData: FormData) {
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Check if supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isMockAuthAllowed) {
      const cookieStore = await cookies();
      cookieStore.set('mock_user_email', data.email || 'demo@example.com', { path: '/' });
      const emailPrefix = data.email ? data.email.split('@')[0] : 'User';
      const parsedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      cookieStore.set('mock_user_name', parsedName, { path: '/' });
      
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    } else {
      return { error: 'Authentication is not configured. Please contact support.' }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  // Check if supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isMockAuthAllowed) {
      const cookieStore = await cookies();
      cookieStore.set('mock_user_email', email || 'demo@example.com', { path: '/' });
      cookieStore.set('mock_user_name', `${firstName || ''} ${lastName || ''}`.trim() || 'User', { path: '/' });
      
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    } else {
      return { error: 'Authentication is not configured. Please contact support.' }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName || ''} ${lastName || ''}`.trim()
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } else {
    const cookieStore = await cookies();
    cookieStore.delete('mock_user_name');
    cookieStore.delete('mock_user_email');
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
