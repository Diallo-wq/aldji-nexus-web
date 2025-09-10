import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/MainNavigation';

interface WebLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ 
  children, 
  title = 'OMEX', 
  showSidebar = true 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  // Rendu mobile classique si pas sur web
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  type SidebarItem = {
    name: keyof MainTabParamList;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  };

  const sidebarItems: readonly SidebarItem[] = [
    { name: 'Dashboard', icon: 'grid-outline', label: 'Tableau de bord' },
    { name: 'Products', icon: 'cube-outline', label: 'Produits' },
    { name: 'Sales', icon: 'trending-up-outline', label: 'Ventes' },
    { name: 'Customers', icon: 'people-outline', label: 'Clients' },
    { name: 'Suppliers', icon: 'briefcase-outline', label: 'Fournisseurs' },
    { name: 'Settings', icon: 'settings-outline', label: 'Paramètres' },
  ] as const;

  return (
    <View style={styles.webLayout}>
      {/* Header removed for web layout */}

      <View style={styles.webMain}>
        {/* Sidebar Web */}
        {showSidebar && (
          <>
            {/* Overlay pour mobile */}
            {sidebarOpen && (
              <Pressable
                style={styles.overlay}
                onPress={() => setSidebarOpen(false)}
              />
            )}
            
            <View style={[
              styles.webSidebar,
              sidebarOpen && styles.sidebarOpen
            ]}>
              <View style={styles.sidebarContent}>
                <View style={styles.logoSection}>
                  <View style={styles.logoImageContainer}>
                    <Image
                      source={user?.logoUrl ? { uri: user.logoUrl } : require('../../assets/icon.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.logoSubtext}>{user?.businessName || 'OMEX'}</Text>
                </View>
                
                <View style={styles.navigation}>
                  {sidebarItems.map((item) => (
                    <Pressable
                      key={item.name}
                      style={styles.navItem}
                      onPress={() => {
                        // Navigate to the selected tab route
                        navigation.navigate(item.name as any);
                        setSidebarOpen(false);
                      }}
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={20} 
                        color={COLORS.primary} 
                      />
                      <Text style={styles.navLabel}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Contenu principal */}
        <View style={styles.webContent}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webLayout: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#f5f5f5',
  },
  webHeader: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderRadius: 8,
    ...Platform.select({
      web: {
        display: 'none',
        '@media (max-width: 1023px)': {
          display: 'flex',
        },
      },
    }),
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  userName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  signOutButton: {
    padding: SPACING.sm,
    borderRadius: 8,
  },
  webMain: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden' as any,
  },
  overlay: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 39,
        '@media (min-width: 1024px)': {
          display: 'none',
        },
      },
    }),
  },
  webSidebar: {
    width: 280,
    backgroundColor: '#2c3e50',
    borderRightWidth: 0,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        left: 0,
        top: 0,
        height: '100vh' as any,
        zIndex: 40,
      },
    }),
  },
  sidebarOpen: {
    ...Platform.select({
      web: {
        left: 0,
      },
    }),
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: SPACING.lg,
  },
  logoSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  logoImageContainer: {
    height: 100,
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  navigation: {
    paddingTop: SPACING.lg,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  navLabel: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.medium,
    color: '#ffffff',
    marginLeft: SPACING.md,
  },
  webContent: {
    flex: 1,
    marginLeft: 280,
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
      },
    }),
  },
});
