'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { Loader2, ShoppingCart, CheckCircle2, XCircle, Tag, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  variationId?: string;
  variationName?: string;
}

interface RecoveryData {
  cart: {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    totalValue: number;
    itemsCount: number;
    createdAt: string;
  };
  items: CartItem[];
  reseller: {
    slug: string;
    storeName: string;
  };
  coupon?: {
    code: string;
    name: string;
    type: string;
    discountValue?: number;
    discountPercentage?: number;
    minimumValue?: number;
  };
}

export default function RecuperarCarrinhoPage() {
  const params = useParams();
  const router = useRouter();
  const dominio = params.dominio as string;
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [recovered, setRecovered] = useState(false);

  const addItem = useCarrinhoStore(state => state.addItem);
  const clearCarrinho = useCarrinhoStore(state => state.clearCarrinho);

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await fetch(`/api/abandoned-cart/recover/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erro ao carregar carrinho');
          return;
        }

        setRecoveryData(data);
      } catch (err) {
        console.error('Erro ao recuperar carrinho:', err);
        setError('Erro ao carregar carrinho. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadCart();
    }
  }, [token]);

  const handleRecoverCart = async () => {
    if (!recoveryData) return;

    setRecovering(true);

    try {
      // Limpar carrinho atual
      clearCarrinho();

      // Adicionar cada item ao carrinho
      for (const item of recoveryData.items) {
        addItem({
          id: item.productId,
          nome: item.productName,
          preco: item.productPrice,
          quantidade: item.quantity,
          imagem: item.productImage || '/placeholder.png',
          estoque: 999, // Assumimos estoque disponível
          sku: item.variationId || undefined,
          tamanho: item.variationName || undefined,
          variacaoId: item.variationId || undefined,
          lojaId: recoveryData.reseller.slug
        });
      }

      // Se tem cupom, salvar no localStorage para aplicar no checkout
      if (recoveryData.coupon) {
        localStorage.setItem('recovery_coupon', JSON.stringify(recoveryData.coupon));
      }

      setRecovered(true);

      // Redirecionar para o carrinho após 2 segundos
      setTimeout(() => {
        router.push(`/loja/${dominio}/carrinho`);
      }, 2000);

    } catch (err) {
      console.error('Erro ao recuperar carrinho:', err);
      setError('Erro ao recuperar carrinho. Tente novamente.');
    } finally {
      setRecovering(false);
    }
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando seu carrinho...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ops! Algo deu errado
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/loja/${dominio}`)}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Ir para a loja
          </button>
        </div>
      </div>
    );
  }

  // Estado de recuperado com sucesso
  if (recovered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Carrinho recuperado!
          </h1>
          <p className="text-gray-600 mb-4">
            Seus produtos estão de volta no carrinho.
          </p>
          {recoveryData?.coupon && (
            <p className="text-pink-600 font-medium mb-4">
              🎁 Cupom {recoveryData.coupon.code} aplicado!
            </p>
          )}
          <p className="text-sm text-gray-500">
            Redirecionando para o carrinho...
          </p>
        </div>
      </div>
    );
  }

  // Página principal de recuperação
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Recupere seu carrinho!
          </h1>
          <p className="text-gray-600">
            {recoveryData?.cart.customerName 
              ? `Oi ${recoveryData.cart.customerName}! ` 
              : ''}
            Encontramos os produtos que você deixou no carrinho.
          </p>
        </div>

        {/* Cupom de desconto */}
        {recoveryData?.coupon && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center gap-3">
              <Tag className="w-6 h-6" />
              <div>
                <p className="font-bold">🎁 Cupom especial para você!</p>
                <p className="text-sm opacity-90">
                  Use o cupom <strong>{recoveryData.coupon.code}</strong> e ganhe 
                  {recoveryData.coupon.discountPercentage 
                    ? ` ${recoveryData.coupon.discountPercentage}% de desconto`
                    : ` R$ ${recoveryData.coupon.discountValue?.toFixed(2)} de desconto`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Seus produtos ({recoveryData?.items.length || 0})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recoveryData?.items.map((item, index) => (
              <div key={index} className="p-4 flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {item.productName}
                  </h3>
                  {item.variationName && (
                    <p className="text-sm text-gray-500">
                      Tamanho: {item.variationName}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500">
                      Qtd: {item.quantity}
                    </p>
                    <p className="font-semibold text-pink-600">
                      R$ {(item.productPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-pink-600">
              R$ {recoveryData?.cart.totalValue?.toFixed(2) || '0,00'}
            </span>
          </div>
        </div>

        {/* Botão de recuperar */}
        <button
          onClick={handleRecoverCart}
          disabled={recovering}
          className="w-full py-4 bg-pink-500 text-white rounded-xl font-bold text-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {recovering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Recuperando...
            </>
          ) : (
            <>
              Recuperar meu carrinho
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Link para loja */}
        <p className="text-center mt-4 text-sm text-gray-500">
          ou{' '}
          <button
            onClick={() => router.push(`/loja/${dominio}`)}
            className="text-pink-500 hover:underline"
          >
            continuar navegando na loja
          </button>
        </p>
      </div>
    </div>
  );
}
