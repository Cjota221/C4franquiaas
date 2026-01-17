'use client';

/**
 * 🦶 MEDIDOR DE PÉ VIRTUAL (Versão Simplificada)
 * 
 * Permite a cliente medir o pé em casa e receber
 * recomendação de tamanho personalizada.
 * 
 * Fluxo direto:
 * 1. Instrução de como medir + inserir medida em cm
 * 2. Ver tamanho recomendado
 */

import React, { useState, useCallback } from 'react';
import { X, ChevronRight, Ruler, Check, AlertCircle } from 'lucide-react';

interface FootMeasurerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  availableSizes: string[];
  primaryColor?: string;
  productName?: string;
}

// Tabela de conversão CM -> Tamanho BR (feminino)
const SIZE_TABLE: { [key: string]: { min: number; max: number } } = {
  '33': { min: 21.0, max: 21.9 },
  '34': { min: 22.0, max: 22.4 },
  '35': { min: 22.5, max: 23.0 },
  '36': { min: 23.1, max: 23.7 },
  '37': { min: 23.8, max: 24.4 },
  '38': { min: 24.5, max: 25.1 },
  '39': { min: 25.2, max: 25.8 },
  '40': { min: 25.9, max: 26.5 },
  '41': { min: 26.6, max: 27.2 },
  '42': { min: 27.3, max: 28.0 },
};

export default function FootMeasurer({
  isOpen,
  onClose,
  onSelectSize,
  availableSizes,
  primaryColor = '#DB1472',
  productName,
}: FootMeasurerProps) {
  const [step, setStep] = useState(1);
  const [footLength, setFootLength] = useState<number | null>(null);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Resetar estado ao fechar
  const handleClose = useCallback(() => {
    setStep(1);
    setFootLength(null);
    setRecommendedSize(null);
    setInputValue('');
    onClose();
  }, [onClose]);

  // Calcular tamanho recomendado baseado no comprimento
  const calculateSize = useCallback((lengthCm: number): string | null => {
    for (const [size, range] of Object.entries(SIZE_TABLE)) {
      if (lengthCm >= range.min && lengthCm <= range.max) {
        return size;
      }
    }
    if (lengthCm < 21.0) return '33';
    if (lengthCm > 28.0) return '42';
    return null;
  }, []);

  // Processar medição
  const processMeasurement = useCallback(() => {
    const length = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(length) || length < 15 || length > 35) {
      alert('Por favor, insira um valor válido entre 15 e 35 cm');
      return;
    }
    setFootLength(length);
    const size = calculateSize(length);
    setRecommendedSize(size);
    setStep(2);
  }, [inputValue, calculateSize]);

  // Selecionar tamanho recomendado
  const handleSelectRecommended = useCallback(() => {
    if (recommendedSize && availableSizes.includes(recommendedSize)) {
      onSelectSize(recommendedSize);
      handleClose();
    }
  }, [recommendedSize, availableSizes, onSelectSize, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <Ruler className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Descubra seu Tamanho</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          
          {/* STEP 1: Como medir + Input */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <span className="text-3xl">📏</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Como medir seu pé
                </h3>
              </div>

              {/* Passos visuais */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Folha + parede:</strong> Coloque uma folha no chão encostada na parede
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Pise descalça:</strong> Calcanhar encostado na parede
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Marque + meça:</strong> Marque a ponta do dedão e meça com régua
                  </p>
                </div>
              </div>

              {/* Input da medida */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qual foi a medida?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ex: 24,5"
                    className="w-full px-4 py-4 border-2 rounded-xl text-center text-2xl font-bold focus:outline-none transition-colors"
                    style={{ borderColor: inputValue ? primaryColor : '#e5e7eb' }}
                    onKeyDown={(e) => e.key === 'Enter' && processMeasurement()}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">
                    cm
                  </span>
                </div>
              </div>

              <button
                onClick={processMeasurement}
                disabled={!inputValue}
                className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                Ver meu tamanho
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: Resultado */}
          {step === 2 && (
            <div className="text-center">
              <div className="mb-5">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Check className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Encontramos seu tamanho!
                </h3>
              </div>

              {/* Resultado */}
              <div className="bg-gray-50 rounded-xl p-5 mb-5">
                <p className="text-gray-500 text-sm mb-1">Seu pé mede:</p>
                <p className="text-2xl font-bold text-gray-900 mb-4">
                  {footLength?.toFixed(1)} cm
                </p>

                <div 
                  className="rounded-xl p-5"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <p className="text-sm mb-1" style={{ color: primaryColor }}>
                    {productName ? `Para este calçado:` : 'Tamanho recomendado:'}
                  </p>
                  <p className="text-6xl font-bold" style={{ color: primaryColor }}>
                    {recommendedSize || '—'}
                  </p>
                </div>
              </div>

              {/* Disponibilidade */}
              {recommendedSize && (
                <div className="mb-5">
                  {availableSizes.includes(recommendedSize) ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg py-3">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Tamanho disponível!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 rounded-lg py-3">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Tamanho indisponível neste produto</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tabela compacta */}
              <details className="text-left mb-5">
                <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                  Ver tabela de tamanhos
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(SIZE_TABLE).slice(1, 9).map(([size, range]) => (
                    <div 
                      key={size}
                      className={`p-2 rounded flex justify-between ${
                        size === recommendedSize ? 'font-bold' : 'bg-gray-50'
                      }`}
                      style={{ 
                        backgroundColor: size === recommendedSize ? `${primaryColor}15` : undefined,
                        color: size === recommendedSize ? primaryColor : undefined
                      }}
                    >
                      <span>Tam {size}</span>
                      <span>{range.min.toFixed(1)}-{range.max.toFixed(1)}cm</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Botões */}
              <div className="space-y-3">
                {recommendedSize && availableSizes.includes(recommendedSize) && (
                  <button
                    onClick={handleSelectRecommended}
                    className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Selecionar tamanho {recommendedSize}
                    <Check className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Escolher outro tamanho
                </button>

                <button
                  onClick={() => {
                    setStep(1);
                    setInputValue('');
                    setFootLength(null);
                    setRecommendedSize(null);
                  }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Medir novamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
