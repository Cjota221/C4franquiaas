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
      {/* Header Minimalista - Apenas Logo */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/loja/${loja.dominio}`} className="flex items-center">
            {loja.logo ? (
              <Image 
                src={loja.logo} 
                alt={loja.nome}
                width={140}
                height={50}
                className="h-10 w-auto"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold" style={{ color: corPrimaria }}>
                {loja.nome}
              </span>
            )}
          </Link>

          {/* Selos de Segurança */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock size={18} style={{ color: corPrimaria }} />
              <span className="font-medium">Compra Segura</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck size={18} style={{ color: corPrimaria }} />
              <span className="font-medium">Dados Protegidos</span>
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
