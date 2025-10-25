"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLojaInfo } from '@/contexts/LojaContext';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import Image from 'next/image';
import { ArrowLeft, Share2, Heart, ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductErrorBoundary from '@/components/loja/ProductErrorBoundary';
import ModalProdutoAdicionado from '@/components/loja/ModalProdutoAdicionado';

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
  return (
    <ProductErrorBoundary>
      <ProdutoDetalheContent />
    </ProductErrorBoundary>
  );
}

function ProdutoDetalheContent() {
  const params = useParams();
  const router = useRouter();
  const loja = useLojaInfo();
  const addItem = useCarrinhoStore(state => state.addItem);
  
  const dominio = params.dominio as string;
  const produtoId = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [favorito, setFavorito] = useState(false);
  
  // ⭐ ESTADO CRÍTICO: SKU Selecionado
  const [skuSelecionado, setSkuSelecionado] = useState<string | null>(null);
  const [cep, setCep] = useState('');
  const [pessoasVendo, setPessoasVendo] = useState(0);
  
  // ⭐ Estados para Swipe nas imagens
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // ⭐ Estado do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoAdicionado, setProdutoAdicionado] = useState<{
    nome: string;
    preco: number;
    imagem: string;
    tamanho?: string;
    quantidade: number;
  } | null>(null);

  // Simular pessoas vendo o produto (entre 8-24 pessoas)
  useEffect(() => {
    const numeroInicial = Math.floor(Math.random() * 17) + 8; // 8-24
    setPessoasVendo(numeroInicial);

    const interval = setInterval(() => {
      setPessoasVendo(prev => {
        const variacao = Math.random() > 0.5 ? 1 : -1;
        const novo = prev + variacao;
        return Math.max(5, Math.min(30, novo)); // Entre 5 e 30
      });
    }, 8000); // Muda a cada 8 segundos

    return () => clearInterval(interval);
  }, []);

  // Buscar produto
  useEffect(() => {
    const fetchProduto = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/loja/${dominio}/produtos?id=${produtoId}`);
        
        if (!response.ok) {
          console.error('[Produto Detalhe] Erro na resposta:', response.status, response.statusText);
          throw new Error('Produto não encontrado');
        }

        const data = await response.json();
        console.log('[Produto Detalhe] Dados recebidos da API:', data);
        
        // A API retorna { produtos: [...] }
        let produtoData;
        if (data.produtos && Array.isArray(data.produtos)) {
          produtoData = data.produtos[0];
        } else if (Array.isArray(data)) {
          produtoData = data[0];
        } else {
          produtoData = data;
        }
        
        if (!produtoData) {
          console.error('[Produto Detalhe] Produto não encontrado nos dados:', data);
          throw new Error('Produto não encontrado');
        }

        console.log('[Produto Detalhe] Produto encontrado:', produtoData.nome);
        console.log('[Produto Detalhe] Imagens:', produtoData.imagens);
        console.log('[Produto Detalhe] Preço final:', produtoData.preco_final);
        console.log('[Produto Detalhe] Variações REAIS:', produtoData.variacoes);

        // ✅ Garantir que imagens seja um array válido
        if (!produtoData.imagens || !Array.isArray(produtoData.imagens)) {
          console.warn('[Produto Detalhe] Array de imagens inválido, criando fallback');
          produtoData.imagens = produtoData.imagem ? [produtoData.imagem] : [];
        }

        // ✅ Garantir que preço seja um número válido
        if (typeof produtoData.preco_final !== 'number' || isNaN(produtoData.preco_final)) {
          console.warn('[Produto Detalhe] Preço final inválido, usando preco_base');
          produtoData.preco_final = produtoData.preco_base || 0;
        }

        // ⭐⭐⭐ CORREÇÃO CRÍTICA: USAR VARIAÇÕES REAIS DA API ⭐⭐⭐
        // REMOVIDO: Mock data de variações
        // A API agora retorna variações REAIS com estoque do banco de dados
        if (!produtoData.variacoes || produtoData.variacoes.length === 0) {
          console.warn('[Produto Detalhe] ⚠️ ATENÇÃO: Produto sem variações no banco de dados!');
          console.warn('[Produto Detalhe] Isso pode indicar que o produto não foi sincronizado corretamente.');
          console.warn('[Produto Detalhe] Execute: node scripts/sync_variacoes_from_facilzap.mjs --apply');
          // Não criar mock - mostrar produto sem seletor de tamanho
          produtoData.variacoes = [];
        } else {
          console.log('[Produto Detalhe] ✅ Usando variações REAIS da API:', produtoData.variacoes.length);
          produtoData.variacoes.forEach((v: { sku: string; tamanho: string; estoque: number; disponivel: boolean }, idx: number) => {
            console.log(`[Produto Detalhe]   Variação ${idx + 1}: ${v.tamanho} - SKU: ${v.sku} - Estoque: ${v.estoque} - Disponível: ${v.disponivel}`);
          });
        }

        setProduto(produtoData);
        console.log('[Produto Detalhe] Estado do produto atualizado com sucesso');
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
    if (!produto || !skuSelecionado) {
      alert('⚠️ Por favor, selecione um tamanho antes de adicionar ao carrinho.');
      return;
    }

    try {
      const variacaoSelecionada = produto.variacoes?.find(v => v.sku === skuSelecionado);
      
      if (!variacaoSelecionada || !variacaoSelecionada.disponivel) {
        alert('❌ Este tamanho está indisponível no momento.');
        return;
      }

      // ✅ ADICIONAR AO CARRINHO USANDO ZUSTAND STORE
      const itemCarrinho = {
        id: produto.id,
        sku: skuSelecionado,  // ⭐ SKU da variação
        tamanho: variacaoSelecionada.tamanho,  // ⭐ Nome do tamanho
        nome: produto.nome,
        preco: produto.preco_final,
        imagem: (produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : produto.imagem) || '',
        quantidade: 1,
        estoque: 99  // TODO: Pegar estoque real da variação
      };

      addItem(itemCarrinho);

      // ✅ Preparar dados para o modal
      setProdutoAdicionado({
        nome: produto.nome,
        preco: produto.preco_final,
        imagem: itemCarrinho.imagem,
        tamanho: variacaoSelecionada.tamanho,
        quantidade: 1
      });

      // ✅ Abrir modal de confirmação
      setModalAberto(true);

      // Disparar evento para atualizar contador do carrinho no header
      window.dispatchEvent(new Event('carrinhoAtualizado'));

      console.log('[Carrinho] ✅ Produto adicionado via Zustand Store:', {
        nome: produto.nome,
        tamanho: variacaoSelecionada.tamanho,
        sku: skuSelecionado
      });
    } catch (error) {
      console.error('[Carrinho] ❌ Erro ao adicionar produto:', error);
      alert('❌ Erro ao adicionar produto ao carrinho. Tente novamente.');
    }
  };

  const compartilhar = async () => {
    const url = window.location.href;
    const preco = typeof produto?.preco_final === 'number' ? produto.preco_final.toFixed(2) : '0.00';
    const texto = `Confira: ${produto?.nome} - R$ ${preco}`;
    
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
    if (!produto || !produto.imagens || produto.imagens.length === 0) return;
    setImagemAtual((prev) => (prev + 1) % produto.imagens.length);
  };

  const imagemAnterior = () => {
    if (!produto || !produto.imagens || produto.imagens.length === 0) return;
    setImagemAtual((prev) => (prev - 1 + produto.imagens.length) % produto.imagens.length);
  };

  // ⭐ Handlers para Swipe na Galeria (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      proximaImagem();
    }
    
    if (isRightSwipe) {
      imagemAnterior();
    }
    
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!produto || !loja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
            <p className="text-gray-600 mb-6">
              O produto que você está procurando não existe ou foi removido.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.back();
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Voltar para a loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Garantir que loja tem as propriedades necessárias
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 backdrop-blur-xl shadow-sm"
        style={{ 
          backgroundColor: `${corPrimaria}15`,
          borderBottom: `1px solid ${corPrimaria}30`
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
          {/* Galeria de Imagens com Swipe */}
          <div className="space-y-4">
            <div 
              className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {(() => {
                const temImagens = produto.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0;
                const imagemPrincipal = produto.imagem;
                
                console.log('[Render] Verificando imagens:', {
                  temImagens,
                  qtdImagens: produto.imagens?.length,
                  imagemPrincipal,
                  imagemAtual: produto.imagens?.[imagemAtual]
                });

                // Se não tem array de imagens mas tem imagem principal
                if (!temImagens && imagemPrincipal) {
                  return (
                    <Image
                      src={imagemPrincipal}
                      alt={produto.nome}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error('[Render] Erro ao carregar imagem principal:', imagemPrincipal);
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/800x800/e5e7eb/9ca3af?text=Sem+Imagem';
                      }}
                    />
                  );
                }

                // Se tem array de imagens
                if (temImagens) {
                  const urlImagem = produto.imagens[imagemAtual];
                  console.log('[Render] Exibindo imagem do array:', urlImagem);
                  
                  return (
                    <>
                      <Image
                        src={urlImagem || 'https://placehold.co/800x800/e5e7eb/9ca3af?text=Sem+Imagem'}
                        alt={produto.nome}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          console.error('[Render] Erro ao carregar imagem do array:', urlImagem);
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
                                    ? 'bg-white w-8' 
                                    : 'bg-white/50 hover:bg-white/75'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                }

                // Fallback se não tem nenhuma imagem
                console.warn('[Render] Nenhuma imagem disponível, usando placeholder');
                return (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-500">Sem Imagem</p>
                    </div>
                  </div>
                );
              })()}

              {/* Tag de destaque */}
              {produto.destaque && produto.tag && (
                <div 
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {produto.tag}
                </div>
              )}
            </div>

            {/* Miniaturas - Scrollável horizontalmente */}
            {produto.imagens && produto.imagens.length > 1 && (
              <div className="relative">
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                  {produto.imagens.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImagemAtual(idx)}
                      className={`
                        relative flex-shrink-0 snap-center
                        w-16 h-16 sm:w-20 sm:h-20
                        rounded-lg overflow-hidden 
                        border-2 transition-all duration-200
                        ${idx === imagemAtual 
                          ? 'border-blue-500 scale-105 shadow-lg ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                        }
                      `}
                    >
                      <Image
                        src={img}
                        alt={`${produto.nome} - Foto ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/80x80/e5e7eb/9ca3af?text=Erro';
                        }}
                      />
                      
                      {/* Número da foto (quando há muitas) */}
                      {produto.imagens && produto.imagens.length > 5 && (
                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-tl">
                          {idx + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Indicador de scroll (quando há muitas imagens) */}
                {produto.imagens && produto.imagens.length > 4 && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Deslize</span>
                  </div>
                )}
              </div>
            )}

            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>

          {/* Informações do Produto - BUY BOX */}
          <div className="space-y-6">
            {/* Nome e Código */}
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {produto.nome}
              </h1>
              
              {/* Prova Social - Pessoas vendo agora */}
              <div className="flex items-center gap-2 mb-3 bg-gradient-to-r from-orange-50 to-red-50 px-3 py-2 rounded-lg border border-orange-200">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-orange-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  <svg className="w-4 h-4 text-orange-500 animate-pulse" style={{ animationDelay: '0.2s' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  <svg className="w-4 h-4 text-orange-500 animate-pulse" style={{ animationDelay: '0.4s' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-orange-700">
                  <strong>{pessoasVendo}</strong> pessoas vendo este produto agora
                </span>
              </div>
              
              {produto.codigo_barras && (
                <p className="text-xs md:text-sm text-gray-500">
                  Cód: {produto.codigo_barras}
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border-2 border-gray-100">
              {produto.preco_venda && produto.preco_venda < produto.preco_base && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm md:text-lg text-gray-500 line-through">
                    De R$ {typeof produto.preco_base === 'number' ? produto.preco_base.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-white bg-green-500 px-2 md:px-3 py-1 rounded-full">
                    -{Math.round((1 - produto.preco_venda / produto.preco_base) * 100)}% OFF
                  </span>
                </div>
              )}
              
              <div className="flex items-baseline gap-2 md:gap-3 mb-3">
                <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold" style={{ color: corPrimaria }}>
                  R$ {typeof produto.preco_final === 'number' ? produto.preco_final.toFixed(2) : '0.00'}
                </span>
                <span className="text-gray-500 text-sm md:text-lg">à vista</span>
              </div>

              <div className="text-sm md:text-base text-gray-700 bg-gray-50 px-3 md:px-4 py-2 rounded-lg">
                ou <span className="font-bold text-gray-900">
                  {produto.parcelamento?.parcelas || 0}x de R$ {typeof produto.parcelamento?.valor === 'number' ? produto.parcelamento.valor.toFixed(2) : '0.00'}
                </span> sem juros
              </div>
            </div>

            {/* ⭐⭐⭐ SELETOR DE TAMANHO/VARIAÇÃO - LÓGICA CRÍTICA ⭐⭐⭐ */}
            {produto.variacoes && produto.variacoes.length > 0 && (
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-bold text-gray-900">
                    Selecione o Tamanho
                  </h3>
                  <button 
                    className="text-xs md:text-sm font-medium flex items-center gap-1 hover:underline"
                    style={{ color: corPrimaria }}
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Guia de Tamanhos
                  </button>
                </div>

                {/* Grid de Botões de Tamanho */}
                <div className="grid grid-cols-4 gap-2 md:gap-3">
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
                          relative py-3 md:py-4 px-2 md:px-3 rounded-lg md:rounded-xl font-bold text-base md:text-lg
                          transition-all duration-200
                          ${isAvailable 
                            ? isSelected
                              ? 'ring-2 md:ring-4 scale-105 shadow-lg' 
                              : 'border-2 border-gray-300 hover:border-gray-400 hover:scale-105 bg-white'
                            : 'bg-gray-100 cursor-not-allowed opacity-60'
                          }
                        `}
                        style={
                          isAvailable && isSelected
                            ? {
                                backgroundColor: `${corPrimaria}15`,
                                borderColor: corPrimaria,
                                color: corPrimaria,
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
                            className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: corPrimaria }}
                          >
                            <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500 text-center">
                    👆 Selecione um tamanho para continuar
                  </p>
                )}
              </div>
            )}

            {/* Informações de Confiança */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-4">
              {/* Frete */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">Calcular Frete e Prazo</h4>
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
                      className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <button className="px-4 md:px-6 py-2 bg-blue-500 text-white text-sm md:text-base font-bold rounded-lg hover:bg-blue-600 transition-colors">
                      OK
                    </button>
                  </div>
                </div>
              </div>

              {/* Envio para todo Brasil */}
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-700 bg-white/60 px-3 md:px-4 py-2 md:py-3 rounded-lg">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span><strong>Envio para todo o Brasil</strong></span>
              </div>

              {/* Compre com Segurança */}
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-700 bg-white/60 px-3 md:px-4 py-2 md:py-3 rounded-lg">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span><strong>Compre com Segurança</strong> - Seus dados protegidos</span>
              </div>
            </div>

            {/* Descrição */}
            {produto.descricao && (
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border-2 border-gray-100">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 md:w-6 md:h-6" style={{ color: corPrimaria }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Detalhes do Produto
                </h2>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ⭐ STICKY FOOTER - CTA PRINCIPAL (Mobile) ⭐ */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-gray-200 p-3 shadow-2xl z-20">
          <button
            onClick={adicionarCarrinho}
            disabled={!skuSelecionado}
            className={`
              w-full py-3 rounded-lg font-bold text-white text-base
              shadow-lg transition-all 
              flex items-center justify-center gap-2
              ${!skuSelecionado 
                ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                : 'active:scale-95'
              }
            `}
            style={
              skuSelecionado 
                ? { backgroundColor: corPrimaria }
                : {}
            }
          >
            <ShoppingCart className="w-5 h-5" />
            {!skuSelecionado 
              ? 'Selecione um tamanho' 
              : 'Adicionar ao Carrinho'
            }
          </button>
        </div>

        {/* CTA para Desktop */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 pb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div></div>
            <div>
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
                    ? { backgroundColor: corPrimaria }
                    : {}
                }
              >
                <ShoppingCart className="w-6 h-6" />
                {!skuSelecionado 
                  ? 'Selecione um tamanho' 
                  : 'Adicionar ao Carrinho'
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ MODAL DE CONFIRMAÇÃO - PRODUTO ADICIONADO ⭐ */}
      {produtoAdicionado && (
        <ModalProdutoAdicionado
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          produto={produtoAdicionado}
          dominio={dominio}
          corPrimaria={corPrimaria}
        />
      )}
    </div>
  );
}
