import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { Product } from '../types';
import { ProductService } from '../services/productService';
import { AddEditProductScreenNavigationProp, AddEditProductScreenRouteProp } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AddEditProductScreenProps {
  navigation: AddEditProductScreenNavigationProp;
  route: AddEditProductScreenRouteProp;
}

export const AddEditProductScreen: React.FC<AddEditProductScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const productId = route.params?.productId;
  const isEditing = !!productId;
  
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    quantity: 0,
    minQuantity: 0,
    category: '',
    imageUrl: '',
    supplierId: '',
  });
  // Champs supplémentaires non encore persistés dans le schéma
  const [productType, setProductType] = useState<'bien' | 'service'>('bien');
  const [billingPolicy, setBillingPolicy] = useState<'ordered' | 'delivered'>('ordered');
  const [saleTaxRate, setSaleTaxRate] = useState<number>(0);
  const [purchaseTaxRate, setPurchaseTaxRate] = useState<number>(0);
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Autocomplete catégories
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState<string>('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
    loadCategories();
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const productData = await ProductService.getProductById(productId);
      if (productData) {
        setProduct(productData);
        setCategoryQuery(productData.category || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du produit');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      if (!user?.id) return;
      const products = await ProductService.getAllProducts(user.id);
      const setCats = new Set<string>();
      products.forEach((p: Product) => { if (p.category) setCats.add(p.category); });
      setAllCategories(Array.from(setCats));
    } catch (e) {
      // silencieux
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setProduct(prev => ({
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!product.name?.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    if (!productType) {
      newErrors.productType = 'Le type de produit est requis';
    }
    if (!billingPolicy) {
      newErrors.billingPolicy = 'La politique de facturation est requise';
    }
    
    if (product.price === undefined || product.price <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }
    if (saleTaxRate === undefined || isNaN(saleTaxRate)) {
      newErrors.saleTaxRate = 'La taxe de vente est requise';
    }
    
    if (product.quantity === undefined || product.quantity < 0) {
      newErrors.quantity = 'La quantité ne peut pas être négative';
    }
    
    if (product.minQuantity === undefined || product.minQuantity < 0) {
      newErrors.minQuantity = 'La quantité minimale ne peut pas être négative';
    }
    if (purchaseTaxRate === undefined || isNaN(purchaseTaxRate)) {
      newErrors.purchaseTaxRate = "La taxe d'achat est requise";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;
    
    try {
      setSaving(true);
      
      if (isEditing && productId) {
        await ProductService.updateProduct(productId, product as Product);
        Alert.alert('Succès', 'Produit mis à jour avec succès');
      } else {
        await ProductService.createProduct(user.id, product as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        Alert.alert('Succès', 'Produit créé avec succès');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du produit:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le produit');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos');
        return;
      }
      
      setImageLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (!user?.id) {
          Alert.alert('Erreur', "Utilisateur non authentifié");
          return;
        }
        try {
          const publicUrl = await ProductService.uploadProductImageToStorage(imageUri, user.id);
          handleInputChange('imageUrl', publicUrl);
        } catch (e: any) {
          console.error('Upload image produit échoué:', e);
          Alert.alert('Erreur', e?.message || "Impossible de téléverser l'image du produit");
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du produit...</Text>
      </View>
    );
  }

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
              {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Informations générales */}
          <View style={styles.imageContainer}>
            {imageLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={50} color={COLORS.textLight} />
              </View>
            )}
            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={20} color={COLORS.white} />
              <Text style={styles.imagePickerText}>Choisir une image</Text>
            </TouchableOpacity>
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Informations générales</Text>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Nom du produit</Text>
                <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
              </View>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={product.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Nom du produit"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Type de produit</Text>
                <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.segment, productType === 'bien' && styles.segmentActive]}
                  onPress={() => setProductType('bien')}
                >
                  <Text style={[styles.segmentText, productType === 'bien' && styles.segmentTextActive]}>Bien</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, productType === 'service' && styles.segmentActive]}
                  onPress={() => setProductType('service')}
                >
                  <Text style={[styles.segmentText, productType === 'service' && styles.segmentTextActive]}>Service</Text>
                </TouchableOpacity>
              </View>
              {errors.productType && <Text style={styles.errorText}>{errors.productType}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={product.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Description du produit"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <TextInput
                style={styles.input}
                value={categoryQuery}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)}
                onChangeText={(text) => {
                  setCategoryQuery(text);
                  setShowCategorySuggestions(true);
                }}
                placeholder="Catégorie du produit"
                placeholderTextColor={COLORS.textLight}
              />
              {showCategorySuggestions && !!categoryQuery && (
                <View style={styles.suggestionsBox}>
                  {allCategories
                    .filter(c => c.toLowerCase().includes(categoryQuery.toLowerCase()))
                    .slice(0, 6)
                    .map(c => (
                      <TouchableOpacity key={c} style={styles.suggestionItem} onPress={() => {
                        handleInputChange('category', c);
                        setCategoryQuery(c);
                        setShowCategorySuggestions(false);
                      }}>
                        <Text style={styles.suggestionText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  {!allCategories.some(c => c.toLowerCase() === categoryQuery.toLowerCase()) && (
                    <TouchableOpacity style={styles.suggestionItem} onPress={() => {
                      handleInputChange('category', categoryQuery.trim());
                      setShowCategorySuggestions(false);
                    }}>
                      <Text style={styles.suggestionText}>Créer "{categoryQuery.trim()}"</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.inputLabel}>Référence interne (SKU)</Text>
                <TextInput
                  style={styles.input}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="SKU"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.inputLabel}>Code-barres</Text>
                <TextInput
                  style={styles.input}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="EAN/UPC"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes internes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={internalNotes}
                onChangeText={setInternalNotes}
                placeholder="Notes visibles en interne uniquement"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Ventes</Text>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Politique de facturation</Text>
                <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.segment, billingPolicy === 'ordered' && styles.segmentActive]}
                  onPress={() => setBillingPolicy('ordered')}
                >
                  <Text style={[styles.segmentText, billingPolicy === 'ordered' && styles.segmentTextActive]}>Qtés commandées</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, billingPolicy === 'delivered' && styles.segmentActive]}
                  onPress={() => setBillingPolicy('delivered')}
                >
                  <Text style={[styles.segmentText, billingPolicy === 'delivered' && styles.segmentTextActive]}>Qtés livrées</Text>
                </TouchableOpacity>
              </View>
              {errors.billingPolicy && <Text style={styles.errorText}>{errors.billingPolicy}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Prix de vente</Text>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
                </View>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={product.price?.toString() || ''}
                  onChangeText={(text) => handleInputChange('price', parseFloat(text) || 0)}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Taxes de vente (%)</Text>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
                </View>
                <TextInput
                  style={[styles.input, errors.saleTaxRate && styles.inputError]}
                  value={saleTaxRate?.toString()}
                  onChangeText={(text) => setSaleTaxRate(parseFloat(text) || 0)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
                {errors.saleTaxRate && <Text style={styles.errorText}>{errors.saleTaxRate}</Text>}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Achats</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Coût (achat HT)</Text>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
                </View>
                <TextInput
                  style={[styles.input, errors.costPrice && styles.inputError]}
                  value={product.costPrice?.toString() || ''}
                  onChangeText={(text) => handleInputChange('costPrice', parseFloat(text) || 0)}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
                {errors.costPrice && <Text style={styles.errorText}>{errors.costPrice}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Taxes d'achat (%)</Text>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
                </View>
                <TextInput
                  style={[styles.input, errors.purchaseTaxRate && styles.inputError]}
                  value={purchaseTaxRate?.toString()}
                  onChangeText={(text) => setPurchaseTaxRate(parseFloat(text) || 0)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
                {errors.purchaseTaxRate && <Text style={styles.errorText}>{errors.purchaseTaxRate}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fournisseur (à venir)</Text>
              <TextInput
                style={styles.input}
                value={product.supplierId}
                onChangeText={(text) => handleInputChange('supplierId', text)}
                placeholder="Saisir un identifiant fournisseur (gestion avancée à venir)"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Stock</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.inputLabel}>Quantité en stock</Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  value={product.quantity?.toString() || ''}
                  onChangeText={(text) => handleInputChange('quantity', parseInt(text) || 0)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
                {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.inputLabel}>Quantité minimale</Text>
                <TextInput
                  style={[styles.input, errors.minQuantity && styles.inputError]}
                  value={product.minQuantity?.toString() || ''}
                  onChangeText={(text) => handleInputChange('minQuantity', parseInt(text) || 0)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
                {errors.minQuantity && <Text style={styles.errorText}>{errors.minQuantity}</Text>}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
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
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Mettre à jour' : 'Enregistrer'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.small,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
  },
  imagePickerText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    ...COLORS.shadows.md,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  inputGroup: {
    marginBottom: SPACING.medium,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 0,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    marginRight: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  suggestionsBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.surface,
    ...COLORS.shadows.sm,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.medium,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.medium,
    marginRight: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.medium,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});