'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, subtitle, icon: Icon, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2">
          <ol className="flex items-center text-sm text-gray-500">
            {breadcrumb.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {item.href ? (
                  <a href={item.href} className="hover:text-gray-700 transition-colors">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-gray-700">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-pink-50 text-pink-600">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
