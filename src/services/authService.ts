import { supabase } from './supabase';
import { User } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export class AuthService {
  // Inscription
  static async signUp(
    email: string,
    password: string,
    businessName: string,
    extras?: {
      displayName?: string;
      phone?: string;
      country?: string;
      language?: User['language'];
      companySize?: User['companySize'];
      sector?: string;
      interest?: User['interest'];
    }
  ): Promise<User> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création de l\'utilisateur');

      // Créer le profil utilisateur dans la table users
      const userData: User = {
        id: authData.user.id,
        email: authData.user.email!,
        businessName,
        displayName: extras?.displayName,
        phone: extras?.phone,
        country: extras?.country,
        language: extras?.language,
        companySize: extras?.companySize,
        sector: extras?.sector,
        interest: extras?.interest,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          business_name: userData.businessName,
          display_name: userData.displayName,
          phone: userData.phone,
          country: userData.country,
          language: userData.language,
          company_size: userData.companySize,
          sector: userData.sector,
          interest: userData.interest,
        });

      if (insertError) throw insertError;
      return userData;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Connexion
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la connexion');

      // Récupérer les données utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('Profil utilisateur non trouvé');

      return {
        id: userData.id,
        email: userData.email,
        displayName: userData.display_name ?? undefined,
        businessName: userData.business_name ?? undefined,
        businessAddress: userData.business_address ?? undefined,
        phone: userData.phone ?? undefined,
        country: userData.country ?? undefined,
        language: userData.language ?? undefined,
        companySize: userData.company_size ?? undefined,
        sector: userData.sector ?? undefined,
        tags: userData.tags ?? undefined,
        interest: userData.interest ?? undefined,
        logoUrl: userData.logo_url ?? undefined,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Déconnexion
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Réinitialisation du mot de passe
  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Récupérer l'utilisateur actuel
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return null;

      // Récupérer les données utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData) return null;

      return {
        id: userData.id,
        email: userData.email,
        displayName: userData.display_name ?? undefined,
        businessName: userData.business_name ?? undefined,
        businessAddress: userData.business_address ?? undefined,
        phone: userData.phone ?? undefined,
        country: userData.country ?? undefined,
        language: userData.language ?? undefined,
        companySize: userData.company_size ?? undefined,
        sector: userData.sector ?? undefined,
        tags: userData.tags ?? undefined,
        interest: userData.interest ?? undefined,
        logoUrl: userData.logo_url ?? undefined,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }
}

