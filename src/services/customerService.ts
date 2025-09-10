import { supabase } from './supabase';
import { Customer } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export class CustomerService {
  // Upload d'une image client vers un bucket Storage dédié et retour de l'URL publique
  static async uploadCustomerImageToStorage(fileUri: string, userId: string): Promise<string> {
    const BUCKET = process.env.EXPO_PUBLIC_SUPABASE_CUSTOMERS_BUCKET || 'customers';

    const guessExt = (uri: string) => {
      const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
      const ext = (m?.[1] || 'jpg').toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext;
      return 'jpg';
    };
    const ext = guessExt(fileUri);
    const contentType = ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';

    // Toujours forcer auth.uid() si disponible
    let ownerId = userId;
    try {
      const { data: authInfo } = await supabase.auth.getUser();
      if (authInfo?.user?.id) ownerId = authInfo.user.id;
    } catch {}

    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${ownerId}/${fileName}`;

    let dataToUpload: any = null;
    if (Platform.OS === 'web') {
      const res = await fetch(fileUri);
      const arrayBuffer = await res.arrayBuffer();
      dataToUpload = arrayBuffer;
    } else {
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      // Convertir en bytes (compat RN)
      const atobLocal = (b64: string): string => {
        if (typeof globalThis !== 'undefined' && typeof (globalThis as any).atob === 'function') {
          return (globalThis as any).atob(b64);
        }
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

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, dataToUpload, { contentType, upsert: false });

    if (uploadError) {
      if ((uploadError as any)?.message?.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${BUCKET}" introuvable. Créez-le dans Supabase Storage ou définissez EXPO_PUBLIC_SUPABASE_CUSTOMERS_BUCKET.`);
      }
      if ((uploadError as any)?.message?.toLowerCase().includes('row-level security')) {
        throw new Error(`RLS: Écriture interdite dans le bucket "${BUCKET}" pour le chemin "${filePath}". Vérifiez vos policies et que vous êtes connecté.`);
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }
  // Créer un client
  static async createCustomer(userId: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          name: customer.name,
          email: customer.email ?? null,
          phone: (customer.phone ?? '').toString(),
          address: customer.address ?? null,
          image_url: customer.imageUrl ?? null,
          total_purchases: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      throw new Error(`Erreur lors de la création du client: ${error.message}`);
    }
  }

  // Mettre à jour un client
  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          address: updates.address,
          image_url: updates.imageUrl,
          total_purchases: updates.totalPurchases,
          last_purchase: updates.lastPurchase?.toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour du client: ${error.message}`);
    }
  }

  // Supprimer un client
  static async deleteCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Erreur lors de la suppression du client: ${error.message}`);
    }
  }

  // Récupérer un client par ID
  static async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.transformDatabaseCustomer(data);
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération du client: ${error.message}`);
    }
  }

  // Récupérer tous les clients d'un utilisateur
  static async getCustomers(userId: string): Promise<Customer[]> {
    // Conserve pour compatibilité, mais privilégier getCustomersWithTotals
    return this.getCustomersWithTotals(userId);
  }

  // Récupérer clients avec total des ventes calculé côté client
  static async getCustomersWithTotals(userId: string): Promise<Customer[]> {
    try {
      // Charger clients et ventes en parallèle
      const [customersRes, salesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('user_id', userId)
          .order('name'),
        supabase
          .from('sales')
          .select('id, customer_id, total, created_at')
          .eq('user_id', userId),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (salesRes.error) throw salesRes.error;

      const customers = (customersRes.data || []).map(this.transformDatabaseCustomer);

      // Agréger totaux par client
      const totals = new Map<string, { sum: number; last: string | null }>();
      for (const s of salesRes.data || []) {
        const cid = s.customer_id as string | null;
        if (!cid) continue;
        const entry = totals.get(cid) || { sum: 0, last: null };
        entry.sum += Number(s.total || 0);
        entry.last = !entry.last || (s.created_at && s.created_at > entry.last) ? (s.created_at as string) : entry.last;
        totals.set(cid, entry);
      }

      // Appliquer somme et dernière date d'achat
      return customers.map((c) => {
        const t = totals.get(c.id);
        return {
          ...c,
          totalPurchases: t ? t.sum : 0,
          lastPurchase: t?.last ? new Date(t.last) : c.lastPurchase,
        };
      });
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des clients (totaux): ${error.message}`);
    }
  }

  // Récupérer tous les clients d'un utilisateur
  // static async getCustomers(userId: string): Promise<Customer[]> {
  //   try {
  //     const { data, error } = await supabase
  //       .from('customers')
  //       .select('*')
  //       .eq('user_id', userId)
  //       .order('name');

  //     if (error) throw error;

  //     return data.map(this.transformDatabaseCustomer);
  //   } catch (error: any) {
  //     throw new Error(`Erreur lors de la récupération des clients: ${error.message}`);
  //   }
  // }

  // Rechercher des clients par nom
  static async searchCustomersByName(userId: string, searchTerm: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('name');

      if (error) throw error;

      return data.map(this.transformDatabaseCustomer);
    } catch (error: any) {
      throw new Error(`Erreur lors de la recherche des clients: ${error.message}`);
    }
  }

  // Écouter les changements clients ET ventes, et recalculer les totaux
  static subscribeToCustomers(userId: string, callback: (customers: Customer[]) => void): () => void {
    const channel = supabase.channel('customers_and_sales_changes');

    const reload = async () => {
      try {
        const customers = await this.getCustomersWithTotals(userId);
        callback(customers);
      } catch (error) {
        console.error('Erreur lors du rechargement des clients:', error);
      }
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `user_id=eq.${userId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `user_id=eq.${userId}` }, reload)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Mettre à jour le total des achats d'un client
  static async updateCustomerPurchases(id: string, amount: number): Promise<void> {
    try {
      const customer = await this.getCustomerById(id);
      if (!customer) {
        throw new Error('Client non trouvé');
      }

      const newTotal = (customer.totalPurchases || 0) + amount;
      await this.updateCustomer(id, { 
        totalPurchases: newTotal,
        lastPurchase: new Date()
      });
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour des achats: ${error.message}`);
    }
  }

  // Méthode utilitaire pour transformer les données de la base
  private static transformDatabaseCustomer(data: any): Customer {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      imageUrl: data.image_url,
      totalPurchases: data.total_purchases || 0,
      lastPurchase: data.last_purchase ? new Date(data.last_purchase) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}