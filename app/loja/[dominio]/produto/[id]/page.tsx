"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLojaInfo } from '@/contexts/LojaContext';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { Loader2 } from 'lucide-react';
import ProductErrorBoundary from '@/components/loja/ProductErrorBoundary';
import ModalProdutoAdicionado from '@/components/loja/ModalProdutoAdicionado';
import ProdutosRelacionados from '@/components/loja/ProdutosRelacionados';
import CustomerCaptureModal from '@/components/loja/CustomerCaptureModal';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { trackViewContent, trackAddToCart } from '@/lib/meta-pixel';

// Novos componentes modernos
import { ModernProductPage } from '@/components/loja/ModernProductPage';
import { FloatingProductVideo } from '@/components/loja/FloatingProductVideo';

// Forçar renderização client-side
export const dynamic = 'force-dynamic';

type Variacao = {
  sku: string;
  tamanho: string;
  disponivel: boolean;
  estoque?: number;
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
  video_url?: string | null;
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

  // 🛒 Hook para carrinho abandonado
  const { 
    isModalOpen: customerModalOpen, 
    closeModal: closeCustomerModal, 
    setCustomerData, 
    trackCartItem,
    needsCustomerData
  } = useAbandonedCart(loja?.id);

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorito, setFavorito] = useState(false);
  
  // ⭐ ESTADO CRÍTICO: SKU Selecionado e Quantidade
  const [skuSelecionado, setSkuSelecionado] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // 📊 Função para trackear visualização de produto
  const trackProductView = useCallback(async (prod: Produto) => {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId || !loja?.id) return;

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'product_view',
          session_id: sessionId,
          loja_id: loja.id,
          produto_id: prod.id,
          produto_nome: prod.nome,
          produto_preco: prod.preco_final,
          produto_categoria: prod.categoria_id,
          source: 'pdp', // Product Detail Page
          device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        })
      });

      // Também envia pro GA4 se disponível
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'view_item', {
          currency: 'BRL',
          value: prod.preco_final,
          items: [{
            item_id: prod.id,
            item_name: prod.nome,
            price: prod.preco_final
          }]
        });
      }
    } catch (error) {
      console.debug('Product view tracking error:', error);
    }
  }, [loja?.id]);
  
  // ⭐ Dados para adicionar após captura do cliente
  const [pendingCartItem, setPendingCartItem] = useState<{
    itemCarrinho: Parameters<typeof addItem>[0];
    modalData: { nome: string; preco: number; imagem: string; tamanho?: string; quantidade: number };
    trackData: Parameters<typeof trackCartItem>[0];
  } | null>(null);
  
  // ⭐ Estado do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoAdicionado, setProdutoAdicionado] = useState<{
    nome: string;
    preco: number;
    imagem: string;
    tamanho?: string;
    quantidade: number;
  } | null>(null);

  // Resetar quantidade quando trocar de variação
  useEffect(() => {
    setQuantidade(1);
  }, [skuSelecionado]);

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
        
        // 📊 Trackear visualização do produto
        trackProductView(produtoData);
        
        // 🎯 Meta Pixel: ViewContent
        trackViewContent({
          content_ids: [produtoData.id],
          content_name: produtoData.nome,
          content_type: 'product',
          value: produtoData.preco_final,
          currency: 'BRL',
        });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const adicionarCarrinho = async () => {
    if (!produto || !skuSelecionado) {
      alert('⚠️ Por favor, selecione um tamanho antes de adicionar ao carrinho.');
      return;
    }

    try {
      setAddingToCart(true);
      const variacaoSelecionada = produto.variacoes?.find(v => v.sku === skuSelecionado);
      
      if (!variacaoSelecionada || !variacaoSelecionada.disponivel) {
        alert('❌ Este tamanho está indisponível no momento.');
        return;
      }

      // ✅ VALIDAÇÃO DE ESTOQUE
      const estoqueDisponivel = variacaoSelecionada.estoque || 0;
      
      if (quantidade > estoqueDisponivel) {
        const mensagemErro = estoqueDisponivel === 0 
          ? `❌ Este tamanho está sem estoque no momento.`
          : estoqueDisponivel === 1
            ? `⚠️ Temos apenas 1 unidade disponível deste tamanho.`
            : `⚠️ Temos apenas ${estoqueDisponivel} unidades disponíveis deste tamanho.`;
        
        alert(mensagemErro);
        setQuantidade(Math.max(1, estoqueDisponivel));
        return;
      }

      // ✅ ADICIONAR AO CARRINHO USANDO ZUSTAND STORE
      const itemCarrinho = {
        id: produto.id,
        sku: skuSelecionado,
        tamanho: variacaoSelecionada.tamanho,
        nome: produto.nome,
        preco: produto.preco_final,
        imagem: (produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : produto.imagem) || '',
        quantidade: quantidade,
        estoque: estoqueDisponivel
      };

      // ✅ Preparar dados do modal e rastreamento
      const modalData = {
        nome: produto.nome,
        preco: produto.preco_final,
        imagem: itemCarrinho.imagem,
        tamanho: variacaoSelecionada.tamanho,
        quantidade: quantidade
      };

      const trackData = {
        resellerId: loja?.id || '',
        productId: produto.id,
        productName: produto.nome,
        productImage: itemCarrinho.imagem,
        productPrice: produto.preco_final,
        quantity: quantidade,
        variationId: skuSelecionado,
        variationName: variacaoSelecionada.tamanho
      };

      // 🛒 Se precisa capturar dados do cliente, salvar para depois
      if (needsCustomerData) {
        setPendingCartItem({ itemCarrinho, modalData, trackData });
        // O hook vai abrir o modal automaticamente ao chamar trackCartItem
        await trackCartItem(trackData);
        return;
      }

      // ✅ Adicionar ao carrinho
      addItem(itemCarrinho);
      setProdutoAdicionado(modalData);

      // 🎯 Meta Pixel: AddToCart
      trackAddToCart({
        content_ids: [produto.id],
        content_name: produto.nome,
        content_type: 'product',
        value: produto.preco_final * quantidade,
        currency: 'BRL',
        num_items: quantidade,
      });

      // 🛒 Rastrear no carrinho abandonado
      await trackCartItem(trackData);

      // ✅ Abrir modal de confirmação
      setModalAberto(true);

      // Resetar quantidade para 1 após adicionar
      setQuantidade(1);

      // Disparar evento para atualizar contador do carrinho no header
      window.dispatchEvent(new Event('carrinhoAtualizado'));

      console.log('[Carrinho] ✅ Produto adicionado:', itemCarrinho);
    } catch (error) {
      console.error('[Carrinho] ❌ Erro ao adicionar produto:', error);
      alert('❌ Erro ao adicionar produto ao carrinho. Tente novamente.');
    } finally {
      setAddingToCart(false);
    }
  };

  // 🛒 Handler para quando cliente preencher dados
  const handleCustomerDataSubmit = async (customerData: { name: string; phone: string }) => {
    setCustomerData(customerData);
    
    if (pendingCartItem) {
      // Adicionar ao carrinho
      addItem(pendingCartItem.itemCarrinho);
      setProdutoAdicionado(pendingCartItem.modalData);
      
      // Abrir modal de confirmação
      setModalAberto(true);
      setQuantidade(1);
      window.dispatchEvent(new Event('carrinhoAtualizado'));
      
      // Limpar item pendente
      setPendingCartItem(null);
      setAddingToCart(false);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
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
              onClick={() => router.back()}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Voltar para a loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🎬 Vídeo Flutuante - Fica fixo na tela durante toda a navegação */}
      {produto.video_url && (
        <FloatingProductVideo 
          videoUrl={produto.video_url}
          productName={produto.nome}
          corPrimaria={loja?.cor_primaria}
        />
      )}

      {/* Página Moderna do Produto */}
      <ModernProductPage
        produto={produto}
        favorito={favorito}
        skuSelecionado={skuSelecionado}
        quantidade={quantidade}
        addingToCart={addingToCart}
        corPrimaria={loja.cor_primaria}
        onToggleFavorito={toggleFavorito}
        onSizeSelect={setSkuSelecionado}
        onQuantityChange={setQuantidade}
        onAddToCart={adicionarCarrinho}
      />

      {/* Produtos Relacionados */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <ProdutosRelacionados
            produtoId={produto.id}
            dominio={dominio}
            titulo="Você Também Pode Gostar"
            subtitulo="Produtos relacionados selecionados especialmente para você"
          />
        </div>
      </div>

      {/* Modal de Confirmação */}
      {produtoAdicionado && (
        <ModalProdutoAdicionado
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          produto={produtoAdicionado}
          dominio={dominio}
          corPrimaria={loja?.cor_primaria || '#000000'}
        />
      )}

      {/* Modal de Captura de Dados do Cliente */}
      <CustomerCaptureModal
        isOpen={customerModalOpen}
        onClose={() => {
          closeCustomerModal();
          setPendingCartItem(null);
          setAddingToCart(false);
        }}
        onSubmit={handleCustomerDataSubmit}
        productName={pendingCartItem?.modalData.nome}
      />
    </>
  );
}
