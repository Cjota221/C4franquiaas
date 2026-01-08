'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Copy, 
  Package, 
  Tag, 
  DollarSign,
  Box,
  Calendar,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  Ruler,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ProdutoCompleto {
  id: number | string;
  id_externo?: string;
  nome: string;
  estoque: number | { estoque?: number; estoque_minimo?: number; localizacao?: string } | null;
  preco_base: number | null;
  ativo: boolean;
  imagem?: string | null;
  imagens?: string[] | null;
  created_at?: string;
  description?: string | null;
  size_guide?: { 
    image_url?: string; 
    measurements?: { size: string; [key: string]: string }[] 
  } | null;
  categorias?: { id?: number; nome: string }[] | null;
  temMargem?: boolean;
  naoVinculado?: boolean;
  variacoes?: {
    cor?: string;
    tamanho?: string;
    estoque?: number;
    preco?: number;
  }[] | null;
}

// Função para extrair o valor numérico do estoque
function getEstoqueNumero(estoque: unknown): number {
  if (estoque === null || estoque === undefined) return 0;
  if (typeof estoque === 'number') return estoque;
  if (typeof estoque === 'string') return parseInt(estoque, 10) || 0;
  if (typeof estoque === 'object') {
    const obj = estoque as Record<string, unknown>;
    if ('estoque' in obj) return getEstoqueNumero(obj.estoque);
    if ('quantidade' in obj) return getEstoqueNumero(obj.quantidade);
    if ('qty' in obj) return getEstoqueNumero(obj.qty);
  }
  return 0;
}

interface ProdutoDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ProdutoCompleto | null;
  onToggleStatus: (id: number | string, novoStatus: boolean) => Promise<void>;
  onEditDescricaoGuia?: (produto: ProdutoCompleto) => void;
  loadingToggle?: boolean;
}

