import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Customer } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { NavigationProps } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CustomerService } from '../services/customerService';
import { Logo } from '../components/Logo';
import { useFormatAmount } from '../utils/format';

interface CustomersScreenProps extends NavigationProps {}

// Liste initiale vide, alimentée par Supabase via CustomerService
const mockCustomers: Customer[] = [];

export const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unsub, setUnsub] = useState<null | (() => void)>(null);

  const loadCustomers = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const data = await CustomerService.getCustomers(user.id);
      setCustomers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = CustomerService.subscribeToCustomers(user.id, setCustomers);
    setUnsub(() => unsubscribe);
    return () => {
      try { unsubscribe && unsubscribe(); } catch {}
    };
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const handleAddCustomer = () => {
    navigation.navigate('AddEditCustomer');
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm(`Supprimer le client "${customer.name}" ? Cette action est irréversible.`);
      if (ok) {
        CustomerService.deleteCustomer(customer.id).catch((e: any) => {
          console.error(e);
          alert(e?.message || 'Impossible de supprimer le client');
        });
      }
      return;
    }

    Alert.alert(
      'Supprimer',
      `Supprimer le client "${customer.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await CustomerService.deleteCustomer(customer.id);
              // La souscription rechargera automatiquement la liste
            } catch (e: any) {
              console.error(e);
              Alert.alert('Erreur', e?.message || 'Impossible de supprimer le client');
            }
          },
        },
      ]
    );
  };

  const formatAmountDynamic = useFormatAmount();

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
        onPress={() => navigation.navigate('AddEditCustomer', { customerId: item.id })}
      >
        <View style={styles.customerAvatar}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerContact}>{item.phone}</Text>
          {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
          <Text style={styles.customerPurchases}>Achats: {formatAmountDynamic(item.totalPurchases)}</Text>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => handleDeleteCustomer(item)} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
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
          <TouchableOpacity onPress={handleAddCustomer} style={styles.addButton}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des clients...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
              <Text style={styles.emptySubText}>Ajoutez votre premier client en appuyant sur le bouton +</Text>
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
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    ...COLORS.shadows.md,
  },
  customerAvatar: {
    marginRight: SPACING.medium,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  customerPurchases: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.success,
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: 'rgba(255,0,0,0.06)'
  },
});