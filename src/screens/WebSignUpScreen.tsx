import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { NavigationProps } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { CGU_TEXT } from '../utils/legal';

interface WebSignUpScreenProps extends NavigationProps {}

export const WebSignUpScreen: React.FC<WebSignUpScreenProps> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('Français');
  const [companySize, setCompanySize] = useState('');
  const [sector, setSector] = useState('');
  const [interest, setInterest] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showCGU, setShowCGU] = useState(false);
  const [picker, setPicker] = useState<null | { type: 'country' | 'language' | 'size' | 'sector' | 'interest' }>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState('');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    businessName?: string;
    country?: string;
    language?: string;
    acceptTerms?: string;
  }>({});
  const [countries, setCountries] = useState<Array<{ name: string; code: string; dial: string }>>([]);
  const { width } = Dimensions.get('window');
  const isLargeScreen = width > 768;

  const COUNTRIES = ['Guinée', 'Sénégal', "Côte d’Ivoire", 'Mali', 'France', 'Maroc'];
  const COUNTRIES_FALLBACK: Array<{ name: string; code: string; dial: string }> = [
    { name: 'Guinée', code: 'GN', dial: '224' },
    { name: 'Sénégal', code: 'SN', dial: '221' },
    { name: 'Côte d’Ivoire', code: 'CI', dial: '225' },
    { name: 'Mali', code: 'ML', dial: '223' },
    { name: 'France', code: 'FR', dial: '33' },
    { name: 'Maroc', code: 'MA', dial: '212' },
  ];
  const LANGUAGES = ['Français', 'English'];
  const SIZES = ['1–5', '6–20', '21–50', '51–200', '200+'];
  const SECTORS = ['Commerce', 'Services', 'Agro', 'Industrie', 'Tech'];
  const INTERESTS = ['Ventes', 'Stock', 'Facturation', 'CRM', 'Tableau de bord'];

  const validateEmail = (val: string) => /\S+@\S+\.\S+/.test(val);
  const validatePhone = (val: string) => /^\+?[0-9]{7,15}$/.test(val.replace(/\s|-/g, ''));
  const validatePassword = (val: string) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(val);

  const setAndValidate = (field: keyof typeof errors, value: string) => {
    switch (field) {
      case 'fullName':
        setFullName(value);
        setErrors((e) => ({ ...e, fullName: value.trim() ? undefined : 'Le nom complet est requis' }));
        break;
      case 'email':
        setEmail(value);
        setErrors((e) => ({ ...e, email: !value.trim() ? "L'email est requis" : (validateEmail(value) ? undefined : "Format d'email invalide") }));
        break;
      case 'password':
        setPassword(value);
        setErrors((e) => ({
          ...e,
          password: !value.trim() ? 'Le mot de passe est requis' : (validatePassword(value) ? undefined : 'Min 8 car., 1 majuscule, 1 chiffre'),
          confirmPassword: confirmPassword && value !== confirmPassword ? 'Les mots de passe ne correspondent pas' : e.confirmPassword,
        }));
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        setErrors((e) => ({ ...e, confirmPassword: !value.trim() ? 'Confirmation requise' : (value === password ? undefined : 'Les mots de passe ne correspondent pas') }));
        break;
      case 'businessName':
        setBusinessName(value);
        setErrors((e) => ({ ...e, businessName: value.trim() ? undefined : 'Le nom de votre commerce est requis' }));
        break;
      case 'country':
        setCountry(value);
        setErrors((e) => ({ ...e, country: value ? undefined : 'Le pays est requis' }));
        break;
      case 'language':
        setLanguage(value);
        setErrors((e) => ({ ...e, language: value ? undefined : 'La langue est requise' }));
        break;
    }
  };

  const getSelectedCountry = () => (countries.length ? countries : COUNTRIES_FALLBACK).find((c) => c.name === country);
  const buildFullPhone = (rest: string) => {
    const sel = getSelectedCountry();
    const dial = sel?.dial ? `+${sel.dial}` : '';
    return [dial, rest].filter(Boolean).join(' ').trim();
  };
  const formatPhoneRest = (text: string) => {
    const digits = text.replace(/\D/g, '');
    return digits.replace(/(.{2})/g, '$1 ').trim(); // group by 2
  };
  const onPhoneChange = (text: string) => {
    const formatted = formatPhoneRest(text);
    setPhone(formatted);
    const full = buildFullPhone(formatted).replace(/\s|-/g, '');
    setErrors((e) => ({
      ...e,
      phone: full && /^\+?[0-9]{7,15}$/.test(full) ? undefined : 'Format international requis',
    }));
  };

  const canSubmit = () => (
    !!fullName.trim() &&
    !!email.trim() && validateEmail(email) &&
    !!phone.trim() && validatePhone(buildFullPhone(phone)) &&
    !!password.trim() && validatePassword(password) &&
    !!confirmPassword.trim() && password === confirmPassword &&
    !!businessName.trim() &&
    !!country && !!language &&
    acceptTerms
  );

  const handleSignUp = async () => {
    if (!canSubmit()) return;

    setLoading(true);
    try {
      await signUp(
        email.trim(),
        password,
        businessName.trim(),
        {
          displayName: fullName.trim(),
          phone: buildFullPhone(phone).replace(/\s|-/g, ''),
          country,
          language: language as any,
          companySize: companySize as any,
          sector,
          interest: interest as any,
        }
      );
      setShowToast('Bienvenue sur OMEX !');
      setTimeout(() => setShowToast(''), 2500);
      try {
        navigation.navigate('Dashboard' as never);
      } catch {
        navigation.navigate('Login');
      }
    } catch (error: any) {
      Alert.alert(
        'Erreur d\'inscription',
        error?.message || 'Une erreur s\'est produite lors de la création du compte'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const openPicker = (type: 'country' | 'language' | 'size' | 'sector' | 'interest') => setPicker({ type });
  const closePicker = () => setPicker(null);
  const pickValue = (val: string) => {
    if (!picker) return;
    if (picker.type === 'country') setAndValidate('country', val);
    if (picker.type === 'language') setAndValidate('language', val);
    if (picker.type === 'size') setCompanySize(val);
    if (picker.type === 'sector') setSector(val);
    if (picker.type === 'interest') setInterest(val);
    closePicker();
  };

  // Ensure body scroll is restored on web when modals are closed
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const hasOpenModal = !!picker || !!showCGU;
    const prev = document.body.style.overflow;
    document.body.style.overflow = hasOpenModal ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [picker, showCGU]);

  // Load full list of countries on web (with ISO codes for flags and dialing codes)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd', { signal: controller.signal });
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
        // sort by French label, dedupe by name
        const byName = new Map<string, { name: string; code: string; dial: string }>();
        list.forEach((c) => {
          if (!byName.has(c.name)) byName.set(c.name, c);
        });
        const sorted = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        if (sorted.length) setCountries(sorted);
      } catch {
        // ignore; fallback to static COUNTRIES
      }
    })();
    return () => controller.abort();
  }, []);

  const flagEmojiFromCode = (code: string) =>
    code
      ? String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)))
      : '';

  // Left content for country input (flag when selected)
  const allCountries = countries.length ? countries : COUNTRIES_FALLBACK;
  const selectedCountry = allCountries.find((c) => c.name === country);
  const countryLeftContent = selectedCountry
    ? (
        Platform.OS === 'web' ? (
          <Image
            source={{ uri: `https://flagcdn.com/24x18/${selectedCountry.code.toLowerCase()}.png` }}
            style={styles.pickerFlagImg}
            accessibilityLabel={`Drapeau ${selectedCountry.name}`}
          />
        ) : (
          <Text style={styles.pickerFlag}>{flagEmojiFromCode(selectedCountry.code)}</Text>
        )
      )
    : undefined;

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.webContainer}>
        {/* Section gauche - Branding */}
        <View style={[styles.brandingSection, !isLargeScreen && styles.hidden]}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.brandingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.brandingContent}>
              <Logo size="large" showText={true} />
              <Text style={styles.brandingTitle}>
              Créer un compte ALDJI_NEXUS
              </Text>
              <Text style={styles.brandingSubtitle}>
                Rejoignez la plateforme qui connecte les PME à l’avenir
              </Text>
              <View style={styles.benefitsContainer}>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>✨</Text>
                  <Text style={styles.benefitText}>Interface moderne et intuitive</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>🔒</Text>
                  <Text style={styles.benefitText}>Sécurité maximale des données</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>📱</Text>
                  <Text style={styles.benefitText}>Accessible partout</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitIcon}>🚀</Text>
                  <Text style={styles.benefitText}>Démarrage rapide</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Section droite - Formulaire */}
        <View style={styles.formSection}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.title}>Créer un compte ALDJI-NEXUS</Text>
                <Text style={styles.subtitle}>
                  Rejoignez la plateforme qui connecte les PME à l’avenir
                </Text>
              </View>

              <View style={styles.formContent}>
                {showToast ? (
                  <View style={styles.toast}>
                    <Text style={styles.toastText}>{showToast}</Text>
                  </View>
                ) : null}

                <Input
                  label="Nom complet"
                  placeholder="Ex: Marie Camara"
                  value={fullName}
                  onChangeText={(t) => setAndValidate('fullName', t)}
                  leftIcon="person"
                  error={errors.fullName}
                  style={styles.input}
                  autoCapitalize="words"
                />

                <Input
                  label="Email professionnel"
                  placeholder="prenom.nom@entreprise.com"
                  value={email}
                  onChangeText={(t) => setAndValidate('email', t)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail"
                  error={errors.email}
                  style={styles.input}
                />

                <Pressable onPress={() => openPicker('country')}>
                  <Input
                    label="Pays"
                    placeholder="Sélectionner le pays"
                    value={country}
                    onChangeText={() => {}}
                    leftIcon={countryLeftContent ? undefined : 'flag'}
                    leftContent={countryLeftContent}
                    rightIcon="chevron-down"
                    error={errors.country}
                    style={styles.input}
                  />
                </Pressable>

                <Input
                  label="Numéro de téléphone"
                  placeholder="Ex: 620 00 00 00"
                  value={phone}
                  onChangeText={onPhoneChange}
                  keyboardType="phone-pad"
                  leftContent={selectedCountry ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {Platform.OS === 'web' ? (
                        <Image
                          source={{ uri: `https://flagcdn.com/24x18/${selectedCountry.code.toLowerCase()}.png` }}
                          style={styles.pickerFlagImg}
                          accessibilityLabel={`Drapeau ${selectedCountry.name}`}
                        />
                      ) : (
                        <Text style={styles.pickerFlag}>{flagEmojiFromCode(selectedCountry.code)}</Text>
                      )}
                      <Text style={styles.phoneDialText}>{selectedCountry ? `+${selectedCountry.dial}` : ''}</Text>
                    </View>
                  ) : undefined}
                  rightIcon="chevron-down"
                  error={errors.phone}
                  style={styles.input}
                />

                <Input
                  label="Mot de passe"
                  placeholder="Min 8 caractères, 1 majuscule, 1 chiffre"
                  value={password}
                  onChangeText={(t) => setAndValidate('password', t)}
                  secureTextEntry
                  leftIcon="lock-closed"
                  error={errors.password}
                  style={styles.input}
                />

                <Input
                  label="Confirmer le mot de passe"
                  placeholder="Retapez votre mot de passe"
                  value={confirmPassword}
                  onChangeText={(t) => setAndValidate('confirmPassword', t)}
                  secureTextEntry
                  leftIcon="lock-closed"
                  error={errors.confirmPassword}
                  style={styles.input}
                />

                <Input
                  label="Nom de l’entreprise"
                  placeholder="Ex: OMEX SARL"
                  value={businessName}
                  onChangeText={(t) => setAndValidate('businessName', t)}
                  leftIcon="business"
                  error={errors.businessName}
                  style={styles.input}
                  autoCapitalize="words"
                />

                <Pressable onPress={() => openPicker('language')}>
                  <Input
                    label="Langue préférée"
                    placeholder="Choisir la langue"
                    value={language}
                    onChangeText={() => {}}
                    leftIcon="language"
                    rightIcon="chevron-down"
                    error={errors.language}
                    style={styles.input}
                  />
                </Pressable>

                <Pressable onPress={() => openPicker('size')}>
                  <Input
                    label="Taille de l’entreprise (optionnel)"
                    placeholder="Sélectionner la taille"
                    value={companySize}
                    onChangeText={() => {}}
                    leftIcon="people"
                    rightIcon="chevron-down"
                    style={styles.input}
                  />
                </Pressable>

                <Pressable onPress={() => openPicker('sector')}>
                  <Input
                    label="Secteur d’activité (optionnel)"
                    placeholder="Sélectionner le secteur"
                    value={sector}
                    onChangeText={() => {}}
                    leftIcon="briefcase"
                    rightIcon="chevron-down"
                    style={styles.input}
                  />
                </Pressable>

                <Pressable onPress={() => openPicker('interest')}>
                  <Input
                    label="Intérêt principal (optionnel)"
                    placeholder="Sélectionner l’intérêt"
                    value={interest}
                    onChangeText={() => {}}
                    leftIcon="star"
                    rightIcon="chevron-down"
                    style={styles.input}
                  />
                </Pressable>

                <View style={styles.termsRow}>
                  <Pressable onPress={() => setAcceptTerms(!acceptTerms)} style={styles.checkbox}>
                    <Ionicons name={acceptTerms ? 'checkbox' : 'square-outline'} size={22} color={acceptTerms ? COLORS.primary : COLORS.textSecondary} />
                  </Pressable>
                  <Text style={styles.termsText}>
                    J’accepte les{' '}
                    <Text style={styles.termsLink} onPress={() => setShowCGU(true)}>Conditions d’utilisation</Text>
                  </Text>
                </View>
                {errors.acceptTerms ? <Text style={styles.errorInline}>{errors.acceptTerms}</Text> : null}

                <Button
                  title="Créer mon compte"
                  onPress={handleSignUp}
                  loading={loading}
                  fullWidth
                  style={styles.signUpButton}
                  disabled={!canSubmit()}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={styles.loginButton}
                  onPress={handleBackToLogin}
                >
                  <Text style={styles.loginButtonText}>
                    Déjà inscrit ? Se connecter
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Picker Modal */}
      {picker && (
        <Modal visible transparent onRequestClose={closePicker}>
          <Pressable style={styles.pickerModal} onPress={closePicker}>
            <View style={styles.pickerModalContent}>
              {picker.type === 'country' && (
                <ScrollView style={styles.pickerList} showsVerticalScrollIndicator>
                  {(countries.length ? countries : COUNTRIES_FALLBACK).map((c) => (
                    <Pressable key={c.code + c.name} onPress={() => pickValue(c.name)}>
                      <View style={styles.pickerRow}>
                        {Platform.OS === 'web' ? (
                          <Image
                            source={{ uri: `https://flagcdn.com/24x18/${c.code.toLowerCase()}.png` }}
                            style={styles.pickerFlagImg}
                            accessibilityLabel={`Drapeau ${c.name}`}
                          />
                        ) : (
                          <Text style={styles.pickerFlag}>{flagEmojiFromCode(c.code)}</Text>
                        )}
                        <Text style={styles.pickerName}>{c.name}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {picker.type === 'language' && (
                <View>
                  {LANGUAGES.map((l) => (
                    <Pressable key={l} onPress={() => pickValue(l)}>
                      <Text style={styles.pickerItem}>{l}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'size' && (
                <View>
                  {SIZES.map((s) => (
                    <Pressable key={s} onPress={() => pickValue(s)}>
                      <Text style={styles.pickerItem}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'sector' && (
                <View>
                  {SECTORS.map((s) => (
                    <Pressable key={s} onPress={() => pickValue(s)}>
                      <Text style={styles.pickerItem}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'interest' && (
                <View>
                  {INTERESTS.map((i) => (
                    <Pressable key={i} onPress={() => pickValue(i)}>
                      <Text style={styles.pickerItem}>{i}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* CGU Modal */}
      <Modal visible={showCGU} transparent onRequestClose={() => setShowCGU(false)}>
        <Pressable style={styles.cguModal} onPress={() => setShowCGU(false)}>
          <View style={styles.cguModalContent}>
            <Text style={styles.cguTitle}>Conditions d’utilisation</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.cguText}>{CGU_TEXT}</Text>
            </ScrollView>
            <Pressable onPress={() => setShowCGU(false)} style={{ alignSelf: 'flex-end', marginTop: SPACING.sm }}>
              <Text style={styles.cguClose}>Fermer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh' as any,
    overflow: 'hidden',
  },
  brandingSection: {
    flex: 1,
    maxWidth: 600,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        height: '100vh' as any,
      },
    }),
  },
  hidden: {
    display: 'none',
  },
  brandingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING['2xl'],
    paddingRight: SPACING['2xl'],
    paddingLeft: SPACING.sm,
  },
  brandingContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  brandingTitle: {
    fontSize: FONTS.sizes['3xl'],
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  brandingSubtitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: SPACING['2xl'],
    lineHeight: 28,
  },
  benefitsContainer: {
    width: '100%',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  benefitText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: COLORS.white,
    opacity: 0.9,
  },
  formSection: {
    flex: 1,
    backgroundColor: COLORS.surface,
    ...Platform.select({
      web: {
        minWidth: 400,
        width: '100%' as any,
        maxWidth: 'unset' as any,
        height: '100vh' as any,
        overflowY: 'auto' as any,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  formContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  formHeader: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContent: {
    gap: SPACING.md,
  },
  toast: {
    backgroundColor: '#0ea5e9',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  toastText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  checkbox: {
    marginRight: SPACING.sm,
  },
  termsText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  termsLink: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  errorInline: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  pickerModal: {
    position: 'fixed' as any,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: 420,
    maxWidth: '90%' as any,
  },
  pickerList: {
    maxHeight: 480,
    ...Platform.select({
      web: {
        maxHeight: '70vh' as any,
      },
    }),
  },
  pickerItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  pickerFlag: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  pickerFlagImg: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  pickerName: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
  },
  cguModal: {
    position: 'fixed' as any,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cguModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: 520,
    maxWidth: '90%' as any,
  },
  cguTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  cguText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  cguClose: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  phoneDialText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
});
