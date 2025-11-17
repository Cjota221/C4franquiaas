"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Package, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2
} from 'lucide-react';

type SortField = 'nome' | 'preco_final' | 'created_at';
type SortDirection = 'asc' | 'desc';

export type ProdutoFranqueada = {
  id: string;
  produto_franqueada_id: string;
  nome: string;
  preco_base: number;
  margem_percentual: number | null;
  preco_final: number;
  ativo_no_site: boolean;
  estoque: number;
  estoque_status: 'disponivel' | 'esgotado';
  imagem: string | null;
  imagens: string[];
  created_at?: string;
  produto_ativo: boolean; // Status do produto no admin
  pode_ativar: boolean; // Se pode ser ativado (depende de admin e estoque)
};

type TabelaProdutosFranqueadaProps = {
  produtos: ProdutoFranqueada[];
  loading: boolean;
  selectedIds: Set<string>;
  sortBy: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onToggleStatus: (produto: ProdutoFranqueada) => void;
  onMargemChange: (produtoId: string, margem: number | null) => void;
  onVerDetalhes?: (produto: ProdutoFranqueada) => void;
};

export default function TabelaProdutosFranqueada({
  produtos,
  loading,
  selectedIds,
  sortBy,
  sortDirection,
  onSort,
  onSelectAll,
  onSelectOne,
  onToggleStatus,
  onMargemChange,
  onVerDetalhes
}: TabelaProdutosFranqueadaProps) {
  
  const [editandoMargem, setEditandoMargem] = useState<string | null>(null);
  const [margemTemp, setMargemTemp] = useState<string>('');

  // Renderizar ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-pink-600" />
      : <ArrowDown className="w-4 h-4 text-pink-600" />;
  };

  // Iniciar edição de margem
  const iniciarEdicaoMargem = (produto: ProdutoFranqueada) => {
    setEditandoMargem(produto.id);
    setMargemTemp(produto.margem_percentual?.toString() || '');
  };

  // Salvar margem
  const salvarMargem = (produtoId: string) => {
    const margem = margemTemp.trim() === '' ? null : parseFloat(margemTemp);
    
    if (margem !== null && (isNaN(margem) || margem < 0 || margem > 1000)) {
      alert('Margem inválida. Use um valor entre 0 e 1000%');
      return;
    }

    onMargemChange(produtoId, margem);
    setEditandoMargem(null);
    setMargemTemp('');
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setEditandoMargem(null);
    setMargemTemp('');
  };

  // Calcular preço final com base na margem
  const calcularPrecoFinal = (precoBase: number, margem: number | null): number => {
    if (margem === null || margem === 0) return precoBase;
    return precoBase * (1 + margem / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-pink-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-gray-500">
          Não há produtos vinculados ou que atendam aos filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Checkbox */}
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === produtos.length && produtos.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </th>

              {/* Imagem */}
              <th className="px-4 py-3 text-left w-20">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Imagem
                </span>
              </th>

              {/* Nome - Ordenável */}
              <th 
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition"
                onClick={() => onSort('nome')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    Nome do Produto
                  </span>
                  {renderSortIcon('nome')}
                </div>
              </th>

              {/* Preço Base C4 */}
              <th className="px-4 py-3 text-left w-32">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Preço Base C4
                </span>
              </th>

              {/* Sua Margem - Editável */}
              <th className="px-4 py-3 text-left w-32">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Sua Margem (%)
                </span>
              </th>

              {/* Preço Final - Ordenável */}
              <th 
                className="px-4 py-3 text-left w-32 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => onSort('preco_final')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    Preço Final
                  </span>
                  {renderSortIcon('preco_final')}
                </div>
              </th>

              {/* Estoque */}
              <th className="px-4 py-3 text-left w-28">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Estoque
                </span>
              </th>

              {/* Ativo no Site - Toggle */}
              <th className="px-4 py-3 text-left w-32">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Ativo no Site
                </span>
              </th>

              {/* Data de Chegada - Ordenável */}
              <th 
                className="px-4 py-3 text-left w-36 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => onSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    Data Chegada
                  </span>
                  {renderSortIcon('created_at')}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {produtos.map((produto) => {
              const isSelected = selectedIds.has(produto.id);
              const isEditandoMargem = editandoMargem === produto.id;
              const precoFinalCalculado = isEditandoMargem 
                ? calcularPrecoFinal(produto.preco_base, margemTemp ? parseFloat(margemTemp) : null)
                : produto.preco_final;

              return (
                <tr 
                  key={produto.id}
                  className={`hover:bg-gray-50 transition ${isSelected ? 'bg-pink-50' : ''}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectOne(produto.id)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                  </td>

                  {/* Imagem */}
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {produto.imagem ? (
                        <Image
                          src={produto.imagem}
                          alt={produto.nome}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                  </td>

                  {/* Nome */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-xs text-gray-500">ID: {produto.id}</p>
                      
                      {/* Badges de status */}
                      <div className="flex gap-1 mt-1">
                        {!produto.produto_ativo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Desativado pela C4
                          </span>
                        )}
                        {produto.estoque_status === 'esgotado' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Sem estoque
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Preço Base C4 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-700">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        R$ {produto.preco_base.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Margem - Input Editável */}
                  <td className="px-4 py-3">
                    {isEditandoMargem ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={margemTemp}
                          onChange={(e) => setMargemTemp(e.target.value)}
                          onBlur={() => salvarMargem(produto.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarMargem(produto.id);
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          placeholder="0"
                          min="0"
                          max="1000"
                          step="0.1"
                          autoFocus
                          className="w-20 px-2 py-1 text-sm border border-pink-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEdicaoMargem(produto)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition group"
                      >
                        {produto.margem_percentual !== null && produto.margem_percentual > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-700">
                              {produto.margem_percentual.toFixed(1)}%
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500 group-hover:text-pink-600">
                              Definir
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Preço Final */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-green-700">
                        R$ {precoFinalCalculado.toFixed(2)}
                      </span>
                    </div>
                    {produto.margem_percentual !== null && produto.margem_percentual > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        +R$ {(precoFinalCalculado - produto.preco_base).toFixed(2)} lucro
                      </p>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      produto.estoque_status === 'disponivel'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {produto.estoque_status === 'disponivel' ? 'Disponível' : 'Esgotado'}
                    </span>
                  </td>

                  {/* Toggle Ativo no Site */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleStatus(produto)}
                        disabled={!produto.pode_ativar && !produto.ativo_no_site}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                          produto.ativo_no_site
                            ? 'bg-green-600'
                            : produto.pode_ativar
                            ? 'bg-gray-300 hover:bg-gray-400'
                            : 'bg-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          !produto.pode_ativar && !produto.ativo_no_site
                            ? 'Produto indisponível (desativado ou sem estoque)'
                            : produto.ativo_no_site
                            ? 'Clique para desativar'
                            : 'Clique para ativar'
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            produto.ativo_no_site ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-medium ${
                        produto.ativo_no_site ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {produto.ativo_no_site ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>

                  {/* Data de Chegada */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {produto.created_at 
                        ? new Date(produto.created_at).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer com contador */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {selectedIds.size > 0 ? (
              <span className="font-medium text-pink-600">
                {selectedIds.size} produto(s) selecionado(s)
              </span>
            ) : (
              <span>
                Total de {produtos.length} produto(s)
              </span>
            )}
          </span>
          <span className="text-xs text-gray-500">
            Clique no nome da coluna para ordenar
          </span>
        </div>
      </div>
    </div>
  );
}
