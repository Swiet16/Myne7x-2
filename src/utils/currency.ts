// Currency conversion utility for USD to PKR and other currencies
// Using ExchangeRate-API (free, no API key required, reliable)

export interface ExchangeRates {
  USD: number;
  PKR: number;
  EUR: number;
  GBP: number;
  [key: string]: number;
}

export interface CurrencyData {
  base: string;
  date: string;
  rates: ExchangeRates;
}

// Cache for exchange rates to avoid excessive API calls
let cachedRates: CurrencyData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates from API
 */
export async function fetchExchangeRates(): Promise<CurrencyData> {
  const now = Date.now();
  
  // Return cached data if it's fresh (less than 1 hour old)
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CurrencyData = await response.json();
    
    // Cache the data
    cachedRates = data;
    lastFetchTime = now;
    
    return data;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Fallback to static rates if API fails (using your provided rate: 1 USD = 280 PKR)
    const fallbackRates: CurrencyData = {
      base: 'USD',
      date: new Date().toISOString().split('T')[0],
      rates: {
        USD: 1,
        PKR: 280, // Your specified rate
        EUR: 0.85,
        GBP: 0.73
      }
    };
    
    return fallbackRates;
  }
}

/**
 * Convert USD amount to PKR
 */
export async function convertUSDtoPKR(usdAmount: number): Promise<number> {
  try {
    const rates = await fetchExchangeRates();
    return Math.round(usdAmount * rates.rates.PKR);
  } catch (error) {
    console.error('Currency conversion failed:', error);
    // Fallback to your static rate
    return Math.round(usdAmount * 280);
  }
}

/**
 * Convert USD amount to any currency
 */
export async function convertUSDtoCurrency(usdAmount: number, targetCurrency: string): Promise<number> {
  try {
    const rates = await fetchExchangeRates();
    const rate = rates.rates[targetCurrency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`Currency ${targetCurrency} not supported`);
    }
    
    return Math.round(usdAmount * rate * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error(`Conversion to ${targetCurrency} failed:`, error);
    throw error;
  }
}

/**
 * Format currency with appropriate symbol and formatting
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    PKR: '₨',
    EUR: '€',
    GBP: '£'
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency;
  
  if (currency.toUpperCase() === 'PKR') {
    // Format PKR with commas for large numbers
    return `${symbol}${amount.toLocaleString('en-US')}`;
  }
  
  return `${symbol}${amount}`;
}

/**
 * Get current exchange rate for USD to PKR
 */
export async function getUSDtoPKRRate(): Promise<number> {
  try {
    const rates = await fetchExchangeRates();
    return rates.rates.PKR;
  } catch (error) {
    console.error('Failed to get PKR rate:', error);
    return 280; // Fallback to your specified rate
  }
}

/**
 * Format dual currency display (USD | PKR)
 */
export async function formatDualCurrency(usdAmount: number): Promise<string> {
  try {
    const pkrAmount = await convertUSDtoPKR(usdAmount);
    return `${formatCurrency(usdAmount, 'USD')} | ${formatCurrency(pkrAmount, 'PKR')}`;
  } catch (error) {
    console.error('Dual currency formatting failed:', error);
    const fallbackPkr = Math.round(usdAmount * 280);
    return `${formatCurrency(usdAmount, 'USD')} | ${formatCurrency(fallbackPkr, 'PKR')}`;
  }
}

export default {
  fetchExchangeRates,
  convertUSDtoPKR,
  convertUSDtoCurrency,
  formatCurrency,
  getUSDtoPKRRate,
  formatDualCurrency
};