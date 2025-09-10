import { supabase } from './supabase';
import { ProductService } from './productService';
import { Sale, SaleItem } from '../types';

export class SaleService {
  // Helpers
  private static mapDbSale(row: any, items: SaleItem[] = []): Sale {
    return {
      id: row.id,
      customerId: row.customer_id || undefined,
      customerName: row.customer_name || undefined,
      items,
      subtotal: Number(row.subtotal || 0),
      tax: Number(row.tax || 0),
      total: Number(row.total || 0),
      paymentMethod: row.payment_method,
      status: row.status,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private static mapDbSaleItem(row: any): SaleItem {
    return {
      productId: row.product_id,
      productName: row.product_name,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      totalPrice: Number(row.total_price),
    };
  }

  // Vérifier le stock pour une nouvelle vente
  static async checkStock(userId: string, items: SaleItem[]): Promise<{
    ok: boolean;
    insufficient: Array<{ productId: string; productName: string; requested: number; available: number }>;
  }> {
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const { data: prods, error } = await supabase
      .from('products')
      .select('id, name, quantity')
      .in('id', productIds)
      .eq('user_id', userId);
    if (error) throw error;

    const qtyById: Record<string, number> = {};
    const nameById: Record<string, string> = {};
    (prods || []).forEach((p: any) => {
      qtyById[p.id] = Number(p.quantity || 0);
      nameById[p.id] = p.name;
    });

    const requestedById: Record<string, number> = {};
    items.forEach((it) => {
      requestedById[it.productId] = (requestedById[it.productId] || 0) + Number(it.quantity || 0);
    });

    const insufficient = Object.keys(requestedById)
      .filter((pid) => (qtyById[pid] ?? 0) < requestedById[pid])
      .map((pid) => ({
        productId: pid,
        productName: nameById[pid] || pid,
        requested: requestedById[pid],
        available: qtyById[pid] ?? 0,
      }));

    return { ok: insufficient.length === 0, insufficient };
  }

  // Vérifier le stock pour une mise à jour de vente (ne requiert que le supplément)
  static async checkStockForUpdate(
    userId: string,
    saleId: string,
    newItems: SaleItem[]
  ): Promise<{
    ok: boolean;
    insufficient: Array<{ productId: string; productName: string; requested: number; available: number; additionalNeeded: number }>;
  }> {
    // Récupérer les anciens items
    const { data: prevItems, error: prevErr } = await supabase
      .from('sale_items')
      .select('product_id, quantity')
      .eq('sale_id', saleId);
    if (prevErr) throw prevErr;

    const sumBy = (rows: any[]) => {
      const map: Record<string, number> = {};
      (rows || []).forEach((r) => {
        const pid = String(r.product_id);
        map[pid] = (map[pid] || 0) + Number(r.quantity || 0);
      });
      return map;
    };

    const prevMap = sumBy(prevItems || []);
    const nextMap: Record<string, number> = {};
    newItems.forEach((it) => {
      nextMap[it.productId] = (nextMap[it.productId] || 0) + Number(it.quantity || 0);
    });

    // Calcul du supplément requis par produit
    const additionalNeeded: Record<string, number> = {};
    const productIds = Array.from(new Set([...Object.keys(prevMap), ...Object.keys(nextMap)]));
    productIds.forEach((pid) => {
      const oldQty = prevMap[pid] || 0;
      const newQty = nextMap[pid] || 0;
      const add = Math.max(0, newQty - oldQty);
      if (add > 0) additionalNeeded[pid] = add;
    });

    if (Object.keys(additionalNeeded).length === 0) {
      return { ok: true, insufficient: [] };
    }

    const addIds = Object.keys(additionalNeeded);
    const { data: prods, error } = await supabase
      .from('products')
      .select('id, name, quantity')
      .in('id', addIds)
      .eq('user_id', userId);
    if (error) throw error;

    const qtyById: Record<string, number> = {};
    const nameById: Record<string, string> = {};
    (prods || []).forEach((p: any) => {
      qtyById[p.id] = Number(p.quantity || 0);
      nameById[p.id] = p.name;
    });

    const insufficient = addIds
      .filter((pid) => (qtyById[pid] ?? 0) < additionalNeeded[pid])
      .map((pid) => ({
        productId: pid,
        productName: nameById[pid] || pid,
        requested: nextMap[pid] || 0,
        available: qtyById[pid] ?? 0,
        additionalNeeded: additionalNeeded[pid],
      }));

    return { ok: insufficient.length === 0, insufficient };
  }

  // Récupère toutes les ventes d'un utilisateur
  static async getSales(userId: string): Promise<Sale[]> {
    try {
      const { data: salesRows, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!salesRows || salesRows.length === 0) return [];

      const saleIds = salesRows.map((r) => r.id);
      const { data: itemsRows, error: itemsErr } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', saleIds);
      if (itemsErr) throw itemsErr;

      const itemsBySale: Record<string, SaleItem[]> = {};
      (itemsRows || []).forEach((row) => {
        const saleId = row.sale_id;
        if (!itemsBySale[saleId]) itemsBySale[saleId] = [];
        itemsBySale[saleId].push(this.mapDbSaleItem(row));
      });

      return salesRows.map((row) => this.mapDbSale(row, itemsBySale[row.id] || []));
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes:', error);
      throw error;
    }
  }

  // Récupère une vente par son ID
  static async getSaleById(userId: string, saleId: string): Promise<Sale | null> {
    try {
      const { data: saleRow, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .eq('user_id', userId)
        .single();
      if (error) {
        if ((error as any).code === 'PGRST116') return null;
        throw error;
      }

      const { data: itemsRows, error: itemsErr } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);
      if (itemsErr) throw itemsErr;

      const items = (itemsRows || []).map((r) => this.mapDbSaleItem(r));
      return this.mapDbSale(saleRow, items);
    } catch (error) {
      console.error(`Erreur lors de la récupération de la vente ${saleId}:`, error);
      throw error;
    }
  }

  // Crée une nouvelle vente (et ses items)
  static async createSale(userId: string, sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data: saleInsert, error } = await supabase
        .from('sales')
        .insert({
          user_id: userId,
          customer_id: sale.customerId || null,
          customer_name: sale.customerName || null,
          subtotal: sale.subtotal,
          tax: sale.tax,
          total: sale.total,
          payment_method: sale.paymentMethod,
          status: sale.status,
          notes: sale.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      const saleId = saleInsert.id as string;
      if (sale.items && sale.items.length > 0) {
        const itemsPayload = sale.items.map((it) => ({
          sale_id: saleId,
          product_id: it.productId,
          product_name: it.productName,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          total_price: it.totalPrice,
        }));
        const { error: itemsErr } = await supabase.from('sale_items').insert(itemsPayload);
        if (itemsErr) throw itemsErr;

        // Décrémenter le stock des produits vendus
        await Promise.all(
          sale.items.map(async (it) => {
            try {
              await ProductService.updateProductQuantity(it.productId, it.quantity);
            } catch (e) {
              console.error(`Echec mise à jour stock pour produit ${it.productId}:`, e);
              throw e;
            }
          })
        );
      }

      return saleId;
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      throw error;
    }
  }

  // Met à jour une vente (remplace les items)
  static async updateSale(userId: string, saleId: string, patch: Partial<Sale>): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          customer_id: patch.customerId ?? null,
          customer_name: patch.customerName ?? null,
          subtotal: patch.subtotal,
          tax: patch.tax,
          total: patch.total,
          payment_method: patch.paymentMethod,
          status: patch.status,
          notes: patch.notes ?? null,
        })
        .eq('id', saleId)
        .eq('user_id', userId);
      if (error) throw error;