export default function ProdutoDetailsPanel({
  isOpen,
  onClose,
  produto,
  onToggleStatus,
  onEditDescricaoGuia,
  loadingToggle = false,
}: ProdutoDetailsPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detalhesExtras, setDetalhesExtras] = useState<{
    variacoes?: unknown[];
    categorias?: { id: number; nome: string }[];
  } | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  // Buscar detalhes extras do produto
  useEffect(() => {
    if (isOpen && produto) {
      setCurrentImageIndex(0);
      carregarDetalhesExtras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, produto?.id]);

  const carregarDetalhesExtras = async () => {
    if (!produto) return;
    
    setLoadingDetalhes(true);
    try {
      const id = produto.id_externo ?? produto.id;
      const res = await fetch(`/api/produtos/${encodeURIComponent(String(id))}`);
      const json = await res.json();
      
      if (json && json.produto) {
        setDetalhesExtras({
          variacoes: json.facilzap?.variacoes || json.produto?.variacoes_meta || null,
          categorias: json.produto?.categorias || null,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  if (!isOpen || !produto) return null;

  // Preparar lista de imagens
  const todasImagens: string[] = [];
  if (produto.imagem) todasImagens.push(produto.imagem);
  if (produto.imagens && Array.isArray(produto.imagens)) {
    produto.imagens.forEach(img => {
      if (img && !todasImagens.includes(img)) {
        todasImagens.push(img);
      }
    });
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copiado!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const formatarPreco = (preco: number | null) => {
    if (!preco) return 'Não definido';
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarData = (dataISO?: string) => {
    if (!dataISO) return '-';
    try {
      const data = new Date(dataISO);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < todasImagens.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : todasImagens.length - 1
    );
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-[#DB1472] to-[#a30f56] p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5" />
                <span className="text-sm opacity-90">Detalhes do Produto</span>
              </div>
              <h2 className="text-xl font-bold line-clamp-2">{produto.nome}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm opacity-80">
                  ID: {produto.id_externo || produto.id}
                </span>
                <button 
                  onClick={() => copyToClipboard(String(produto.id_externo || produto.id), 'id')}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Copy className={`w-3.5 h-3.5 ${copiedField === 'id' ? 'text-green-300' : ''}`} />
                </button>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status e Ações Rápidas */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  produto.ativo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {produto.ativo ? (
                    <><CheckCircle className="w-4 h-4" /> Ativo</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Inativo</>
                  )}
                </span>
                
                {produto.naoVinculado && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <AlertCircle className="w-4 h-4" />
                    Não Vinculado
                  </span>
                )}

                {produto.temMargem && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <DollarSign className="w-3 h-3" />
                    Com Margem
                  </span>
                )}
              </div>
              
              {/* Toggle Status */}
              <button
                onClick={() => onToggleStatus(produto.id, !produto.ativo)}
                disabled={loadingToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  produto.ativo
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {loadingToggle ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                ) : produto.ativo ? (
                  <><ToggleRight className="w-5 h-5" /> Desativar</>
                ) : (
                  <><ToggleLeft className="w-5 h-5" /> Ativar</>
                )}
              </button>
            </div>
          </div>

          {/* Galeria de Imagens */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Imagens do Produto</h3>
              {todasImagens.length > 1 && (
                <span className="text-sm text-gray-500 ml-auto">
                  {currentImageIndex + 1} de {todasImagens.length}
                </span>
              )}
            </div>
            
            <div className="relative aspect-square bg-gray-100">
              {todasImagens.length > 0 ? (
                <>
                  <Image
                    src={todasImagens[currentImageIndex]}
                    alt={produto.nome}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  
                  {todasImagens.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Sem imagem</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {todasImagens.length > 1 && (
              <div className="p-3 flex gap-2 overflow-x-auto border-t border-gray-100">
                {todasImagens.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex 
                        ? 'border-[#DB1472] ring-2 ring-[#DB1472]/30' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${produto.nome} ${idx + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-2 gap-4">
            {/* Preço */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Preço Base</span>
              </div>
              <p className="text-2xl font-bold text-[#DB1472]">
                {formatarPreco(produto.preco_base)}
              </p>
            </div>

            {/* Estoque */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Box className="w-4 h-4" />
                <span className="text-sm font-medium">Estoque</span>
              </div>
              <p className={`text-2xl font-bold ${
                getEstoqueNumero(produto.estoque) > 10 ? 'text-green-600' : 
                getEstoqueNumero(produto.estoque) > 0 ? 'text-orange-600' : 
                'text-red-600'
              }`}>
                {getEstoqueNumero(produto.estoque)} un.
              </p>
              {getEstoqueNumero(produto.estoque) === 0 && (
                <p className="text-xs text-red-500 mt-1">Produto esgotado</p>
              )}
            </div>

            {/* Data de Criação */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Criado em</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {formatarData(produto.created_at)}
              </p>
            </div>

            {/* ID Externo */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">ID Externo</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-800 font-mono">
                  {produto.id_externo || '-'}
                </p>
                {produto.id_externo && (
                  <button 
                    onClick={() => copyToClipboard(produto.id_externo!, 'id_externo')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className={`w-4 h-4 ${copiedField === 'id_externo' ? 'text-green-500' : 'text-gray-400'}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Descrição</h3>
              </div>
              {onEditDescricaoGuia && (
                <button
                  onClick={() => onEditDescricaoGuia(produto)}
                  className="text-sm text-[#DB1472] hover:underline font-medium"
                >
                  Editar
                </button>
              )}
            </div>
            <div className="p-4">
              {produto.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{produto.description}</p>
              ) : (
                <p className="text-gray-400 italic">Sem descrição cadastrada</p>
              )}
            </div>
          </div>

          {/* Guia de Tamanhos */}
          {produto.size_guide && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-800">Guia de Tamanhos</h3>
                </div>
                {onEditDescricaoGuia && (
                  <button
                    onClick={() => onEditDescricaoGuia(produto)}
                    className="text-sm text-[#DB1472] hover:underline font-medium"
                  >
                    Editar
                  </button>
                )}
              </div>
              <div className="p-4">
                {produto.size_guide.image_url && (
                  <div className="mb-4">
                    <Image
                      src={produto.size_guide.image_url}
                      alt="Guia de Tamanhos"
                      width={400}
                      height={300}
                      className="rounded-lg border border-gray-200"
                      unoptimized
                    />
                  </div>
                )}
                {produto.size_guide.measurements && produto.size_guide.measurements.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(produto.size_guide.measurements[0]).map(key => (
                            <th key={key} className="px-3 py-2 text-left font-medium text-gray-600 capitalize">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {produto.size_guide.measurements.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, valIdx) => (
                              <td key={valIdx} className="px-3 py-2 text-gray-700">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variações */}
          {loadingDetalhes ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#DB1472] border-t-transparent" />
            </div>
          ) : detalhesExtras?.variacoes && Array.isArray(detalhesExtras.variacoes) && detalhesExtras.variacoes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Variações</h3>
                <span className="text-sm text-gray-500 ml-auto">
                  {detalhesExtras.variacoes.length} variação(ões)
                </span>
              </div>
              <div className="p-4 max-h-60 overflow-y-auto">
                <div className="grid gap-2">
                  {detalhesExtras.variacoes.slice(0, 20).map((variacao, idx: number) => {
                    const v = variacao as { cor?: string; tamanho?: string; estoque?: unknown; preco?: number };
                    // Extrair estoque se for objeto
                    const estoqueVal = getEstoqueNumero(v.estoque);
                    return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {v.cor && (
                          <span className="px-2 py-1 bg-white border border-gray-200 rounded text-sm">
                            Cor: {String(v.cor)}
                          </span>
                        )}
                        {v.tamanho && (
                          <span className="px-2 py-1 bg-white border border-gray-200 rounded text-sm">
                            Tam: {String(v.tamanho)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {v.estoque !== undefined && (
                          <span className={estoqueVal > 0 ? 'text-green-600' : 'text-red-600'}>
                            {estoqueVal} un.
                          </span>
                        )}
                        {v.preco && (
                          <span className="font-medium">
                            {formatarPreco(v.preco)}
                          </span>
                        )}
                      </div>
                    </div>
                  )})}
                  {detalhesExtras.variacoes.length > 20 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      ... e mais {detalhesExtras.variacoes.length - 20} variações
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Categorias */}
          {detalhesExtras?.categorias && detalhesExtras.categorias.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Categorias</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {detalhesExtras.categorias.map((cat) => (
                  <span 
                    key={cat.id}
                    className="px-3 py-1.5 bg-[#DB1472]/10 text-[#DB1472] rounded-full text-sm font-medium"
                  >
                    {cat.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer - Ações */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-3">
            {onEditDescricaoGuia && (
              <button
                onClick={() => onEditDescricaoGuia(produto)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                <FileText className="w-5 h-5" />
                Editar Descrição/Guia
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
