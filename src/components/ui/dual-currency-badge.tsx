import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Input } from '@/components/ui/input';

interface DualCurrencyBadgeProps {
  usdPrice: number;
  pkrPrice?: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showIcons?: boolean;
  interactive?: boolean;
  editable?: boolean;
  onPriceChange?: (usd: number, pkr: number) => void;
}

const DualCurrencyBadge: React.FC<DualCurrencyBadgeProps> = ({ 
  usdPrice, 
  pkrPrice,
  className = '', 
  size = 'medium',
  showIcons = false,
  interactive = true,
  editable = false,
  onPriceChange
}) => {
  const { convertUSDtoPKR, exchangeRates } = useCurrency();
  const [localUsdPrice, setLocalUsdPrice] = useState(usdPrice);
  const [localPkrPrice, setLocalPkrPrice] = useState(pkrPrice || convertUSDtoPKR(usdPrice));
  const [isEditingUsd, setIsEditingUsd] = useState(false);
  const [isEditingPkr, setIsEditingPkr] = useState(false);

  useEffect(() => {
    setLocalUsdPrice(usdPrice);
    setLocalPkrPrice(pkrPrice || convertUSDtoPKR(usdPrice));
  }, [usdPrice, pkrPrice, convertUSDtoPKR]);

  const handleUsdChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalUsdPrice(numValue);
    const calculatedPkr = convertUSDtoPKR(numValue);
    setLocalPkrPrice(calculatedPkr);
    if (onPriceChange) {
      onPriceChange(numValue, calculatedPkr);
    }
  };

  const handlePkrChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalPkrPrice(numValue);
    const calculatedUsd = exchangeRates ? Math.round((numValue / exchangeRates.PKR) * 100) / 100 : numValue / 280;
    setLocalUsdPrice(calculatedUsd);
    if (onPriceChange) {
      onPriceChange(calculatedUsd, numValue);
    }
  };

  // Format large numbers with K, M suffixes
  const formatCompactNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 10000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString('en-US');
  };

  // Format USD with proper decimals
  const formatUSD = (num: number): string => {
    if (num >= 1000) {
      return formatCompactNumber(num);
    }
    return num.toFixed(2);
  };

  if (usdPrice === 0 && !editable) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400 rounded-lg font-bold text-sm shadow-md">
          FREE
        </span>
      </div>
    );
  }

  const sizeClasses = {
    small: { text: 'text-xs', padding: 'px-2 py-0.5', gap: 'gap-1.5' },
    medium: { text: 'text-sm', padding: 'px-3 py-1', gap: 'gap-2' },
    large: { text: 'text-base', padding: 'px-4 py-1.5', gap: 'gap-2.5' }
  };

  const styles = sizeClasses[size];

  if (editable) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {/* Editable USD */}
        <div className="inline-flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            value={localUsdPrice}
            onChange={(e) => handleUsdChange(e.target.value)}
            onFocus={() => setIsEditingUsd(true)}
            onBlur={() => setIsEditingUsd(false)}
            className={`w-20 h-8 px-2 ${styles.text} border-blue-500/30 focus:border-blue-500`}
          />
          <span className={`${styles.text} text-blue-600 font-semibold`}>$</span>
        </div>

        <span className={`${styles.text} text-gray-400`}>/</span>

        {/* Editable PKR */}
        <div className="inline-flex items-center gap-1">
          <Input
            type="number"
            step="1"
            value={Math.round(localPkrPrice)}
            onChange={(e) => handlePkrChange(e.target.value)}
            onFocus={() => setIsEditingPkr(true)}
            onBlur={() => setIsEditingPkr(false)}
            className={`w-24 h-8 px-2 ${styles.text} border-green-500/30 focus:border-green-500`}
          />
          <span className={`${styles.text} text-green-600 font-semibold`}>Rs</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center flex-wrap ${styles.gap} ${className}`}>
      {/* USD Price - Gradient Blue Badge */}
      <span className={`${styles.padding} bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold ${styles.text} shadow-md border border-blue-400/30 whitespace-nowrap`}>
        ${formatUSD(localUsdPrice)}
      </span>

      <span className={`${styles.text} text-gray-400 font-bold`}>/</span>

      {/* PKR Price - Gradient Green Badge with Rs symbol */}
      <span className={`${styles.padding} bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold ${styles.text} shadow-md border border-green-400/30 whitespace-nowrap`}>
        {formatCompactNumber(Math.round(localPkrPrice))} Rs
      </span>
    </div>
  );
};

export default DualCurrencyBadge;