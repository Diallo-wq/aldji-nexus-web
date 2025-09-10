import { supabase } from './supabase';
import { DashboardStats, ActivityItem } from '../types';

export class DashboardService {
  /**
   * Récupère les statistiques pour le tableau de bord
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // 1) Produits (total et faible stock)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, quantity, min_quantity')
        .eq('user_id', userId);
      if (productsError) throw productsError;
      const totalProducts = productsData?.length || 0;
      const lowStockProducts = (productsData || []).filter(p => (p as any).quantity <= (p as any).min_quantity).length;

      // 2) Clients (total)
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (customersError) throw customersError;
      const totalCustomers = customersCount || 0;

      // 3) Ventes du jour et du mois (somme des totals pour status=completed)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const { data: todaySalesRows, error: todayError } = await supabase
        .from('sales')
        .select('total')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', startOfTomorrow.toISOString());
      if (todayError) throw todayError;
      const todaySales = (todaySalesRows || []).reduce((sum, r: any) => sum + Number(r.total || 0), 0);

      const { data: monthSalesRows, error: monthError } = await supabase
        .from('sales')
        .select('total')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', startOfNextMonth.toISOString());
      if (monthError) throw monthError;
      const monthSales = (monthSalesRows || []).reduce((sum, r: any) => sum + Number(r.total || 0), 0);

      // 4) Activités récentes unifiées (limite 10)
      const limit = 10;
      const [salesQ, productsQ, customersQ, suppliersQ] = await Promise.all([
        supabase
          .from('sales')
          .select('id, customer_name, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('products')
          .select('id, name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('customers')
          .select('id, name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('suppliers')
          .select('id, name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
      ]);

      if (salesQ.error) throw salesQ.error;
      if (productsQ.error) throw productsQ.error;
      if (customersQ.error) throw customersQ.error;
      if (suppliersQ.error) throw suppliersQ.error;

      const recentActivities: ActivityItem[] = [
        ...((salesQ.data || []).map((r: any) => ({
          id: `sale:${r.id}`,
          type: 'sale' as const,
          title: r.status === 'completed' ? 'Vente complétée' : `Vente ${r.status || ''}`.trim(),
          subtitle: r.customer_name || 'Client',
          createdAt: new Date(r.created_at),
        })) as ActivityItem[]),
        ...((productsQ.data || []).map((r: any) => ({
          id: `product:${r.id}`,
          type: 'product' as const,
          title: 'Nouveau produit',
          subtitle: r.name || 'Produit',
          createdAt: new Date(r.created_at),
        })) as ActivityItem[]),
        ...((customersQ.data || []).map((r: any) => ({
          id: `customer:${r.id}`,
          type: 'customer' as const,
          title: 'Nouveau client',
          subtitle: r.name || 'Client',
          createdAt: new Date(r.created_at),
        })) as ActivityItem[]),
        ...((suppliersQ.data || []).map((r: any) => ({
          id: `supplier:${r.id}`,
          type: 'supplier' as const,
          title: 'Nouveau fournisseur',
          subtitle: r.name || 'Fournisseur',
          createdAt: new Date(r.created_at),
        })) as ActivityItem[]),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      return {
        todaySales,
        monthSales,
        totalProducts,
        lowStockProducts,
        totalCustomers,
        recentActivities,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /** Somme des ventes complétées sur une plage donnée */
  static async getSalesSum(userId: string, start: Date, end: Date): Promise<number> {
    const { data, error } = await supabase
      .from('sales')
      .select('total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());
    if (error) throw error;
    return (data || []).reduce((s, r: any) => s + Number(r.total || 0), 0);
  }

  /** Deux derniers clients */
  static async getCustomersRecent(userId: string, limit: number = 2): Promise<{ id: string; name: string; createdAt: Date }[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((r: any) => ({ id: r.id, name: r.name || 'Client', createdAt: new Date(r.created_at) }));
  }

  /** Total fournisseurs */
  static async getSuppliersTotals(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count || 0;
  }

  /** Tendance fournisseurs créés par jour sur N jours */
  static async getSuppliersTrend(userId: string, days: number = 7): Promise<number[]> {
    const series: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const { count, error } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());
      if (error) throw error;
      series.push(count || 0);
    }
    return series;
  }

  /**
   * Récupère les données pour le graphique des ventes
   */
  static async getSalesChartData(userId: string, days: number = 7): Promise<{ labels: string[]; data: number[] }> {
    try {
      const labels: string[] = [];
      const data: number[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

        const { data: dayRows, error } = await supabase
          .from('sales')
          .select('total')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());
        if (error) throw error;
        const sum = (dayRows || []).reduce((s, r: any) => s + Number(r.total || 0), 0);
        labels.push(label);
        data.push(sum);
      }
      return { labels, data };
    } catch (error) {
      console.error('Erreur lors de la récupération des données du graphique:', error);
      throw error;
    }
  }

  /**
   * Récupère les données pour le graphique des catégories de produits
   */
  static async getProductCategoriesData(userId: string): Promise<{ labels: string[]; data: number[] }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('user_id', userId);
      if (error) throw error;
      const counts = new Map<string, number>();
      (data || []).forEach((row: any) => {
        const key = row.category || 'Non classé';
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      const labels = Array.from(counts.keys());
      const values = Array.from(counts.values());
      return { labels, data: values };
    } catch (error) {
      console.error('Erreur lors de la récupération des données de catégories:', error);
      throw error;
    }
  }
}