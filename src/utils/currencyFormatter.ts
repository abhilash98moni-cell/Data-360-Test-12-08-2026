export type CurrencyMode = 'USD' | 'INR';

export const USD_TO_INR_RATE = 83;

/**
 * Returns the currency symbol for the active currency mode.
 */
export function getCurrencySymbol(currencyMode: CurrencyMode = 'INR'): string {
  return currencyMode === 'USD' ? '$' : '₹';
}

/**
 * Converts a base USD amount to the target currency amount.
 */
export function getConvertedAmount(amountInUSD: number, currencyMode: CurrencyMode = 'INR'): number {
  if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) return 0;
  return currencyMode === 'USD' ? amountInUSD : amountInUSD * USD_TO_INR_RATE;
}

/**
 * Formats monetary amounts for financial transactions and tables (Debit, Credit, Balance, Totals).
 * Displays full numeric precision with 2 decimal places and correct locale formatting:
 * USD: $1,250.00
 * INR: ₹1,03,750.00 (converted by USD_TO_INR_RATE)
 */
export function formatFinancialAmount(
  amountInUSD: number | string | null | undefined,
  currencyMode: CurrencyMode = 'INR',
  options?: {
    showZeroAsDash?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amountInUSD === null || amountInUSD === undefined || amountInUSD === '') {
    return '—';
  }
  const numericVal = typeof amountInUSD === 'string' ? parseFloat(amountInUSD) : amountInUSD;
  if (isNaN(numericVal)) {
    return '—';
  }

  if (numericVal === 0 && options?.showZeroAsDash) {
    return '—';
  }

  const minDecimals = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 2;
  const maxDecimals = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;

  if (currencyMode === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    }).format(numericVal);
  }

  // INR mode: converted at 83 INR/USD
  const inrAmount = numericVal * USD_TO_INR_RATE;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(inrAmount);
}

/**
 * Formats monetary amounts seamlessly according to chosen currency mode (INR by default or USD).
 * INR: ₹3.52 Cr or ₹35.25 Lakhs (or standard Indian comma separation ₹3,52,75,000)
 * USD: $425,000
 */
export function formatCurrency(
  amountInUSD: number | string | null | undefined, 
  currencyMode: CurrencyMode = 'INR', 
  compact: boolean = false
): string {
  if (amountInUSD === null || amountInUSD === undefined || amountInUSD === '') {
    return '—';
  }
  const numericVal = typeof amountInUSD === 'string' ? parseFloat(amountInUSD) : amountInUSD;
  if (isNaN(numericVal)) {
    return '—';
  }

  if (currencyMode === 'USD') {
    if (compact) {
      if (numericVal >= 1_000_000) {
        return `$${(numericVal / 1_000_000).toFixed(2)}M`;
      }
      if (numericVal >= 1_000) {
        return `$${(numericVal / 1_000).toFixed(0)}k`;
      }
      return `$${numericVal.toLocaleString('en-US')}`;
    }
    return `$${numericVal.toLocaleString('en-US')}`;
  }

  // INR Conversion (1 USD ≈ 83 INR)
  const inrAmount = numericVal * USD_TO_INR_RATE;

  if (compact) {
    if (inrAmount >= 10_000_000) { // 1 Crore = 10,000,000
      return `₹${(inrAmount / 10_000_000).toFixed(2)} Cr`;
    }
    if (inrAmount >= 100_000) { // 1 Lakh = 100,000
      return `₹${(inrAmount / 100_000).toFixed(2)} L`;
    }
    return `₹${Math.round(inrAmount).toLocaleString('en-IN')}`;
  }

  // Non-compact INR
  if (inrAmount >= 10_000_000) {
    return `₹${(inrAmount / 10_000_000).toFixed(2)} Crore (₹${Math.round(inrAmount).toLocaleString('en-IN')})`;
  }
  if (inrAmount >= 100_000) {
    return `₹${(inrAmount / 100_000).toFixed(2)} Lakhs`;
  }

  return `₹${Math.round(inrAmount).toLocaleString('en-IN')}`;
}
