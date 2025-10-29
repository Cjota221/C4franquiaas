"use client";
import { useLojaInfo } from '@/contexts/LojaContext';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import CheckoutForm from '@/components/loja/CheckoutForm';
import OrderSummary from '@/components/loja/OrderSummary';

export default function CheckoutPage() {
  const loja = useLojaInfo();
  const { items, isLoading } = useCart();
  const corPrimaria = loja?.cor_primaria || '#DB1472';

  // Debug
  console.log('🛒 Checkout - Items:', items);
  console.log('⏳ Checkout - Loading:', isLoading);
  console.log('🏪 Checkout - Loja:', loja?.nome);

  if (!loja || isLoading) {
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
      {/* Header Minimalista - Apenas Logo e Avisos de Segurança */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {/* Logo */}
            <Link href={`/loja/${loja.dominio}`} className="flex items-center">
              {loja.logo ? (
                <Image 
                  src={loja.logo} 
                  alt={loja.nome}
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold" style={{ color: corPrimaria }}>
                  {loja.nome}
                </span>
              )}
            </Link>

            {/* Selo Compra Segura - Desktop */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <ShieldCheck size={20} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                Compra 100% Segura
              </span>
            </div>
          </div>

          {/* Aviso de Segurança - Importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Lock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Para sua segurança: realize o pagamento somente neste site oficial
                </p>
                <p className="text-xs text-amber-700">
                  Não efetue pagamentos via PIX externo ou links de terceiros. Pagamentos seguros são processados apenas aqui.
                </p>
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
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Finalizar Compra
              </h1>
              
              <CheckoutForm loja={loja} />
            </div>
          </div>

          {/* Coluna Direita - Resumo (40%) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <OrderSummary loja={loja} items={items} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
