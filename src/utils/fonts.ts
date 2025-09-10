import * as Font from 'expo-font';
import { Platform } from 'react-native';

export const loadFonts = async () => {
  try {
    // Sur le web, évite de charger des TTF locaux (provoque des erreurs OTS et bloque le démarrage).
    // On utilise les polices système (voir FONTS dans utils/constants.ts).
    if (Platform.OS === 'web') return;

    await Font.loadAsync({
      'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
      'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
      'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
      'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    });
  } catch (error) {
    console.warn('Erreur lors du chargement des polices:', error);
    // Continuer sans les polices personnalisées
  }
};
