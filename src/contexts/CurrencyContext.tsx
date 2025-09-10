import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'GNF', symbol: 'GNF', name: 'Franc Guinéen', decimals: 0 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'Dollar Américain', decimals: 2 },
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (BCEAO)', decimals: 0 },
  { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (BEAC)', decimals: 0 },
  { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain', decimals: 2 },
  { code: 'TND', symbol: 'TND', name: 'Dinar Tunisien', decimals: 3 },
  { code: 'DZD', symbol: 'DA', name: 'Dinar Algérien', decimals: 2 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatAmount: (value: number | string | null | undefined, options?: { decimals?: number }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = '@aldji_nexus_currency';

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(AVAILABLE_CURRENCIES[0]); // GNF par défaut

  // Charger la devise sauvegardée au démarrage
  useEffect(() => {
    const loadSavedCurrency = async () => {
      try {
        const savedCurrencyCode = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (savedCurrencyCode) {
          const savedCurrency = AVAILABLE_CURRENCIES.find(c => c.code === savedCurrencyCode);
          if (savedCurrency) {
            setCurrencyState(savedCurrency);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la devise:', error);
      }
    };

    loadSavedCurrency();
  }, []);

  // Fonction pour changer la devise et la sauvegarder
  const setCurrency = async (newCurrency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency.code);
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la devise:', error);
      // Même en cas d'erreur de sauvegarde, on applique le changement
      setCurrencyState(newCurrency);
    }
  };

  // Fonction de formatage qui utilise la devise courante
  const formatAmount = (value: number | string | null | undefined, options: { decimals?: number } = {}) => {
    const decimals = options.decimals ?? currency.decimals;
    
    if (value === null || value === undefined) return `0 ${currency.symbol}`;

    const n = typeof value === 'string' ? Number(value) : value;
    if (!isFinite(n as number) || isNaN(n as number)) return `0 ${currency.symbol}`;

    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n as number);

    return `${formatted} ${currency.symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
