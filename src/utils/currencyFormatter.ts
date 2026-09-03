export type CurrencyMode = 'USD' | 'INR';

export const USD_TO_INR_RATE = 83;

/**
 * Returns the currency symbol for the active currency mode.
 */
export function getCurrencySymbol(currencyMode: CurrencyMode = 'INR'): string {
  return currencyMode === 'USD' ? '$' : '₹';
}

/**
 * Converts a base INR GL amount to the target currency amount for display/calculation.
 * Raw uploaded General Ledger amounts are in INR by default.
 */
export function getConvertedAmount(amountInINR: number, currencyMode: CurrencyMode = 'INR'): number {
  if (typeof amountInINR !== 'number' || isNaN(amountInINR)) return 0;
  return currencyMode === 'INR' ? amountInINR : amountInINR / USD_TO_INR_RATE;
}

/**
 * Formats monetary amounts for General Ledger transactions and tables (Debit, Credit, Balance, Totals).
 *
 * IMPORTANT: All raw monetary values uploaded from the General Ledger Excel are treated as INR by default.
 * - In INR view (default): displays original uploaded values directly:
 *     10000 → ₹10,000
 *     56000 → ₹56,000
 *     15000 → ₹15,000
 * - In USD view: converts the INR value for display purposes using the existing exchange rate (1 USD ≈ 83 INR):
 *     ₹10,000 → $120.48
 *
 * Switching between INR and USD never modifies, overwrites, multiplies, or permanently converts stored database values.
 */
export function formatFinancialAmount(
  amountInINR: number | string | null | undefined,
  currencyMode: CurrencyMode = 'INR',
  options?: {
    showZeroAsDash?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amountInINR === null || amountInINR === undefined || amountInINR === '') {
    return '—';
  }
  let numericVal: number;
  if (typeof amountInINR === 'number') {
    numericVal = amountInINR;
  } else if (typeof amountInINR === 'string') {
    const cleaned = amountInINR.replace(/[^0-9.-]/g, '');
    numericVal = parseFloat(cleaned);
  } else {
    return '—';
  }

  if (isNaN(numericVal)) {
    return '—';
  }

  if (numericVal === 0 && options?.showZeroAsDash) {
    return '—';
  }

  const maxDecimals = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;

  if (currencyMode === 'USD') {
    // Convert INR to USD for display only using exchange rate
    const usdAmount = numericVal / USD_TO_INR_RATE;
    const minDecimals = options?.minimumFractionDigits !== undefined
      ? options.minimumFractionDigits
      : (Number.isInteger(usdAmount) ? 0 : 2);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals
    }).format(usdAmount);
  }

  // INR mode (Default): directly display the original uploaded values
  const minDecimals = options?.minimumFractionDigits !== undefined
    ? options.minimumFractionDigits
    : (Number.isInteger(numericVal) ? 0 : 2);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(numericVal);
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
