import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default"
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600";
    if (trend.value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "danger":
        return "border-red-200 bg-red-50";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          <div className="flex items-center justify-between">
            {description && (
              <p className="text-xs text-gray-600">
                {description}
              </p>
            )}
            
            {trend && (
              <div className={cn("flex items-center space-x-1 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span className="font-medium">
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-gray-500">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized stats cards for common use cases
export function PaymentStatsCard({
  totalPayments,
  totalVolume,
  successRate,
  className
}: {
  totalPayments: number;
  totalVolume: string;
  successRate: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      <StatsCard
        title="Total Payments"
        value={totalPayments}
        description="All time"
        variant={totalPayments > 0 ? "success" : "default"}
      />
      <StatsCard
        title="Total Volume"
        value={totalVolume}
        description="USDC processed"
        variant="default"
      />
      <StatsCard
        title="Success Rate"
        value={`${successRate}%`}
        description="Last 30 days"
        variant={successRate >= 95 ? "success" : successRate >= 90 ? "warning" : "danger"}
      />
    </div>
  );
}

export function MerchantStatsCard({
  activePayments,
  pendingPayments,
  failedPayments,
  className
}: {
  activePayments: number;
  pendingPayments: number;
  failedPayments: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      <StatsCard
        title="Active Payments"
        value={activePayments}
        description="Currently processing"
        variant="success"
      />
      <StatsCard
        title="Pending Payments"
        value={pendingPayments}
        description="Awaiting confirmation"
        variant={pendingPayments > 0 ? "warning" : "default"}
      />
      <StatsCard
        title="Failed Payments"
        value={failedPayments}
        description="Requires attention"
        variant={failedPayments > 0 ? "danger" : "default"}
      />
    </div>
  );
}