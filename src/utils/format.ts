import { useCurrency } from '../contexts/CurrencyContext';

export type FormatAmountOptions = {
  decimals?: number; // number of decimal places to show; if undefined, uses currency default
  currency?: string; // optional currency suffix like '€', 'GNF', 'FCFA' - overrides context currency
};

/**
 * Formats a number for display with French-style digit grouping and currency.
 * Uses the currency from CurrencyContext by default, but can be overridden.
 * Examples:
 *  - formatAmount(1000000) => "1  000 000 GNF" (using context currency)
 *  - formatAmount(1234.5, { decimals: 2, currency: '€' }) => "1  234,50 €"
 */
export function formatAmount(value: number | string | null | undefined, options: FormatAmountOptions = {}): string {
  const { decimals, currency } = options;

  if (value === null || value === undefined) return currency ? `0 ${currency}` : '0';

  const n = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(n as number) || isNaN(n as number)) return currency ? `0 ${currency}` : '0';

  const finalDecimals = decimals ?? 2; // Default to 2 if not specified
  
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: finalDecimals,
    maximumFractionDigits: finalDecimals,
  }).format(n as number);

  return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * Hook-based format function that uses the current currency context.
 * Use this in React components for dynamic currency formatting.
 */
export function useFormatAmount() {
  const { formatAmount: contextFormatAmount } = useCurrency();
  return contextFormatAmount;
}
