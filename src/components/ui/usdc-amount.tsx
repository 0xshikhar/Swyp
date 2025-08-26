import { cn } from '@/lib/utils';

interface USDCAmountProps {
  amount: string | number;
  className?: string;
  showSymbol?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

const variantClasses = {
  default: 'text-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

export function USDCAmount({ 
  amount, 
  className, 
  showSymbol = true, 
  showIcon = false,
  size = 'md',
  variant = 'default'
}: USDCAmountProps) {
  const formatAmount = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) return '0.00';
    
    // Format with appropriate decimal places
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    }
  };

  return (
    <span 
      className={cn(
        'font-mono tabular-nums',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {showIcon && (
        <span className="inline-block w-4 h-4 mr-1 rounded-full bg-blue-500 text-white text-xs leading-4 text-center">
          $
        </span>
      )}
      {formatAmount(amount)}
      {showSymbol && (
        <span className="ml-1 text-muted-foreground font-sans">
          USDC
        </span>
      )}
    </span>
  );
}