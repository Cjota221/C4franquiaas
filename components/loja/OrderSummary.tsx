"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Tag, Truck } from 'lucide-react';
import { LojaInfo } from '@/contexts/LojaContext';
import { CartItem } from '@/contexts/CartContext';

interface OrderSummaryProps {
  loja: LojaInfo;
  items: CartItem[];
}

export default function OrderSummary({ loja, items }: OrderSummaryProps) {
  const corPrimaria = loja?.cor_primaria || '#DB1472';
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(false);

  // Debug para verificar se items está atualizando
  console.log('📦 [OrderSummary] Items recebidos:', items.length, items);

  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + (item.preco_final * item.quantidade), 0);
  
  // Frete grátis baseado na configuração da loja
  const valorMinimoFreteGratis = loja.frete_gratis_valor || 150; // Default: R$ 150
  const valorFrete = loja.valor_frete || 15.90; // Default: R$ 15,90
  const shipping = subtotal >= valorMinimoFreteGratis ? 0 : valorFrete;
  
  // 🔍 DEBUG: Verificar valores de frete
  console.log('🚚 [OrderSummary Frete Debug]', {
    'Subtotal': `R$ ${subtotal.toFixed(2)}`,
    'loja.frete_gratis_valor': loja.frete_gratis_valor,
    'Mínimo Usado': `R$ ${valorMinimoFreteGratis.toFixed(2)}`,
    'Frete Grátis?': subtotal >= valorMinimoFreteGratis,
    'Shipping': `R$ ${shipping.toFixed(2)}`
  });
  
  const discount = appliedCoupon ? subtotal * 0.1 : 0; // 10% de desconto exemplo
  const total = subtotal + shipping - discount;

  const applyCoupon = () => {
    if (couponCode.trim()) {
      setAppliedCoupon(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
      {/* Título */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Resumo do Pedido
      </h2>

      {/* Lista de Produtos */}
      <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4">
            {/* Imagem do Produto */}
            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
              {item.imagens && item.imagens[0] && (
                <Image
                  src={item.imagens[0]}
                  alt={item.nome}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>

            {/* Detalhes */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {item.nome}
              </h3>
              {item.tamanho && (
                <p className="text-xs text-gray-500 mt-1">
                  Tamanho: {item.tamanho}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Quantidade: {item.quantidade}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                R$ {(item.preco_final * item.quantidade).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cupom de Desconto */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cupom de Desconto
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Digite o cupom"
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
            disabled={appliedCoupon}
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={appliedCoupon}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: appliedCoupon ? '#E5E7EB' : corPrimaria,
              color: appliedCoupon ? '#6B7280' : 'white'
            }}
          >
            {appliedCoupon ? '✓' : 'Aplicar'}
          </button>
        </div>
        {appliedCoupon && (
          <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: corPrimaria }}>
            <Tag size={16} />
            <span className="font-medium">Cupom aplicado com sucesso!</span>
          </div>
        )}
      </div>

      {/* Resumo de Valores */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            R$ {subtotal.toFixed(2)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm" style={{ color: corPrimaria }}>
            <span className="font-medium">Desconto</span>
            <span className="font-medium">
              - R$ {discount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete</span>
          <span className="font-medium text-gray-900">
            {shipping === 0 ? (
              <span style={{ color: corPrimaria }} className="font-semibold">
                GRÁTIS
              </span>
            ) : (
              `R$ ${shipping.toFixed(2)}`
            )}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold" style={{ color: corPrimaria }}>
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Prazo de Entrega */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Truck size={20} className="flex-shrink-0 mt-0.5" style={{ color: corPrimaria }} />
        <div>
          <p className="text-sm font-medium text-gray-900">
            Prazo de entrega estimado
          </p>
          <p className="text-sm text-gray-600 mt-1">
            5 a 10 dias úteis
          </p>
        </div>
      </div>

      {/* Benefícios Adicionais */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-green-500 font-bold">✓</span>
          <span>Compra 100% segura</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-green-500 font-bold">✓</span>
          <span>Garantia de entrega</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-green-500 font-bold">✓</span>
          <span>Devolução grátis em 30 dias</span>
        </div>
      </div>
    </div>
  );
}
