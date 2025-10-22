import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchExchangeRates, ExchangeRates } from '@/utils/currency';

interface CurrencyContextType {
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  refreshRates: () => Promise<void>;
  convertUSDtoPKR: (usdAmount: number) => number;
  formatDualPrice: (usdAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchExchangeRates();
      setExchangeRates(data.rates);
    } catch (err) {
      setError('Failed to fetch exchange rates');
      console.error('Currency fetch error:', err);
      // Set fallback rates
      setExchangeRates({
        USD: 1,
        PKR: 280, // Your specified rate
        EUR: 0.85,
        GBP: 0.73
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertUSDtoPKR = (usdAmount: number): number => {
    if (!exchangeRates) return Math.round(usdAmount * 280); // Fallback
    return Math.round(usdAmount * exchangeRates.PKR);
  };

  const formatDualPrice = (usdAmount: number): string => {
    const pkrAmount = convertUSDtoPKR(usdAmount);
    return `$${usdAmount} | ₨${pkrAmount.toLocaleString('en-US')}`;
  };

  const refreshRates = async () => {
    await fetchRates();
  };

  const value: CurrencyContextType = {
    exchangeRates,
    isLoading,
    error,
    refreshRates,
    convertUSDtoPKR,
    formatDualPrice
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;