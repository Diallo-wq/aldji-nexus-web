import { Platform } from 'react-native';

// Styles spécifiques pour la version web
export const WEB_STYLES = Platform.select({
  web: {
    // Fix pour le défilement sur web
    scrollView: {
      height: '100vh',
      overflowY: 'auto' as 'auto',
      WebkitOverflowScrolling: 'touch' as 'touch',
    },
    container: {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden' as 'hidden',
    },
    content: {
      flex: 1,
      height: '100%',
      overflow: 'auto' as 'auto',
    },
    flatList: {
      height: '100%',
      overflow: 'auto' as 'auto',
    },
    safeArea: {
      height: '100vh',
      display: 'flex' as 'flex',
      flexDirection: 'column' as 'column',
    },
  },
  default: {},
});

// Hook pour détecter si on est sur web
export const useIsWeb = () => Platform.OS === 'web';

// Styles pour corriger le défilement sur les listes
export const getScrollableStyles = () => Platform.select({
  web: {
    height: 'calc(100vh - 200px)', // Ajustez selon votre header
    overflow: 'auto' as 'auto',
  },
  default: {},
});
