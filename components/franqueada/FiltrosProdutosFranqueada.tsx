"use client";
import React from 'react';
import { Search, X, Filter, Loader2 } from 'lucide-react';

type StatusAtivacao = 'todos' | 'ativo' | 'inativo';
type StatusEstoque = 'todos' | 'disponivel' | 'esgotado';
type StatusMargem = 'todos' | 'configurada' | 'nao_configurada';

export type FiltrosProdutos = {
  busca: string;
  statusAtivacao: StatusAtivacao;
  statusEstoque: StatusEstoque;
  statusMargem: StatusMargem;
  produtosNovos: boolean;
  precoMin: string;
  precoMax: string;
};

type FiltrosProdutosFranqueadaProps = {
  filtros: FiltrosProdutos;
  onFiltrosChange: (filtros: Partial<FiltrosProdutos>) => void;
  onLimparFiltros: () => void;
  totalProdutos: number;
  produtosFiltrados: number;
  buscando?: boolean;
};

export default function FiltrosProdutosFranqueada({
  filtros,
  onFiltrosChange,
  onLimparFiltros,
  totalProdutos,
  produtosFiltrados,
  buscando = false
}: FiltrosProdutosFranqueadaProps) {
  
  // Verificar se há filtros ativos
  const temFiltrosAtivos = 
    filtros.busca !== '' ||
    filtros.statusAtivacao !== 'todos' ||
    filtros.statusEstoque !== 'todos' ||
    filtros.statusMargem !== 'todos' ||
    filtros.produtosNovos ||
    filtros.precoMin !== '' ||
    filtros.precoMax !== '';

  // Contadores de filtros ativos (para badges)
  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.busca) count++;
    if (filtros.statusAtivacao !== 'todos') count++;
    if (filtros.statusEstoque !== 'todos') count++;
    if (filtros.statusMargem !== 'todos') count++;
    if (filtros.produtosNovos) count++;
    if (filtros.precoMin || filtros.precoMax) count++;
    return count;
  };

  const filtrosAtivosCount = contarFiltrosAtivos();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
          {filtrosAtivosCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
              {filtrosAtivosCount} ativo{filtrosAtivosCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {temFiltrosAtivos && (
          <button
            onClick={onLimparFiltros}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium transition"
          >
            Limpar todos
          </button>
        )}
      </div>

      {/* Grid de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Busca por Nome/ID */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar Produto
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => onFiltrosChange({ busca: e.target.value })}
              placeholder="Nome ou ID do produto..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {buscando && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-600 animate-spin" />
            )}
            {filtros.busca && !buscando && (
              <button
                onClick={() => onFiltrosChange({ busca: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Status de Ativação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status no Site
          </label>
          <select
            value={filtros.statusAtivacao}
            onChange={(e) => onFiltrosChange({ statusAtivacao: e.target.value as StatusAtivacao })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos no site</option>
            <option value="inativo">Inativos no site</option>
          </select>
        </div>

        {/* Status de Estoque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estoque
          </label>
          <select
            value={filtros.statusEstoque}
            onChange={(e) => onFiltrosChange({ statusEstoque: e.target.value as StatusEstoque })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="todos">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="esgotado">Esgotado</option>
          </select>
        </div>

        {/* Status de Margem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Margem de Lucro
          </label>
          <select
            value={filtros.statusMargem}
            onChange={(e) => onFiltrosChange({ statusMargem: e.target.value as StatusMargem })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="todos">Todos</option>
            <option value="configurada">Com margem configurada</option>
            <option value="nao_configurada">Sem margem configurada</option>
          </select>
        </div>

        {/* Faixa de Preço Final */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Faixa de Preço Final
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                value={filtros.precoMin}
                onChange={(e) => onFiltrosChange({ precoMin: e.target.value })}
                placeholder="Mínimo"
                min="0"
                step="0.01"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <span className="text-gray-500">até</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                value={filtros.precoMax}
                onChange={(e) => onFiltrosChange({ precoMax: e.target.value })}
                placeholder="Máximo"
                min="0"
                step="0.01"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checkbox de Produtos Novos */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filtros.produtosNovos}
            onChange={(e) => onFiltrosChange({ produtosNovos: e.target.checked })}
            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600 transition">
            Mostrar apenas produtos novos (últimos 30 dias)
          </span>
          {filtros.produtosNovos && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Novos
            </span>
          )}
        </label>
      </div>

      {/* Tags de Filtros Ativos */}
      {temFiltrosAtivos && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
            
            {filtros.busca && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                Busca: &ldquo;{filtros.busca}&rdquo;
                <button
                  onClick={() => onFiltrosChange({ busca: '' })}
                  className="hover:text-pink-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filtros.statusAtivacao !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                Status: {filtros.statusAtivacao === 'ativo' ? 'Ativo' : 'Inativo'}
                <button
                  onClick={() => onFiltrosChange({ statusAtivacao: 'todos' })}
                  className="hover:text-pink-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filtros.statusEstoque !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                Estoque: {filtros.statusEstoque === 'disponivel' ? 'Disponível' : 'Esgotado'}
                <button
                  onClick={() => onFiltrosChange({ statusEstoque: 'todos' })}
                  className="hover:text-pink-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filtros.statusMargem !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                Margem: {filtros.statusMargem === 'configurada' ? 'Configurada' : 'Não configurada'}
                <button
                  onClick={() => onFiltrosChange({ statusMargem: 'todos' })}
                  className="hover:text-pink-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filtros.precoMin || filtros.precoMax) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                Preço: R$ {filtros.precoMin || '0'} - R$ {filtros.precoMax || '∞'}
                <button
                  onClick={() => onFiltrosChange({ precoMin: '', precoMax: '' })}
                  className="hover:text-pink-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filtros.produtosNovos && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                Produtos novos
                <button
                  onClick={() => onFiltrosChange({ produtosNovos: false })}
                  className="hover:text-pink-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer com Resultado */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Exibindo <span className="font-semibold text-gray-900">{produtosFiltrados}</span> de{' '}
          <span className="font-semibold text-gray-900">{totalProdutos}</span> produto(s)
        </p>
      </div>
    </div>
  );
}
