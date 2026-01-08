'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  revendedoraNome?: string;
  isLoading?: boolean;
}

export default function RejectModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  revendedoraNome = 'esta revendedora',
  isLoading: externalLoading = false,
}: RejectModalProps) {
  const [motivo, setMotivo] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      setErro('Por favor, informe o motivo da rejeição.');
      return;
    }

    setInternalLoading(true);
    setErro(null);

    try {
      await onConfirm(motivo.trim());
      setMotivo('');
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao rejeitar');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMotivo('');
      setErro(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Rejeitar Cadastro
                </h3>
                <p className="text-sm text-gray-500">
                  {revendedoraNome}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da rejeição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErro(null);
              }}
              placeholder="Descreva o motivo pelo qual o cadastro está sendo rejeitado..."
              rows={4}
              disabled={loading}
              className={`w-full rounded-lg border px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                erro 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-red-500 focus:ring-red-200'
              } disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
            
            {erro && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {erro}
              </p>
            )}

            <p className="mt-3 text-xs text-gray-500">
              A revendedora receberá um email informando sobre a rejeição com o motivo descrito acima.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !motivo.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Rejeitando...
                </>
              ) : (
                'Confirmar Rejeição'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