      if (patch.items) {
        // 1) Récupérer les anciens items pour calculer les deltas de stock
        const { data: prevItemsRows, error: prevErr } = await supabase
          .from('sale_items')
          .select('product_id, quantity')
          .eq('sale_id', saleId);
        if (prevErr) throw prevErr;

        const { error: delErr } = await supabase.from('sale_items').delete().eq('sale_id', saleId);
        if (delErr) throw delErr;
        if (patch.items.length > 0) {
          const itemsPayload = patch.items.map((it) => ({
            sale_id: saleId,
            product_id: it.productId,
            product_name: it.productName,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            total_price: it.totalPrice,
          }));
          const { error: insErr } = await supabase.from('sale_items').insert(itemsPayload);
          if (insErr) throw insErr;

          // 2) Calcul des deltas par produit: deltaStock = oldQty - newQty
          const sumBy = (rows: any[] | undefined | null) => {
            const map: Record<string, number> = {};
            (rows || []).forEach((r) => {
              const pid = String(r.product_id);
              map[pid] = (map[pid] || 0) + Number(r.quantity || 0);
            });
            return map;
          };
          const prevMap = sumBy(prevItemsRows);
          const nextMap = sumBy(itemsPayload as any);
          const productIds = Array.from(new Set([...Object.keys(prevMap), ...Object.keys(nextMap)]));

          // 3) Appliquer les ajustements
          await Promise.all(
            productIds.map(async (pid) => {
              const oldQty = prevMap[pid] || 0;
              const newQty = nextMap[pid] || 0;
              const deltaStock = oldQty - newQty; // si vente augmentée -> négatif -> décrémente stock
              if (deltaStock !== 0) {
                await ProductService.adjustProductQuantity(pid, deltaStock);
              }
            })
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la vente:', error);
      throw error;
    }
  }

  // Supprime une vente: restaure le stock puis supprime les lignes et l'entête
  static async deleteSale(userId: string, saleId: string, opts?: { restoreStock?: boolean }): Promise<void> {
    const restoreStock = opts?.restoreStock !== false; // par défaut: restaurer le stock
    try {
      // 1) Récupérer items
      const { data: itemsRows, error: itemsErr } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', saleId);
      if (itemsErr) throw itemsErr;

      // 2) Restaurer stock si demandé
      if (restoreStock && itemsRows && itemsRows.length > 0) {
        // Additionner les quantités par produit
        const map: Record<string, number> = {};
        itemsRows.forEach((r) => {
          const pid = String(r.product_id);
          map[pid] = (map[pid] || 0) + Number(r.quantity || 0);
        });
        const productIds = Object.keys(map);
        await Promise.all(
          productIds.map((pid) => ProductService.adjustProductQuantity(pid, map[pid]))
        );
      }

      // 3) Supprimer les items
      const { error: delItemsErr } = await supabase.from('sale_items').delete().eq('sale_id', saleId);
      if (delItemsErr) throw delItemsErr;

      // 4) Supprimer la vente (sécurisé par user_id)
      const { error: delSaleErr } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', userId);
      if (delSaleErr) throw delSaleErr;
    } catch (error) {
      console.error('Erreur lors de la suppression de la vente:', error);
      throw error;
    }
  }
}