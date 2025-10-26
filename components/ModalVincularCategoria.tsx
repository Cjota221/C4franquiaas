"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useStatusStore } from '@/lib/store/statusStore';

type Categoria = {
  id: number;
  nome: string;
  pai_id: number | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  produtoIds: (number | string)[];
  onSuccess: () => void;
};

export default function ModalVincularCategoria({ isOpen, onClose, produtoIds, onSuccess }: Props): React.JSX.Element | null {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'vincular' | 'desvincular'>('vincular');
  const setStatusMsg = useStatusStore((s) => s.setStatusMsg);

  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar categorias' });
    }
  };

  const handleVincular = async () => {
    if (!categoriaSelecionada) {
      setStatusMsg({ type: 'error', text: 'Selecione uma categoria' });
      return;
    }

    try {
      setLoading(true);

      if (modo === 'vincular') {
        // Vincular produtos à categoria
        const inserts = produtoIds.map(produtoId => ({
          produto_id: produtoId,
          categoria_id: categoriaSelecionada,
        }));

        // Remover vínculos existentes primeiro
        await supabase
          .from('produto_categorias')
          .delete()
          .in('produto_id', produtoIds)
          .eq('categoria_id', categoriaSelecionada);

        // Inserir novos vínculos
        const { error } = await supabase
          .from('produto_categorias')
          .insert(inserts);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: `${produtoIds.length} produto(s) vinculado(s) com sucesso` });
      } else {
        // Desvincular produtos da categoria
        const { error } = await supabase
          .from('produto_categorias')
          .delete()
          .in('produto_id', produtoIds)
          .eq('categoria_id', categoriaSelecionada);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: `${produtoIds.length} produto(s) desvinculado(s) com sucesso` });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao vincular/desvincular:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao processar operação' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        // Fechar modal se clicar no backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl max-w-md w-full shadow-2xl relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#DB1472] text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold">Gerenciar Categorias</h2>
          <button
            className="text-white hover:bg-white/20 transition-colors px-3 py-1 rounded"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            {produtoIds.length} produto(s) selecionado(s)
          </p>

          {/* Escolher modo */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setModo('vincular')}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                modo === 'vincular'
                  ? 'bg-[#DB1472] text-white'
                  : 'bg-gray-200 text-[#333] hover:bg-gray-300'
              }`}
            >
              Vincular
            </button>
            <button
              onClick={() => setModo('desvincular')}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                modo === 'desvincular'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-[#333] hover:bg-gray-300'
              }`}
            >
              Desvincular
            </button>
          </div>

          {/* Selecionar categoria */}
          <div className="mb-6">
            <label htmlFor="categoria-select" className="block text-sm font-medium text-[#333] mb-2">
              Selecione a categoria:
            </label>
            <select
              id="categoria-select"
              value={categoriaSelecionada || ''}
              onChange={(e) => {
                const value = e.target.value;
                setCategoriaSelecionada(value ? Number(value) : null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] focus:outline-none bg-white"
              disabled={loading}
            >
              <option value="">-- Escolha uma categoria --</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.pai_id ? `  └─ ${cat.nome}` : cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={handleVincular}
              disabled={loading || !categoriaSelecionada}
              className={`flex-1 py-2 px-4 rounded font-medium text-white transition-colors ${
                modo === 'vincular'
                  ? 'bg-[#DB1472] hover:bg-[#DB1472]/90'
                  : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processando...
                </span>
              ) : modo === 'vincular' ? (
                'Vincular'
              ) : (
                'Desvincular'
              )}
            </button>
            <button
              onClick={onClose}
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
