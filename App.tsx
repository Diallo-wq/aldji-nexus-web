import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme as NavLightTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { WebLoginScreen } from './src/screens/WebLoginScreen';
import { WebSignUpScreen } from './src/screens/WebSignUpScreen';
import { MainNavigation } from './src/navigation/MainNavigation';
import { COLORS, FONTS } from './src/utils/constants';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { loadFonts } from './src/utils/fonts';
import { CurrencyProvider } from './src/contexts/CurrencyContext';

// Importer les types depuis le fichier types
import { RootStackParamList } from './src/types';

// Importer les styles CSS et enregistrer le Service Worker pour la version web
if (Platform.OS === 'web') {
  require('./web/index.css');
  import('./src/registerServiceWorker').then((m) => m.registerServiceWorker());
}

// Importer les services et composants de mise à jour
import { updateService, UpdateCheckResult } from './src/services/UpdateService';
import { UpdateModal } from './src/components/UpdateModal';

const Stack = createStackNavigator<RootStackParamList>();

// Composant pour la navigation d'authentification
const AuthStack = () => {
  // Utiliser les écrans web optimisés sur web, les écrans mobiles ailleurs
  const LoginComponent = Platform.OS === 'web' ? WebLoginScreen : LoginScreen;
  const SignUpComponent = Platform.OS === 'web' ? WebSignUpScreen : SignUpScreen;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginComponent} />
      <Stack.Screen name="SignUp" component={SignUpComponent} />
    </Stack.Navigator>
  );
};

// Composant pour la navigation principale (après connexion)
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainNavigation} />
    </Stack.Navigator>
  );
};

// Composant principal de navigation
const Navigation = () => {
  const { user, loading } = useAuth();
  const { isDark, colors } = useTheme();
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Vérifier les mises à jour au lancement
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const result = await updateService.checkForUpdate();
        setUpdateCheck(result);
        
        if (result.hasUpdate && result.updateInfo) {
          setShowUpdateModal(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    };

    // Vérifier les mises à jour seulement si l'utilisateur est connecté
    if (user && !loading) {
      checkForUpdates();
    }
  }, [user, loading]);

  const handleUpdateLater = () => {
    setShowUpdateModal(false);
  };

  const handleCloseUpdateModal = () => {
    // Ne fermer que si la mise à jour n'est pas obligatoire
    if (updateCheck?.updateInfo && !updateCheck.updateInfo.mandatory) {
      setShowUpdateModal(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontFamily: FONTS.regular, color: colors.text }}>
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <NavigationContainer theme={isDark ? NavDarkTheme : NavLightTheme}>
        {user ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
      
      {/* Modal de mise à jour */}
      {updateCheck?.updateInfo && (
        <UpdateModal
          visible={showUpdateModal}
          updateInfo={updateCheck.updateInfo}
          onClose={handleCloseUpdateModal}
          onUpdateLater={handleUpdateLater}
        />
      )}
    </SafeAreaView>
  );
};

// Composant principal de l'application
export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadAppFonts = async () => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des polices:', error);
        setFontsLoaded(true); // Continuer même si les polices ne se chargent pas
      }
    };

    loadAppFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.text }}>
          Chargement des polices...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <CurrencyProvider>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" translucent={false} />
            <Navigation />
          </AuthProvider>
        </ThemeProvider>
      </CurrencyProvider>
    </SafeAreaProvider>
  );
}
