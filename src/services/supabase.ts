import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Configuration Supabase - OMEX Gestion Commerciale
// Lecture robuste des variables en runtime:
// 1) expo-constants (expoConfig.extra ou manifest2.extra)
// 2) fallback process.env (injection Metro au build)
const extra = (Constants?.expoConfig?.extra as Record<string, any>)
  || (Constants as any)?.manifest2?.extra
  || {};

// 3) fallback final: valeurs publiques connues de .env (anon key = publique par conception)
const FALLBACK_URL = 'https://znfrixnupnnufkudggdk.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZnJpeG51cG5udWZrdWRnZ2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTMyMTQsImV4cCI6MjA3MTI4OTIxNH0.ng48pR-baXccj2pg77U32en_1E26-ctpMlTnH41-Niw';

const supabaseUrl: string | undefined =
  extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseKey: string | undefined =
  extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Aide au débogage si les variables ne sont pas injectées
  console.error('[Supabase] Variables manquantes.');
  console.error('EXPO_PUBLIC_SUPABASE_URL (extra/env):', extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY présent:', !!(extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY));
  throw new Error('Configuration Supabase invalide: définissez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Alias pour compatibilité avec l'ancien code
export const db = supabase;
export const auth = supabase.auth;
export const storage = supabase.storage;

export default supabase;
