import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProps } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { uploadLogoToStorage, updateUserProfile, deleteStorageFileByPublicUrl } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import { CGU_TEXT, CGU_LAST_UPDATE_HUMAN } from '../utils/legal';
import { ABOUT_TEXT } from '../utils/about';
import { useCurrency, AVAILABLE_CURRENCIES, Currency } from '../contexts/CurrencyContext';

interface SettingsScreenProps extends NavigationProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, signOut, updateUser } = useAuth();
  const { isDark, setDark, colors } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const darkMode = isDark;
  const [notifications, setNotifications] = React.useState(true);
  const [dataSync, setDataSync] = React.useState(true);
  const [editVisible, setEditVisible] = React.useState(false);
  const [editName, setEditName] = React.useState(user?.displayName || '');
  const [editBusiness, setEditBusiness] = React.useState(user?.businessName || '');
  const [shopLogoUri, setShopLogoUri] = React.useState<string | undefined>(undefined);
  const [cguVisible, setCguVisible] = React.useState(false);
  const [aboutVisible, setAboutVisible] = React.useState(false);
  const [editPhone, setEditPhone] = React.useState(user?.phone || '');
  const [editCountry, setEditCountry] = React.useState(user?.country || '');
  const [editLanguage, setEditLanguage] = React.useState(user?.language || 'Français');
  const [editCompanySize, setEditCompanySize] = React.useState(user?.companySize || '');
  const [editSector, setEditSector] = React.useState(user?.sector || '');
  const [editTags, setEditTags] = React.useState((user?.tags || []).join(', '));
  const [editInterest, setEditInterest] = React.useState(user?.interest || '');
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [saveToast, setSaveToast] = React.useState('');
  const [errors, setErrors] = React.useState<{ name?: string; business?: string; phone?: string }>({});
  const [countries, setCountries] = React.useState<Array<{ name: string; code: string; dial: string }>>([]);
  const [countryPickerVisible, setCountryPickerVisible] = React.useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = React.useState(false);

  const LANGUAGES = ['Français', 'English'];
  const COMPANY_SIZES = ['1–5', '6–20', '21–50', '51–200', '200+'];
  const SECTORS = ['Commerce', 'Services', 'Agro', 'Industrie', 'Tech'];
  const INTERESTS = ['Ventes', 'Stock', 'Facturation', 'CRM', 'Tableau de bord'];
  const COUNTRIES = ['Guinée', 'Sénégal', 'Côte d’Ivoire', 'Mali', 'France', 'Maroc'];

  const validatePhone = (val: string) => /^\+?[0-9]{7,15}$/.test(val.replace(/[\s-]/g, ''));
  const allCountries = countries.length ? countries : [
    { name: 'Guinée', code: 'GN', dial: '224' },
    { name: 'Sénégal', code: 'SN', dial: '221' },
    { name: 'Côte d’Ivoire', code: 'CI', dial: '225' },
    { name: 'Mali', code: 'ML', dial: '223' },
    { name: 'France', code: 'FR', dial: '33' },
    { name: 'Maroc', code: 'MA', dial: '212' },
  ];
  const getSelectedCountry = () => allCountries.find((c) => c.name === editCountry);
  const flagEmojiFromCode = (code: string) => (
    code ? String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0))) : ''
  );
  const buildFullPhone = (rest: string) => {
    const sel = getSelectedCountry();
    const dial = sel?.dial ? `+${sel.dial}` : '';
    return [dial, rest].filter(Boolean).join(' ').replace(/\s|-/g, '').trim();
  };
  const formatPhoneRest = (text: string) => {
    const digits = text.replace(/\D/g, '');
    return digits.replace(/(.{2})/g, '$1 ').trim();
  };
  const extractRestFromFull = (full?: string) => {
    const clean = (full || '').replace(/\s|-/g, '');
    if (!clean) return '';
    const sel = getSelectedCountry();
    if (clean.startsWith('+') && sel?.dial) {
      const dial = `+${sel.dial}`;
      if (clean.startsWith(dial)) {
        return clean.slice(dial.length).replace(/(.{2})/g, '$1 ').trim();
      }
    }
    // fallback: drop leading + and keep rest grouped
    return clean.replace(/^\+/, '').replace(/(.{2})/g, '$1 ').trim();
  };

  const setAndValidate = (field: 'name' | 'business' | 'phone', value: string) => {
    if (field === 'name') {
      setEditName(value);
      setErrors((e) => ({ ...e, name: value.trim() ? undefined : 'Nom requis' }));
    } else if (field === 'business') {
      setEditBusiness(value);
      setErrors((e) => ({ ...e, business: value.trim() ? undefined : 'Nom de l’entreprise requis' }));
    } else if (field === 'phone') {
      const formatted = formatPhoneRest(value);
      setEditPhone(formatted);
      const full = buildFullPhone(formatted);
      setErrors((e) => ({ ...e, phone: !formatted.trim() ? undefined : (validatePhone(full) ? undefined : 'Format international requis') }));
    }
  };

  const isDirty = () => {
    if (!user) return false;
    const t = (s?: string) => (s || '').trim();
    const tagsArray = editTags.split(',').map((s) => s.trim()).filter(Boolean);
    const sameTags = JSON.stringify(tagsArray) === JSON.stringify(user.tags || []);
    return (
      t(editName) !== t(user.displayName) ||
      t(editBusiness) !== t(user.businessName) ||
      t(buildFullPhone(editPhone)) !== t(user.phone) ||
      t(editCountry) !== t(user.country) ||
      t(editLanguage) !== t(user.language) ||
      t(editCompanySize) !== t(user.companySize) ||
      t(editSector) !== t(user.sector) ||
      !sameTags ||
      t(editInterest) !== t(user.interest) ||
      !!shopLogoUri
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleProfileEdit = () => {
    setEditVisible(true);
  };

  React.useEffect(() => {
    if (!editVisible) return;
    setEditName(user?.displayName || '');
    setEditBusiness(user?.businessName || '');
    // Ensure a default country so phone composition/validation can work even if user has none yet
    setEditCountry(user?.country || 'Guinée');
    setEditLanguage((user?.language as any) || 'Français');
    setEditCompanySize((user?.companySize as any) || '');
    setEditSector(user?.sector || '');
    setEditTags((user?.tags || []).join(', '));
    setEditInterest(user?.interest || '');
    // After country is set, derive phone rest from stored full phone
    setTimeout(() => {
      setEditPhone(extractRestFromFull(user?.phone));
    }, 0);
  }, [editVisible, user]);

  // Load full list of countries on web
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,translations', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const list: Array<{ name: string; code: string; dial: string }> = (data || [])
          .map((c: any) => {
            const root = c?.idd?.root || '';
            const suffix = Array.isArray(c?.idd?.suffixes) && c.idd.suffixes.length ? c.idd.suffixes[0] : '';
            const dial = (root + suffix).replace(/\D/g, '').replace(/^0+/, '');
            return {
              name: c?.translations?.fra?.common || c?.name?.common,
              code: c?.cca2,
              dial,
            };
          })
          .filter((c: any) => c?.name && c?.code);
        const byName = new Map<string, { name: string; code: string; dial: string }>();
        list.forEach((c) => { if (!byName.has(c.name)) byName.set(c.name, c); });
        const sorted = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        if (sorted.length) setCountries(sorted);
      } catch {}
    })();
    return () => controller.abort();
  }, []);

  const pickLogo = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        setShopLogoUri(asset.uri);
      }
    } catch (e) {
      console.error('Erreur sélection logo:', e);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!user?.id) return;
      if (!isDirty()) { setEditVisible(false); return; }
      if (errors.name || errors.business || errors.phone) {
        setSaveToast('Veuillez corriger les erreurs du formulaire');
        setTimeout(() => setSaveToast(''), 2500);
        return;
      }
      setSaveLoading(true);
      console.debug('[Settings] Save start for user', user.id);
      const withTimeout = async <T,>(p: Promise<T>, ms = 25000, label = 'op'): Promise<T> => {
        return await new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(label + ' timeout')), ms);
          p.then((v) => { clearTimeout(timer); resolve(v); }).catch((e) => { clearTimeout(timer); reject(e); });
        });
      };
      const previousLogoUrl = user.logoUrl;
      let finalLogoUrl = previousLogoUrl;
      if (shopLogoUri) {
        console.debug('[Settings] Uploading new logo to storage…');
        finalLogoUrl = await withTimeout(uploadLogoToStorage(shopLogoUri, user.id), 60000, 'upload');
        console.debug('[Settings] Upload done. publicUrl=', finalLogoUrl);
      }
      const tagsArray = editTags.split(',').map((s) => s.trim()).filter(Boolean);
      console.debug('[Settings] Updating user profile in DB…');
      const updated = await withTimeout(updateUserProfile(user.id, {
        displayName: editName || undefined,
        businessName: editBusiness || undefined,
        phone: buildFullPhone(editPhone) || undefined,
        country: editCountry || undefined,
        language: (editLanguage as any) || undefined,
        companySize: (editCompanySize as any) || undefined,
        sector: editSector || undefined,
        tags: tagsArray,
        interest: editInterest || undefined,
        logoUrl: finalLogoUrl,
      }), 30000, 'update');
      console.debug('[Settings] Update done.');
      updateUser(updated);
      // After successful update, delete previous logo if it existed and changed
      if (shopLogoUri && previousLogoUrl && previousLogoUrl !== finalLogoUrl) {
        try {
          console.debug('[Settings] Deleting previous logo…');
          await withTimeout(deleteStorageFileByPublicUrl(previousLogoUrl), 15000, 'delete-old');
          console.debug('[Settings] Previous logo deleted.');
        } catch (delErr) {
          console.warn('Suppression de l\'ancien logo échouée:', delErr);
        }
      }
      setEditVisible(false);
      setSaveToast('Modifications enregistrées avec succès');
      setTimeout(() => setSaveToast(''), 2500);
    } catch (e: any) {
      console.error('Erreur lors de l\'enregistrement du profil:', e);
      const msg = e?.message ? String(e.message) : 'Erreur lors de l\'enregistrement du profil';
      setSaveToast(msg);
      setTimeout(() => setSaveToast(''), 3000);
    } finally {
      console.debug('[Settings] Save finished.');
      setSaveLoading(false);
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    action: React.ReactNode
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.settingAction}>{action}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Paramètres</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {saveToast ? (
          <View style={[styles.toast, { backgroundColor: colors.primary }]}>
            <Text style={styles.toastText}>{saveToast}</Text>
          </View>
        ) : null}
        {/* Profil utilisateur */}
        <View style={[styles.profileSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileInfo}>
            {shopLogoUri ? (
              <Image source={{ uri: shopLogoUri }} style={styles.profileLogo} resizeMode="contain" />
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.profileInitials, { color: colors.white }]}>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>{editName || user?.displayName || 'Utilisateur'}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              <Text style={[styles.businessName, { color: colors.primary }]}>{editBusiness || user?.businessName}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: isDark ? '#0f172a' : COLORS.primaryLight }]} onPress={handleProfileEdit}>
            <Text style={[styles.editProfileText, { color: colors.primary }]}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Paramètres de l'application */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Préférences</Text>
          {renderSettingItem(
            'card-outline',
            'Devise',
            `Devise actuelle: ${currency.name} (${currency.symbol})`,
            <TouchableOpacity onPress={() => setCurrencyModalVisible(true)}>
              <View style={styles.currencySelector}>
                <Text style={[styles.currencyText, { color: colors.primary }]}>{currency.symbol}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
          {renderSettingItem(
            'moon-outline',
            'Mode sombre',
            'Activer le thème sombre',
            <Switch
              value={darkMode}
              onValueChange={setDark}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={darkMode ? colors.primary : colors.white}
            />
          )}
          {renderSettingItem(
            'notifications-outline',
            'Notifications',
            'Recevoir des alertes et notifications',
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={notifications ? colors.primary : colors.white}
            />
          )}
          {renderSettingItem(
            'sync-outline',
            'Synchronisation',
            'Synchroniser les données automatiquement',
            <Switch
              value={dataSync}
              onValueChange={setDataSync}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={dataSync ? colors.primary : colors.white}
            />
          )}
        </View>

        {/* Paramètres du compte */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Compte</Text>
          {renderSettingItem(
            'lock-closed-outline',
            'Sécurité',
            'Modifier le mot de passe',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
          {renderSettingItem(
            'cloud-outline',
            'Sauvegarde',
            'Gérer les sauvegardes de données',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </View>

        {/* Informations */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>
          <TouchableOpacity onPress={() => setAboutVisible(true)} activeOpacity={0.7}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>À propos</Text>
                <Text style={styles.settingSubtitle}>Informations sur l'application</Text>
              </View>
              <View style={styles.settingAction}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
          {renderSettingItem(
            'help-circle-outline',
            'Aide',
            'Centre d\'aide et support',
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
          <TouchableOpacity onPress={() => setCguVisible(true)} activeOpacity={0.7}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Conditions d'utilisation</Text>
                <Text style={styles.settingSubtitle}>Lire les conditions d'utilisation</Text>
              </View>
              <View style={styles.settingAction}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: isDark ? '#1f2937' : COLORS.errorLight }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={[styles.signOutText, { color: COLORS.error }]}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>ALDJI-NEXUS Gestion Commerciale</Text>
          <Text style={[styles.versionNumber, { color: colors.textLight }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modal d'édition */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Modifier le profil</Text>

            <ScrollView
              style={{ maxHeight: '75%' }}
              contentContainerStyle={{ paddingBottom: SPACING.medium }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nom</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                value={editName}
                onChangeText={(t) => setAndValidate('name', t)}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Nom de la boutique</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                value={editBusiness}
                onChangeText={(t) => setAndValidate('business', t)}
                placeholder="Ma Société"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Pays</Text>
              <Pressable onPress={() => setCountryPickerVisible(true)}>
                <View style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  {(() => {
                    const sel = getSelectedCountry();
                    if (!sel) return <Ionicons name="flag-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />;
                    return (
                      <>
                        {Platform.OS === 'web' ? (
                          <Image source={{ uri: `https://flagcdn.com/24x18/${sel.code.toLowerCase()}.png` }} style={{ width: 24, height: 18, borderRadius: 2, marginRight: 8 }} />
                        ) : (
                          <Text style={{ fontSize: 18, width: 28, textAlign: 'center', marginRight: 4 }}>{flagEmojiFromCode(sel.code)}</Text>
                        )}
                        <Text style={{ color: colors.text }}>{sel.name}</Text>
                      </>
                    );
                  })()}
                </View>
              </Pressable>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Téléphone</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {(() => {
                  const sel = getSelectedCountry();
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                      {sel ? (
                        Platform.OS === 'web' ? (
                          <Image source={{ uri: `https://flagcdn.com/24x18/${sel.code.toLowerCase()}.png` }} style={{ width: 24, height: 18, borderRadius: 2, marginRight: 6 }} />
                        ) : (
                          <Text style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{flagEmojiFromCode(sel.code)}</Text>
                        )
                      ) : null}
                      <Text style={{ color: colors.text }}>{sel?.dial ? `+${sel.dial}` : ''}</Text>
                    </View>
                  );
                })()}
                <TextInput
                  style={[styles.textInput, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                  value={editPhone}
                  onChangeText={(t) => setAndValidate('phone', t)}
                  placeholder="Ex: 620 00 00 00"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {errors.phone ? <Text style={{ color: COLORS.error, marginBottom: SPACING.small }}>{errors.phone}</Text> : null}

              <Text style={[styles.inputLabel, { color: colors.text }]}>Langue préférée</Text>
              <View style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                {LANGUAGES.map((l) => (
                  <TouchableOpacity key={l} style={[styles.choiceChip, { borderColor: colors.border, backgroundColor: editLanguage === l ? colors.primary : 'transparent' }]} onPress={() => setEditLanguage(l as any)}>
                    <Text style={{ color: editLanguage === l ? COLORS.white : colors.text }}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Taille de l’entreprise</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {COMPANY_SIZES.map((s) => (
                  <TouchableOpacity key={s} style={[styles.choiceChip, { borderColor: colors.border, backgroundColor: editCompanySize === s ? colors.primary : 'transparent' }]} onPress={() => setEditCompanySize(s as any)}>
                    <Text style={{ color: editCompanySize === s ? COLORS.white : colors.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Secteur d’activité</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {SECTORS.map((s) => (
                  <TouchableOpacity key={s} style={[styles.choiceChip, { borderColor: colors.border, backgroundColor: editSector === s ? colors.primary : 'transparent' }]} onPress={() => setEditSector(s)}>
                    <Text style={{ color: editSector === s ? COLORS.white : colors.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Tags / catégories</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                value={editTags}
                onChangeText={setEditTags}
                placeholder="Ex: alimentaire, gros, détail"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Intérêt principal</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {INTERESTS.map((i) => (
                  <TouchableOpacity key={i} style={[styles.choiceChip, { borderColor: colors.border, backgroundColor: editInterest === i ? colors.primary : 'transparent' }]} onPress={() => setEditInterest(i)}>
                    <Text style={{ color: editInterest === i ? COLORS.white : colors.text }}>{i}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Logo de la boutique</Text>
              {shopLogoUri ? (
                <Image source={{ uri: shopLogoUri }} style={styles.logoPreview} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
                  <Text style={styles.logoPlaceholderText}>Aucun logo sélectionné</Text>
                </View>
              )}
              <TouchableOpacity style={styles.pickLogoButton} onPress={pickLogo}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                <Text style={styles.pickLogoText}>Choisir un logo</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => setEditVisible(false)}>
                <Text style={[styles.cancelText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!isDirty() || !!errors.name || !!errors.business || !!errors.phone || saveLoading} style={[styles.modalButton, styles.saveButton, { backgroundColor: (!isDirty() || !!errors.name || !!errors.business || !!errors.phone) ? colors.border : colors.primary, opacity: saveLoading ? 0.7 : 1 }]} onPress={handleSaveEdit}>
                <Text style={styles.saveText}>{saveLoading ? 'Enregistrement…' : 'Enregistrer les modifications'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={countryPickerVisible} transparent onRequestClose={() => setCountryPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCountryPickerVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '75%', width: 420 }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner un pays</Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator>
              {allCountries.map((c) => (
                <Pressable key={c.code + c.name} onPress={() => { setEditCountry(c.name); setCountryPickerVisible(false); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                    {Platform.OS === 'web' ? (
                      <Image source={{ uri: `https://flagcdn.com/24x18/${c.code.toLowerCase()}.png` }} style={{ width: 24, height: 18, borderRadius: 2, marginRight: 8 }} />
                    ) : (
                      <Text style={{ fontSize: 18, width: 28, textAlign: 'center', marginRight: 4 }}>{flagEmojiFromCode(c.code)}</Text>
                    )}
                    <Text style={{ color: colors.text }}>{c.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal CGU */}
      <Modal
        visible={cguVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCguVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Conditions d'utilisation</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: SPACING.small, fontFamily: FONTS.regular, fontSize: 12 }}>Dernière mise à jour : {CGU_LAST_UPDATE_HUMAN}</Text>
            <ScrollView style={{ maxHeight: '70%' }} showsVerticalScrollIndicator>
              <Text style={{ color: colors.text, lineHeight: 20, fontFamily: FONTS.regular, fontSize: 14 }}>{CGU_TEXT}</Text>
            </ScrollView>
            <View style={[styles.modalActions, { marginTop: SPACING.medium }]}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={() => setCguVisible(false)}>
                <Text style={styles.saveText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal À propos */}
      <Modal
        visible={aboutVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>À propos de l'application</Text>
            <ScrollView style={{ maxHeight: '70%' }} showsVerticalScrollIndicator>
              <Text style={{ color: colors.text, lineHeight: 20, fontFamily: FONTS.regular, fontSize: 14 }}>{ABOUT_TEXT}</Text>
            </ScrollView>
            <View style={[styles.modalActions, { marginTop: SPACING.medium }]}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]} onPress={() => setAboutVisible(false)}>
                <Text style={styles.saveText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection de devise */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choisir une devise</Text>
            <ScrollView style={{ maxHeight: '60%' }} showsVerticalScrollIndicator>
              {AVAILABLE_CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyOption,
                    { 
                      backgroundColor: currency.code === curr.code ? `${colors.primary}15` : 'transparent',
                      borderColor: currency.code === curr.code ? colors.primary : colors.border
                    }
                  ]}
                  onPress={async () => {
                    await setCurrency(curr);
                    setCurrencyModalVisible(false);
                  }}
                >
                  <View style={styles.currencyOptionContent}>
                    <Text style={[styles.currencySymbol, { color: colors.primary }]}>{curr.symbol}</Text>
                    <View style={styles.currencyDetails}>
                      <Text style={[styles.currencyName, { color: colors.text }]}>{curr.name}</Text>
                      <Text style={[styles.currencyCode, { color: colors.textSecondary }]}>
                        {curr.code} • {curr.decimals} décimale{curr.decimals > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  {currency.code === curr.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={[styles.modalActions, { marginTop: SPACING.medium }]}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface }]} 
                onPress={() => setCurrencyModalVisible(false)}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.medium,
    marginTop: 0,
    padding: SPACING.medium,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  profileLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.medium,
  },
  profileInitials: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  businessName: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  editProfileButton: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  section: {
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.medium,
    marginTop: 0,
    padding: SPACING.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.medium,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.small,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  settingAction: {
    marginLeft: SPACING.small,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.medium,
    marginTop: 0,
    padding: SPACING.medium,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.small,
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: SPACING.large,
  },
  versionText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  versionNumber: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.medium,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.large,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.medium,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginTop: SPACING.small,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.medium,
    height: 44,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.small,
  },
  logoPreview: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.small,
  },
  logoPlaceholder: {
    height: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  logoPlaceholderText: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  pickLogoButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.medium,
  },
  pickLogoText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.small,
  },
  modalButton: {
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.small,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  saveText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
  },
  pickerRow: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.small,
    flexDirection: 'row',
  },
  choiceChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: SPACING.small,
    paddingVertical: 6,
    marginRight: 6,
  },
  toast: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: SPACING.small,
    marginBottom: SPACING.small,
  },
  toastText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  currencyOption: {
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyOptionContent: {
    flex: 1,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginRight: SPACING.small,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  currencyCode: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});