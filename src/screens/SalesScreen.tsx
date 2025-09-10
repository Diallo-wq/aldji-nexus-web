import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { SalesScreenNavigationProp, SalesScreenRouteProp, Sale } from '../types';
import { SaleService } from '../services/saleService';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { generateAndShareSalePDF } from '../utils/invoice';
import { useFormatAmount } from '../utils/format';
import { Logo } from '../components/Logo';

interface SalesScreenProps {
  navigation: SalesScreenNavigationProp;
  route: SalesScreenRouteProp;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      const salesData = await SaleService.getSales(user.id);
      setSales(salesData);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Recharger quand l'écran reprend le focus (retour depuis Add/Edit)
  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSales();
  }, [loadSales]);

  const handleNewSale = () => {
    // Navigation vers l'écran de nouvelle vente
    navigation.navigate('AddEditSale', {});
  };

  const handleDeleteSale = (sale: Sale) => {
    if (!user?.id) return;
    const confirmAndDelete = async () => {
      try {
        await SaleService.deleteSale(user.id, sale.id, { restoreStock: true });
        loadSales();
      } catch (e: any) {
        const msg = e?.message || 'Impossible de supprimer la vente';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Erreur', msg);
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`Supprimer la vente du ${formatDate(sale.createdAt)} ?`) : true;
      if (ok) confirmAndDelete();
      return;
    }
    Alert.alert(
      'Supprimer la vente',
      `Voulez-vous supprimer la vente du ${formatDate(sale.createdAt)} ? Les quantités seront réajustées en stock.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: confirmAndDelete },
      ]
    );
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmountDynamic = useFormatAmount();

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <View style={styles.saleCard}>
      <TouchableOpacity
        style={styles.saleInfo}
        onPress={() => navigation.navigate('AddEditSale', { saleId: item.id })}
      >
        <View style={styles.saleHeader}>
          <Text style={styles.saleDate}>{formatDate(item.createdAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{item.customerName || 'Client non spécifié'}</Text>
        <View style={styles.saleMeta}>
          <Text style={styles.saleTotal}>{formatAmountDynamic(item.total)}</Text>
          <Text style={styles.saleItems}>{item.items?.length || 0} article{(item.items?.length || 0) > 1 ? 's' : ''}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={async () => {
            try {
              await generateAndShareSalePDF(item, {
                name: user?.businessName,
                address: user?.businessAddress,
                phone: user?.phone,
                email: user?.email,
              });
            } catch (e) {
              console.error('Erreur export PDF:', e);
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={`Supprimer la vente du ${formatDate(item.createdAt)}`}
          onPress={() => handleDeleteSale(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error || '#ef4444'} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Logo size="small" showText={false} />
          <TouchableOpacity onPress={handleNewSale} style={styles.addButton}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des ventes...</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          renderItem={renderSaleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Aucune vente trouvée</Text>
              <Text style={styles.emptySubText}>Créez votre première vente en appuyant sur le bouton +</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.large,
    paddingBottom: SPACING.medium,
    paddingHorizontal: SPACING.medium,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.medium,
  },
  saleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    ...COLORS.shadows.md,
  },
  saleInfo: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    marginRight: 8,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    marginRight: 8,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.small,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
  customerName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 8,
  },
  saleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleTotal: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  saleItems: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.medium,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.large,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.medium,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.small,
  },
});