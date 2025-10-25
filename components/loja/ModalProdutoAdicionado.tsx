"use client";
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, CheckCircle2, ArrowRight, Package } from 'lucide-react';

type ModalProdutoAdicionadoProps = {
  isOpen: boolean;
  onClose: () => void;
  produto: {
    nome: string;
    preco: number;
    imagem: string;
    tamanho?: string;
    quantidade: number;
  };
  dominio: string;
  corPrimaria: string;
};

export default function ModalProdutoAdicionado({
  isOpen,
  onClose,
  produto,
  dominio,
  corPrimaria
}: ModalProdutoAdicionadoProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleIrParaCarrinho = () => {
    onClose();
    router.push(`/loja/${dominio}/carrinho`);
  };

  const handleContinuarComprando = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com sucesso */}
          <div 
            className="px-6 py-4 rounded-t-2xl flex items-center justify-between"
            style={{ backgroundColor: corPrimaria }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h3 className="font-bold text-lg">Produto Adicionado!</h3>
                <p className="text-sm text-white/90">Seu item está no carrinho</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Corpo do modal */}
          <div className="p-6">
            {/* Produto adicionado */}
            <div className="flex gap-4 mb-6 bg-gray-50 rounded-xl p-4">
              {/* Imagem */}
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                {produto.imagem ? (
                  <Image
                    src={produto.imagem}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    quality={70}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                  {produto.nome}
                </h4>
                
                {produto.tamanho && (
                  <p className="text-sm text-gray-600 mb-1">
                    Tamanho: <span className="font-semibold">{produto.tamanho}</span>
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Quantidade: <span className="font-semibold">{produto.quantidade}</span>
                  </p>
                  <p 
                    className="font-bold text-lg"
                    style={{ color: corPrimaria }}
                  >
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              {/* Ir para o carrinho */}
              <button
                onClick={handleIrParaCarrinho}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ backgroundColor: corPrimaria }}
              >
                <ShoppingCart className="w-5 h-5" />
                Ir para o Carrinho
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Continuar comprando */}
              <button
                onClick={handleContinuarComprando}
                className="w-full py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animações */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
