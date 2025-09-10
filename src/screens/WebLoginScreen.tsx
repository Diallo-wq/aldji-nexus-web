import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Pressable,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { NavigationProps } from '../types';

interface WebLoginScreenProps extends NavigationProps {}

export const WebLoginScreen: React.FC<WebLoginScreenProps> = ({ navigation }) => {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { width } = Dimensions.get('window');
  const isLargeScreen = width > 768;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        'Erreur de connexion',
        error.message || 'Une erreur s\'est produite lors de la connexion'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email d\'abord');
      return;
    }

    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Email envoyé',
        'Un email de réinitialisation a été envoyé à votre adresse email'
      );
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur s\'est produite lors de l\'envoi de l\'email'
      );
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  if (Platform.OS !== 'web') {
    // Retourner à l'écran mobile classique si pas sur web
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
                Bienvenue dans ALDJI-NEXUS
              </Text>
              <Text style={styles.brandingSubtitle}>
                Votre solution complète de gestion commerciale moderne
              </Text>
              
              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>📊</Text>
                  <Text style={styles.featureText}>Tableau de bord intuitif</Text>
                </View>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>📦</Text>
                  <Text style={styles.featureText}>Gestion des stocks</Text>
                </View>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>👥</Text>
                  <Text style={styles.featureText}>Suivi des clients</Text>
                </View>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>📈</Text>
                  <Text style={styles.featureText}>Rapports détaillés</Text>
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
                <Text style={styles.title}>Connexion</Text>
                <Text style={styles.subtitle}>
                  Connectez-vous à votre espace de gestion
                </Text>
              </View>

              <View style={styles.formContent}>
                <Input
                  label="Adresse email"
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail"
                  error={errors.email}
                  style={styles.input}
                />

                <Input
                  label="Mot de passe"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon="lock-closed"
                  error={errors.password}
                  style={styles.input}
                />

                <Button
                  title="Se connecter"
                  onPress={handleLogin}
                  loading={loading}
                  fullWidth
                  style={styles.loginButton}
                />

                <Pressable
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    Mot de passe oublié ?
                  </Text>
                </Pressable>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                >
                  <Text style={styles.signUpButtonText}>
                    Créer un nouveau compte
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
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
  featuresContainer: {
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureText: {
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.xl,
  },
  formContainer: {
    maxWidth: '100%' as any,
    alignSelf: 'stretch',
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
    gap: SPACING.lg,
  },
  input: {
    marginBottom: SPACING.md,
  },
  loginButton: {
    marginTop: SPACING.md,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    padding: SPACING.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  forgotPasswordText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  signUpButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.2s ease-in-out',
        ':hover': {
          backgroundColor: COLORS.primary,
        },
      },
    }),
  },
  signUpButtonText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease-in-out',
      },
    }),
  },
});
