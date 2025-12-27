"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCatalogo } from '../layout';

export default function CarrinhoPage() {
  const { 
    reseller, 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotal, 
    primaryColor 
  } = useCatalogo();
  
  const [enviando, setEnviando] = useState(false);

  const formatarPedidoWhatsApp = () => {
    if (cart.length === 0) return '';

    let mensagem = `🛒 *Novo Pedido*\n\n`;
    mensagem += `Olá! Gostaria de fazer o seguinte pedido:\n\n`;

    cart.forEach((item, index) => {
      mensagem += `*${index + 1}. ${item.nome}*\n`;
      if (item.variacao) {
        mensagem += `   Tamanho: ${item.variacao.tamanho}`;
        if (item.variacao.cor) mensagem += ` | Cor: ${item.variacao.cor}`;
        mensagem += `\n`;
      } else if (item.tamanho) {
        mensagem += `   Tamanho: ${item.tamanho}\n`;
      }
      mensagem += `   Qtd: ${item.quantidade} x R$ ${item.preco.toFixed(2).replace('.', ',')}\n`;
      mensagem += `   Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}\n\n`;
    });

    mensagem += `─────────────────\n`;
    mensagem += `*TOTAL: R$ ${getTotal().toFixed(2).replace('.', ',')}*\n\n`;
    mensagem += `Aguardo confirmação! 😊`;

    return mensagem;
  };

  const handleFinalizarPedido = () => {
    if (cart.length === 0) return;
    if (!reseller?.phone) {
      alert('Número de WhatsApp não configurado para esta loja.');
      return;
    }

    setEnviando(true);
    
    const mensagem = formatarPedidoWhatsApp();
    const phoneNumber = reseller.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Opcional: limpar carrinho após enviar
    // clearCart();
    
    setTimeout(() => setEnviando(false), 1000);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link 
          href={`/catalogo/${reseller?.slug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          Continuar comprando
        </Link>

        <div className="text-center py-16">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-600 mb-6">
            Adicione produtos para continuar
          </p>
          <Link
            href={`/catalogo/${reseller?.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Ver Produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href={`/catalogo/${reseller?.slug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Continuar comprando
        </Link>
        
        <button
          onClick={() => {
            if (confirm('Deseja limpar todo o carrinho?')) {
              clearCart();
            }
          }}
          className="text-red-500 hover:text-red-600 text-sm"
        >
          Limpar carrinho
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Meu Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const itemKey = item.variacao?.id 
              ? `${item.productId}-${item.variacao.id}` 
              : item.id || item.productId;

            return (
              <div 
                key={itemKey}
                className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4"
              >
                {/* Imagem */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={item.imagem || '/placeholder.png'}
                    alt={item.nome}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                    {item.nome}
                  </h3>
                  
                  {item.variacao && (
                    <p className="text-sm text-gray-500 mb-2">
                      Tamanho: {item.variacao.tamanho}
                      {item.variacao.cor && ` | Cor: ${item.variacao.cor}`}
                    </p>
                  )}
                  {!item.variacao && item.tamanho && (
                    <p className="text-sm text-gray-500 mb-2">
                      Tamanho: {item.tamanho}
                    </p>
                  )}

                  <p className="font-bold" style={{ color: primaryColor }}>
                    R$ {item.preco.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* Quantidade e Remover */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.productId, item.variacao?.id || item.sku)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(
                        item.productId, 
                        item.quantidade - 1, 
                        item.variacao?.id || item.sku
                      )}
                      disabled={item.quantidade <= 1}
                      className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => updateQuantity(
                        item.productId, 
                        item.quantidade + 1, 
                        item.variacao?.id || item.sku
                      )}
                      className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Resumo do Pedido
            </h2>

            <div className="space-y-3 mb-6">
              {cart.map((item) => {
                const itemKey = item.variacao?.id 
                  ? `${item.productId}-${item.variacao.id}` 
                  : item.id || item.productId;
                
                return (
                  <div key={`summary-${itemKey}`} className="flex justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                      {item.quantidade}x {item.nome}
                      {item.variacao && ` (${item.variacao.tamanho})`}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span style={{ color: primaryColor }}>
                  R$ {getTotal().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizarPedido}
              disabled={enviando}
              className="w-full py-4 rounded-lg text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle size={20} />
              {enviando ? 'Abrindo WhatsApp...' : 'Finalizar via WhatsApp'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Você será redirecionado para o WhatsApp para confirmar seu pedido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
