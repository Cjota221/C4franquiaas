'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, icon: Icon, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="w-5 h-5 text-gray-500" />
        )}
        <div>
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
