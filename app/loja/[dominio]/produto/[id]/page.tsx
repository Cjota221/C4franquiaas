"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLojaInfo } from '@/contexts/LojaContext';
import Image from 'next/image';
import { ArrowLeft, Share2, Heart, ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// Forçar renderização client-side
export const dynamic = 'force-dynamic';

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
    if (!produto) return;
    
    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const itemExistente = carrinho.find((item: { id: string }) => item.id === produto.id);
    
    if (itemExistente) {
      itemExistente.quantidade += 1;
    } else {
      carrinho.push({
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco_final,
        imagem: produto.imagens[0] || produto.imagem,
        quantidade: 1
      });
    }
    
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Feedback visual (pode adicionar toast aqui)
    alert('Produto adicionado ao carrinho!');
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

          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {produto.nome}
              </h1>
              
              {produto.codigo_barras && (
                <p className="text-sm text-gray-500">
                  Cód: {produto.codigo_barras}
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              {produto.preco_venda && produto.preco_venda < produto.preco_base && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 line-through">
                    R$ {produto.preco_base.toFixed(2)}
                  </span>
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    -{Math.round((1 - produto.preco_venda / produto.preco_base) * 100)}%
                  </span>
                </div>
              )}
              
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold text-gray-900">
                  R$ {produto.preco_final.toFixed(2)}
                </span>
                <span className="text-gray-500">à vista</span>
              </div>

              <div className="text-sm text-gray-600">
                ou <span className="font-semibold text-gray-900">
                  {produto.parcelamento.parcelas}x de R$ {produto.parcelamento.valor.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Descrição */}
            {produto.descricao && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Descrição
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="sticky bottom-20 lg:static space-y-3">
              <button
                onClick={adicionarCarrinho}
                className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: loja.cor_primaria }}
              >
                <ShoppingCart className="w-5 h-5" />
                Adicionar ao Carrinho
              </button>

              <a
                href={`https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(
                  `Olá! Gostaria de saber mais sobre:\n${produto.nome}\nR$ ${produto.preco_final.toFixed(2)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl font-bold bg-green-500 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:bg-green-600"
              >
                💬 Comprar via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
