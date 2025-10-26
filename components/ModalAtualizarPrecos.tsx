"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useStatusStore } from '@/lib/store/statusStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  produtoIds: (number | string)[];
  onSuccess: () => void;
};

export default function ModalAtualizarPrecos({ isOpen, onClose, produtoIds, onSuccess }: Props): React.JSX.Element | null {
  const [tipo, setTipo] = useState<'percentual' | 'fixo'>('percentual');
  const [operacao, setOperacao] = useState<'aumentar' | 'diminuir'>('aumentar');
  const [valor, setValor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [previewCalculado, setPreviewCalculado] = useState<number | null>(null);
  const setStatusMsg = useStatusStore((s) => s.setStatusMsg);

  const handleClose = () => {
    setTipo('percentual');
    setOperacao('aumentar');
    setValor('');
    setPreviewCalculado(null);
    onClose();
  };

  const calcularPreview = () => {
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setPreviewCalculado(null);
      return;
    }

    // Exemplo: produto de R$ 100
    const precoExemplo = 100;
    let novoPreco = precoExemplo;

    if (tipo === 'percentual') {
      if (operacao === 'aumentar') {
        novoPreco = precoExemplo * (1 + valorNum / 100);
      } else {
        novoPreco = precoExemplo * (1 - valorNum / 100);
      }
    } else {
      if (operacao === 'aumentar') {
        novoPreco = precoExemplo + valorNum;
      } else {
        novoPreco = precoExemplo - valorNum;
      }
    }

    setPreviewCalculado(Math.max(0, novoPreco));
  };

  const handleAtualizarPrecos = async () => {
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setStatusMsg({ type: 'error', text: 'Valor inválido' });
      return;
    }

    try {
      setLoading(true);

      // Buscar os produtos selecionados
      const { data: produtos, error: fetchError } = await supabase
        .from('produtos')
        .select('id, preco_base')
        .in('id', produtoIds);

      if (fetchError) throw fetchError;

      if (!produtos || produtos.length === 0) {
        throw new Error('Nenhum produto encontrado');
      }

      // Calcular novos preços
      const updates = produtos.map(produto => {
        const precoAtual = produto.preco_base || 0;
        let novoPreco = precoAtual;

        if (tipo === 'percentual') {
          if (operacao === 'aumentar') {
            novoPreco = precoAtual * (1 + valorNum / 100);
          } else {
            novoPreco = precoAtual * (1 - valorNum / 100);
          }
        } else {
          if (operacao === 'aumentar') {
            novoPreco = precoAtual + valorNum;
          } else {
            novoPreco = precoAtual - valorNum;
          }
        }

        // Não permitir preços negativos
        novoPreco = Math.max(0, novoPreco);

        return {
          id: produto.id,
          preco_base: parseFloat(novoPreco.toFixed(2))
        };
      });

      // Atualizar cada produto individualmente
      // (Supabase não suporta batch update direto, então fazemos em paralelo)
      const updatePromises = updates.map(update =>
        supabase
          .from('produtos')
          .update({ preco_base: update.preco_base })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Verificar se houve erros
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} produtos não puderam ser atualizados`);
      }

      setStatusMsg({ 
        type: 'success', 
        text: `${produtos.length} produto(s) atualizado(s) com sucesso` 
      });
      
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Erro ao atualizar preços:', err);
      setStatusMsg({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Erro ao atualizar preços' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl max-w-lg w-full shadow-2xl relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#DB1472] text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold">Atualizar Preços em Lote</h2>
          <button
            className="text-white hover:bg-white/20 transition-colors px-3 py-1 rounded"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {produtoIds.length} produto(s) selecionado(s)
          </p>

          {/* Escolher tipo de atualização */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">
              Tipo de atualização:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTipo('percentual')}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  tipo === 'percentual'
                    ? 'bg-[#DB1472] text-white'
                    : 'bg-gray-200 text-[#333] hover:bg-gray-300'
                }`}
              >
                Percentual (%)
              </button>
              <button
                onClick={() => setTipo('fixo')}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  tipo === 'fixo'
                    ? 'bg-[#DB1472] text-white'
                    : 'bg-gray-200 text-[#333] hover:bg-gray-300'
                }`}
              >
                Valor Fixo (R$)
              </button>
            </div>
          </div>

          {/* Escolher operação */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">
              Operação:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOperacao('aumentar')}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  operacao === 'aumentar'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-[#333] hover:bg-gray-300'
                }`}
              >
                Aumentar
              </button>
              <button
                onClick={() => setOperacao('diminuir')}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  operacao === 'diminuir'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-[#333] hover:bg-gray-300'
                }`}
              >
                Diminuir
              </button>
            </div>
          </div>

          {/* Input do valor */}
          <div className="mb-6">
            <label htmlFor="valor-input" className="block text-sm font-medium text-[#333] mb-2">
              {tipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}:
            </label>
            <input
              id="valor-input"
              type="number"
              step={tipo === 'percentual' ? '1' : '0.01'}
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onBlur={calcularPreview}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] focus:outline-none"
              placeholder={tipo === 'percentual' ? 'Ex: 10' : 'Ex: 5.00'}
              disabled={loading}
            />
          </div>

          {/* Preview */}
          {previewCalculado !== null && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">Preview:</p>
              <p className="text-sm text-blue-700">
                Produto de R$ 100,00 ficará: <span className="font-bold">R$ {previewCalculado.toFixed(2)}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {operacao === 'aumentar' ? '+' : '-'}
                {tipo === 'percentual' ? `${valor}%` : `R$ ${valor}`}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={handleAtualizarPrecos}
              disabled={loading || !valor || parseFloat(valor) <= 0}
              className="flex-1 py-2 px-4 rounded font-medium text-white bg-[#DB1472] hover:bg-[#DB1472]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processando...
                </span>
              ) : (
                'Atualizar Preços'
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 bg-gray-300 text-[#333] rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
