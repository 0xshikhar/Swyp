import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mainnet, polygon, base, sepolia, polygonMumbai, baseSepolia } from 'viem/chains';

interface ChainBadgeProps {
  chainId: number;
  className?: string;
  showIcon?: boolean;
}

const chainConfig = {
  [mainnet.id]: {
    name: 'Ethereum',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '⟠',
  },
  [polygon.id]: {
    name: 'Polygon',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '⬟',
  },
  [base.id]: {
    name: 'Base',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🔵',
  },
  [sepolia.id]: {
    name: 'Sepolia',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '⟠',
  },
  [polygonMumbai.id]: {
    name: 'Mumbai',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '⬟',
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: '🔵',
  },
};

export function ChainBadge({ chainId, className, showIcon = true }: ChainBadgeProps) {
  const config = chainConfig[chainId as keyof typeof chainConfig];
  
  if (!config) {
    return (
      <Badge variant="outline" className={cn('text-xs', className)}>
        Chain {chainId}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs font-medium',
        config.color,
        className
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.name}
    </Badge>
  );
}