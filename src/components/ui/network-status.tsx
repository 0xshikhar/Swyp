import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAccount, useBlockNumber } from 'wagmi';
import { useEffect, useState } from 'react';

interface NetworkStatusProps {
  className?: string;
  showText?: boolean;
}

export function NetworkStatus({ className, showText = true }: NetworkStatusProps) {
  const { isConnected, chainId } = useAccount();
  const { data: blockNumber, isError, isLoading } = useBlockNumber({
    watch: true,
  });
  const [lastBlockTime, setLastBlockTime] = useState<number>(Date.now());
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'slow' | 'error'>('disconnected');

  useEffect(() => {
    if (!isConnected) {
      setStatus('disconnected');
      return;
    }

    if (isError) {
      setStatus('error');
      return;
    }

    if (isLoading) {
      return;
    }

    if (blockNumber) {
      const now = Date.now();
      const timeSinceLastBlock = now - lastBlockTime;
      
      setLastBlockTime(now);
      
      // Consider connection slow if no new block in 30 seconds
      if (timeSinceLastBlock > 30000) {
        setStatus('slow');
      } else {
        setStatus('connected');
      }
    }
  }, [isConnected, blockNumber, isError, isLoading, lastBlockTime]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'slow':
        return {
          icon: AlertCircle,
          text: 'Slow Connection',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'error':
        return {
          icon: WifiOff,
          text: 'Connection Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'flex items-center gap-1 text-xs',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {showText && config.text}
      {isConnected && chainId && showText && (
        <span className="ml-1 opacity-70">
          (Chain {chainId})
        </span>
      )}
    </Badge>
  );
}