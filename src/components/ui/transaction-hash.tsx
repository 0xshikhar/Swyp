import { ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { mainnet, polygon, base, sepolia, polygonMumbai, baseSepolia } from 'viem/chains';

interface TransactionHashProps {
  hash: string;
  chainId: number;
  className?: string;
  showCopy?: boolean;
  showExternalLink?: boolean;
  truncate?: boolean;
}

const explorerUrls = {
  [mainnet.id]: 'https://etherscan.io',
  [polygon.id]: 'https://polygonscan.com',
  [base.id]: 'https://basescan.org',
  [sepolia.id]: 'https://sepolia.etherscan.io',
  [polygonMumbai.id]: 'https://mumbai.polygonscan.com',
  [baseSepolia.id]: 'https://sepolia.basescan.org',
};

export function TransactionHash({
  hash,
  chainId,
  className,
  showCopy = true,
  showExternalLink = true,
  truncate = true,
}: TransactionHashProps) {
  const [copied, setCopied] = useState(false);
  
  const explorerUrl = explorerUrls[chainId as keyof typeof explorerUrls];
  const txUrl = explorerUrl ? `${explorerUrl}/tx/${hash}` : null;
  
  const displayHash = truncate 
    ? `${hash.slice(0, 6)}...${hash.slice(-4)}`
    : hash;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
        {displayHash}
      </code>
      
      <div className="flex items-center gap-1">
        {showCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {showExternalLink && txUrl && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-6 w-6 p-0"
          >
            <a 
              href={txUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              title="View on block explorer"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}