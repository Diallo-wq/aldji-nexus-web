import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProductsNavigation } from './ProductsNavigation';
import { SalesNavigation } from './SalesNavigation';
import { CustomersNavigation } from './CustomersNavigation';
import { SuppliersNavigation } from './SuppliersNavigation';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WebLayout } from '../components/WebLayout';
import { COLORS, FONTS } from '../utils/constants';

// Type pour la navigation principale
export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Sales: undefined;
  Customers: undefined;
  Suppliers: undefined;
  Settings: undefined;
  AddEditProduct: { productId?: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Wrapper pour les écrans avec WebLayout sur web
const ScreenWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => {
  if (Platform.OS === 'web') {
    return (
      <WebLayout title={title} showSidebar={true}>
        {children}
      </WebLayout>
    );
  }
  return <>{children}</>;
};

export const MainNavigation = () => {
  const insets = useSafeAreaInsets();
  
  // Créer des composants wrappés pour chaque écran avec les bonnes props
  const WrappedDashboard = (props: any) => (
    <ScreenWrapper title="Tableau de bord">
      <DashboardScreen {...props} />
    </ScreenWrapper>
  );

  const WrappedProducts = (props: any) => (
    <ScreenWrapper title="Produits">
      <ProductsNavigation {...props} />
    </ScreenWrapper>
  );

  const WrappedSales = (props: any) => (
    <ScreenWrapper title="Ventes">
      <SalesNavigation {...props} />
    </ScreenWrapper>
  );

  const WrappedCustomers = (props: any) => (
    <ScreenWrapper title="Clients">
      <CustomersNavigation {...props} />
    </ScreenWrapper>
  );

  const WrappedSettings = (props: any) => (
    <ScreenWrapper title="Paramètres">
      <SettingsScreen {...props} />
    </ScreenWrapper>
  );

  return (
    <Tab.Navigator
      sceneContainerStyle={{ paddingBottom: insets.bottom }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Sales') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Suppliers') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 12,
        },
        tabBarHideOnKeyboard: true,
        tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60 + insets.bottom,
          paddingTop: 8,
          elevation: 0,
          borderTopWidth: 1,
          paddingBottom: 5 + insets.bottom,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={WrappedDashboard} 
        options={{
          title: 'Tableau de bord',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={WrappedProducts} 
        options={{
          title: 'Produits',
        }}
      />
      <Tab.Screen 
        name="Sales" 
        component={WrappedSales} 
        options={{
          title: 'Ventes',
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={WrappedCustomers} 
        options={{
          title: 'Clients',
        }}
      />
      <Tab.Screen 
        name="Suppliers"
        options={{
          title: 'Fournisseurs',
        }}
      >
        {(props: any) => (
          <ScreenWrapper title="Fournisseurs">
            <SuppliersNavigation {...props} />
          </ScreenWrapper>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Settings" 
        component={WrappedSettings} 
        options={{
          title: 'Paramètres',
        }}
      />
    </Tab.Navigator>
  );
};