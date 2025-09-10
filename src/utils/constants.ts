// Couleurs de l'application OMEX
export const COLORS = {
  // Couleurs principales
  primary: '#1e3a8a', // Bleu foncé
  secondary: '#c0c0c0', // Argenté
  white: '#ffffff',
  black: '#000000',
  
  // Couleurs de fond
  background: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Couleurs de texte
  text: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  // Alias rétrocompatibilité
  textPrimary: '#1f2937',
  
  // Couleurs d'état
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  // Alias rétrocompatibilité
  danger: '#ef4444',
  info: '#3b82f6',
  
  // Couleurs de bordure
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  // Alias rétrocompatibilité
  inputBackground: '#ffffff',
  
  // Couleurs de gradient
  gradientStart: '#1e3a8a',
  gradientEnd: '#3b82f6',
  
  // Couleurs de graphiques
  chartColors: [
    '#1e3a8a',
    '#3b82f6',
    '#60a5fa',
    '#93c5fd',
    '#c7d2fe',
    '#e0e7ff'
  ],

  // Ombres
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    }
  }
};

// Typographie - Utilisation des polices système par défaut
export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  }
};

// Espacements
export const SPACING = {
  xs: 4,
  sm: 8,
  small: 8,
  md: 16,
  medium: 16,
  lg: 24,
  large: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64
};

// Rayons de bordure
export const BORDER_RADIUS = {
  sm: 4,
  small: 4,
  md: 8,
  medium: 8,
  lg: 12,
  large: 12,
  xl: 16,
  full: 9999
};

// Configuration de l'application
export const APP_CONFIG = {
  name: 'OMEX',
  version: '1.0.0',
  description: 'Application de gestion commerciale',
  
  // Configuration par défaut
  defaultCurrency: 'EUR',
  defaultTaxRate: 20, // 20%
  defaultLanguage: 'fr',
  
  // Limites
  maxProductNameLength: 100,
  maxProductDescriptionLength: 500,
  maxCustomerNameLength: 100,
  maxSupplierNameLength: 100,
  
  // Quantités par défaut
  defaultMinQuantity: 5,
  defaultMaxQuantity: 9999,
  
  // Formats de date
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'DD/MM/YYYY HH:mm'
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  // Authentification
  invalidEmail: 'Adresse email invalide',
  weakPassword: 'Le mot de passe doit contenir au moins 6 caractères',
  emailAlreadyInUse: 'Cette adresse email est déjà utilisée',
  userNotFound: 'Aucun compte trouvé avec cette adresse email',
  wrongPassword: 'Mot de passe incorrect',
  
  // Produits
  productNameRequired: 'Le nom du produit est requis',
  productPriceRequired: 'Le prix du produit est requis',
  productQuantityRequired: 'La quantité est requise',
  insufficientStock: 'Stock insuffisant',
  
  // Clients
  customerNameRequired: 'Le nom du client est requis',
  customerPhoneRequired: 'Le téléphone du client est requis',
  
  // Ventes
  saleItemsRequired: 'Au moins un produit est requis',
  invalidQuantity: 'Quantité invalide',
  
  // Général
  networkError: 'Erreur de connexion réseau',
  unknownError: 'Une erreur inattendue s\'est produite',
  required: 'Ce champ est requis'
};

// Messages de succès
export const SUCCESS_MESSAGES = {
  productCreated: 'Produit créé avec succès',
  productUpdated: 'Produit mis à jour avec succès',
  productDeleted: 'Produit supprimé avec succès',
  customerCreated: 'Client créé avec succès',
  customerUpdated: 'Client mis à jour avec succès',
  saleCreated: 'Vente enregistrée avec succès',
  passwordResetSent: 'Email de réinitialisation envoyé',
  settingsSaved: 'Paramètres sauvegardés'
};
