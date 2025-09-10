import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Card, StatsCard, ActionCard } from '../components/Card';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { NavigationProps, DashboardStats } from '../types';
import { DashboardService } from '../services/dashboardService';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Logo } from '../components/Logo';
import { useFormatAmount } from '../utils/format';

interface DashboardScreenProps extends NavigationProps {}

const PIE_COLORS = [
  '#1e3a8a', // navy
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesLabels, setSalesLabels] = useState<string[]>([]);
  const [salesSeries, setSalesSeries] = useState<number[]>([]);
  const [catLabels, setCatLabels] = useState<string[]>([]);
  const [catSeries, setCatSeries] = useState<number[]>([]);
  const { width: windowWidth } = useWindowDimensions();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [periodSalesSum, setPeriodSalesSum] = useState<number>(0);
  const [recentCustomers, setRecentCustomers] = useState<{ id: string; name: string; createdAt: Date }[]>([]);
  const [suppliersTotal, setSuppliersTotal] = useState<number>(0);
  const [suppliersTrend, setSuppliersTrend] = useState<number[]>([]);
  const isSmall = windowWidth < 600;
  const formatAmount = useFormatAmount();

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Déterminer la période sélectionnée
      const now = new Date();
      let start: Date; let end: Date;
      if (period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (period === 'week') {
        // Lundi comme début de semaine
        const day = now.getDay(); // 0=dimanche
        const diffToMonday = (day === 0 ? -6 : 1 - day);
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        end = new Date(start);
        end.setDate(start.getDate() + 7);
      } else if (period === 'month') {
        // month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else {
        // all
        start = new Date(1970, 0, 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      }

      // Charger statistiques + données graphiques en parallèle
      const [realStats, sales, cats, salesSum, customers, supTotal, supTrend] = await Promise.all([
        DashboardService.getDashboardStats(user.id),
        DashboardService.getSalesChartData(user.id, 7),
        DashboardService.getProductCategoriesData(user.id),
        DashboardService.getSalesSum(user.id, start, end),
        DashboardService.getCustomersRecent(user.id, 2),
        DashboardService.getSuppliersTotals(user.id),
        DashboardService.getSuppliersTrend(user.id, 7),
      ]);
      setStats(realStats);
      setSalesLabels(sales.labels);
      setSalesSeries(sales.data);
      setCatLabels(cats.labels);
      setCatSeries(cats.data);
      setPeriodSalesSum(salesSum);
      setRecentCustomers(customers);
      setSuppliersTotal(supTotal);
      setSuppliersTrend(supTrend);
    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, period]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);



  // Labels semaine fixe L M M J V S D
  const weekLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Indicateur de tendance fournisseurs (sans courbe)
  const suppliersDelta = suppliersTrend.length >= 2
    ? suppliersTrend[suppliersTrend.length - 1] - suppliersTrend[suppliersTrend.length - 2]
    : 0;
  const suppliersPrev = suppliersTrend.length >= 2 ? suppliersTrend[suppliersTrend.length - 2] : 0;
  const suppliersPct = suppliersPrev > 0 ? Math.round((suppliersDelta / suppliersPrev) * 100) : 0;
  const suppliersTrendDir: 'up' | 'down' | 'neutral' = suppliersDelta > 0 ? 'up' : suppliersDelta < 0 ? 'down' : 'neutral';

  const weeklySalesSum = salesSeries.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  // Libellé dynamique pour la carte des ventes selon la période
  const periodTitle = period === 'today'
    ? "Ventes d'aujourd'hui"
    : period === 'week'
    ? 'Ventes de la semaine'
    : period === 'month'
    ? 'Ventes du mois'
    : 'Toutes les ventes';

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1e3a8a", "#3b82f6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size="small" showText={false} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.periodSelectorHeader}
            onPress={() => setPeriodMenuOpen(v => !v)}
          >
            <Text style={styles.periodText}>
              {period === 'today' ? 'Aujourd\'hui' : period === 'week' ? 'Cette semaine' : period === 'month' ? 'Ce mois' : 'Tous'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#ffffff" />
          </TouchableOpacity>
          {periodMenuOpen && (
            <View style={styles.periodMenu}>
              <TouchableOpacity style={styles.periodMenuItem} onPress={() => { setPeriod('today'); setPeriodMenuOpen(false); }}>
                <Text style={styles.periodMenuText}>Aujourd'hui</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.periodMenuItem} onPress={() => { setPeriod('week'); setPeriodMenuOpen(false); }}>
                <Text style={styles.periodMenuText}>Cette semaine</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.periodMenuItem} onPress={() => { setPeriod('month'); setPeriodMenuOpen(false); }}>
                <Text style={styles.periodMenuText}>Ce mois</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.periodMenuItem} onPress={() => { setPeriod('all'); setPeriodMenuOpen(false); }}>
                <Text style={styles.periodMenuText}>Tous</Text>
              </TouchableOpacity>
            </View>
          )}
          {periodMenuOpen && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPeriodMenuOpen(false)}
              style={styles.periodOverlay}
            />
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>Tableau de bord</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statsGrid, isSmall && { flexDirection: 'column' }]}>
                <StatsCard
                  title={periodTitle}
                  style={[styles.gridItem, isSmall && { width: '100%', minHeight: 140 }]}
                  value={formatAmount(periodSalesSum)}
                  icon={<Ionicons name="cash-outline" size={24} color="#28A745" />}
                  color="#28A745"
                  footerLinkTitle="Voir plus"
                  footerLinkOnPress={() => navigation.navigate && navigation.navigate('Sales' as any, { screen: 'SalesList' } as any)}
                  onPress={() => navigation.navigate && navigation.navigate('Sales' as any, { screen: 'SalesList' } as any)}
                  flat
                />
                <StatsCard
                  title="Produits en alerte"
                  style={[styles.gridItem, isSmall && { width: '100%', minHeight: 140 }]}
                  value={`${stats?.lowStockProducts ?? 0}`}
                  icon={<Ionicons name="alert-circle-outline" size={24} color="#DC3545" />}
                  color="#DC3545"
                  footerButtonTitle="Ajouter un produit"
                  footerButtonOnPress={() => navigation.navigate && navigation.navigate('Products' as any, { screen: 'AddEditProduct' } as any)}
                  onPress={() => navigation.navigate && navigation.navigate('Products' as any, { screen: 'ProductsList' } as any)}
                  flat
                />
                <View style={[styles.gridItem, isSmall && { width: '100%', minHeight: 140 }]}>
                  <View style={{ padding: SPACING.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#adb5bd33', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="people-outline" size={24} color="#6c757d" />
                        </View>
                        <View>
                          <Text style={{ fontSize: FONTS.sizes.base, fontFamily: FONTS.semiBold, color: COLORS.text }}>Clients récents</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontFamily: FONTS.regular, color: COLORS.text }}>{recentCustomers[0]?.name || '—'}</Text>
                      <Text style={{ fontFamily: FONTS.regular, color: COLORS.text }}>{recentCustomers[1]?.name || '—'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: SPACING.md }}>
                      <TouchableOpacity onPress={() => navigation.navigate && navigation.navigate('Customers' as any, { screen: 'AddEditCustomer' } as any)} style={{ backgroundColor: '#007BFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 }}>
                        <Text style={{ color: '#fff', fontFamily: FONTS.semiBold }}>+ Ajouter un client</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <StatsCard
                  title="Fournisseurs"
                  style={[styles.gridItem, isSmall && { width: '100%', minHeight: 140 }]}
                  value={`${suppliersTotal}`}
                  icon={<Ionicons name="business-outline" size={24} color="#007BFF" />}
                  color="#007BFF"
                  trend={suppliersTrendDir}
                  trendValue={`${suppliersPct >= 0 ? '+' : ''}${suppliersPct}%`}
                  onPress={() => navigation.navigate && navigation.navigate('Suppliers' as any)}
                  flat
                />
              </View>
            </View>
            
            <View style={[styles.chartsContainer, isSmall && { flexDirection: 'column' }]}>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Évolution des ventes <Text style={{ color: COLORS.textSecondary }}>(7 jours)</Text></Text>
                {salesSeries.length > 0 ? (
                  <>
                    <View style={styles.chartCanvas}>
                      <LineChart
                        data={{
                          labels: weekLabels,
                          datasets: [{ data: salesSeries, strokeWidth: 3 }],
                        }}
                        width={Math.max(
                          260,
                          (isSmall
                            ? (windowWidth - 2 * SPACING.lg - 2 * SPACING.lg)
                            : (((windowWidth - 2 * SPACING.lg - SPACING.md) / 2) - 2 * SPACING.lg))
                        )}
                        height={220}
                        withInnerLines
                        withOuterLines={false}
                        fromZero
                        chartConfig={{
                          backgroundColor: '#ffffff',
                          backgroundGradientFrom: '#ffffff',
                          backgroundGradientTo: '#ffffff',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                          fillShadowGradient: '#3b82f6',
                          fillShadowGradientOpacity: 0.12,
                          propsForDots: { r: '4', strokeWidth: '0', fill: '#3b82f6' },
                          propsForBackgroundLines: { stroke: '#e5e7eb' },
                        }}
                        bezier
                        style={{}}
                      />
                    </View>
                    <Text style={{ marginTop: SPACING.md, color: COLORS.text, fontFamily: FONTS.regular }}>
                      Ventes cette semaine: {formatAmount(weeklySalesSum)}
                    </Text>
                  </>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Text style={styles.chartPlaceholderText}>Pas de données</Text>
                  </View>
                )}
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Catégories de produits</Text>
                {catSeries.length > 0 ? (
                  <PieChart
                    data={catLabels.map((name, i) => ({
                      name,
                      population: catSeries[i] || 0,
                      color: PIE_COLORS[i % PIE_COLORS.length],
                      legendFontColor: COLORS.textSecondary,
                      legendFontSize: FONTS.sizes.sm,
                    }))}
                    width={Math.max(
                      260,
                      (isSmall
                        ? (windowWidth - 2 * SPACING.lg - 2 * SPACING.lg)
                        : (((windowWidth - 2 * SPACING.lg - SPACING.md) / 2) - 2 * SPACING.lg))
                    )}
                    height={240}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="0"
                    absolute
                    hasLegend
                  />
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Text style={styles.chartPlaceholderText}>Pas de données</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate && navigation.navigate('Sales' as any, { screen: 'AddEditSale' } as any)}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.primaryActionText}>Ajouter une vente</Text>
              </TouchableOpacity>
            </View>
          </>
        )}


        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          {isSmall ? (
            <View style={{ gap: SPACING.sm }}>
              {(stats?.recentActivities || []).map((a) => (
                <View key={a.id} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>{a.title}</Text>
                  <Text style={styles.activitySubtitle}>{a.subtitle || '—'}</Text>
                  <Text style={styles.activityDate}>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</Text>
                </View>
              ))}
              {(!stats || (stats.recentActivities || []).length === 0) && (
                <View style={styles.activityCard}>
                  <Text style={styles.activitySubtitle}>Aucune activité récente</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.activityTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Date</Text>
                <Text style={styles.tableHeaderText}>Description</Text>
                <Text style={styles.tableHeaderText}>Détails</Text>
              </View>
              {(stats?.recentActivities || []).map((a) => (
                <View key={a.id} style={styles.tableRow}>
                  <Text style={styles.tableCellDate}>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</Text>
                  <Text style={styles.tableCell}>{a.title}</Text>
                  <Text style={styles.tableCell}>{a.subtitle || '—'}</Text>
                </View>
              ))}
              {(!stats || (stats.recentActivities || []).length === 0) && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    Aucune activité récente
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    position: 'relative',
    zIndex: 100,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    padding: SPACING.xs,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleRow: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodText: {
    fontSize: FONTS.sizes.sm,
    color: '#ffffff',
    marginRight: 6,
    fontFamily: FONTS.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  statsContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  gridItem: {
    width: '48%',
    minHeight: 180,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  chartsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  chartCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  chartCanvas: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007BFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryActionText: {
    color: '#fff',
    fontFamily: FONTS.semiBold,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  secondaryText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.sm,
  },
  recentContainer: {
    marginBottom: SPACING.xl,
  },
  activityTable: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCellDate: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: '#6b7280',
    fontFamily: FONTS.regular,
  },
  tableCell: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  periodSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  periodMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0 6px 12px rgba(0,0,0,0.12)' } }),
    overflow: 'hidden',
    zIndex: 1000,
    pointerEvents: 'auto' as any,
    elevation: 12,
  },
  periodMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 160,
  },
  periodMenuText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.sm,
  },
  periodOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
      },
    }),
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  activityTitle: {
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  activitySubtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: 6,
  },
  activityDate: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.xs,
  },
});
