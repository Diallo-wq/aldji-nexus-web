import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { Customer } from '../types';
import { CustomerService } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface AddEditCustomerScreenProps {
  navigation: any;
  route: { params?: { customerId?: string } };
}

export const AddEditCustomerScreen: React.FC<AddEditCustomerScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const customerId = route?.params?.customerId;
  const isEditing = !!customerId;

  // Champs persistés (limités au schéma actuel)
  const [customer, setCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    imageUrl: '',
  });
  // Champs UI additionnels (non encore persistés)
  const [contactType, setContactType] = useState<'person' | 'company' | ''>('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAssoc, setCompanyAssoc] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [vatNumber, setVatNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [tagsInput, setTagsInput] = useState(''); // tags séparés par des virgules
  const [internalNotes, setInternalNotes] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomerById(customerId as string);
      if (data) {
        setCustomer(data);
        setLocalImageUri(data.imageUrl);
        // Heuristique: si le nom contient un espace, considérer "Personne"
        if (data.name?.includes(' ')) {
          setContactType('person');
          setFullName(data.name);
        } else {
          setContactType('company');
          setCompanyName(data.name || '');
        }
        // Adresse simple -> pré-remplir rue1
        if (data.address) setStreet1(data.address);
        if (data.email) handleInputChange('email', data.email);
        if (data.phone) handleInputChange('phone', data.phone);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de charger le client');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Customer, value: any) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const clone = { ...errors };
      delete clone[field];
      setErrors(clone);
    }
  };

  const emailValid = (val?: string) => !val || /\S+@\S+\.\S+/.test(val);
  const phoneValid = (val?: string) => !val || /^\+?[0-9\s().-]{6,}$/.test(val);
  const urlValid = (val?: string) => !val || /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/.test(val);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!contactType) next.contactType = 'Le type est requis';
    if (contactType === 'person' && !fullName.trim()) next.fullName = 'Le nom complet est requis';
    if (contactType === 'company' && !companyName.trim()) next.companyName = 'Le nom de la société est requis';
    if (!emailValid(customer.email)) next.email = 'Format email invalide';
    if (!customer.phone?.trim()) next.phone = 'Le téléphone est requis';
    else if (!phoneValid(customer.phone)) next.phone = 'Numéro de téléphone invalide';
    if (!urlValid(website)) next.website = 'URL invalide';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;
    try {
      setSaving(true);
      // Mapper champs UI -> champs persistés actuels
      const nameToPersist = contactType === 'company' ? companyName.trim() : fullName.trim();
      const addressToPersist = [street1, street2, city, region, postalCode, country].filter(Boolean).join(', ');

      let imageUrlToPersist: string | undefined = customer.imageUrl;
      if (localImageUri && user?.id) {
        try {
          // Sécuriser l'upload avec un timeout pour éviter un spinner infini
          const withTimeout = <T,>(p: Promise<T>, ms: number) => new Promise<T>((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('Upload image timeout')), ms);
            p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
          });
          imageUrlToPersist = await withTimeout(
            CustomerService.uploadCustomerImageToStorage(localImageUri, user.id),
            15000
          );
        } catch (e: any) {
          console.warn('Upload image client échoué/timeout, on continue sans image:', e?.message || e);
        }
      }

      const payload: Partial<Customer> = {
        name: nameToPersist,
        phone: customer.phone?.trim() || '',
        email: customer.email?.trim(),
        address: addressToPersist || customer.address || '',
        imageUrl: imageUrlToPersist,
      };

      if (isEditing) {
        await CustomerService.updateCustomer(customerId as string, payload as Customer);
        Alert.alert('Succès', 'Client mis à jour');
      } else {
        await CustomerService.createCustomer(
          user.id,
          payload as Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases'>
        );
        Alert.alert('Succès', 'Client créé');
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'enregistrer le client");
    } finally {
      setSaving(false);
    }
  };

  const countries = useMemo(() => [
    'France','Belgique','Suisse','Canada','Maroc','Algérie','Tunisie','Sénégal','Côte d’Ivoire','Espagne','Italie','Allemagne','Royaume-Uni','États-Unis'
  ], []);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Accès aux photos nécessaire');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Erreur image:', e);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la caméra nécessaire');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Erreur caméra:', e);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du client...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Modifier le client' : 'Nouveau client'}</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Identification</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.segment, contactType === 'person' && styles.segmentActive]}
                onPress={() => setContactType('person')}
              >
                <Text style={[styles.segmentText, contactType === 'person' && styles.segmentTextActive]}>Personne</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, contactType === 'company' && styles.segmentActive]}
                onPress={() => setContactType('company')}
              >
                <Text style={[styles.segmentText, contactType === 'company' && styles.segmentTextActive]}>Société</Text>
              </TouchableOpacity>
            </View>
            {errors.contactType && <Text style={styles.errorText}>{errors.contactType}</Text>}

            {contactType === 'person' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Nom complet</Text>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
                </View>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Prénom Nom"
                  placeholderTextColor={COLORS.textLight}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>
            )}
            {contactType === 'company' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Nom de la société</Text>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} />
                </View>
                <TextInput
                  style={[styles.input, errors.companyName && styles.inputError]}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Raison sociale"
                  placeholderTextColor={COLORS.textLight}
                />
                {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
              </View>
            )}

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={customer.email}
                  onChangeText={(t) => handleInputChange('email', t)}
                  placeholder="email@exemple.com"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={customer.phone}
                  onChangeText={(t) => handleInputChange('phone', t)}
                  placeholder="+33 6 12 34 56 78"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>
            </View>

            {(contactType === 'person' || contactType === 'company') && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Société</Text>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Société associée</Text>
                    <TextInput
                      style={styles.input}
                      value={companyAssoc}
                      onChangeText={setCompanyAssoc}
                      placeholder="Nom de la société"
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Poste / Fonction</Text>
                    <TextInput
                      style={styles.input}
                      value={jobTitle}
                      onChangeText={setJobTitle}
                      placeholder="Ex: Acheteur, DG..."
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Adresse</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rue</Text>
              <TextInput style={styles.input} value={street1} onChangeText={setStreet1} placeholder="Rue" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rue 2</Text>
              <TextInput style={styles.input} value={street2} onChangeText={setStreet2} placeholder="Complément d'adresse" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Ville</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Ville" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>État / Région</Text>
                <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="Région" placeholderTextColor={COLORS.textLight} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Code postal</Text>
                <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="Code postal" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Pays</Text>
                <TextInput
                  style={styles.input}
                  value={country}
                  onFocus={() => setShowCountrySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 150)}
                  onChangeText={(t) => { setCountry(t); setShowCountrySuggestions(true); }}
                  placeholder="Pays"
                  placeholderTextColor={COLORS.textLight}
                />
                {showCountrySuggestions && !!country && (
                  <View style={styles.suggestionsBox}>
                    {countries.filter(c => c.toLowerCase().includes(country.toLowerCase())).slice(0, 6).map(c => (
                      <TouchableOpacity key={c} style={styles.suggestionItem} onPress={() => { setCountry(c); setShowCountrySuggestions(false); }}>
                        <Text style={styles.suggestionText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Informations fiscales & légales</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>N° TVA</Text>
                <TextInput style={styles.input} value={vatNumber} onChangeText={setVatNumber} placeholder="FRXX999999999" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Site web</Text>
                <TextInput
                  style={[styles.input, errors.website && styles.inputError]}
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://exemple.com"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="none"
                />
                {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Segmentation & suivi</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Étiquettes / Tags</Text>
              <TextInput
                style={styles.input}
                value={tagsInput}
                onChangeText={setTagsInput}
                placeholder="ex: VIP, Prospect, Paris"
                placeholderTextColor={COLORS.textLight}
              />
              <Text style={styles.helperText}>Séparez les tags par des virgules</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: SPACING.large }]}>Photo du client</Text>
            <View style={styles.imageRow}>
              <View style={styles.avatarPreview}>
                {localImageUri ? (
                  <Image source={{ uri: localImageUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholderLarge}>
                    <Ionicons name="person-circle-outline" size={64} color={COLORS.textLight} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.buttonSecondary, { marginRight: 8 }]} onPress={handlePickImage}>
                    <Ionicons name="image-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.buttonSecondaryText}>Uploader</Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.buttonSecondary} onPress={handleTakePhoto}>
                      <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.buttonSecondaryText}>Prendre photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.helperText}>Formats: JPG/PNG — carré 500×500 px conseillé</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
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
  formContainer: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.medium, padding: SPACING.medium, ...COLORS.shadows.md },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SPACING.small },
  inputGroup: { marginBottom: SPACING.medium },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  inputLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.small, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.small, fontSize: 16, fontFamily: FONTS.regular, color: COLORS.text },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },
  helperText: { marginTop: 4, color: COLORS.textLight, fontFamily: FONTS.regular, fontSize: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  segment: { flex: 1, paddingVertical: SPACING.small, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.small, backgroundColor: COLORS.background, alignItems: 'center', marginBottom: SPACING.small },
  segmentActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  segmentText: { color: COLORS.text, fontFamily: FONTS.medium },
  segmentTextActive: { color: COLORS.white },
  suggestionsBox: { marginTop: 4, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.small, backgroundColor: COLORS.surface, ...COLORS.shadows.sm },
  suggestionItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggestionText: { color: COLORS.text, fontFamily: FONTS.regular },
  imageRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPreview: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.medium },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholderLarge: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonSecondary: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 12, borderRadius: BORDER_RADIUS.small },
  buttonSecondaryText: { marginLeft: 8, color: COLORS.primary, fontFamily: FONTS.medium },
  footer: { flexDirection: 'row', padding: SPACING.medium, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelButton: { flex: 1, paddingVertical: SPACING.medium, marginRight: SPACING.small, borderRadius: BORDER_RADIUS.small, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: 16 },
  saveButton: { flex: 2, flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: SPACING.medium, borderRadius: BORDER_RADIUS.small, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: COLORS.white, fontFamily: FONTS.medium, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: SPACING.medium, fontFamily: FONTS.regular, color: COLORS.textSecondary },
});
