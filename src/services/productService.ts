import { supabase } from './supabase';
import { Product } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export class ProductService {
  private static isValidUuid(value?: string | null): boolean {
    if (!value) return false;
    const v = value.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v);
  }
  // Créer un produit
  static async createProduct(userId: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.costPrice,
          quantity: product.quantity,
          min_quantity: product.minQuantity,
          category: product.category,
          image_url: product.imageUrl,
          supplier_id: this.isValidUuid(product.supplierId as any) ? (product.supplierId as string).trim() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      throw new Error(`Erreur lors de la création du produit: ${error.message}`);
    }
  }

  // Mettre à jour un produit
  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updates.name,
          description: updates.description,
          price: updates.price,
          cost_price: updates.costPrice,
          quantity: updates.quantity,
          min_quantity: updates.minQuantity,
          category: updates.category,
          image_url: updates.imageUrl,
          supplier_id: this.isValidUuid(updates.supplierId as any) ? (updates.supplierId as string).trim() : null,
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour du produit: ${error.message}`);
    }
  }

  // Supprimer un produit
  static async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Erreur lors de la suppression du produit: ${error.message}`);
    }
  }

  // Récupérer un produit par ID
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.transformDatabaseProduct(data);
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération du produit: ${error.message}`);
    }
  }

  // Récupérer tous les produits d'un utilisateur
  static async getAllProducts(userId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      return data.map(this.transformDatabaseProduct);
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des produits: ${error.message}`);
    }
  }

  // Récupérer les produits en rupture de stock
  static async getLowStockProducts(userId: string): Promise<Product[]> {
    try {
      // Note: Supabase ne supporte pas la comparaison directe entre colonnes
      // Nous devons récupérer tous les produits et filtrer côté client
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const products = data.map(this.transformDatabaseProduct);
      return products.filter(product => product.quantity <= product.minQuantity);
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des produits en rupture: ${error.message}`);
    }
  }

  // Écouter les changements des produits en temps réel
  static subscribeToProducts(userId: string, callback: (products: Product[]) => void): () => void {
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${userId}` }, 
        async () => {
          // Recharger les données quand il y a un changement
          try {
            const products = await this.getAllProducts(userId);
            callback(products);
          } catch (error) {
            console.error('Erreur lors du rechargement des produits:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Mettre à jour la quantité d'un produit (après vente)
  static async updateProductQuantity(id: string, quantitySold: number): Promise<void> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Produit non trouvé');
      }

      const newQuantity = product.quantity - quantitySold;
      if (newQuantity < 0) {
        throw new Error('Quantité insuffisante en stock');
      }

      await this.updateProduct(id, { quantity: newQuantity });
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour de la quantité: ${error.message}`);
    }
  }

  // Ajuster la quantité d'un produit par un delta (positif ou négatif)
  static async adjustProductQuantity(id: string, delta: number): Promise<void> {
    try {
      const product = await this.getProductById(id);
      if (!product) throw new Error('Produit non trouvé');
      const newQuantity = product.quantity + delta;
      if (newQuantity < 0) throw new Error('Quantité insuffisante en stock');
      await this.updateProduct(id, { quantity: newQuantity });
    } catch (error: any) {
      throw new Error(`Erreur lors de l'ajustement de la quantité: ${error.message}`);
    }
  }

  // Méthode utilitaire pour transformer les données de la base
  private static transformDatabaseProduct(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      costPrice: data.cost_price,
      quantity: data.quantity,
      minQuantity: data.min_quantity,
      category: data.category,
      imageUrl: data.image_url,
      supplierId: data.supplier_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Upload d'une image produit vers Supabase Storage et retour de l'URL publique
  static async uploadProductImageToStorage(fileUri: string, userId: string): Promise<string> {
    const BUCKET = process.env.EXPO_PUBLIC_SUPABASE_PRODUCTS_BUCKET || 'products';

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

    // Toujours forcer auth.uid() pour le chemin (RLS)
    let ownerId = userId;
    try {
      const { data: authInfo } = await supabase.auth.getUser();
      if (authInfo?.user?.id) ownerId = authInfo.user.id;
    } catch {}

    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${ownerId}/${fileName}`;

    // Log de debug
    try {
      const { data: authInfo } = await supabase.auth.getUser();
      console.debug('[uploadProductImageToStorage] bucket:', BUCKET, 'auth.uid:', authInfo?.user?.id, 'filePath:', filePath);
    } catch {}

    let dataToUpload: any = null;
    if (Platform.OS === 'web') {
      const res = await fetch(fileUri);
      const arrayBuffer = await res.arrayBuffer();
      dataToUpload = arrayBuffer;
    } else {
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
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
        throw new Error(`Storage bucket "${BUCKET}" introuvable. Créez-le dans Supabase Storage ou définissez EXPO_PUBLIC_SUPABASE_PRODUCTS_BUCKET.`);
      }
      if ((uploadError as any)?.message?.toLowerCase().includes('row-level security')) {
        throw new Error(`RLS: Écriture interdite dans le bucket "${BUCKET}" pour le chemin "${filePath}". Vérifiez vos policies (INSERT sur dossier auth.uid()) et que vous êtes connecté.`);
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }
}
