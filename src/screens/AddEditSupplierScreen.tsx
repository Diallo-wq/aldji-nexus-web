import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Supplier } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { AddEditSupplierScreenNavigationProp, AddEditSupplierScreenRouteProp } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SupplierService } from '../services/supplierService';

interface Props {
  navigation: AddEditSupplierScreenNavigationProp;
  route: AddEditSupplierScreenRouteProp;
}

const COUNTRIES = ['Guinée', 'Sénégal', 'Mali', 'Côte d\'Ivoire', 'France', 'Belgique', 'Suisse', 'Maroc', 'Canada'];
const BILLING_CURRENCIES = ['GNF', 'EUR', 'USD', 'XOF'];
const SUPPLIER_TYPES: Supplier['type'][] = ['Entreprise', 'Indépendant', 'Organisation'];

export const AddEditSupplierScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const supplierId = route.params?.supplierId;
  const isEditing = !!supplierId;

  const [supplier, setSupplier] = useState<Partial<Supplier>>({ name: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) load();
  }, [supplierId]);

  const load = async () => {
    if (!supplierId) return;
    try {
      setLoading(true);
      const row = await SupplierService.getSupplierById(supplierId);
      if (row) setSupplier(row);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger le fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: keyof Supplier, value: any) => {
    setSupplier(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!supplier.name?.trim()) e.name = 'Nom du fournisseur requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!validate()) return;
    try {
      setSaving(true);
      if (isEditing && supplierId) {
        await SupplierService.updateSupplier(supplierId, supplier as Supplier);
        Alert.alert('Succès', 'Fournisseur mis à jour');
      } else {
        await SupplierService.createSupplier(user.id, supplier as Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>);
        Alert.alert('Succès', 'Fournisseur créé');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', "Autorisez l'accès aux photos pour importer un logo");
        return;
      }
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets?.length) {
        if (!user?.id) return;
        const uri = result.assets[0].uri;
        const publicUrl = await SupplierService.uploadSupplierLogoToStorage(uri, user.id);
        setField('logoUrl', publicUrl);
      }
    } catch (e: any) {
      console.error('handlePickImage error', e);
      Alert.alert('Erreur', e?.message || 'Upload du logo impossible');
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.muted}>Chargement du fournisseur…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Médias */}
          <View style={styles.imageContainer}>
            {imageLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : supplier.logoUrl ? (
              <Image source={{ uri: supplier.logoUrl }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={50} color={COLORS.textLight} />
              </View>
            )}
            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={20} color={COLORS.white} />
              <Text style={styles.imagePickerText}>Importer un logo</Text>
            </TouchableOpacity>
          </View>

          {/* Identification */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Identification du fournisseur</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du fournisseur / Société *</Text>
              <TextInput style={[styles.input, errors.name && styles.inputError]} value={supplier.name || ''} onChangeText={(t) => setField('name', t)} placeholder="Nom" placeholderTextColor={COLORS.textLight} />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.inputLabel}>Type</Text>
                <TextInput style={styles.input} value={supplier.type || ''} onChangeText={(t) => setField('type', t as any)} placeholder="Entreprise / Indépendant / Organisation" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.inputLabel}>Contact principal</Text>
                <TextInput style={styles.input} value={supplier.contactPerson || ''} onChangeText={(t) => setField('contactPerson', t)} placeholder="Nom du contact" placeholderTextColor={COLORS.textLight} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} value={supplier.email || ''} onChangeText={(t) => setField('email', t)} placeholder="email@domaine.com" keyboardType="email-address" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <TextInput style={styles.input} value={supplier.phone || ''} onChangeText={(t) => setField('phone', t)} placeholder="+224 ..." keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />
              </View>
            </View>
          </View>

          {/* Adresse */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Adresse</Text>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Rue</Text><TextInput style={styles.input} value={supplier.addressLine1 || ''} onChangeText={(t) => setField('addressLine1', t)} placeholder="Rue" placeholderTextColor={COLORS.textLight} /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Rue 2</Text><TextInput style={styles.input} value={supplier.addressLine2 || ''} onChangeText={(t) => setField('addressLine2', t)} placeholder="Complément" placeholderTextColor={COLORS.textLight} /></View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Ville</Text><TextInput style={styles.input} value={supplier.city || ''} onChangeText={(t) => setField('city', t)} placeholder="Ville" placeholderTextColor={COLORS.textLight} /></View>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Région / État</Text><TextInput style={styles.input} value={supplier.state || ''} onChangeText={(t) => setField('state', t)} placeholder="Région" placeholderTextColor={COLORS.textLight} /></View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Code postal</Text><TextInput style={styles.input} value={supplier.postalCode || ''} onChangeText={(t) => setField('postalCode', t)} placeholder="Code postal" placeholderTextColor={COLORS.textLight} /></View>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Pays</Text><TextInput style={styles.input} value={supplier.country || ''} onChangeText={(t) => setField('country', t)} placeholder="Pays" placeholderTextColor={COLORS.textLight} /></View>
            </View>
          </View>

          {/* Fiscales & bancaires */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations fiscales et bancaires</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>NIF</Text><TextInput style={styles.input} value={supplier.taxId || ''} onChangeText={(t) => setField('taxId', t)} placeholder="N° d\'identification fiscale" placeholderTextColor={COLORS.textLight} /></View>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>N° TVA</Text><TextInput style={styles.input} value={supplier.vatNumber || ''} onChangeText={(t) => setField('vatNumber', t)} placeholder="TVA intracommunautaire" placeholderTextColor={COLORS.textLight} /></View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>IBAN / Compte bancaire</Text><TextInput style={styles.input} value={supplier.iban || ''} onChangeText={(t) => setField('iban', t)} placeholder="IBAN / Compte" placeholderTextColor={COLORS.textLight} /></View>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Nom de la banque</Text><TextInput style={styles.input} value={supplier.bankName || ''} onChangeText={(t) => setField('bankName', t)} placeholder="Banque" placeholderTextColor={COLORS.textLight} /></View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Adresse de la banque</Text><TextInput style={styles.input} value={supplier.bankAddress || ''} onChangeText={(t) => setField('bankAddress', t)} placeholder="Adresse banque" placeholderTextColor={COLORS.textLight} /></View>
          </View>

          {/* Commerciales */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations commerciales</Text>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Produits / services</Text><TextInput style={styles.input} value={(supplier.productsServices || []).join(', ')} onChangeText={(t) => setField('productsServices', t.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Ex: Transport, Emballage" placeholderTextColor={COLORS.textLight} /></View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Devise principale</Text><TextInput style={styles.input} value={supplier.billingCurrency || ''} onChangeText={(t) => setField('billingCurrency', t)} placeholder="GNF / EUR / USD ..." placeholderTextColor={COLORS.textLight} /></View>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Délai de paiement</Text><TextInput style={styles.input} value={supplier.paymentTerms || ''} onChangeText={(t) => setField('paymentTerms', t)} placeholder="ex: 30 jours" placeholderTextColor={COLORS.textLight} /></View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}><Text style={styles.inputLabel}>Mode de livraison habituel</Text><TextInput style={styles.input} value={supplier.defaultShippingMethod || ''} onChangeText={(t) => setField('defaultShippingMethod', t)} placeholder="Transporteur, Interne, ..." placeholderTextColor={COLORS.textLight} /></View>
              <View style={[styles.inputGroup, styles.half]} />
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Conditions commerciales</Text><TextInput style={[styles.input, styles.textArea]} value={supplier.commercialTerms || ''} onChangeText={(t) => setField('commercialTerms', t)} placeholder="Texte libre" placeholderTextColor={COLORS.textLight} multiline numberOfLines={3} textAlignVertical="top" /></View>
          </View>

          {/* Segmentation & suivi */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Segmentation & suivi</Text>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Étiquettes / Tags</Text><TextInput style={styles.input} value={(supplier.tags || []).join(', ')} onChangeText={(t) => setField('tags', t.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Alimentaire, Textile, SaaS" placeholderTextColor={COLORS.textLight} /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notes internes</Text><TextInput style={[styles.input, styles.textArea]} value={supplier.internalNotes || ''} onChangeText={(t) => setField('internalNotes', t)} placeholder="Notes visibles uniquement en interne" placeholderTextColor={COLORS.textLight} multiline numberOfLines={3} textAlignVertical="top" /></View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? (<ActivityIndicator size="small" color={COLORS.white} />) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>{isEditing ? 'Mettre à jour' : 'Enregistrer'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: SPACING.large, paddingBottom: SPACING.medium, paddingHorizontal: SPACING.medium },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.white },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: SPACING.medium },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  imageContainer: { alignItems: 'center', marginBottom: SPACING.medium },
  logoImage: { width: 120, height: 120, borderRadius: BORDER_RADIUS.medium, marginBottom: SPACING.small },
  logoPlaceholder: { width: 120, height: 120, borderRadius: BORDER_RADIUS.medium, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.small, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  imagePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.small, borderRadius: BORDER_RADIUS.small },
  imagePickerText: { color: COLORS.white, fontFamily: FONTS.medium, marginLeft: 8 },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.medium, padding: SPACING.medium, ...COLORS.shadows.md, marginBottom: SPACING.medium },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SPACING.small },
  inputGroup: { marginBottom: SPACING.medium },
  inputLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.small, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.small, fontSize: 16, fontFamily: FONTS.regular, color: COLORS.text },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { flex: 1, ...(Platform.OS !== 'web' ? { marginRight: 8 } : {}), paddingRight: 8 },
  footer: { flexDirection: 'row', padding: SPACING.medium, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelButton: { flex: 1, paddingVertical: SPACING.medium, marginRight: SPACING.small, borderRadius: BORDER_RADIUS.small, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 16 },
  saveButton: { flex: 2, flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: SPACING.medium, borderRadius: BORDER_RADIUS.small, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: COLORS.white, fontFamily: FONTS.medium, fontSize: 16 },
  muted: { color: COLORS.textSecondary, fontFamily: FONTS.regular, marginTop: SPACING.sm },
});
