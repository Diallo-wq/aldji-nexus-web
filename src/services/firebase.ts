import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - OMEX Gestion Commerciale
// Remplacez ces valeurs par vos vraies clés Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

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
