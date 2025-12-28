"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Ruler } from 'lucide-react';

type Medida = {
  size: string;
  busto?: string;
  cintura?: string;
  quadril?: string;
  comprimento?: string;
  [key: string]: string | undefined;
};

type SizeGuide = {
  image_url?: string;
  measurements?: Medida[];
};

type Props = {
  sizeGuide: SizeGuide;
  primaryColor?: string;
};

export default function SizeGuideModal({ sizeGuide, primaryColor = '#DB1472' }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Se não há guia de tamanhos, não mostra nada
  if (!sizeGuide || (!sizeGuide.image_url && (!sizeGuide.measurements || sizeGuide.measurements.length === 0))) {
    return null;
  }

  // Descobrir quais colunas de medidas existem
  const colunas = sizeGuide.measurements && sizeGuide.measurements.length > 0
    ? Object.keys(sizeGuide.measurements[0]).filter(k => k !== 'size' && sizeGuide.measurements?.some(m => m[k]))
    : [];

  const traduzirColuna = (coluna: string) => {
    const traducoes: Record<string, string> = {
      busto: 'Busto',
      cintura: 'Cintura',
      quadril: 'Quadril',
      comprimento: 'Comprimento',
      largura: 'Largura',
      manga: 'Manga',
      ombro: 'Ombro',
    };
    return traducoes[coluna.toLowerCase()] || coluna.charAt(0).toUpperCase() + coluna.slice(1);
  };

  return (
    <>
      {/* Botão para abrir o modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-medium hover:underline transition-colors"
        style={{ color: primaryColor }}
      >
        <Ruler className="w-4 h-4" />
        Ver Guia de Tamanhos
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div 
              className="px-6 py-4 flex justify-between items-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <Ruler className="w-6 h-6" />
                <h2 className="text-xl font-bold">Guia de Tamanhos</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {/* Imagem do guia */}
              {sizeGuide.image_url && (
                <div className="mb-6">
                  <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden">
                    <Image
                      src={sizeGuide.image_url}
                      alt="Guia de tamanhos"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Tabela de medidas */}
              {sizeGuide.measurements && sizeGuide.measurements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tabela de Medidas (em cm)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: `${primaryColor}15` }}>
                          <th 
                            className="px-4 py-3 text-left text-sm font-semibold border border-gray-200"
                            style={{ color: primaryColor }}
                          >
                            Tamanho
                          </th>
                          {colunas.map((col) => (
                            <th 
                              key={col} 
                              className="px-4 py-3 text-center text-sm font-semibold border border-gray-200"
                              style={{ color: primaryColor }}
                            >
                              {traduzirColuna(col)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sizeGuide.measurements.map((medida, index) => (
                          <tr 
                            key={medida.size || index} 
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="px-4 py-3 text-left font-bold text-gray-900 border border-gray-200">
                              {medida.size}
                            </td>
                            {colunas.map((col) => (
                              <td 
                                key={col} 
                                className="px-4 py-3 text-center text-gray-600 border border-gray-200"
                              >
                                {medida[col] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Dica de como medir */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">📏 Como Medir</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><strong>Busto:</strong> Meça ao redor da parte mais larga do busto.</li>
                      <li><strong>Cintura:</strong> Meça ao redor da parte mais fina da cintura.</li>
                      <li><strong>Quadril:</strong> Meça ao redor da parte mais larga do quadril.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
