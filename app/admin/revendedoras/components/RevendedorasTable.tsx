'use client';

import React, { useState } from 'react';
import { 
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Store,
  Phone,
  User,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Download,
  CheckSquare,
  Square,
  MessageCircle
} from 'lucide-react';
import { RevendedoraCompleta } from './types';
import { exportToWhatsappCSV, formatPhoneForWhatsapp } from '@/lib/whatsapp-export';
import { toast } from 'sonner';

interface RevendedorasTableProps {
  revendedoras: RevendedoraCompleta[];
  isLoading: boolean;
  onSelectRevendedora: (revendedora: RevendedoraCompleta) => void;
  // Paginação
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  // Exportação
  enableSelection?: boolean;
  allRevendedorasForExport?: RevendedoraCompleta[];
}

export default function RevendedorasTable({
  revendedoras,
  isLoading,
  onSelectRevendedora,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  enableSelection = true,
  allRevendedorasForExport,
}: RevendedorasTableProps) {
  // Estados para seleção
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Handlers de seleção
  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setSelectAll(false);
  };

  const handleSelectAllPage = () => {
    if (selectedIds.size === revendedoras.length) {
      // Desselecionar todos da página
      setSelectedIds(new Set());
    } else {
      // Selecionar todos da página
      const newSet = new Set(revendedoras.map(r => r.id));
      setSelectedIds(newSet);
    }
  };

  const handleSelectAllFiltered = () => {
    if (allRevendedorasForExport) {
      const newSet = new Set(allRevendedorasForExport.map(r => r.id));
      setSelectedIds(newSet);
      setSelectAll(true);
      toast.success(`${allRevendedorasForExport.length} revendedoras selecionadas`);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  // Handler de exportação
  const handleExportWhatsapp = () => {
    let dataToExport: Array<{ name: string; phone: string | null }> = [];
    
    if (selectAll && allRevendedorasForExport) {
      dataToExport = allRevendedorasForExport.map(r => ({
        name: r.name,
        phone: r.phone
      }));
    } else if (selectedIds.size > 0) {
      dataToExport = revendedoras
        .filter(r => selectedIds.has(r.id))
        .map(r => ({
          name: r.name,
          phone: r.phone
        }));
    } else {
      toast.error('Selecione pelo menos uma revendedora');
      return;
    }

    const result = exportToWhatsappCSV(dataToExport, 'revendedoras_whatsapp', false);
    
    toast.success(
      `Exportado! ${result.validos} telefones válidos${result.invalidos > 0 ? `, ${result.invalidos} inválidos ignorados` : ''}`
    );
    
    // Limpar seleção após exportar
    handleClearSelection();
  };

  const isSelected = (id: string) => selectedIds.has(id);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'aprovada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Aprovada
          </span>
        );
      case 'rejeitada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejeitada
          </span>
        );
      default:
        return null;
    }
  };

  const getAtivoBadge = (is_active: boolean) => {
    return is_active ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <ToggleRight className="w-3 h-3" />
        Ativa
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <ToggleLeft className="w-3 h-3" />
        Inativa
      </span>
    );
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#DB1472]" />
        <span className="ml-3 text-gray-600">Carregando revendedoras...</span>
      </div>
    );
  }

  if (revendedoras.length === 0) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma revendedora encontrada</h3>
        <p className="text-gray-500">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div>
      {/* Barra de seleção e exportação */}
      {enableSelection && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedIds.size > 0 ? (
                <>
                  <strong>{selectAll && allRevendedorasForExport ? allRevendedorasForExport.length : selectedIds.size}</strong> selecionada(s)
                </>
              ) : (
                'Selecione para exportar'
              )}
            </span>
            
            {allRevendedorasForExport && allRevendedorasForExport.length > 0 && (
              <button
                onClick={handleSelectAllFiltered}
                className="text-sm text-[#DB1472] hover:text-[#b81160] font-medium"
              >
                Selecionar todas ({allRevendedorasForExport.length})
              </button>
            )}
            
            {selectedIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar seleção
              </button>
            )}
          </div>
          
          <button
            onClick={handleExportWhatsapp}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Exportar para WhatsApp</span>
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {enableSelection && (
                <th className="px-3 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllPage();
                    }}
                    className="text-gray-500 hover:text-[#DB1472]"
                    title={selectedIds.size === revendedoras.length ? 'Desselecionar página' : 'Selecionar página'}
                  >
                    {selectedIds.size === revendedoras.length && revendedoras.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-[#DB1472]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Loja / Revendedora
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Situação
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Produtos
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Views
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cadastro
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {revendedoras.map((revendedora) => (
              <tr
                key={revendedora.id}
                className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected(revendedora.id) ? 'bg-pink-50' : ''}`}
                onClick={() => onSelectRevendedora(revendedora)}
              >
                {enableSelection && (
                  <td className="px-3 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOne(revendedora.id);
                      }}
                      className="text-gray-500 hover:text-[#DB1472]"
                    >
                      {isSelected(revendedora.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#DB1472]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                )}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DB1472] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {revendedora.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{revendedora.store_name}</p>
                      <p className="text-sm text-gray-500">{revendedora.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">{revendedora.email}</p>
                    <p className="text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {revendedora.phone}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  {getStatusBadge(revendedora.status)}
                </td>
                <td className="px-4 py-4 text-center">
                  {revendedora.status === 'aprovada' && getAtivoBadge(revendedora.is_active)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                    <Package className="w-4 h-4 text-purple-500" />
                    {revendedora.total_products}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                    <Eye className="w-4 h-4 text-blue-500" />
                    {revendedora.catalog_views}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-500">
                  {new Date(revendedora.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRevendedora(revendedora);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#DB1472] bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3 p-4">
        {revendedoras.map((revendedora) => (
          <div
            key={revendedora.id}
            onClick={() => onSelectRevendedora(revendedora)}
            className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isSelected(revendedora.id) ? 'border-[#DB1472] bg-pink-50' : 'border-gray-200'}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {enableSelection && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOne(revendedora.id);
                    }}
                    className="text-gray-500"
                  >
                    {isSelected(revendedora.id) ? (
                      <CheckSquare className="w-6 h-6 text-[#DB1472]" />
                    ) : (
                      <Square className="w-6 h-6" />
                    )}
                  </button>
                )}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DB1472] to-purple-600 flex items-center justify-center text-white font-bold">
                  {revendedora.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{revendedora.store_name}</h3>
                  <p className="text-sm text-gray-500">{revendedora.name}</p>
                </div>
              </div>
              {getStatusBadge(revendedora.status)}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {revendedora.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Store className="w-4 h-4 text-gray-400" />
                {revendedora.slug || 'Sem slug'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4 text-purple-500" />
                {revendedora.total_products} produtos
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="w-4 h-4 text-blue-500" />
                {revendedora.catalog_views} views
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {revendedora.status === 'aprovada' && getAtivoBadge(revendedora.is_active)}
                <span className="text-xs text-gray-400">
                  {new Date(revendedora.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button className="text-sm font-medium text-[#DB1472] flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{startItem}</span> a <span className="font-semibold">{endItem}</span> de{' '}
            <span className="font-semibold">{totalItems}</span> revendedoras
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            {/* Números das páginas */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#DB1472] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Página atual - mobile */}
            <span className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