// Helpers de profil & stockage
export async function uploadLogoToStorage(fileUri: string, userId: string): Promise<string> {
  const BUCKET = process.env.EXPO_PUBLIC_SUPABASE_LOGOS_BUCKET || 'logos';
  // Déduire l'extension et le contentType
  const guessExt = (uri: string) => {
    const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    const ext = (m?.[1] || 'jpg').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return ext;
    return 'jpg';
  };
  const ext = guessExt(fileUri);
  const contentType = ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : 'image/jpeg';

  const fileName = `${Date.now()}.${ext}`;
  // Toujours utiliser l'UID de l'utilisateur authentifié pour respecter la policy RLS
  let ownerId = userId;
  try {
    const { data: authInfo, error: authErr } = await supabase.auth.getUser();
    if (!authErr && authInfo?.user?.id) {
      ownerId = authInfo.user.id;
    }
  } catch {}
  const filePath = `${ownerId}/${fileName}`;

  // Logs de diagnostic (retirer en prod si besoin)
  try {
    const { data: authInfo } = await supabase.auth.getUser();
    console.debug('[uploadLogoToStorage] bucket:', BUCKET, 'auth.uid:', authInfo?.user?.id, 'filePath:', filePath);
    if (authInfo?.user?.id && authInfo.user.id !== userId) {
      console.warn('[uploadLogoToStorage] Attention: userId passé en param diffère de auth.uid(). Utilisation de auth.uid() pour le chemin.');
    }
  } catch (e) {
    console.debug('[uploadLogoToStorage] impossible de lire auth user pour debug:', e);
  }

  let dataToUpload: any = null;
  let effectiveContentType = contentType;

  if (Platform.OS === 'web') {
    // Web: récupérer un Blob avec timeout et privilégier un File avec le bon content-type
    console.debug('[uploadLogoToStorage] WEB fetch blob start:', fileUri?.slice(0, 30));
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort('blob-fetch-timeout'), 15000);
    try {
      const res = await fetch(fileUri, { signal: controller.signal });
      if (!res.ok) throw new Error(`blob fetch failed: ${res.status}`);
      const blob = await res.blob();
      clearTimeout(t);
      effectiveContentType = blob.type || contentType;
      // Supabase accepte Blob/File/ArrayBuffer; on utilise File pour fournir un nom + type
      dataToUpload = new File([blob], fileName, { type: effectiveContentType });
      console.debug('[uploadLogoToStorage] WEB blob ready. size=', (blob as any).size, 'type=', effectiveContentType);
    } catch (e) {
      clearTimeout(t);
      console.error('[uploadLogoToStorage] WEB blob fetch error:', e);
      throw e;
    }
  } else {
    // Native: utiliser Expo FileSystem (base64 -> Uint8Array)
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const atobLocal = (b64: string): string => {
      if (typeof globalThis !== 'undefined' && typeof (globalThis as any).atob === 'function') {
        return (globalThis as any).atob(b64);
      }
      // Polyfill simple de atob
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = '';
      let i = 0;
      b64 = b64.replace(/\s/g, '');
      for (; i < b64.length;) {
        const enc1 = chars.indexOf(b64.charAt(i++));
        const enc2 = chars.indexOf(b64.charAt(i++));
        const enc3 = chars.indexOf(b64.charAt(i++));
        const enc4 = chars.indexOf(b64.charAt(i++));
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        str += String.fromCharCode(chr1);
        if (enc3 !== 64) str += String.fromCharCode(chr2);
        if (enc4 !== 64) str += String.fromCharCode(chr3);
      }
      return str;
    };
    const binary = atobLocal(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    dataToUpload = bytes;
  }

  console.debug('[uploadLogoToStorage] Upload start ->', BUCKET, filePath, 'type=', effectiveContentType);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    // Important: pas d'upsert pour rester compatible avec une policy INSERT uniquement
    .upload(filePath, dataToUpload, { contentType: effectiveContentType, upsert: false });
  if (uploadError) {
    if ((uploadError as any)?.message?.includes('Bucket not found')) {
      throw new Error(`Storage bucket "${BUCKET}" introuvable. Créez-le dans Supabase Storage ou définissez EXPO_PUBLIC_SUPABASE_LOGOS_BUCKET.`);
    }
    if ((uploadError as any)?.message?.toLowerCase().includes('row-level security')) {
      throw new Error(`RLS: Écriture interdite dans le bucket "${BUCKET}" pour le chemin "${filePath}". Vérifiez vos policies (INSERT sur dossier auth.uid()) et que vous êtes connecté.`);
    }
    throw uploadError;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

// Parse a Supabase public URL and extract bucket and internal path
export function getStoragePathFromPublicUrl(publicUrl: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(publicUrl);
    const marker = '/storage/v1/object/public/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + marker.length); // `${bucket}/${path}`
    const firstSlash = rest.indexOf('/');
    if (firstSlash === -1) return null;
    const bucket = rest.slice(0, firstSlash);
    const path = rest.slice(firstSlash + 1);
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

// Delete a file in Supabase Storage given its public URL
export async function deleteStorageFileByPublicUrl(publicUrl: string): Promise<void> {
  const info = getStoragePathFromPublicUrl(publicUrl);
  if (!info) return; // nothing to do if not a valid public URL
  const { bucket, path } = info;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error && !String(error.message || '').toLowerCase().includes('not found')) {
    // Swallow not-found, throw other errors for visibility
    throw error;
  }
}

export async function updateUserProfile(userId: string, patch: Partial<User>): Promise<User> {
  const update: any = {};
  if (patch.displayName !== undefined) update.display_name = patch.displayName;
  if (patch.businessName !== undefined) update.business_name = patch.businessName;
  if (patch.businessAddress !== undefined) update.business_address = patch.businessAddress;
  if (patch.logoUrl !== undefined) update.logo_url = patch.logoUrl;
  if (patch.phone !== undefined) update.phone = patch.phone;
  if (patch.country !== undefined) update.country = patch.country;
  if (patch.language !== undefined) update.language = patch.language;
  if (patch.companySize !== undefined) update.company_size = patch.companySize;
  if (patch.sector !== undefined) update.sector = patch.sector;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.interest !== undefined) update.interest = patch.interest;

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name ?? undefined,
    businessName: data.business_name ?? undefined,
    businessAddress: data.business_address ?? undefined,
    phone: data.phone ?? undefined,
    country: data.country ?? undefined,
    language: data.language ?? undefined,
    companySize: data.company_size ?? undefined,
    sector: data.sector ?? undefined,
    tags: data.tags ?? undefined,
    interest: data.interest ?? undefined,
    logoUrl: data.logo_url ?? undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
