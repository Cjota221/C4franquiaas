'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'success' | 'warning' | 'error';
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig = {
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', defaultLabel: 'Ativo' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', defaultLabel: 'Inativo' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', defaultLabel: 'Pendente' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', defaultLabel: 'Aprovado' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', defaultLabel: 'Rejeitado' },
  success: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', defaultLabel: 'Sucesso' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', defaultLabel: 'Atenção' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', defaultLabel: 'Erro' },
};

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`${dotSize} rounded-full ${config.dot}`} />
      {label || config.defaultLabel}
    </span>
  );
}

export default StatusBadge;
