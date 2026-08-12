export type CurrencyMode = 'USD' | 'INR';

/**
 * Formats monetary amounts seamlessly according to chosen currency mode (INR by default or USD).
 * INR: ₹3.52 Cr or ₹35.25 Lakhs (or standard Indian comma separation ₹3,52,75,000)
 * USD: $425,000
 */
export function formatCurrency(
  amountInUSD: number, 
  currencyMode: CurrencyMode = 'INR', 
  compact: boolean = false
): string {
  if (currencyMode === 'USD') {
    if (compact) {
      if (amountInUSD >= 1_000_000) {
        return `$${(amountInUSD / 1_000_000).toFixed(2)}M`;
      }
      if (amountInUSD >= 1_000) {
        return `$${(amountInUSD / 1_000).toFixed(0)}k`;
      }
      return `$${amountInUSD.toLocaleString('en-US')}`;
    }
    return `$${amountInUSD.toLocaleString('en-US')}`;
  }

  // INR Conversion (1 USD ≈ 83 INR)
  const inrAmount = amountInUSD * 83;

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
