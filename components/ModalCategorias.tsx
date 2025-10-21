"use client";

import React, { useEffect, useState } from 'react';
import { useCategoriaStore } from '@/lib/store/categoriaStore';
import { useStatusStore } from '@/lib/store/statusStore';
import { supabase } from '@/lib/supabaseClient';

type Categoria = {
  id: number;
  nome: string;
  pai_id: number | null;
  subcategorias?: Categoria[];
};

export default function ModalCategorias(): React.JSX.Element | null {
  const categoriaPanelOpen = useCategoriaStore((s) => s.categoriaPanelOpen);
  const setCategoryPanelOpen = useCategoriaStore((s) => s.setCategoryPanelOpen);
  const setStatusMsg = useStatusStore((s) => s.setStatusMsg);
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaSubcategoria, setNovaSubcategoria] = useState('');
  const [paiSelecionado, setPaiSelecionado] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNome, setEditandoNome] = useState('');

  // Carregar categorias
  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      // Organizar em árvore (pai -> filhos)
      const categoriasMap = new Map<number, Categoria>();
      const raizes: Categoria[] = [];

      (data || []).forEach((cat) => {
        categoriasMap.set(cat.id, { ...cat, subcategorias: [] });
      });

      categoriasMap.forEach((cat) => {
        if (cat.pai_id === null) {
          raizes.push(cat);
        } else {
          const pai = categoriasMap.get(cat.pai_id);
          if (pai) {
            pai.subcategorias = pai.subcategorias || [];
            pai.subcategorias.push(cat);
          }
        }
      });

      setCategorias(raizes);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar categorias' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoriaPanelOpen) {
      carregarCategorias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaPanelOpen]);

  // Criar categoria ou subcategoria
  const handleCriar = async () => {
    const nome = paiSelecionado ? novaSubcategoria : novaCategoria;
    if (!nome.trim()) {
      setStatusMsg({ type: 'error', text: 'Digite um nome' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('categorias')
        .insert({ nome: nome.trim(), pai_id: paiSelecionado });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: `${paiSelecionado ? 'Subcategoria' : 'Categoria'} criada com sucesso` });
      setNovaCategoria('');
      setNovaSubcategoria('');
      setPaiSelecionado(null);
      await carregarCategorias();
    } catch (err) {
      console.error('Erro ao criar:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao criar categoria' });
    } finally {
      setLoading(false);
    }
  };

  // Editar categoria
  const handleEditar = async (id: number) => {
    if (!editandoNome.trim()) {
      setStatusMsg({ type: 'error', text: 'Digite um nome' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('categorias')
        .update({ nome: editandoNome.trim() })
        .eq('id', id);

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Categoria atualizada' });
      setEditandoId(null);
      setEditandoNome('');
      await carregarCategorias();
    } catch (err) {
      console.error('Erro ao editar:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao editar categoria' });
    } finally {
      setLoading(false);
    }
  };

  // Deletar categoria
  const handleDeletar = async (id: number) => {
    if (!confirm('Tem certeza? Isso também removerá as subcategorias.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Categoria removida' });
      await carregarCategorias();
    } catch (err) {
      console.error('Erro ao deletar:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao remover categoria' });
    } finally {
      setLoading(false);
    }
  };

  const renderCategoria = (cat: Categoria, nivel = 0) => (
    <div key={cat.id} className={`${nivel > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''} mb-2`}>
      {editandoId === cat.id ? (
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
          <input
            type="text"
            value={editandoNome}
            onChange={(e) => setEditandoNome(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
            autoFocus
          />
          <button
            onClick={() => handleEditar(cat.id)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            ✓
          </button>
          <button
            onClick={() => {
              setEditandoId(null);
              setEditandoNome('');
            }}
            className="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded hover:bg-gray-100 transition-colors">
          <span className="font-medium">{cat.nome}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPaiSelecionado(cat.id);
                setNovaSubcategoria('');
              }}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              title="Adicionar subcategoria"
            >
              + Sub
            </button>
            <button
              onClick={() => {
                setEditandoId(cat.id);
                setEditandoNome(cat.nome);
              }}
              className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
            >
              ✎
            </button>
            <button
              onClick={() => handleDeletar(cat.id)}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              🗑
            </button>
          </div>
        </div>
      )}
      
      {cat.subcategorias && cat.subcategorias.length > 0 && (
        <div className="mt-2">
          {cat.subcategorias.map((sub) => renderCategoria(sub, nivel + 1))}
        </div>
      )}
    </div>
  );

  if (!categoriaPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">📁 Gerenciar Categorias</h2>
          <button
            className="text-white hover:bg-white/20 transition-colors px-4 py-2 rounded-lg"
            onClick={() => setCategoryPanelOpen(false)}
          >
            ✕ Fechar
          </button>
        </div>

        <div className="p-6">
          {/* Criar nova categoria */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-3 text-gray-700">➕ Nova Categoria</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da categoria..."
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              <button
                onClick={handleCriar}
                disabled={loading || !novaCategoria.trim()}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Criar
              </button>
            </div>
          </div>

          {/* Criar subcategoria */}
          {paiSelecionado !== null && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3 text-gray-700">
                ➕ Nova Subcategoria de: <span className="text-blue-600">{categorias.find(c => c.id === paiSelecionado)?.nome}</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da subcategoria..."
                  value={novaSubcategoria}
                  onChange={(e) => setNovaSubcategoria(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
                <button
                  onClick={handleCriar}
                  disabled={loading || !novaSubcategoria.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setPaiSelecionado(null);
                    setNovaSubcategoria('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de categorias */}
          <div className="space-y-2">
            <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
              📋 Categorias Existentes
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>}
            </h3>
            
            {loading && categorias.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
                Carregando categorias...
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                Nenhuma categoria cadastrada ainda.
              </div>
            ) : (
              categorias.map((cat) => renderCategoria(cat))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
