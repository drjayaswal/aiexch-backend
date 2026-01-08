/**
 * Currency conversion utilities
 * Exchange rates are approximate and should be updated regularly
 */

// Exchange rate: 1 EUR = 90 INR (approximate)
// This should ideally be fetched from an exchange rate API or stored in database
const EUR_TO_INR_RATE = 105.07;

/**
 * Convert INR to EUR
 * @param inrAmount - Amount in INR
 * @returns Amount in EUR as string with 2 decimal places
 */
export function convertINRToEUR(inrAmount: string | number): string {
  const amount =
    typeof inrAmount === "string" ? parseFloat(inrAmount) : inrAmount;
  if (isNaN(amount) || amount < 0) return "0.00";
  const eurAmount = amount / EUR_TO_INR_RATE;
  return eurAmount.toFixed(2);
}

/**
 * Convert EUR to INR
 * @param eurAmount - Amount in EUR
 * @returns Amount in INR as string with 2 decimal places
 */
export function convertEURToINR(eurAmount: string | number): string {
  const amount =
    typeof eurAmount === "string" ? parseFloat(eurAmount) : eurAmount;
  if (isNaN(amount) || amount < 0) return "0.00";
  const inrAmount = amount * EUR_TO_INR_RATE;
  return inrAmount.toFixed(2);
}

/**
 * Convert amount based on currency
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency (INR or EUR)
 * @param toCurrency - Target currency (INR or EUR)
 * @returns Converted amount as string
 */
export function convertCurrency(
  amount: string | number,
  fromCurrency: string,
  toCurrency: string
): string {
  if (fromCurrency === toCurrency) {
    const amt = typeof amount === "string" ? parseFloat(amount) : amount;
    return isNaN(amt) ? "0.00" : amt.toFixed(2);
  }

  if (fromCurrency === "INR" && toCurrency === "EUR") {
    return convertINRToEUR(amount);
  }

  if (fromCurrency === "EUR" && toCurrency === "INR") {
    return convertEURToINR(amount);
  }

  // If currencies don't match supported pairs, return original amount
  const amt = typeof amount === "string" ? parseFloat(amount) : amount;
  return isNaN(amt) ? "0.00" : amt.toFixed(2);
}
