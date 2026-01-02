"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { ArrowLeft, Plus, Minus, ShoppingBag, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useCatalogo } from '../../layout';
import SizeGuideModal from '@/components/catalogo/SizeGuideModal';
import DeliveryNoticeBadge from '@/components/loja/DeliveryNoticeBadge';
// import ProdutosRelacionados from '@/components/loja/ProdutosRelacionados'; // REMOVIDO TEMPORARIAMENTE

type Variacao = {
  sku: string;
  nome?: string;
  tamanho: string;
  cor?: string;
  estoque: number;
  disponivel: boolean;
};

type SizeGuide = {
  image_url?: string;
  measurements?: { size: string; [key: string]: string | undefined }[];
};

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  description?: string; // Campo do banco
  preco_base: number;
  imagem?: string;
  imagens?: string[];
  estoque: number;
  variacoes: Variacao[];
  size_guide?: SizeGuide | null;
};

export default function ProdutoPage() {
  const params = useParams();
  const { reseller, primaryColor, addToCart, themeSettings } = useCatalogo();
  
  const [produto, setProduto] = useState<Produto | null>(null);
  const [marginPercent, setMarginPercent] = useState(0);
  const [selectedVariacao, setSelectedVariacao] = useState<Variacao | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!reseller?.id || !params.id) return;

    async function loadProduct() {
      // Buscar dados do reseller_product (margem e status)
      const { data: resellerProduct } = await supabase
        .from('reseller_products')
        .select('margin_percent, is_active')
        .eq('reseller_id', reseller.id)
        .eq('product_id', params.id)
        .single();

      // Se não está ativo para a revendedora, não mostrar
      if (!resellerProduct?.is_active) {
        setLoading(false);
        return;
      }

      setMarginPercent(resellerProduct.margin_percent || 0);

      // Buscar produto - só se estiver ativo no admin
      const { data: prod } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', params.id)
        .eq('ativo', true)  // Só mostrar se ativo no admin
        .gt('estoque', 0)   // Só mostrar se tem estoque
        .single();

      if (prod) {
        // Processar variações do variacoes_meta
        let variacoes: Variacao[] = [];
        let estoqueTotal = 0;

        if (prod.variacoes_meta && Array.isArray(prod.variacoes_meta) && prod.variacoes_meta.length > 0) {
          variacoes = prod.variacoes_meta.map((v: { sku?: string; nome?: string; estoque?: number }) => {
            const estoqueVariacao = typeof v.estoque === 'number' ? v.estoque : 0;
            estoqueTotal += estoqueVariacao;
            
            // Extrair tamanho do SKU ou nome
            const tamanho = v.nome || v.sku?.split('-').pop() || 'Único';
            
            return {
              sku: v.sku || `SKU-${prod.id}`,
              nome: v.nome,
              tamanho,
              estoque: estoqueVariacao,
              disponivel: estoqueVariacao > 0,
            };
          });
        } else {
          estoqueTotal = prod.estoque || 0;
        }

        setProduto({
          ...prod,
          descricao: prod.description || prod.descricao, // Prioriza description do banco
          estoque: estoqueTotal,
          variacoes,
          size_guide: prod.size_guide,
        });
      }

      setLoading(false);
    }

    loadProduct();
  }, [reseller?.id, params.id, supabase]);

  // Funções de swipe para galeria
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
    
    const imagens = produto?.imagens && produto.imagens.length > 0 
      ? produto.imagens 
      : produto?.imagem 
        ? [produto.imagem] 
        : [];

    if (isLeftSwipe && selectedImage < imagens.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
    
    if (isRightSwipe && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleWhatsAppDuvida = () => {
    if (!produto || !reseller?.phone) return;
    
    const phoneNumber = reseller.phone.replace(/\D/g, '');
    const phoneWithCountryCode = phoneNumber.startsWith('55') 
      ? phoneNumber 
      : `55${phoneNumber}`;
    
    // Construir URL do produto
    const productUrl = `${window.location.origin}/catalogo/${reseller.slug}/produto/${produto.id}`;
    
    // Mensagem formatada SEM EMOJIS
    let mensagem = `Olá!\n\n`;
    mensagem += `Tenho interesse neste produto:\n\n`;
    mensagem += `*${produto.nome}*\n`;
    mensagem += `*Preço:* R$ ${calcularPreco(produto.preco_base).toFixed(2).replace('.', ',')}\n\n`;
    
    if (selectedVariacao) {
      mensagem += `*Tamanho:* ${selectedVariacao.tamanho}\n`;
      if (selectedVariacao.cor) {
        mensagem += `*Cor:* ${selectedVariacao.cor}\n`;
      }
      mensagem += `\n`;
    }
    
    mensagem += `*Link do produto:*\n${productUrl}\n\n`;
    mensagem += `Gostaria de tirar uma dúvida sobre este produto.`;
    
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  const calcularPreco = (precoBase: number) => {
    return precoBase * (1 + marginPercent / 100);
  };

  const handleAddToCart = () => {
    if (!produto) return;

    // Se tem variações, precisa selecionar uma
    if (produto.variacoes && produto.variacoes.length > 0 && !selectedVariacao) {
      alert('Por favor, selecione um tamanho');
      return;
    }

    const precoFinal = calcularPreco(produto.preco_base);
    
    // Estoque da variação selecionada ou do produto
    const estoqueItem = selectedVariacao 
      ? selectedVariacao.estoque 
      : produto.estoque;

    addToCart({
      productId: produto.id,
      nome: produto.nome,
      imagem: produto.imagem,
      preco: precoFinal,
      quantidade,
      estoque: estoqueItem, // Salvar estoque para limitar no carrinho
      variacao: selectedVariacao ? {
        id: selectedVariacao.sku,
        tamanho: selectedVariacao.tamanho,
        cor: selectedVariacao.cor,
      } : undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Verificar estoque disponível
  const estoqueDisponivel = selectedVariacao 
    ? selectedVariacao.estoque 
    : produto?.estoque || 0;

  // Lista de imagens
  const imagens = produto?.imagens && produto.imagens.length > 0 
    ? produto.imagens 
    : produto?.imagem 
      ? [produto.imagem] 
      : ['/placeholder.png'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando produto...</p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Produto não encontrado</p>
        <Link 
          href={`/catalogo/${reseller?.slug}`}
          className="mt-4 inline-block text-pink-500 hover:underline"
        >
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Botão Voltar */}
      <Link 
        href={`/catalogo/${reseller?.slug}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Voltar ao catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Galeria de Imagens - Formato 3:4 (960x1280) com Swipe */}
        <div>
          <div 
            className="relative overflow-hidden bg-gray-50 mb-4 shadow-lg cursor-grab active:cursor-grabbing" 
            style={{ 
              aspectRatio: '3/4',
              borderRadius: themeSettings?.border_radius === 'none' ? '0px' 
                : themeSettings?.border_radius === 'small' ? '4px'
                : themeSettings?.border_radius === 'large' ? '24px' : '12px'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={imagens[selectedImage]}
              alt={produto.nome}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={95}
              priority
              className="object-cover"
            />
            {/* Indicador de foto atual */}
            {imagens.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {imagens.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImage === index 
                        ? 'w-8 bg-white' 
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Miniaturas - Maiores e com espaçamento */}
          {imagens.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 px-2">
              {imagens.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-24 h-24 overflow-hidden flex-shrink-0 transition-all ${
                    selectedImage === index 
                      ? 'ring-1 ring-offset-1 scale-105 shadow-lg' 
                      : 'border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
                  style={{ 
                    borderRadius: themeSettings?.border_radius === 'none' ? '0px' 
                      : themeSettings?.border_radius === 'small' ? '6px'
                      : themeSettings?.border_radius === 'large' ? '16px' : '10px',
                    '--tw-ring-color': selectedImage === index ? primaryColor : 'transparent',
                  } as React.CSSProperties}
                >
                  <Image
                    src={img}
                    alt={`${produto.nome} - ${index + 1}`}
                    fill
                    sizes="96px"
                    quality={85}
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {produto.nome}
          </h1>

          <p className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>
            R$ {calcularPreco(produto.preco_base).toFixed(2).replace('.', ',')}
          </p>

          {/* Aviso "Sob Encomenda" */}
          {themeSettings?.delivery_notice?.enabled && (
            <div className="mb-4">
              <DeliveryNoticeBadge 
                days={themeSettings.delivery_notice.days}
                message={themeSettings.delivery_notice.message}
                variant="default"
              />
            </div>
          )}

          {/* Guia de Tamanhos */}
          {produto.size_guide && (
            <div className="mb-4">
              <SizeGuideModal 
                sizeGuide={produto.size_guide} 
                primaryColor={primaryColor} 
              />
            </div>
          )}

          {/* Seletor de Variações */}
          {produto.variacoes && produto.variacoes.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho
              </label>
              <div className="flex flex-wrap gap-2">
                {produto.variacoes.map((variacao) => {
                  const semEstoque = !variacao.disponivel;
                  const selecionada = selectedVariacao?.sku === variacao.sku;
                  
                  return (
                    <button
                      key={variacao.sku}
                      onClick={() => !semEstoque && setSelectedVariacao(variacao)}
                      disabled={semEstoque}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        selecionada
                          ? 'border-pink-500 bg-pink-50 text-pink-600'
                          : semEstoque
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                            : 'border-gray-300 hover:border-pink-300'
                      }`}
                    >
                      {variacao.tamanho}
                      {variacao.cor && ` - ${variacao.cor}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="w-12 text-center font-medium text-lg">
                {quantidade}
              </span>
              <button
                onClick={() => setQuantidade(Math.min(estoqueDisponivel || 99, quantidade + 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Botão Adicionar ao Carrinho */}
          <button
            onClick={handleAddToCart}
            disabled={estoqueDisponivel <= 0 || (produto.variacoes && produto.variacoes.length > 0 && !selectedVariacao)}
            className={`w-full py-4 font-bold text-white flex items-center justify-center gap-2 transition-all ${
              addedToCart 
                ? 'bg-green-500' 
                : estoqueDisponivel <= 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'hover:opacity-90'
            }`}
            style={{ 
              backgroundColor: addedToCart ? undefined : (estoqueDisponivel > 0 ? primaryColor : undefined),
              borderRadius: themeSettings?.button_style === 'rounded' ? '9999px' 
                : themeSettings?.border_radius === 'none' ? '0px'
                : themeSettings?.border_radius === 'small' ? '4px'
                : themeSettings?.border_radius === 'large' ? '24px' : '12px'
            }}
          >
            {addedToCart ? (
              <>
                <Check size={20} />
                Adicionado!
              </>
            ) : estoqueDisponivel <= 0 ? (
              'Produto Esgotado'
            ) : (
              <>
                <ShoppingBag size={20} />
                Adicionar ao Carrinho
              </>
            )}
          </button>

          {/* Botão WhatsApp - Tirar Dúvida */}
          <button
            onClick={handleWhatsAppDuvida}
            className="w-full mt-3 py-4 font-bold text-white bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 transition-all"
            style={{ 
              borderRadius: themeSettings?.button_style === 'rounded' ? '9999px' 
                : themeSettings?.border_radius === 'none' ? '0px'
                : themeSettings?.border_radius === 'small' ? '4px'
                : themeSettings?.border_radius === 'large' ? '24px' : '12px'
            }}
          >
            <MessageCircle size={20} />
            Tirar Dúvida no WhatsApp
          </button>

          {/* Link para o Carrinho */}
          <Link
            href={`/catalogo/${reseller?.slug}/carrinho`}
            className="block mt-4 text-center text-gray-600 hover:text-gray-900"
          >
            Ver meu carrinho
          </Link>
        </div>
      </div>

      {/* Descrição do Produto - Seção separada embaixo */}
      {produto.descricao && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📝 Descrição do Produto
          </h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {produto.descricao}
            </p>
          </div>
        </div>
      )}

      {/* 🆕 Produtos Relacionados - REMOVIDO TEMPORARIAMENTE */}
      {/* {(() => {
        console.log('🔍 [Produtos Relacionados] Verificando condições:', {
          themeSettings,
          show_related_products: themeSettings?.show_related_products,
          condicao: themeSettings?.show_related_products !== false,
          produtoId: params.id,
          slug: params.slug
        });
        return themeSettings?.show_related_products !== false;
      })() && (
        <div className="mt-12 border-t pt-8">
          <ProdutosRelacionados 
            produtoId={params.id as string}
            dominio={params.slug as string}
            titulo="✨ Você também pode gostar"
            subtitulo="Produtos selecionados especialmente para você"
          />
        </div>
      )} */}
    </div>
  );
}
