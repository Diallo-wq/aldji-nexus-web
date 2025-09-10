// Types pour l'application OMEX

export interface User {
  id: string;
  email: string;
  displayName?: string;
  businessName?: string;
  businessAddress?: string;
  phone?: string;
  country?: string;
  language?: 'Français' | 'English';
  companySize?: '1–5' | '6–20' | '21–50' | '51–200' | '200+' | '21+';
  sector?: string;
  tags?: string[];
  interest?: 'Ventes' | 'Stock' | 'Facturation' | 'CRM' | 'Tableau de bord' | string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  quantity: number;
  minQuantity: number; // Quantité minimale avant alerte
  category?: string;
  imageUrl?: string;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  imageUrl?: string;
  totalPurchases: number;
  lastPurchase?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  // Identification
  name: string; // Nom du fournisseur / Société
  type?: 'Entreprise' | 'Indépendant' | 'Organisation';
  contactPerson?: string; // Contact principal
  email?: string;
  phone?: string;

  // Adresse
  addressLine1?: string; // Rue
  addressLine2?: string; // Rue 2
  city?: string;
  state?: string; // Région / État
  postalCode?: string;
  country?: string;

  // Informations fiscales et bancaires
  taxId?: string; // NIF
  vatNumber?: string; // N° TVA intracommunautaire
  iban?: string; // IBAN / Compte bancaire
  bankName?: string;
  bankAddress?: string;

  // Informations commerciales
  productsServices?: string[]; // Tags libres
  billingCurrency?: string; // Devise de facturation
  paymentTerms?: string; // ex: 30 jours
  defaultShippingMethod?: string; // Transporteur, Livraison interne, etc.
  commercialTerms?: string; // Conditions commerciales (texte)

  // Segmentation & suivi
  tags?: string[]; // Étiquettes / Tags
  internalNotes?: string; // Notes internes

  // Médias
  logoUrl?: string; // URL du logo/photo

  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currency: string;
  taxRate: number;
  language: string;
  theme: 'light' | 'dark';
}

export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  recentActivities: ActivityItem[];
}

// Activités récentes unifiées pour le tableau de bord
export type ActivityType = 'sale' | 'product' | 'customer' | 'supplier';
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string; // ex: "Vente complétée", "Nouveau produit", etc.
  subtitle?: string; // ex: client ou nom
  createdAt: Date;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    businessName: string,
    extras?: {
      displayName?: string;
      phone?: string;
      country?: string;
      language?: User['language'];
      companySize?: User['companySize'];
      sector?: string;
      interest?: User['interest'];
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../navigation/MainNavigation';
import { ProductsStackParamList } from '../navigation/ProductsNavigation';
import { SalesStackParamList } from '../navigation/SalesNavigation';
import { SuppliersStackParamList } from '../navigation/SuppliersNavigation';

// Types pour la navigation
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
};

// Type générique pour les props de navigation
export interface NavigationProps {
  navigation: any;
  route: any;
}

// Types spécifiques pour la navigation des produits
export type ProductsScreenNavigationProp = StackNavigationProp<ProductsStackParamList, 'ProductsList'>;
export type ProductsScreenRouteProp = RouteProp<ProductsStackParamList, 'ProductsList'>;

export type AddEditProductScreenNavigationProp = StackNavigationProp<ProductsStackParamList, 'AddEditProduct'>;
export type AddEditProductScreenRouteProp = RouteProp<ProductsStackParamList, 'AddEditProduct'>;

// Types spécifiques pour la navigation des ventes
export type SalesScreenNavigationProp = StackNavigationProp<SalesStackParamList, 'SalesList'>;
export type SalesScreenRouteProp = RouteProp<SalesStackParamList, 'SalesList'>;

export type AddEditSaleScreenNavigationProp = StackNavigationProp<SalesStackParamList, 'AddEditSale'>;
export type AddEditSaleScreenRouteProp = RouteProp<SalesStackParamList, 'AddEditSale'>;

// Types spécifiques pour la navigation des fournisseurs
export type SuppliersScreenNavigationProp = StackNavigationProp<SuppliersStackParamList, 'SuppliersList'>;
export type SuppliersScreenRouteProp = RouteProp<SuppliersStackParamList, 'SuppliersList'>;
export type AddEditSupplierScreenNavigationProp = StackNavigationProp<SuppliersStackParamList, 'AddEditSupplier'>;
export type AddEditSupplierScreenRouteProp = RouteProp<SuppliersStackParamList, 'AddEditSupplier'>;
