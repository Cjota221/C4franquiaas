"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLojaInfo } from '@/contexts/LojaContext';
import Image from 'next/image';
import { ArrowLeft, Share2, Heart, ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// Forçar renderização client-side
export const dynamic = 'force-dynamic';

type Variacao = {
  sku: string;
  tamanho: string;
  disponivel: boolean;
};

type Produto = {
  id: string;
  nome: string;
  descricao: string;
  imagem: string | null;
  imagens: string[];
  preco_base: number;
  preco_venda?: number;
  preco_final: number;
  codigo_barras?: string;
  categoria_id?: string;
  variacoes_meta?: Record<string, unknown>;
  variacoes?: Variacao[];
  destaque: boolean;
  tag?: string;
  parcelamento: {
    parcelas: number;
    valor: number;
    total: number;
  };
};

export default function ProdutoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const loja = useLojaInfo();
  
  const dominio = params.dominio as string;
  const produtoId = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [favorito, setFavorito] = useState(false);
  
  // ⭐ ESTADO CRÍTICO: SKU Selecionado
  const [skuSelecionado, setSkuSelecionado] = useState<string | null>(null);
  const [cep, setCep] = useState('');

  // Buscar produto
  useEffect(() => {
    const fetchProduto = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/loja/${dominio}/produtos?id=${produtoId}`);
        
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }

        const data = await response.json();
        
        // A API retorna array, pegar o primeiro (ou único) produto
        const produtoData = Array.isArray(data) ? data[0] : data;
        
        if (!produtoData) {
          throw new Error('Produto não encontrado');
        }

        // ⭐ ADICIONAR VARIAÇÕES MOCK SE NÃO EXISTIR
        if (!produtoData.variacoes || produtoData.variacoes.length === 0) {
          produtoData.variacoes = [
            { sku: `SKU-${produtoData.id}-34`, tamanho: '34', disponivel: true },
            { sku: `SKU-${produtoData.id}-35`, tamanho: '35', disponivel: true },
            { sku: `SKU-${produtoData.id}-36`, tamanho: '36', disponivel: false },
            { sku: `SKU-${produtoData.id}-37`, tamanho: '37', disponivel: true },
            { sku: `SKU-${produtoData.id}-38`, tamanho: '38', disponivel: false },
            { sku: `SKU-${produtoData.id}-39`, tamanho: '39', disponivel: true },
            { sku: `SKU-${produtoData.id}-40`, tamanho: '40', disponivel: true },
            { sku: `SKU-${produtoData.id}-41`, tamanho: '41', disponivel: true },
          ];
        }

        setProduto(produtoData);
      } catch (error) {
        console.error('[Produto Detalhe] Erro ao buscar produto:', error);
        // Redirecionar para página de produtos se não encontrar
        router.push(`/loja/${dominio}/produtos`);
      } finally {
        setLoading(false);
      }
    };

    if (dominio && produtoId) {
      fetchProduto();
    }
  }, [dominio, produtoId, router]);

  // Verificar favoritos
  useEffect(() => {
    if (produto) {
      const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
      setFavorito(favoritos.includes(produto.id));
    }
  }, [produto]);

  const toggleFavorito = () => {
    if (!produto) return;
    
    const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
    const index = favoritos.indexOf(produto.id);
    
    if (index > -1) {
      favoritos.splice(index, 1);
      setFavorito(false);
    } else {
      favoritos.push(produto.id);
      setFavorito(true);
    }
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  };

  const adicionarCarrinho = () => {
    if (!produto || !skuSelecionado) return;
    
    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const variacaoSelecionada = produto.variacoes?.find(v => v.sku === skuSelecionado);
    
    const itemExistente = carrinho.find((item: { id: string; sku?: string }) => 
      item.id === produto.id && item.sku === skuSelecionado
    );
    
    if (itemExistente) {
      itemExistente.quantidade += 1;
    } else {
      carrinho.push({
        id: produto.id,
        sku: skuSelecionado,
        tamanho: variacaoSelecionada?.tamanho,
        nome: produto.nome,
        preco: produto.preco_final,
        imagem: produto.imagens[0] || produto.imagem,
        quantidade: 1
      });
    }
    
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Feedback visual
    alert(`Produto adicionado ao carrinho!\nTamanho: ${variacaoSelecionada?.tamanho}`);
  };

  const compartilhar = async () => {
    const url = window.location.href;
    const texto = `Confira: ${produto?.nome} - R$ ${produto?.preco_final.toFixed(2)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: produto?.nome, text: texto, url });
      } catch {
        console.log('Compartilhamento cancelado');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  const proximaImagem = () => {
    if (!produto) return;
    setImagemAtual((prev) => (prev + 1) % produto.imagens.length);
  };

  const imagemAnterior = () => {
    if (!produto) return;
    setImagemAtual((prev) => (prev - 1 + produto.imagens.length) % produto.imagens.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!produto || !loja) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 backdrop-blur-xl shadow-sm"
        style={{ 
          backgroundColor: `${loja.cor_primaria}15`,
          borderBottom: `1px solid ${loja.cor_primaria}30`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={compartilhar}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={toggleFavorito}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <Heart 
                className={`w-5 h-5 transition-colors ${
                  favorito ? 'fill-red-500 text-red-500' : 'text-gray-700'
                }`} 
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl">
              {produto.imagens.length > 0 ? (
                <>
                  <Image
                    src={produto.imagens[imagemAtual]}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/800x800/e5e7eb/9ca3af?text=Sem+Imagem';
                    }}
                  />
                  
                  {/* Navegação de imagens */}
                  {produto.imagens.length > 1 && (
                    <>
                      <button
                        onClick={imagemAnterior}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                      </button>
                      
                      <button
                        onClick={proximaImagem}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                      </button>

                      {/* Indicadores */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {produto.imagens.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setImagemAtual(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === imagemAtual 
                                ? 'bg-white w-6' 
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}

              {/* Tag de destaque */}
              {produto.destaque && produto.tag && (
                <div 
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: loja.cor_primaria }}
                >
                  {produto.tag}
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {produto.imagens.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {produto.imagens.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImagemAtual(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === imagemAtual 
                        ? 'border-blue-500 scale-105 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${produto.nome} - ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto - BUY BOX */}
          <div className="space-y-6">
            {/* Nome e Código */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {produto.nome}
              </h1>
              
              {/* Prova Social - Avaliações */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600">(127 avaliações)</span>
              </div>
              
              {produto.codigo_barras && (
                <p className="text-sm text-gray-500">
                  Cód: {produto.codigo_barras}
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              {produto.preco_venda && produto.preco_venda < produto.preco_base && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg text-gray-500 line-through">
                    De R$ {produto.preco_base.toFixed(2)}
                  </span>
                  <span className="text-sm font-bold text-white bg-green-500 px-3 py-1 rounded-full">
                    -{Math.round((1 - produto.preco_venda / produto.preco_base) * 100)}% OFF
                  </span>
                </div>
              )}
              
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-5xl font-extrabold" style={{ color: loja.cor_primaria }}>
                  R$ {produto.preco_final.toFixed(2)}
                </span>
                <span className="text-gray-500 text-lg">à vista</span>
              </div>

              <div className="text-base text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                ou <span className="font-bold text-gray-900">
                  {produto.parcelamento.parcelas}x de R$ {produto.parcelamento.valor.toFixed(2)}
                </span> sem juros
              </div>
            </div>

            {/* ⭐⭐⭐ SELETOR DE TAMANHO/VARIAÇÃO - LÓGICA CRÍTICA ⭐⭐⭐ */}
            {produto.variacoes && produto.variacoes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Selecione o Tamanho
                  </h3>
                  <button 
                    className="text-sm font-medium flex items-center gap-1 hover:underline"
                    style={{ color: loja.cor_primaria }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Guia de Tamanhos
                  </button>
                </div>

                {/* Grid de Botões de Tamanho */}
                <div className="grid grid-cols-4 gap-3">
                  {produto.variacoes.map((variacao) => {
                    const isSelected = skuSelecionado === variacao.sku;
                    const isAvailable = variacao.disponivel;

                    return (
                      <button
                        key={variacao.sku}
                        onClick={() => {
                          // Só permite selecionar se estiver disponível
                          if (isAvailable) {
                            setSkuSelecionado(variacao.sku);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`
                          relative py-4 px-3 rounded-xl font-bold text-lg
                          transition-all duration-200
                          ${isAvailable 
                            ? isSelected
                              ? 'ring-4 scale-105 shadow-lg' 
                              : 'border-2 border-gray-300 hover:border-gray-400 hover:scale-105 bg-white'
                            : 'bg-gray-100 cursor-not-allowed opacity-60'
                          }
                        `}
                        style={
                          isAvailable && isSelected
                            ? {
                                backgroundColor: `${loja.cor_primaria}15`,
                                borderColor: loja.cor_primaria,
                                color: loja.cor_primaria,
                              }
                            : isAvailable
                            ? { color: '#374151' }
                            : {}
                        }
                      >
                        {/* Tamanho */}
                        <span 
                          className={`
                            ${!isAvailable ? 'line-through' : ''}
                          `}
                          style={
                            !isAvailable 
                              ? { 
                                  textDecorationColor: '#9ca3af',
                                  textDecorationThickness: '2px',
                                  color: '#9ca3af'
                                } 
                              : {}
                          }
                        >
                          {variacao.tamanho}
                        </span>

                        {/* Checkmark se selecionado */}
                        {isSelected && isAvailable && (
                          <div 
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: loja.cor_primaria }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Mensagem de ajuda */}
                {!skuSelecionado && (
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    👆 Selecione um tamanho para continuar
                  </p>
                )}
              </div>
            )}

            {/* Informações de Confiança */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 space-y-4">
              {/* Frete */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">Calcular Frete</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 8) {
                          setCep(value.replace(/(\d{5})(\d)/, '$1-$2'));
                        }
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <button className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
                      OK
                    </button>
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 px-4 py-3 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Frete <strong>GRÁTIS</strong> para todo o Brasil</span>
              </div>

              {/* Devolução */}
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 px-4 py-3 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Troca grátis</strong> em até 30 dias</span>
              </div>
            </div>

            {/* Descrição */}
            {produto.descricao && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" style={{ color: loja.cor_primaria }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Detalhes do Produto
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </p>
              </div>
            )}

            {/* ⭐ BOTÕES DE AÇÃO - CTA PRINCIPAL ⭐ */}
            <div className="sticky bottom-20 lg:static space-y-3">
              <button
                onClick={adicionarCarrinho}
                disabled={!skuSelecionado}
                className={`
                  w-full py-5 rounded-xl font-bold text-white text-lg
                  shadow-lg hover:shadow-xl transition-all 
                  flex items-center justify-center gap-3
                  ${!skuSelecionado 
                    ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                    : 'hover:scale-105'
                  }
                `}
                style={
                  skuSelecionado 
                    ? { backgroundColor: loja.cor_primaria }
                    : {}
                }
              >
                <ShoppingCart className="w-6 h-6" />
                {!skuSelecionado 
                  ? 'Selecione um tamanho' 
                  : 'Adicionar ao Carrinho'
                }
              </button>

              <a
                href={`https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(
                  `Olá! Gostaria de saber mais sobre:\n${produto.nome}${
                    skuSelecionado 
                      ? `\nTamanho: ${produto.variacoes?.find(v => v.sku === skuSelecionado)?.tamanho}`
                      : ''
                  }\nR$ ${produto.preco_final.toFixed(2)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-5 rounded-xl font-bold bg-green-500 text-white text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 hover:bg-green-600 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Comprar via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
