"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Ruler } from 'lucide-react';

// Estrutura para calçados
type MedidaCalcado = {
  tamanho: string;
  centimetros: string;
};

// Estrutura antiga (roupas) - manter compatibilidade
type MedidaRoupa = {
  size: string;
  busto?: string;
  cintura?: string;
  quadril?: string;
  comprimento?: string;
  [key: string]: string | undefined;
};

type SizeGuide = {
  image_url?: string;
  instrucoes?: string;
  measurements?: (MedidaCalcado | MedidaRoupa)[];
};

type Props = {
  sizeGuide: SizeGuide;
  primaryColor?: string;
};

export default function SizeGuideModal({ sizeGuide, primaryColor = '#DB1472' }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Medidas padrão de calçados femininos
  const medidasPadraoCalcados: MedidaCalcado[] = [
    { tamanho: '34', centimetros: '23,5' },
    { tamanho: '35', centimetros: '24,0' },
    { tamanho: '36', centimetros: '25,5' },
    { tamanho: '37', centimetros: '26,0' },
    { tamanho: '38', centimetros: '26,5' },
    { tamanho: '39', centimetros: '27,0' },
    { tamanho: '40', centimetros: '27,5' },
    { tamanho: '41', centimetros: '28,0' },
    { tamanho: '42', centimetros: '29,5' },
    { tamanho: '43', centimetros: '30,0' },
  ];

  // Se não há guia de tamanhos, usar as medidas padrão de calçados
  const medidasFinais = (sizeGuide?.measurements && sizeGuide.measurements.length > 0) 
    ? sizeGuide.measurements 
    : medidasPadraoCalcados;

  // Se não tem imagem, instruções e nem medidas customizadas, ainda assim mostramos a tabela padrão
  // então não retornar null aqui

  // Detectar se é estrutura de calçados ou roupas
  const isCalcado = medidasFinais && medidasFinais.length > 0 && 
    'tamanho' in medidasFinais[0];

  // Descobrir quais colunas de medidas existem (para roupas)
  const colunasRoupa = !isCalcado && medidasFinais && medidasFinais.length > 0
    ? Object.keys(medidasFinais[0]).filter(k => k !== 'size' && (medidasFinais as MedidaRoupa[])?.some(m => m[k]))
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
              {/* Imagem/Ilustração do guia */}
              {sizeGuide?.image_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    📐 Como Medir
                  </h3>
                  <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border">
                    <Image
                      src={sizeGuide.image_url}
                      alt="Guia de tamanhos - como medir"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Instruções de como medir */}
              {sizeGuide?.instrucoes && (
                <div className="mb-6 p-4 bg-pink-50 rounded-xl border border-pink-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    📝 Instruções
                  </h4>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {sizeGuide.instrucoes}
                  </div>
                </div>
              )}

              {/* Tabela de medidas - CALÇADOS */}
              {isCalcado && medidasFinais && medidasFinais.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    👟 Tabela de Medidas - Calçados
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: `${primaryColor}15` }}>
                          <th 
                            className="px-6 py-3 text-center text-sm font-semibold border border-gray-200"
                            style={{ color: primaryColor }}
                          >
                            Tamanho (BR)
                          </th>
                          <th 
                            className="px-6 py-3 text-center text-sm font-semibold border border-gray-200"
                            style={{ color: primaryColor }}
                          >
                            Comprimento do Solado (cm)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(medidasFinais as MedidaCalcado[]).map((medida, index) => (
                          <tr 
                            key={medida.tamanho || index} 
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="px-6 py-3 text-center font-bold text-gray-900 border border-gray-200 text-lg">
                              {medida.tamanho}
                            </td>
                            <td className="px-6 py-3 text-center text-gray-600 border border-gray-200">
                              {medida.centimetros} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabela de medidas - ROUPAS (compatibilidade com estrutura antiga) */}
              {!isCalcado && medidasFinais && medidasFinais.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    👗 Tabela de Medidas (em cm)
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
                          {colunasRoupa.map((col) => (
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
                        {(medidasFinais as MedidaRoupa[]).map((medida, index) => (
                          <tr 
                            key={medida.size || index} 
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="px-4 py-3 text-left font-bold text-gray-900 border border-gray-200">
                              {medida.size}
                            </td>
                            {colunasRoupa.map((col) => (
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
                </div>
              )}

              {/* Dica extra quando não tem instruções */}
              {!sizeGuide?.instrucoes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">� Dica</h4>
                  <p className="text-sm text-gray-600">
                    {isCalcado 
                      ? 'Meça o comprimento do seu pé (do calcanhar até o dedo mais longo) e compare com a tabela acima. Se estiver entre dois tamanhos, escolha o maior.'
                      : 'Use uma fita métrica para medir seu corpo e compare com a tabela acima. Se estiver entre dois tamanhos, recomendamos escolher o maior.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

