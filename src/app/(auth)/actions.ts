'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const isMockAuthAllowed = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';

export async function login(formData: FormData) {
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Check if supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isMockAuthAllowed) {
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
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Check if supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isMockAuthAllowed) {
      redirect('/dashboard')
    } else {
      return { error: 'Authentication is not configured. Please contact support.' }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp(data)

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
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
