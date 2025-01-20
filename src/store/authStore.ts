import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
    set({ user: data.user });
  },
  signUp: async (email, password) => {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) throw signUpError;

    // Create user record in public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: user?.id,
          email: user?.email,
          username: user?.email?.split('@')[0],
        }
      ]);
    
    if (insertError) {
      // Rollback auth signup if user creation fails
      await supabase.auth.signOut();
      throw new Error('Failed to create user profile');
    }

    set({ user });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  initialize: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null });
    });
  },
}));