import { supabase } from './supabase';
import { Supplier } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export class SupplierService {
  // Create
  static async createSupplier(userId: string, supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        user_id: userId,
        name: supplier.name,
        type: supplier.type || null,
        contact_person: supplier.contactPerson || null,
        email: supplier.email || null,
        phone: supplier.phone || null,
        address_line1: supplier.addressLine1 || null,
        address_line2: supplier.addressLine2 || null,
        city: supplier.city || null,
        state: supplier.state || null,
        postal_code: supplier.postalCode || null,
        country: supplier.country || null,
        tax_id: supplier.taxId || null,
        vat_number: supplier.vatNumber || null,
        iban: supplier.iban || null,
        bank_name: supplier.bankName || null,
        bank_address: supplier.bankAddress || null,
        products_services: supplier.productsServices || null,
        billing_currency: supplier.billingCurrency || null,
        payment_terms: supplier.paymentTerms || null,
        default_shipping_method: supplier.defaultShippingMethod || null,
        commercial_terms: supplier.commercialTerms || null,
        tags: supplier.tags || null,
        internal_notes: supplier.internalNotes || null,
        logo_url: supplier.logoUrl || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data.id as string;
  }

  // Update
  static async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: updates.name,
        type: updates.type ?? null,
        contact_person: updates.contactPerson ?? null,
        email: updates.email ?? null,
        phone: updates.phone ?? null,
        address_line1: updates.addressLine1 ?? null,
        address_line2: updates.addressLine2 ?? null,
        city: updates.city ?? null,
        state: updates.state ?? null,
        postal_code: updates.postalCode ?? null,
        country: updates.country ?? null,
        tax_id: updates.taxId ?? null,
        vat_number: updates.vatNumber ?? null,
        iban: updates.iban ?? null,
        bank_name: updates.bankName ?? null,
        bank_address: updates.bankAddress ?? null,
        products_services: updates.productsServices ?? null,
        billing_currency: updates.billingCurrency ?? null,
        payment_terms: updates.paymentTerms ?? null,
        default_shipping_method: updates.defaultShippingMethod ?? null,
        commercial_terms: updates.commercialTerms ?? null,
        tags: updates.tags ?? null,
        internal_notes: updates.internalNotes ?? null,
        logo_url: updates.logoUrl ?? null,
      })
      .eq('id', id);
    if (error) throw error;
  }

  // Delete
  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  }

  // Read one
  static async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapRow(data) : null;
  }

  // Read all for a user
  static async getAllSuppliers(userId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return (data || []).map(this.mapRow);
  }

  private static mapRow(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      type: row.type || undefined,
      contactPerson: row.contact_person || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      addressLine1: row.address_line1 || undefined,
      addressLine2: row.address_line2 || undefined,
      city: row.city || undefined,
      state: row.state || undefined,
      postalCode: row.postal_code || undefined,
      country: row.country || undefined,
      taxId: row.tax_id || undefined,
      vatNumber: row.vat_number || undefined,
      iban: row.iban || undefined,
      bankName: row.bank_name || undefined,
      bankAddress: row.bank_address || undefined,
      productsServices: row.products_services || undefined,
      billingCurrency: row.billing_currency || undefined,
      paymentTerms: row.payment_terms || undefined,
      defaultShippingMethod: row.default_shipping_method || undefined,
      commercialTerms: row.commercial_terms || undefined,
      tags: row.tags || undefined,
      internalNotes: row.internal_notes || undefined,
      logoUrl: row.logo_url || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Upload supplier logo to Supabase Storage and return public URL
  static async uploadSupplierLogoToStorage(fileUri: string, userId: string): Promise<string> {
    const BUCKET = process.env.EXPO_PUBLIC_SUPABASE_SUPPLIERS_BUCKET || 'suppliers';

    const guessExt = (uri: string) => {
      const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
      const ext = (m?.[1] || 'jpg').toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext;
      return 'jpg';
    };
    const ext = guessExt(fileUri);
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // Ensure auth uid folder due to RLS
    let ownerId = userId;
    try {
      const { data: authInfo } = await supabase.auth.getUser();
      if (authInfo?.user?.id) ownerId = authInfo.user.id;
    } catch {}

    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${ownerId}/${fileName}`;

    // Cross-platform body preparation
    let body: any;
    let size = 0;
    try {
      if (Platform.OS === 'web') {
        // Web: fetch Blob then upload Blob directly
        const res = await fetch(fileUri);
        if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
        const blob: Blob = await (res as any).blob();
        // Ensure type is set
        const typedBlob = blob.type ? blob : blob.slice(0, blob.size, contentType);
        body = typedBlob;
        size = typedBlob.size || 0;
      } else {
        // Native: Some Android URIs are content:// and cannot be read directly.
        // Re-encode with ImageManipulator to get base64 reliably and reduce size.
        const format = contentType === 'image/png'
          ? ImageManipulator.SaveFormat.PNG
          : contentType === 'image/webp'
          ? ImageManipulator.SaveFormat.WEBP
          : ImageManipulator.SaveFormat.JPEG;
        const result = await ImageManipulator.manipulateAsync(
          fileUri,
          [],
          { compress: 0.85, format, base64: true }
        );
        if (!result.base64) throw new Error('no_base64');
        const bytes = this.base64ToUint8Array(result.base64);
        body = bytes; // Uint8Array
        size = bytes.byteLength;
      }
    } catch (err) {
      throw new Error('Impossible de préparer le fichier pour l\'upload. Essayez une autre image.');
    }

    if (!body || size === 0) {
      throw new Error('Fichier image vide ou illisible. Réessayez avec une autre image.');
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, body as any, { contentType, upsert: false, cacheControl: '3600' });

    if (uploadError) {
      const msg = (uploadError as any)?.message || '';
      if (msg.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${BUCKET}" introuvable. Créez-le dans Supabase Storage ou définissez EXPO_PUBLIC_SUPABASE_SUPPLIERS_BUCKET.`);
      }
      if (msg.toLowerCase().includes('permission')) {
        throw new Error('Permission refusée par les politiques de Storage. Vérifiez les règles RLS du bucket (écriture sous /<user_id>/* pour les utilisateurs authentifiés).');
      }
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('bad request')) {
        throw new Error('Requête invalide par Supabase Storage. Vérifiez le type de fichier et réessayez.');
      }
      throw uploadError as any;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  // Minimal base64 decoder producing a Uint8Array (no atob required)
  private static base64ToUint8Array(b64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let bufferLength = Math.floor(b64.length * 0.75);
    if (b64.endsWith('==')) bufferLength -= 2;
    else if (b64.endsWith('=')) bufferLength -= 1;
    const bytes = new Uint8Array(bufferLength);

    let p = 0;
    for (let i = 0; i < b64.length; ) {
      const enc1 = chars.indexOf(b64[i++]);
      const enc2 = chars.indexOf(b64[i++]);
      const enc3 = chars.indexOf(b64[i++]);
      const enc4 = chars.indexOf(b64[i++]);

      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;

      bytes[p++] = chr1;
      if (enc3 !== 64) bytes[p++] = chr2;
      if (enc4 !== 64) bytes[p++] = chr3;
    }
    return bytes;
  }
}
