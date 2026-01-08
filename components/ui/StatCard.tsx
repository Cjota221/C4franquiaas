'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: 'pink' | 'green' | 'blue' | 'yellow' | 'purple' | 'gray';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
  className?: string;
}

const iconColorClasses = {
  pink: 'bg-pink-50 text-pink-600',
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  yellow: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600',
};

const variantIconClasses = {
  default: 'bg-gray-50 text-gray-600',
  primary: 'bg-pink-50 text-pink-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  variant = 'default',
  trend,
  loading = false,
  className = '',
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-emerald-600';
    if (trend.value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const TrendIcon = getTrendIcon();
  
  // Use iconColor if specified, otherwise use variant
  const iconClasses = iconColor ? iconColorClasses[iconColor] : variantIconClasses[variant];

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-100 animate-pulse rounded" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          )}

          {subtitle && !loading && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}

          {trend && !loading && TrendIcon && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${getTrendColor()}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-gray-400 ml-1">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconClasses}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
