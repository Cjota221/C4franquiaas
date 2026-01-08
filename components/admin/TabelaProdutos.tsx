"use client";

import React from 'react';
import Image from 'next/image';
import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Eye } from 'lucide-react';

export type Produto = {
  id: number | string;
  id_externo?: string;
  nome: string;
  estoque: number;
  preco_base: number | null;
  ativo: boolean;
  imagem?: string | null;
  created_at?: string;
  categorias?: { id?: number; nome: string }[] | null;
  temMargem?: boolean;
  description?: string | null;
  size_guide?: Record<string, unknown> | null;
};

interface TabelaProdutosProps {
  produtos: Produto[];
  loading: boolean;
  selectedIds: Record<number | string, boolean>;
  onSelectOne: (id: number | string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (campo: string) => void;
  onVerDetalhes: (produto: Produto) => void;
  onOpenDrawer?: (produto: Produto) => void;
  onToggleStatus: (id: number | string, ativo: boolean) => void;
  toggling: Record<number | string, boolean>;
  onEditDescricaoGuia?: (produto: Produto) => void;
  produtosNaoVinculadosIds?: Set<number | string>;
}

export default function TabelaProdutos({
  produtos,
  loading,
  selectedIds,
  onSelectOne,
  onSelectAll,
  allSelected,
  sortBy,
  sortDirection,
  onSort,
  onVerDetalhes,
  onOpenDrawer,
  onToggleStatus,
  toggling,
  onEditDescricaoGuia,
  produtosNaoVinculadosIds,
}: TabelaProdutosProps) {
  
  const formatarData = (dataISO?: string) => {
    if (!dataISO) return '-';
    try {
      const data = new Date(dataISO);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatarPreco = (preco: number | null) => {
    if (!preco) return '-';
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const renderIconeOrdenacao = (campo: string) => {
    if (sortBy !== campo) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-[#DB1472]" />
      : <ArrowDown className="w-4 h-4 text-[#DB1472]" />;
  };

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DB1472] border-t-transparent"></div>
            <span className="text-sm font-medium text-gray-600">Carregando produtos...</span>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full bg-white">
          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Checkbox */}
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#DB1472] focus:ring-[#DB1472] cursor-pointer"
                />
              </th>

              {/* Imagem */}
              <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Imagem
              </th>

              {/* Nome - Ordenável */}
              <th 
                onClick={() => onSort('nome')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Nome do Produto
                  {renderIconeOrdenacao('nome')}
                </div>
              </th>

              {/* ID - Ordenável */}
              <th 
                onClick={() => onSort('id')}
                className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  ID
                  {renderIconeOrdenacao('id')}
                </div>
              </th>

              {/* Preço - Ordenável */}
              <th 
                onClick={() => onSort('preco_base')}
                className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Preço (R$)
                  {renderIconeOrdenacao('preco_base')}
                </div>
              </th>

              {/* Estoque - Ordenável */}
              <th 
                onClick={() => onSort('estoque')}
                className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Estoque
                  {renderIconeOrdenacao('estoque')}
                </div>
              </th>

              {/* Status - Ordenável */}
              <th 
                onClick={() => onSort('ativo')}
                className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Status
                  {renderIconeOrdenacao('ativo')}
                </div>
              </th>

              {/* Data de Criação - Ordenável */}
              <th 
                onClick={() => onSort('created_at')}
                className="w-36 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Data Criação
                  {renderIconeOrdenacao('created_at')}
                </div>
              </th>

              {/* Ações */}
              <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <div className="text-5xl">📭</div>
                    <p className="text-lg font-medium">Nenhum produto encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros ou fazer uma nova busca</p>
                  </div>
                </td>
              </tr>
            ) : (
              produtos.map((produto) => {
                const isSelected = selectedIds[produto.id] ?? false;
                const isToggling = toggling[produto.id] ?? false;
                const produtoAtivo = produto.ativo ?? false;
                const isNaoVinculado = produtosNaoVinculadosIds?.has(produto.id) ?? false;

                return (
                  <tr 
                    key={produto.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-[#DB1472]/5' : ''
                    } ${!produtoAtivo ? 'opacity-60' : ''} ${isNaoVinculado ? 'bg-orange-50/50' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectOne(produto.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#DB1472] focus:ring-[#DB1472] cursor-pointer"
                      />
                    </td>

                    {/* Imagem */}
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden">
                        {produto.imagem ? (
                          <Image
                            src={produto.imagem}
                            alt={produto.nome}
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onVerDetalhes(produto)}
                          className="font-medium text-gray-900 hover:text-[#DB1472] transition-colors text-left line-clamp-2"
                        >
                          {produto.nome}
                        </button>
                        {produto.temMargem === false && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded uppercase whitespace-nowrap">
                            NOVO
                          </span>
                        )}
                        {isNaoVinculado && (
                          <span 
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded border border-orange-300 whitespace-nowrap flex items-center gap-1"
                            title="Este produto não está vinculado a nenhuma revendedora"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            NÃO VINCULADO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {produto.id_externo || produto.id}
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatarPreco(produto.preco_base)}
                    </td>

                    {/* Estoque */}
                    <td className="px-4 py-3">
                      {produto.estoque === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Esgotado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Disponível
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {produtoAtivo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inativo
                        </span>
                      )}
                    </td>

                    {/* Data de Criação */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatarData(produto.created_at)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {onOpenDrawer ? (
                          <button
                            onClick={() => onOpenDrawer(produto)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#DB1472] rounded hover:bg-[#DB1472]/90 transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detalhes
                          </button>
                        ) : (
                          <button
                            onClick={() => onVerDetalhes(produto)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#DB1472] rounded hover:bg-[#DB1472]/90 transition-colors"
                          >
                            Ver Detalhes
                          </button>
                        )}
                        {onEditDescricaoGuia && (
                          <button
                            onClick={() => onEditDescricaoGuia(produto)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                            title="Editar Descrição e Guia de Tamanhos"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Descrição
                          </button>
                        )}
                        <button
                          disabled={isToggling}
                          onClick={() => onToggleStatus(produto.id, !produtoAtivo)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            produtoAtivo 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-gray-400 text-white hover:bg-gray-500'
                          } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isToggling ? '...' : produtoAtivo ? 'Ativo' : 'Inativo'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
