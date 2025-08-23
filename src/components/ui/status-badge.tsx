import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 
  | "PENDING" 
  | "PROCESSING" 
  | "COMPLETED" 
  | "FAILED" 
  | "CANCELLED"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "BANNED"
  | "VERIFIED"
  | "UNVERIFIED";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: string; className: string }> = {
  // Payment statuses
  PENDING: {
    label: "Pending",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  PROCESSING: {
    label: "Processing",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 border-blue-200"
  },
  COMPLETED: {
    label: "Completed",
    variant: "secondary",
    className: "bg-green-100 text-green-800 border-green-200"
  },
  FAILED: {
    label: "Failed",
    variant: "destructive",
    className: "bg-red-100 text-red-800 border-red-200"
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200"
  },
  
  // Merchant statuses
  ACTIVE: {
    label: "Active",
    variant: "secondary",
    className: "bg-green-100 text-green-800 border-green-200"
  },
  INACTIVE: {
    label: "Inactive",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200"
  },
  SUSPENDED: {
    label: "Suspended",
    variant: "secondary",
    className: "bg-orange-100 text-orange-800 border-orange-200"
  },
  BANNED: {
    label: "Banned",
    variant: "destructive",
    className: "bg-red-100 text-red-800 border-red-200"
  },
  VERIFIED: {
    label: "Verified",
    variant: "secondary",
    className: "bg-green-100 text-green-800 border-green-200"
  },
  UNVERIFIED: {
    label: "Unverified",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant as any}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

// Specific status badge components for better type safety
export function PaymentStatusBadge({ 
  status, 
  className 
}: { 
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  className?: string;
}) {
  return <StatusBadge status={status} className={className} />;
}

export function MerchantStatusBadge({ 
  status, 
  className 
}: { 
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "VERIFIED" | "UNVERIFIED";
  className?: string;
}) {
  return <StatusBadge status={status} className={className} />;
}