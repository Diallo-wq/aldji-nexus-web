import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { ProductTable } from '../components';
import { Logo } from '../components/Logo';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { ProductsScreenNavigationProp, ProductsScreenRouteProp } from '../types';
import { ProductService } from '../services/productService';
import { useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';

interface ProductsScreenProps {
  navigation: ProductsScreenNavigationProp;
  route: ProductsScreenRouteProp;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const isSmall = windowWidth < 600;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [sortField, setSortField] = useState<'name' | 'price' | 'quantity'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Options dynamiques pour catégories à partir des produits chargés
  const CATEGORY_OPTIONS = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      const c = (p.category || '').trim();
      if (c) set.add(c);
    });
    return ['Tous', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);
  const STATUS_OPTIONS = ['Tous', 'Actifs', 'En rupture'];

  // Tap-to-cycle behavior
  const cycleOption = (current: string, options: string[]) => {
    const idx = options.indexOf(current);
    const next = (idx + 1) % options.length;
    return options[next];
  };

  const onPressCategory = () => {
    setSelectedCategory(prev => cycleOption(prev, CATEGORY_OPTIONS));
  };

  const onPressStatus = () => {
    setSelectedStatus(prev => cycleOption(prev, STATUS_OPTIONS));
  };

  const onPressSort = () => {
    // Cycle fields: name -> price -> quantity; when wrapping, toggle direction
    const nextField = sortField === 'name' ? 'price' : sortField === 'price' ? 'quantity' : 'name';
    const nextDir = nextField === 'name' && sortField === 'quantity' ? (sortDir === 'asc' ? 'desc' : 'asc') : sortDir;
    setSortField(nextField);
    setSortDir(nextDir);
  };

  const loadProducts = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const result = await ProductService.getAllProducts(user.id);
      console.log('[Products] user:', user.id, 'fetched count:', result.length);
      setProducts(result);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
      return () => {};
    }, [user?.id])
  );

  // Abonnement temps réel pour refléter immédiatement les créations/modifications
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = ProductService.subscribeToProducts(user.id, (list) => {
      console.log('[Products] realtime update count:', list.length);
      setProducts(list);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddProduct = () => {
    navigation.navigate('AddEditProduct', {} as any);
  };

  const handleDeleteProduct = (product: Product) => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`Supprimer « ${product.name} » ?`) : true;
      if (!ok) return;
      (async () => {
        try {
          await ProductService.deleteProduct(product.id);
          loadProducts();
        } catch (e: any) {
          alert(e?.message || 'Impossible de supprimer le produit');
        }
      })();
      return;
    }

    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous supprimer « ${product.name} » ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.deleteProduct(product.id);
              loadProducts();
            } catch (e: any) {
              Alert.alert('Erreur', e?.message || 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter(p => {
      const matchSearch = q === '' ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'Tous' || (p.category || '') === selectedCategory;
      const isActive = p.quantity > p.minQuantity;
      const matchStatus = selectedStatus === 'Tous'
        ? true
        : selectedStatus === 'Actifs'
          ? isActive
          : !isActive; // 'En rupture'
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  const visibleProducts = useMemo(() => {
    const arr = [...filteredProducts];
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') {
        return a.name.localeCompare(b.name) * dir;
      } else if (sortField === 'price') {
        return (a.price - b.price) * dir;
      }
      // quantity
      return (a.quantity - b.quantity) * dir;
    });
    return arr;
  }, [filteredProducts, sortField, sortDir]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1e3a8a", "#3b82f6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <Logo size="small" showText={false} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des produits...</Text>
          </View>
        ) : (
          <>
            <View style={styles.controlsContainer}>
              <View style={styles.controlsTopRow}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
                  <Text style={styles.addButtonText}>Ajouter produit</Text>
                </TouchableOpacity>

                <View style={styles.filtersContainer}>
                  <TouchableOpacity style={styles.filterChip} onPress={onPressCategory}>
                    <Text style={styles.filterChipText}>Catégorie: {selectedCategory}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.text} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.filterChip} onPress={onPressStatus}>
                    <Text style={styles.filterChipText}>Statut: {selectedStatus}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.text} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.filterChip} onPress={onPressSort}>
                    <Text style={styles.filterChipText}>
                      Trier: {sortField === 'name' ? 'Nom' : sortField === 'price' ? 'Prix' : 'Stock'} {sortDir === 'asc' ? '↑' : '↓'}
                    </Text>
                    <Ionicons name="swap-vertical" size={16} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par nom, description, catégorie"
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {visibleProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Aucun produit</Text>
                <Text style={styles.emptySubtitle}>Ajoutez votre premier produit pour le voir ici.</Text>
              </View>
            ) : (
              <ProductTable 
                products={visibleProducts} 
                onProductPress={(product) => {
                  navigation.navigate('AddEditProduct', { productId: product.id } as any);
                }}
                onDeleteProduct={handleDeleteProduct}
              />
            )}
            
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationText}>1 - 4 de 4</Text>
              <View style={styles.paginationButtons}>
                <TouchableOpacity style={styles.paginationButton}>
                  <Ionicons name="chevron-back" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.paginationButton}>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
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
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  controlsContainer: {
    flexDirection: 'column',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  controlsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } }),
  },
  filterChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 0,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.xs,
    width: '100%',
    alignSelf: 'stretch',
    ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } }),
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    ...Platform.select({ web: { outlineStyle: 'none' as any } }),
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
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  paginationText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  paginationButtons: {
    flexDirection: 'row',
  },
  paginationButton: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
});