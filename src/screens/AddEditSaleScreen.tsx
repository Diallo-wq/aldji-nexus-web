import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  FlatList,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { Sale, SaleItem, Product, Customer, AddEditSaleScreenNavigationProp, AddEditSaleScreenRouteProp } from '../types';
import { SaleService } from '../services/saleService';
import { ProductService } from '../services/productService';
import { CustomerService } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';
import { generateAndShareSalePDF } from '../utils/invoice';
import { useFormatAmount } from '../utils/format';

interface AddEditSaleScreenProps {
  navigation: AddEditSaleScreenNavigationProp;
  route: AddEditSaleScreenRouteProp;
}

export const AddEditSaleScreen: React.FC<AddEditSaleScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const saleId = route.params?.saleId;
  const isEditing = !!saleId;
  
  const [sale, setSale] = useState<Partial<Sale>>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentMethod: 'cash',
    status: 'pending',
  });
  // TVA en pourcentage saisi par l'utilisateur (par défaut 0%)
  const [taxRatePercent, setTaxRatePercent] = useState<string>('0');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // États pour les produits et clients
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // États pour les modales
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState('1');
  
  // Saisie rapide client
  const [newCustomerName, setNewCustomerName] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  
  // Helper alerte cross-plateforme (notamment Web)
  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    if (isEditing && saleId) {
      loadSale();
    }
    loadProducts();
    loadCustomers();
  }, [saleId]);
  
  // Charger la vente existante
  const loadSale = async () => {
    if (!saleId || !user?.id) return;
    
    try {
      setLoading(true);
      const saleData = await SaleService.getSaleById(user.id, saleId);
      if (saleData) {
        setSale(saleData);
        // Déduire un taux de TVA à partir des données existantes si possible
        if (saleData.subtotal && saleData.subtotal > 0) {
          const inferred = (saleData.tax / saleData.subtotal) * 100;
          if (isFinite(inferred)) {
            setTaxRatePercent(String(Math.round(inferred * 100) / 100));
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vente:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations de la vente');
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les produits
  const loadProducts = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingProducts(true);
      const productsData = await ProductService.getAllProducts(user.id);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Charger les clients
  const loadCustomers = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingCustomers(true);
      const customersData = await CustomerService.getCustomers(user.id);
      setCustomers(customersData);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };
  
  // Gérer les changements d'entrée
  const handleInputChange = (field: keyof Sale, value: any) => {
    setSale(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Ajouter un produit à la vente
  const addProductToSale = () => {
    if (!selectedProduct || parseInt(productQuantity) <= 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un produit et spécifier une quantité valide');
      return;
    }
    
    const quantity = parseInt(productQuantity);
    
    // Vérifier si le produit est déjà dans la liste
    const existingItemIndex = sale.items?.findIndex(item => item.productId === selectedProduct.id);
    
    let newItems = [...(sale.items || [])];
    
    if (existingItemIndex !== undefined && existingItemIndex >= 0) {
      // Mettre à jour la quantité si le produit existe déjà
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity,
        totalPrice: (newItems[existingItemIndex].quantity + quantity) * selectedProduct.price
      };
    } else {
      // Ajouter un nouveau produit
      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        unitPrice: selectedProduct.price,
        totalPrice: quantity * selectedProduct.price
      };
      
      newItems.push(newItem);
    }
    
    // Calculer les nouveaux totaux
    const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = Math.max(0, parseFloat(taxRatePercent || '0')) / 100;
    const tax = subtotal * (isFinite(taxRate) ? taxRate : 0);
    const total = subtotal + tax;
    
    setSale(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      tax,
      total
    }));
    
    // Réinitialiser
    setSelectedProduct(null);
    setProductQuantity('1');
    setProductModalVisible(false);
  };
  
  // Supprimer un produit de la vente
  const removeProductFromSale = (index: number) => {
    const newItems = [...(sale.items || [])];
    newItems.splice(index, 1);
    
    // Recalculer les totaux
    const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = Math.max(0, parseFloat(taxRatePercent || '0')) / 100;
    const tax = subtotal * (isFinite(taxRate) ? taxRate : 0);
    const total = subtotal + tax;
    
    setSale(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      tax,
      total
    }));
  };
  
  // Sélectionner un client
  const selectCustomer = (customer: Customer) => {
    setSale(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name
    }));
    
    setCustomerModalVisible(false);
  };
  
  // Créer rapidement un client par nom et l'assigner à la vente
  const handleQuickAddCustomer = async () => {
    if (!user?.id) return;
    const name = newCustomerName.trim();
    if (!name) {
      showAlert('Client', 'Veuillez saisir un nom de client.');
      return;
    }
    try {
      setCreatingCustomer(true);
      const newId = await CustomerService.createCustomer(user.id, {
        name,
        email: undefined,
        phone: '', // colonne phone est NOT NULL dans le schéma -> envoyer une chaîne vide par défaut
        address: undefined,
        imageUrl: undefined,
      } as any);
      // recharger la liste et sélectionner
      await loadCustomers();
      setSale(prev => ({ ...prev, customerId: newId, customerName: name }));
      setNewCustomerName('');
      setCustomerModalVisible(false);
    } catch (e: any) {
      console.error('Erreur création client:', e);
      showAlert('Erreur', e?.message || 'Impossible de créer le client');
    } finally {
      setCreatingCustomer(false);
    }
  };
  
  // Valider le formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!sale.items?.length) {
      newErrors.items = 'Veuillez ajouter au moins un produit à la vente';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Enregistrer la vente
  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;
    
    try {
      setSaving(true);
      
      // Vérification de stock avant enregistrement
      if (isEditing && saleId) {
        const check = await SaleService.checkStockForUpdate(user.id, saleId, (sale.items || []) as SaleItem[]);
        if (!check.ok) {
          const lines = check.insufficient.map(
            (i) => `- ${i.productName}: demandé ${i.requested} (supplément ${i.additionalNeeded}), disponible ${i.available}`
          );
          setSaving(false);
          setErrors((prev) => ({ ...prev, items: 'Stock insuffisant: ajustez les quantités indiquées.' }));
          showAlert('Stock insuffisant', `Ajustez les quantités pour ces produits:\n\n${lines.join('\n')}`);
          return;
        }
      } else {
        const check = await SaleService.checkStock(user.id, (sale.items || []) as SaleItem[]);
        if (!check.ok) {
          const lines = check.insufficient.map(
            (i) => `- ${i.productName}: demandé ${i.requested}, disponible ${i.available}`
          );
          setSaving(false);
          setErrors((prev) => ({ ...prev, items: 'Stock insuffisant: ajustez les quantités indiquées.' }));
          showAlert('Stock insuffisant', `Ajustez les quantités pour ces produits:\n\n${lines.join('\n')}`);
          return;
        }
      }
      
      if (isEditing && saleId) {
        await SaleService.updateSale(user.id, saleId, sale as Sale);
        Alert.alert('Succès', 'Vente mise à jour avec succès');
      } else {
        await SaleService.createSale(user.id, sale as Sale);
        Alert.alert('Succès', 'Vente créée avec succès');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
      Alert.alert('Erreur', `${(error as any)?.message || "Impossible d'enregistrer la vente"}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Finaliser la vente
  const handleCompleteSale = async () => {
    if (!validateForm() || !user?.id) return;
    
    try {
      setSaving(true);
      
      const completedSale = {
        ...sale,
        status: 'completed' as const
      };
      
      // Vérification de stock avant finalisation
      if (isEditing && saleId) {
        const check = await SaleService.checkStockForUpdate(user.id, saleId, (completedSale.items || []) as SaleItem[]);
        if (!check.ok) {
          const lines = check.insufficient.map(
            (i) => `- ${i.productName}: demandé ${i.requested} (supplément ${i.additionalNeeded}), disponible ${i.available}`
          );
          setSaving(false);
          setErrors((prev) => ({ ...prev, items: 'Stock insuffisant: ajustez les quantités indiquées.' }));
          showAlert('Stock insuffisant', `Ajustez les quantités pour ces produits:\n\n${lines.join('\n')}`);
          return;
        }
      } else {
        const check = await SaleService.checkStock(user.id, (completedSale.items || []) as SaleItem[]);
        if (!check.ok) {
          const lines = check.insufficient.map(
            (i) => `- ${i.productName}: demandé ${i.requested}, disponible ${i.available}`
          );
          setSaving(false);
          setErrors((prev) => ({ ...prev, items: 'Stock insuffisant: ajustez les quantités indiquées.' }));
          showAlert('Stock insuffisant', `Ajustez les quantités pour ces produits:\n\n${lines.join('\n')}`);
          return;
        }
      }
      
      // Enregistrer la vente finalisée et récupérer son ID / ses données complètes
      let finalizedSaleId: string | undefined = saleId;
      if (isEditing && saleId) {
        await SaleService.updateSale(user.id, saleId, completedSale as Sale);
      } else {
        finalizedSaleId = await SaleService.createSale(user.id, completedSale as Sale);
      }
      
      // Récupérer la vente complète pour la facturation
      const fullSale = await SaleService.getSaleById(user.id, finalizedSaleId!);
      
      // Demander si l'utilisateur souhaite générer la facture maintenant
      const proceed = await new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          const ok = typeof window !== 'undefined' ? window.confirm('Vente finalisée. Générer la facture PDF maintenant ?') : true;
          resolve(!!ok);
        } else {
          Alert.alert(
            'Vente finalisée',
            'Souhaitez-vous générer la facture PDF maintenant ?',
            [
              { text: 'Plus tard', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Générer', style: 'default', onPress: () => resolve(true) },
            ]
          );
        }
      });
      
      if (proceed && fullSale) {
        try {
          await generateAndShareSalePDF(fullSale, undefined, 'GNF');
        } catch (e) {
          console.error('Erreur génération facture:', e);
          showAlert('Facture', "La vente est finalisée mais la génération du PDF a échoué.");
        }
      }
      
      Alert.alert('Succès', 'Vente finalisée avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la finalisation de la vente:', error);
      Alert.alert('Erreur', `${(error as any)?.message || 'Impossible de finaliser la vente'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Annuler la vente
  const handleCancelSale = async () => {
    if (!isEditing || !saleId || !user?.id) {
      navigation.goBack();
      return;
    }
    
    Alert.alert(
      'Annuler la vente',
      'Êtes-vous sûr de vouloir annuler cette vente ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              
              const cancelledSale = {
                ...sale,
                status: 'cancelled' as const
              };
              
              await SaleService.updateSale(user.id, saleId, cancelledSale as Sale);
              
              Alert.alert('Succès', 'Vente annulée avec succès');
              navigation.goBack();
            } catch (error) {
              console.error('Erreur lors de l\'annulation de la vente:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la vente');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };
  
  // Rendu des éléments de l'interface
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de la vente...</Text>
      </View>
    );
  }
  
  const formatAmountDynamic = useFormatAmount();
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Modifier la vente' : 'Nouvelle vente'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Informations client */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Client</Text>
            <TouchableOpacity 
              style={styles.customerSelector} 
              onPress={() => setCustomerModalVisible(true)}
            >
              {sale.customerName ? (
                <Text style={styles.customerName}>{sale.customerName}</Text>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner un client</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Liste des produits */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Produits</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setProductModalVisible(true)}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            
            {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
            
            {sale.items && sale.items.length > 0 ? (
              <View style={styles.itemsContainer}>
                {sale.items.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemQuantity}>{item.quantity} x {formatAmountDynamic(item.unitPrice)}</Text>
                        <Text style={styles.itemTotal}>{formatAmountDynamic(item.totalPrice)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeProductFromSale(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyItems}>
                <Ionicons name="cart-outline" size={40} color={COLORS.textLight} />
                <Text style={styles.emptyText}>Aucun produit ajouté</Text>
              </View>
            )}
          </View>
          
          {/* Détails de paiement */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Détails de paiement</Text>
            
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.inputLabel}>Mode de paiement</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity 
                  style={[styles.paymentOption, sale.paymentMethod === 'cash' && styles.selectedPayment]}
                  onPress={() => handleInputChange('paymentMethod', 'cash')}
                >
                  <Ionicons 
                    name="cash-outline" 
                    size={20} 
                    color={sale.paymentMethod === 'cash' ? COLORS.white : COLORS.textPrimary} 
                  />
                  <Text style={[styles.paymentText, sale.paymentMethod === 'cash' && styles.selectedPaymentText]}>Espèces</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.paymentOption, sale.paymentMethod === 'card' && styles.selectedPayment]}
                  onPress={() => handleInputChange('paymentMethod', 'card')}
                >
                  <Ionicons 
                    name="card-outline" 
                    size={20} 
                    color={sale.paymentMethod === 'card' ? COLORS.white : COLORS.textPrimary} 
                  />
                  <Text style={[styles.paymentText, sale.paymentMethod === 'card' && styles.selectedPaymentText]}>Carte</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.paymentOption, sale.paymentMethod === 'transfer' && styles.selectedPayment]}
                  onPress={() => handleInputChange('paymentMethod', 'transfer')}
                >
                  <Ionicons 
                    name="swap-horizontal-outline" 
                    size={20} 
                    color={sale.paymentMethod === 'transfer' ? COLORS.white : COLORS.textPrimary} 
                  />
                  <Text style={[styles.paymentText, sale.paymentMethod === 'transfer' && styles.selectedPaymentText]}>Virement</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={sale.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                placeholder="Notes sur la vente"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          {/* TVA (%) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TVA (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={taxRatePercent}
              onChangeText={(text) => {
                // Accepter nombres et virgule, normaliser en point
                const normalized = text.replace(',', '.');
                setTaxRatePercent(normalized);
                // Recalculer taxes immédiatement
                const rate = Math.max(0, parseFloat(normalized || '0')) / 100;
                const subtotal = (sale.items || []).reduce((sum, item) => sum + item.totalPrice, 0);
                const tax = subtotal * (isFinite(rate) ? rate : 0);
                const total = subtotal + tax;
                setSale(prev => ({ ...prev, subtotal, tax, total }));
              }}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          
          {/* Résumé */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{formatAmountDynamic(sale.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TVA ({(taxRatePercent || '0')}%)</Text>
              <Text style={styles.summaryValue}>{formatAmountDynamic(sale.tax)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatAmountDynamic(sale.total)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Boutons d'action */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancelSale}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>
              {isEditing ? 'Annuler la vente' : 'Annuler'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.completeButton} 
              onPress={handleCompleteSale}
              disabled={saving}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.completeButtonText}>Finaliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Modal de sélection de produit */}
      <Modal
        visible={productModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un produit</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {loadingProducts ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.productItem, selectedProduct?.id === item.id && styles.selectedProductItem]}
                    onPress={() => setSelectedProduct(item)}
                  >
                    <View>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>{formatAmountDynamic(item.price)} | Stock: {item.quantity}</Text>
                    </View>
                    {selectedProduct?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>Aucun produit disponible</Text>
                  </View>
                }
              />
            )}
            
            {selectedProduct && (
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantité:</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={productQuantity}
                  onChangeText={setProductQuantity}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.addToCartButton, !selectedProduct && styles.disabledButton]}
              onPress={addProductToSale}
              disabled={!selectedProduct}
            >
              <Text style={styles.addToCartButtonText}>Ajouter à la vente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal de sélection de client */}
      <Modal
        visible={customerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un client</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {loadingCustomers ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.customerItem}
                    onPress={() => selectCustomer(item)}
                  >
                    <View>
                      <Text style={styles.customerItemName}>{item.name}</Text>
                      <Text style={styles.customerContact}>{item.phone}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>Aucun client disponible</Text>
                  </View>
                }
              />
            )}
            
            {/* Création rapide d'un client par nom */}
            <View style={styles.quickCustomerContainer}>
              <Text style={styles.inputLabel}>Nouveau client (nom uniquement)</Text>
              <View style={styles.quickCustomerRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                  placeholder="Ex: Mamadou Diallo"
                  placeholderTextColor={COLORS.textLight}
                />
                <TouchableOpacity
                  style={[styles.addButton, creatingCustomer && { opacity: 0.7 }]}
                  onPress={handleQuickAddCustomer}
                  disabled={creatingCustomer}
                >
                  {creatingCustomer ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={20} color={COLORS.white} />
                      <Text style={styles.addButtonText}>Créer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelModalButton}
              onPress={() => setCustomerModalVisible(false)}
            >
              <Text style={styles.cancelModalButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.small,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  sectionContainer: {
    marginBottom: SPACING.medium,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.small,
  },
  customerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.medium,
    backgroundColor: COLORS.inputBackground,
  },
  customerName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  itemsContainer: {
    marginTop: SPACING.small,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  itemTotal: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  removeButton: {
    padding: 8,
  },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.large,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.small,
  },
  paymentMethodContainer: {
    marginBottom: SPACING.medium,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  paymentOptions: {
    flexDirection: 'row',
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.small,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.white,
  },
  selectedPayment: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentText: {
    marginLeft: 8,
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  selectedPaymentText: {
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: SPACING.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.medium,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.inputBackground,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.medium,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontFamily: FONTS.regular,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    padding: SPACING.medium,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
    paddingBottom: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedProductItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  productName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.medium,
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.small,
  },
  quantityLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginRight: SPACING.medium,
  },
  quantityInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    padding: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.white,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    alignItems: 'center',
    marginTop: SPACING.small,
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  addToCartButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customerItemName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.large,
  },
  cancelModalButton: {
    paddingVertical: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    alignItems: 'center',
    marginTop: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelModalButtonText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  quickCustomerContainer: {
    marginTop: SPACING.medium,
  },
  quickCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});