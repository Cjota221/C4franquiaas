"use client";

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface FiltrosProdutosProps {
  // Busca
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;

  // Categoria
  categorias: Array<{ id: number; nome: string }>;
  categoriaId: number | null;
  onCategoriaChange: (id: number | null) => void;

  // Status
  status: 'todos' | 'ativo' | 'inativo';
  onStatusChange: (status: 'todos' | 'ativo' | 'inativo') => void;

  // Estoque
  estoque: 'todos' | 'disponivel' | 'esgotado';
  onEstoqueChange: (estoque: 'todos' | 'disponivel' | 'esgotado') => void;

  // Produtos Novos
  apenasNovos: boolean;
  onApenasNovosChange: (checked: boolean) => void;

  // Faixa de Preço
  precoMin: string;
  precoMax: string;
  onPrecoMinChange: (value: string) => void;
  onPrecoMaxChange: (value: string) => void;

  // Limpar Filtros
  onLimparFiltros: () => void;
  
  // Contador de filtros ativos
  filtrosAtivos: number;
}

export default function FiltrosProdutos({
  searchTerm,
  onSearchChange,
  isSearching,
  categorias,
  categoriaId,
  onCategoriaChange,
  status,
  onStatusChange,
  estoque,
  onEstoqueChange,
  apenasNovos,
  onApenasNovosChange,
  precoMin,
  precoMax,
  onPrecoMinChange,
  onPrecoMaxChange,
  onLimparFiltros,
  filtrosAtivos,
}: FiltrosProdutosProps) {
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Título */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#DB1472]" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          {filtrosAtivos > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[#DB1472] text-white text-xs font-medium rounded-full">
              {filtrosAtivos}
            </span>
          )}
        </div>
        
        {filtrosAtivos > 0 && (
          <button
            onClick={onLimparFiltros}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Grid de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Busca por Nome/ID */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Produto
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome ou ID..."
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-colors"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#DB1472] border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={categoriaId || ''}
            onChange={(e) => onCategoriaChange(e.target.value ? Number(e.target.value) : null)}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-colors"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>

        {/* Status de Exibição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status de Exibição
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as 'todos' | 'ativo' | 'inativo')}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-colors"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Apenas Inativos</option>
          </select>
        </div>

        {/* Status de Estoque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estoque
          </label>
          <select
            value={estoque}
            onChange={(e) => onEstoqueChange(e.target.value as 'todos' | 'disponivel' | 'esgotado')}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-colors"
          >
            <option value="todos">Todos</option>
            <option value="disponivel">Apenas Disponível</option>
            <option value="esgotado">Apenas Esgotado</option>
          </select>
        </div>

        {/* Faixa de Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preço Mínimo (R$)
          </label>
          <input
            type="number"
            value={precoMin}
            onChange={(e) => onPrecoMinChange(e.target.value)}
            placeholder="0,00"
            min="0"
            step="0.01"
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preço Máximo (R$)
          </label>
          <input
            type="number"
            value={precoMax}
            onChange={(e) => onPrecoMaxChange(e.target.value)}
            placeholder="999,99"
            min="0"
            step="0.01"
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-colors"
          />
        </div>

        {/* Produtos Novos (Últimos 7 dias) */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-[#DB1472] transition-colors cursor-pointer bg-white w-full">
            <input 
              type="checkbox" 
              checked={apenasNovos}
              onChange={(e) => onApenasNovosChange(e.target.checked)}
              className="w-4 h-4 text-[#DB1472] border-gray-300 rounded focus:ring-[#DB1472]"
            />
            <span className="text-sm font-medium text-gray-700">
              Apenas produtos novos (7 dias)
            </span>
          </label>
        </div>

      </div>

      {/* Tags de Filtros Ativos */}
      {filtrosAtivos > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Busca: &ldquo;{searchTerm}&rdquo;
                <button 
                  onClick={() => onSearchChange('')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {categoriaId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                Categoria: {categorias.find(c => c.id === categoriaId)?.nome}
                <button 
                  onClick={() => onCategoriaChange(null)}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {status !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Status: {status === 'ativo' ? 'Ativo' : 'Inativo'}
                <button 
                  onClick={() => onStatusChange('todos')}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {estoque !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Estoque: {estoque === 'disponivel' ? 'Disponível' : 'Esgotado'}
                <button 
                  onClick={() => onEstoqueChange('todos')}
                  className="hover:bg-yellow-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {apenasNovos && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                Apenas novos
                <button 
                  onClick={() => onApenasNovosChange(false)}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(precoMin || precoMax) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                Preço: R$ {precoMin || '0'} - R$ {precoMax || '∞'}
                <button 
                  onClick={() => {
                    onPrecoMinChange('');
                    onPrecoMaxChange('');
                  }}
                  className="hover:bg-pink-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
