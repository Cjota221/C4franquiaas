"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore'; // 🔧 MUDANÇA: Usar Zustand em vez de CartContext
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import CheckoutForm from '@/components/loja/CheckoutFormTransparente'; // 🆕 CHECKOUT TRANSPARENTE ATIVADO
import OrderSummary from '@/components/loja/OrderSummary';
import CheckoutFooter from '@/components/loja/CheckoutFooter';
import CheckoutShippingSelector from '@/components/loja/CheckoutShippingSelector';

interface FreteOpcao {
  id: number;
  nome: string;
  preco: number;
  prazo: number;
  logo: string;
  servico_id: string;
}

export default function CheckoutPage() {
  const loja = useLojaInfo();
  const [mounted, setMounted] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<FreteOpcao | null>(null);
  
  // 🔧 Usar Zustand em vez de CartContext
  const items = useCarrinhoStore(state => state.items);
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  // Garantir hidratação
  useEffect(() => {
    console.log('🔄 [Checkout] useEffect montando...');
    console.log('📦 [Checkout] Items do Zustand:', items);
    console.log('💾 [Checkout] localStorage:', localStorage.getItem('c4-carrinho-storage'));
    setMounted(true);
    
    // 📊 Trackear begin_checkout
    const trackBeginCheckout = async () => {
      try {
        const sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId || !loja?.id || items.length === 0) return;

        const total = items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'begin_checkout',
            session_id: sessionId,
            loja_id: loja.id,
            cart_total: total,
            cart_items_count: items.length,
            device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
          })
        });

        // Também envia pro GA4 se disponível
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'begin_checkout', {
            currency: 'BRL',
            value: total,
            items: items.map(item => ({
              item_id: item.id,
              item_name: item.nome,
              price: item.preco,
              quantity: item.quantidade
            }))
          });
        }
      } catch (error) {
        console.debug('Begin checkout tracking error:', error);
      }
    };

    if (items.length > 0) {
      trackBeginCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Array vazio - só roda uma vez na montagem

  // Debug
  console.log('🛒 Checkout - Items:', items);
  console.log('🛒 Checkout - Mounted:', mounted);
  console.log('🏪 Checkout - Loja:', loja?.nome);

  // Converter items do Zustand para formato do OrderSummary
  const convertedItems = items.map(item => ({
    id: item.id,
    nome: item.nome,
    preco_final: item.preco,
    imagens: [item.imagem],
    quantidade: item.quantidade,
    tamanho: item.tamanho,
    sku: item.sku,
  }));

  if (!loja || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Carrinho Vazio</h2>
          <p className="text-gray-600 mb-6">Adicione produtos ao carrinho para continuar</p>
          <Link 
            href={`/loja/${loja.dominio}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: corPrimaria }}
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Minimalista - Logo e Badge de Confiança */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={`/loja/${loja.dominio}`} className="flex items-center">
              {loja.logo ? (
                <Image 
                  src={loja.logo} 
                  alt={loja.nome}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold" style={{ color: corPrimaria }}>
                  {loja.nome}
                </span>
              )}
            </Link>

            {/* Badge Verde de Segurança - Mobile e Desktop */}
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <Lock size={18} className="text-green-600" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-green-700 leading-tight">
                  Compra Segura
                </span>
                <span className="text-[10px] text-green-600 leading-tight hidden sm:block">
                  Seus dados protegidos
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Link Voltar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link 
          href={`/loja/${loja.dominio}/carrinho`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para o carrinho
        </Link>
      </div>

      {/* Layout Principal - Duas Colunas */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda - Formulários (60%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Seleção de Frete */}
            <CheckoutShippingSelector
              onSelectShipping={setSelectedShipping}
              selectedShipping={selectedShipping}
              corPrimaria={corPrimaria}
            />
            
            {/* Formulário de Checkout */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Dados de Pagamento
              </h1>
              
              <CheckoutForm loja={loja} />
            </div>
          </div>

          {/* Coluna Direita - Resumo (40%) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <OrderSummary 
                loja={loja} 
                items={convertedItems}
                shippingValue={selectedShipping?.preco || null}
                shippingName={selectedShipping?.nome || null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer do Checkout */}
      <CheckoutFooter />
    </div>
  );
}
