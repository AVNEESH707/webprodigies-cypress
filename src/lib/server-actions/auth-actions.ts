'use server';

import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { FormSchema } from '../types';
import { cookies } from 'next/headers';

export async function actionLoginUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
        },
      };
    }
    return {
      data,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
    return {
      data: null,
      error: {
        message: errorMessage,
      },
    };
  }
}

export async function actionSignUpUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);

    if (data?.length) {
      return {
        data: null,
        error: { message: 'User already exists' },
      };
    }
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}api/auth/callback`,
      },
    });
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
        },
      };
    }
    return {
      data: signUpData,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup';
    return {
      data: null,
      error: {
        message: errorMessage,
      },
    };
  }
}
