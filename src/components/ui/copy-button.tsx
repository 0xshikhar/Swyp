import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  showToast?: boolean;
  toastMessage?: string;
}

export function CopyButton({
  value,
  className,
  size = 'icon',
  variant = 'ghost',
  showToast = true,
  toastMessage = 'Copied to clipboard',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      
      if (showToast) {
        toast.success(toastMessage);
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      if (showToast) {
        toast.error('Failed to copy');
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'transition-colors',
        size === 'icon' && 'h-6 w-6 p-0',
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className={cn(
          'text-green-600',
          size === 'icon' && 'h-3 w-3',
          size === 'sm' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5'
        )} />
      ) : (
        <Copy className={cn(
          size === 'icon' && 'h-3 w-3',
          size === 'sm' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5'
        )} />
      )}
    </Button>
  );
}