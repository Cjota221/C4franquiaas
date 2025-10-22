"use client";

import React, { useState } from 'react';
import { ShoppingCart, Heart, Truck, Shield, RefreshCw } from 'lucide-react';

interface Cor {
  nome: string;
  hex: string;
  imagem_url?: string; // URL da imagem desta cor
}

interface Variacao {
  id: string;
  sku: string;
  tamanho: string;
  cor?: string;
  estoque: number;
}

interface BuyBoxProps {
  produtoId: string;
  nome: string;
  preco_final: number;
  preco_base?: number;
  cores?: Cor[];
  variacoes?: Variacao[];
  tamanhos?: string[]; // Se não usar variações complexas
  parcelamento?: string;
  estoque: number;
  onAddToCart: (data: {
    produtoId: string;
    cor?: string;
    tamanho?: string;
    variacaoId?: string;
    quantidade: number;
  }) => void;
  onChangeColor?: (cor: Cor) => void; // Callback para trocar imagem na galeria
}

export default function BuyBox({
  produtoId,
  nome,
  preco_final,
  preco_base,
  cores = [],
  variacoes = [],
  tamanhos = [],
  parcelamento,
  estoque,
  onAddToCart,
  onChangeColor
}: BuyBoxProps) {
  const [selectedCor, setSelectedCor] = useState<string | null>(null);
  const [selectedTamanho, setSelectedTamanho] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Verificar se há desconto
  const hasDiscount = preco_base && preco_base > preco_final;
  const discountPercentage = hasDiscount 
    ? Math.round(((preco_base - preco_final) / preco_base) * 100)
    : 0;

  // Determinar tamanhos disponíveis (com base na cor selecionada se houver variações)
  const getTamanhosDisponiveis = () => {
    if (variacoes.length > 0) {
      // Se há variações e uma cor foi selecionada
      if (selectedCor) {
        const variacoesDaCor = variacoes.filter(v => v.cor === selectedCor);
        return variacoesDaCor
          .filter(v => v.estoque > 0)
          .map(v => v.tamanho);
      }
      // Se não selecionou cor, mostrar todos os tamanhos únicos
      return [...new Set(variacoes.map(v => v.tamanho))];
    }
    // Fallback: lista simples de tamanhos
    return tamanhos;
  };

  const tamanhosDisponiveis = getTamanhosDisponiveis();

  // Verificar se um tamanho específico está disponível
  const isTamanhoDisponivel = (tamanho: string): boolean => {
    if (variacoes.length === 0) return true;
    
    if (selectedCor) {
      const variacao = variacoes.find(
        v => v.tamanho === tamanho && v.cor === selectedCor
      );
      return variacao ? variacao.estoque > 0 : false;
    }
    
    // Se não há cor selecionada, verificar se existe alguma variação com estoque
    return variacoes.some(v => v.tamanho === tamanho && v.estoque > 0);
  };

  // Handler para seleção de cor
  const handleSelectCor = (cor: Cor) => {
    setSelectedCor(cor.nome);
    setSelectedTamanho(null); // Resetar tamanho ao trocar cor
    setSizeError(false);
    
    // Callback para trocar imagem na galeria
    if (onChangeColor) {
      onChangeColor(cor);
    }
  };

  // Handler para seleção de tamanho
  const handleSelectTamanho = (tamanho: string) => {
    if (!isTamanhoDisponivel(tamanho)) return;
    setSelectedTamanho(tamanho);
    setSizeError(false);
  };

  // Handler para adicionar ao carrinho
  const handleAddToCart = async () => {
    // Validação de tamanho (se houver tamanhos disponíveis)
    if (tamanhosDisponiveis.length > 0 && !selectedTamanho) {
      setSizeError(true);
      // Scroll suave até o seletor de tamanhos
      document.getElementById('size-selector')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return;
    }

    setIsAddingToCart(true);

    // Encontrar a variação específica se houver
    let variacaoId: string | undefined;
    if (variacoes.length > 0 && selectedTamanho) {
      const variacao = selectedCor
        ? variacoes.find(v => v.cor === selectedCor && v.tamanho === selectedTamanho)
        : variacoes.find(v => v.tamanho === selectedTamanho);
      
      variacaoId = variacao?.id;
    }

    // Disparar callback
    onAddToCart({
      produtoId,
      cor: selectedCor || undefined,
      tamanho: selectedTamanho || undefined,
      variacaoId,
      quantidade
    });

    // Simular loading
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {nome}
        </h1>
      </div>

      {/* Preços */}
      <div className="flex items-center gap-3">
        {hasDiscount && (
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-500 line-through">
              R$ {preco_base!.toFixed(2).replace('.', ',')}
            </span>
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPercentage}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-3xl md:text-4xl font-bold text-[#DB1472]">
        R$ {preco_final.toFixed(2).replace('.', ',')}
      </div>

      {parcelamento && (
        <div className="text-gray-600">
          {parcelamento}
        </div>
      )}

      {/* Seletor de Cores */}
      {cores.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Cor: {selectedCor && <span className="text-[#DB1472]">{selectedCor}</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {cores.map((cor) => (
              <button
                key={cor.nome}
                onClick={() => handleSelectCor(cor)}
                className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                  selectedCor === cor.nome
                    ? 'border-[#F8B81F] ring-2 ring-[#F8B81F] ring-offset-2'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: cor.hex }}
                title={cor.nome}
              >
                {selectedCor === cor.nome && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de Tamanhos */}
      {tamanhosDisponiveis.length > 0 && (
        <div id="size-selector">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Tamanho: {selectedTamanho && <span className="text-[#DB1472]">{selectedTamanho}</span>}
          </label>
          
          {sizeError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-pulse">
              <span className="font-bold">⚠️</span>
              Por favor, selecione um tamanho antes de adicionar ao carrinho
            </div>
          )}

          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {tamanhosDisponiveis.map((tamanho) => {
              const disponivel = isTamanhoDisponivel(tamanho);
              const selecionado = selectedTamanho === tamanho;

              return (
                <button
                  key={tamanho}
                  onClick={() => handleSelectTamanho(tamanho)}
                  disabled={!disponivel}
                  className={`py-3 px-2 rounded-lg font-bold text-center transition-all ${
                    selecionado
                      ? 'bg-[#F8B81F] text-gray-900 ring-2 ring-[#F8B81F] ring-offset-2 scale-105'
                      : disponivel
                        ? 'bg-white text-gray-900 border-2 border-gray-300 hover:border-[#F8B81F]'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  {tamanho}
                  {!disponivel && <div className="text-xs mt-1">Esgotado</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantidade */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Quantidade
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-[#F8B81F] font-bold"
          >
            -
          </button>
          <span className="text-xl font-bold w-12 text-center">{quantidade}</span>
          <button
            onClick={() => setQuantidade(Math.min(estoque, quantidade + 1))}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-[#F8B81F] font-bold"
            disabled={quantidade >= estoque}
          >
            +
          </button>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || estoque === 0}
          className="w-full bg-[#F8B81F] hover:bg-[#F8B81F]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl"
        >
          {isAddingToCart ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
              Adicionando...
            </>
          ) : estoque === 0 ? (
            'Produto Esgotado'
          ) : (
            <>
              <ShoppingCart size={22} />
              Adicionar ao Carrinho
            </>
          )}
        </button>

        <button className="w-full border-2 border-gray-300 hover:border-[#DB1472] text-gray-900 font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
          <Heart size={20} />
          Adicionar aos Favoritos
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
        <div className="flex items-center gap-2 text-sm">
          <Truck className="text-green-600" size={20} />
          <span className="font-medium">Frete Grátis</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw className="text-blue-600" size={20} />
          <span className="font-medium">Troca Fácil</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="text-purple-600" size={20} />
          <span className="font-medium">Compra Segura</span>
        </div>
      </div>
    </div>
  );
}
