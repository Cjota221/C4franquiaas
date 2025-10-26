"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, Package } from 'lucide-react';

type LojaInfo = {
  nome: string;
  cor_primaria: string;
  cor_secundaria: string;
};

export default function CarrinhoPage({ params }: { params: Promise<{ dominio: string }> }) {
  const [lojaInfo, setLojaInfo] = useState<LojaInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dominio, setDominio] = useState<string>('');
  const [erroEstoque, setErroEstoque] = useState<Record<string, string>>({});
  
  const itens = useCarrinhoStore(state => state.items);
  const updateQuantidade = useCarrinhoStore(state => state.updateQuantidade);
  const removeItem = useCarrinhoStore(state => state.removeItem);
  const clearCarrinho = useCarrinhoStore(state => state.clearCarrinho);
  const getTotal = useCarrinhoStore(state => state.getTotal);

  useEffect(() => {
    async function init() {
      const { dominio: dom } = await params;
      setDominio(dom);
      setMounted(true);
      
      try {
        const res = await fetch(`/api/loja/${dom}/info`);
        if (res.ok) {
          const json = await res.json();
          setLojaInfo(json.loja);
        }
      } catch (err) {
        console.error('Erro ao carregar loja:', err);
      }
    }
    
    init();
  }, [params]);

  // Evitar hydration error
  if (!mounted) {
    return null;
  }

  const total = getTotal();
  const isEmpty = itens.length === 0;

  // Função para aumentar quantidade com validação
  const handleAumentarQuantidade = (item: typeof itens[0]) => {
    const itemKey = item.sku ? `${item.id}-${item.sku}` : item.id;
    
    if (item.quantidade >= item.estoque) {
      const mensagem = item.estoque === 0 
        ? `Este produto está sem estoque.`
        : item.estoque === 1
          ? `Temos apenas 1 unidade disponível.`
          : `Temos apenas ${item.estoque} unidades disponíveis.`;
      
      setErroEstoque(prev => ({ ...prev, [itemKey]: mensagem }));
      
      // Limpar erro após 3 segundos
      setTimeout(() => {
        setErroEstoque(prev => {
          const newErros = { ...prev };
          delete newErros[itemKey];
          return newErros;
        });
      }, 3000);
      
      return;
    }
    
    updateQuantidade(item.id, item.quantidade + 1, item.sku);
    setErroEstoque(prev => {
      const newErros = { ...prev };
      delete newErros[itemKey];
      return newErros;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meu Carrinho</h1>
          <p className="text-gray-600">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</p>
        </div>

        {!isEmpty && (
          <button
            onClick={() => {
              if (confirm('Deseja realmente limpar o carrinho?')) {
                clearCarrinho();
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium transition"
          >
            Limpar Carrinho
          </button>
        )}
      </div>

      {isEmpty ? (
        /* Carrinho Vazio */
        <div className="text-center py-16">
          <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Seu carrinho está vazio</h2>
          <p className="text-gray-600 mb-6">Adicione produtos para continuar comprando</p>
          <Link
            href={`/loja/${dominio}/produtos`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: lojaInfo?.cor_primaria || '#DB1472' }}
          >
            <Package size={20} />
            Ver Produtos
          </Link>
        </div>
      ) : (
        /* Carrinho com Itens */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2 space-y-4">
            {itens.map((item) => {
              // ⭐ Chave única considerando SKU
              const itemKey = item.sku ? `${item.id}-${item.sku}` : item.id;
              
              return (
                <div key={itemKey} className="bg-white rounded-xl shadow-md p-4 flex gap-4">
                  {/* Imagem */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.imagem ? (
                      <Image
                        src={item.imagem}
                        alt={item.nome}
                        fill
                        className="object-cover"
                        quality={70}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package size={32} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 truncate">{item.nome}</h3>
                    
                    {/* ⭐ Mostrar tamanho se existir */}
                    {item.tamanho && (
                      <p className="text-sm text-gray-600 mb-1">
                        Tamanho: <span className="font-semibold">{item.tamanho}</span>
                      </p>
                    )}
                    
                    {/* ✅ Mostrar estoque disponível */}
                    <p className="text-xs text-gray-500 mb-2">
                      {item.estoque > 0 ? (
                        <>
                          <span className="text-green-600 font-semibold">
                            {item.estoque} {item.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 font-semibold">Sem estoque</span>
                      )}
                    </p>
                    
                    <p className="text-xl font-bold mb-3" style={{ color: lojaInfo?.cor_primaria || '#DB1472' }}>
                      R$ {item.preco.toFixed(2).replace('.', ',')}
                    </p>

                    {/* ❌ Mensagem de erro de estoque */}
                    {erroEstoque[itemKey] && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-medium">
                          ⚠️ {erroEstoque[itemKey]}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Controle de Quantidade */}
                      <div className="flex items-center border-2 border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantidade(item.id, item.quantidade - 1, item.sku)}
                          disabled={item.quantidade <= 1}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 py-1 font-bold">{item.quantidade}</span>
                        <button
                          onClick={() => handleAumentarQuantidade(item)}
                          disabled={item.quantidade >= item.estoque}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          title={item.quantidade >= item.estoque ? 'Estoque máximo atingido' : 'Aumentar quantidade'}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <span className="text-sm text-gray-600">
                        Subtotal: <span className="font-bold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Botão Remover */}
                  <button
                    onClick={() => removeItem(item.id, item.sku)}
                    className="text-red-600 hover:text-red-700 p-2 transition"
                    title="Remover item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="text-sm">Calcular na finalização</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span style={{ color: lojaInfo?.cor_primaria || '#DB1472' }}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <button
                  className="w-full py-4 rounded-lg font-bold text-white text-lg transition hover:opacity-90"
                  style={{ backgroundColor: lojaInfo?.cor_primaria || '#DB1472' }}
                  onClick={() => alert('Em breve: Finalizar Compra via WhatsApp')}
                >
                  Finalizar Compra
                </button>

                <Link
                  href={`/loja/${dominio}/produtos`}
                  className="w-full py-3 rounded-lg font-bold text-center border-2 transition hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ 
                    borderColor: lojaInfo?.cor_primaria || '#DB1472',
                    color: lojaInfo?.cor_primaria || '#DB1472'
                  }}
                >
                  <ArrowLeft size={20} />
                  Continuar Comprando
                </Link>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="mb-2">✓ Pagamento seguro</p>
                <p className="mb-2">✓ Produtos garantidos</p>
                <p>✓ Entrega rápida</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
