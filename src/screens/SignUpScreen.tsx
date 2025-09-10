import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Pressable
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

interface SignUpScreenProps extends NavigationProps {}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
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
  const [picker, setPicker] = useState<null | { type: 'country' | 'language' | 'size' | 'sector' | 'interest'; }>(null);
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

  const COUNTRIES = ['Guinée', 'Sénégal', "Côte d’Ivoire", 'Mali', 'France', 'Maroc'];
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
      case 'phone':
        setPhone(value);
        setErrors((e) => ({ ...e, phone: !value.trim() ? 'Le numéro est requis' : (validatePhone(value) ? undefined : 'Format international requis') }));
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

  const isFormValid = () => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) newErrors.fullName = 'Le nom complet est requis';
    if (!email.trim()) newErrors.email = "L'email est requis"; else if (!validateEmail(email)) newErrors.email = "Format d'email invalide";
    if (!phone.trim()) newErrors.phone = 'Le numéro est requis'; else if (!validatePhone(phone)) newErrors.phone = 'Format international requis';
    if (!password.trim()) newErrors.password = 'Le mot de passe est requis'; else if (!validatePassword(password)) newErrors.password = 'Min 8 car., 1 majuscule, 1 chiffre';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Confirmation requise'; else if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!businessName.trim()) newErrors.businessName = 'Le nom de votre commerce est requis';
    if (!country) newErrors.country = 'Le pays est requis';
    if (!language) newErrors.language = 'La langue est requise';
    if (!acceptTerms) newErrors.acceptTerms = "Vous devez accepter les Conditions d'utilisation";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!isFormValid()) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, businessName.trim());
      setShowToast('Bienvenue sur OMEX !');
      setTimeout(() => setShowToast(''), 2500);
      // Essayer d'aller vers le Dashboard si disponible, sinon Login
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

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Logo size="large" showText={false} />
            <Text style={styles.titleMain}>Créer un compte OMEX</Text>
            <Text style={styles.welcomeText}>
              Rejoignez la plateforme qui connecte les PME à l’avenir
            </Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            {showToast ? (
              <View style={styles.toast}>
                <Text style={styles.toastText}>{showToast}</Text>
              </View>
            ) : null}
            <Text style={styles.sectionTitle}>Informations du compte</Text>

            <Input
              label="Nom complet"
              placeholder="Ex: Marie Camara"
              value={fullName}
              onChangeText={(t) => setAndValidate('fullName', t)}
              leftIcon="person"
              error={errors.fullName}
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
            />

            <Input
              label="Numéro de téléphone"
              placeholder="Ex: +224 620 00 00 00"
              value={phone}
              onChangeText={(t) => setAndValidate('phone', t)}
              keyboardType="phone-pad"
              leftIcon="call"
              error={errors.phone}
            />

            <Input
              label="Mot de passe"
              placeholder="Min 8 caractères, 1 majuscule, 1 chiffre"
              value={password}
              onChangeText={(t) => setAndValidate('password', t)}
              secureTextEntry
              leftIcon="lock-closed"
              error={errors.password}
            />

            <Input
              label="Confirmation du mot de passe"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChangeText={(t) => setAndValidate('confirmPassword', t)}
              secureTextEntry
              leftIcon="lock-closed"
              error={errors.confirmPassword}
            />

            <Text style={styles.sectionTitle}>Entreprise</Text>

            <Input
              label="Nom de l’entreprise"
              placeholder="Ex: OMEX SARL"
              value={businessName}
              onChangeText={(t) => setAndValidate('businessName', t)}
              leftIcon="business"
              error={errors.businessName}
              autoCapitalize="words"
            />

            <Pressable onPress={() => openPicker('country')}>
              <Input
                label="Pays"
                placeholder="Sélectionner le pays"
                value={country}
                onChangeText={() => {}}
                leftIcon="flag"
                rightIcon="chevron-down"
                error={errors.country}
              />
            </Pressable>

            <Pressable onPress={() => openPicker('language')}>
              <Input
                label="Langue préférée"
                placeholder="Choisir la langue"
                value={language}
                onChangeText={() => {}}
                leftIcon="language"
                rightIcon="chevron-down"
                error={errors.language}
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
              />
            </Pressable>

            <View style={styles.termsRow}>
              <Pressable onPress={() => setAcceptTerms(!acceptTerms)} style={styles.checkbox}>
                <Ionicons name={acceptTerms ? 'checkbox' : 'square-outline'} size={22} color={acceptTerms ? COLORS.primary : COLORS.textSecondary} />
              </Pressable>
              <Text style={styles.termsText}>
                J’accepte les
                {' '}
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
              disabled={!isFormValid()}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Déjà inscrit ? Se connecter"
              onPress={handleBackToLogin}
              variant="outline"
              fullWidth
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker Modals */}
      {picker && (
        <Modal
          visible={!!picker}
          transparent={true}
          onRequestClose={closePicker}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalContent}>
              {picker.type === 'country' && (
                <View>
                  {COUNTRIES.map((country) => (
                    <Pressable key={country} onPress={() => pickValue(country)}>
                      <Text style={styles.pickerItem}>{country}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'language' && (
                <View>
                  {LANGUAGES.map((language) => (
                    <Pressable key={language} onPress={() => pickValue(language)}>
                      <Text style={styles.pickerItem}>{language}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'size' && (
                <View>
                  {SIZES.map((size) => (
                    <Pressable key={size} onPress={() => pickValue(size)}>
                      <Text style={styles.pickerItem}>{size}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'sector' && (
                <View>
                  {SECTORS.map((sector) => (
                    <Pressable key={sector} onPress={() => pickValue(sector)}>
                      <Text style={styles.pickerItem}>{sector}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {picker.type === 'interest' && (
                <View>
                  {INTERESTS.map((interest) => (
                    <Pressable key={interest} onPress={() => pickValue(interest)}>
                      <Text style={styles.pickerItem}>{interest}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* CGU Modal */}
      <Modal
        visible={showCGU}
        transparent={true}
        onRequestClose={() => setShowCGU(false)}
      >
        <View style={styles.cguModal}>
          <View style={styles.cguModalContent}>
            <Text style={styles.cguTitle}>Conditions d’utilisation</Text>
            <Text style={styles.cguText}>{CGU_TEXT}</Text>
            <Pressable onPress={() => setShowCGU(false)}>
              <Text style={styles.cguClose}>Fermer</Text>
            </Pressable>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleMain: {
    color: COLORS.white,
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  welcomeText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: SPACING.sm,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
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
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: '80%',
  },
  pickerItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cguModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cguModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: '80%',
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
    marginBottom: SPACING.md,
  },
  cguClose: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
});
