/**
 * Componente Cliente: Grid de produtos com busca interativa
 * 
 * Recebe produtos do servidor (já carregados) e adiciona
 * apenas a interatividade de busca/filtro no cliente.
 */
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Package, Search } from 'lucide-react';
import type { GradeFechadaProduto } from '@/types/grade-fechada';

interface ProdutosGridProps {
  produtos: GradeFechadaProduto[];
}

export default function ProdutosGrid({ produtos }: ProdutosGridProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const produtosFiltrados = useMemo(() => produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [produtos, searchTerm]);

  return (
    <>
      {/* Barra de busca */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid de produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500">
            Tente buscar por outro termo ou aguarde novos produtos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              onClick={() => router.push(`/encomendas/produto/${produto.id}`)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Imagem */}
              <div className="relative w-full h-64 bg-gray-100">
                {produto.imagens && produto.imagens.length > 0 ? (
                  <Image
                    src={produto.imagens[0]}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Badge de personalização */}
                {produto.aceita_personalizacao && (
                  <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Aceita Logomarca
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {produto.nome}
                </h3>

                {produto.codigo_interno && (
                  <p className="text-sm text-gray-500 mb-3">
                    Cód: {produto.codigo_interno}
                  </p>
                )}

                {/* Preços */}
                <div className="space-y-1 mb-3">
                  {produto.permite_meia_grade && produto.preco_meia_grade && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Meia Grade:</span> R${' '}
                      {produto.preco_meia_grade.toFixed(2)}
                    </p>
                  )}
                  {produto.permite_grade_completa &&
                    produto.preco_grade_completa && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Grade Completa:</span> R${' '}
                        {produto.preco_grade_completa.toFixed(2)}
                      </p>
                    )}
                </div>

                {/* Cores */}
                {produto.cores_disponiveis &&
                  produto.cores_disponiveis.length > 0 && (
                    <p className="text-sm text-gray-600 mb-3">
                      {produto.cores_disponiveis.length} cores disponíveis
                    </p>
                  )}

                {/* Botão */}
                <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:opacity-90 transition">
                  Ver Detalhes e Montar Grade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
