"use client";

import React, { useEffect, useState } from 'react';
import { useCategoriaStore } from '@/lib/store/categoriaStore';
import { useStatusStore } from '@/lib/store/statusStore';

type Categoria = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem: string | null;
};

export default function ModalCategorias(): React.JSX.Element | null {
  const categoriaPanelOpen = useCategoriaStore((s) => s.categoriaPanelOpen);
  const setCategoryPanelOpen = useCategoriaStore((s) => s.setCategoryPanelOpen);
  const setStatusMsg = useStatusStore((s) => s.setStatusMsg);
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaImagemFile, setNovaImagemFile] = useState<File | null>(null);
  const [novaImagemPreview, setNovaImagemPreview] = useState<string>('');
  const [uploadingImagem, setUploadingImagem] = useState(false);
  
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState('');
  const [editandoDescricao, setEditandoDescricao] = useState('');
  const [editandoImagemFile, setEditandoImagemFile] = useState<File | null>(null);
  const [editandoImagemPreview, setEditandoImagemPreview] = useState<string>('');
  const [editandoImagemAtual, setEditandoImagemAtual] = useState<string>('');

  // Carregar categorias
  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categorias/list');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }

      const data = await response.json();
      // API retorna { items: [], total: 0 }, não um array direto
      setCategorias(Array.isArray(data) ? data : (data.items || []));
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar categorias' });
      setCategorias([]); // Garantir que seja array mesmo em caso de erro
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

  // Upload de imagem para o Supabase Storage
  const uploadImagem = async (file: File): Promise<string | null> => {
    try {
      setUploadingImagem(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/categorias/upload-imagem', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Erro no upload:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao fazer upload da imagem' });
      return null;
    } finally {
      setUploadingImagem(false);
    }
  };

  // Handler para seleção de arquivo (criar)
  const handleNovaImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNovaImagemFile(file);
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNovaImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler para seleção de arquivo (editar)
  const handleEditandoImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditandoImagemFile(file);
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditandoImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Criar categoria
  const handleCriar = async () => {
    if (!novaCategoria.trim()) {
      setStatusMsg({ type: 'error', text: 'Digite um nome para a categoria' });
      return;
    }

    try {
      setLoading(true);
      
      // Upload da imagem primeiro (se houver)
      let imagemUrl: string | null = null;
      if (novaImagemFile) {
        imagemUrl = await uploadImagem(novaImagemFile);
        if (!imagemUrl) {
          // Erro no upload, mas permite continuar sem imagem
          setStatusMsg({ type: 'info', text: 'Erro no upload da imagem, categoria será criada sem imagem' });
        }
      }

      const response = await fetch('/api/admin/categorias/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          nome: novaCategoria.trim(),
          descricao: novaDescricao.trim() || null,
          imagem: imagemUrl
        })
      });

      if (!response.ok) {
        let errorDetail;
        try {
          errorDetail = await response.json();
        } catch {
          errorDetail = await response.text();
        }
        console.error('[ModalCategorias] Erro da API (criar):', JSON.stringify(errorDetail, null, 2));
        console.error('[ModalCategorias] Status:', response.status);
        const errorMessage = typeof errorDetail === 'object' 
          ? (errorDetail.error || errorDetail.message || JSON.stringify(errorDetail))
          : String(errorDetail);
        throw new Error(errorMessage || 'Erro ao criar categoria');
      }

      setStatusMsg({ type: 'success', text: 'Categoria criada com sucesso' });
      setNovaCategoria('');
      setNovaDescricao('');
      setNovaImagemFile(null);
      setNovaImagemPreview('');
      await carregarCategorias();
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro desconhecido ao criar categoria';
      setStatusMsg({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Editar categoria
  const handleEditar = async (id: string) => {
    if (!editandoNome.trim()) {
      setStatusMsg({ type: 'error', text: 'Digite um nome' });
      return;
    }

    try {
      setLoading(true);
      
      // Upload da nova imagem (se houver)
      let imagemUrl: string | null = editandoImagemAtual; // Mantém a atual por padrão
      if (editandoImagemFile) {
        const novaUrl = await uploadImagem(editandoImagemFile);
        if (novaUrl) {
          imagemUrl = novaUrl;
          // TODO: Deletar imagem antiga do storage se necessário
        }
      }

      const response = await fetch('/api/admin/categorias/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          updates: {
            nome: editandoNome.trim(),
            slug: slugify(editandoNome.trim()),
            descricao: editandoDescricao.trim() || null,
            imagem: imagemUrl
          }
        })
      });

      if (!response.ok) {
        let errorDetail;
        try {
          errorDetail = await response.json();
        } catch {
          errorDetail = await response.text();
        }
        console.error('[ModalCategorias] Erro da API (editar):', JSON.stringify(errorDetail, null, 2));
        console.error('[ModalCategorias] Status:', response.status);
        const errorMessage = typeof errorDetail === 'object' 
          ? (errorDetail.error || errorDetail.message || JSON.stringify(errorDetail))
          : String(errorDetail);
        throw new Error(errorMessage || 'Erro ao atualizar categoria');
      }

      setStatusMsg({ type: 'success', text: 'Categoria atualizada' });
      setEditandoId(null);
      setEditandoNome('');
      setEditandoDescricao('');
      setEditandoImagemFile(null);
      setEditandoImagemPreview('');
      setEditandoImagemAtual('');
      await carregarCategorias();
    } catch (err) {
      console.error('Erro ao editar:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro desconhecido ao editar categoria';
      setStatusMsg({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para criar slug
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Deletar categoria
  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta categoria?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/categorias/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar categoria');
      }

      setStatusMsg({ type: 'success', text: 'Categoria removida' });
      await carregarCategorias();
    } catch (err) {
      console.error('Erro ao deletar:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro desconhecido ao deletar categoria';
      setStatusMsg({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderCategoria = (cat: Categoria) => (
    <div key={cat.id} className="mb-2">
      {editandoId === cat.id ? (
        <div className="flex flex-col gap-2 bg-blue-50 p-3 rounded">
          <input
            type="text"
            value={editandoNome}
            onChange={(e) => setEditandoNome(e.target.value)}
            placeholder="Nome da categoria"
            className="px-3 py-2 border rounded"
            autoFocus
          />
          <textarea
            value={editandoDescricao}
            onChange={(e) => setEditandoDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="px-3 py-2 border rounded resize-none"
            rows={2}
          />
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 block">
              Imagem da categoria (opcional)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleEditandoImagemChange}
              className="w-full px-3 py-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#DB1472] file:text-white hover:file:bg-[#DB1472]/90 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WebP ou GIF (máx. 5MB)
            </p>
          </label>
          {(editandoImagemPreview || editandoImagemAtual) && (
            <div className="relative w-full h-32 rounded overflow-hidden bg-gray-100">
              <img 
                src={editandoImagemPreview || editandoImagemAtual} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/400x200/e5e7eb/9ca3af?text=Imagem+Inválida';
                }}
              />
              {editandoImagemFile && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Nova imagem selecionada
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleEditar(cat.id)}
              disabled={uploadingImagem}
              className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex-1 disabled:opacity-50"
            >
              {uploadingImagem ? '⏳ Enviando...' : '✓ Salvar'}
            </button>
            <button
              onClick={() => {
                setEditandoId(null);
                setEditandoNome('');
                setEditandoDescricao('');
                setEditandoImagemFile(null);
                setEditandoImagemPreview('');
                setEditandoImagemAtual('');
              }}
              className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400"
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors">
          <div className="flex gap-3 flex-1">
            {/* Imagem da categoria */}
            {cat.imagem && (
              <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                <img 
                  src={cat.imagem} 
                  alt={cat.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <div className="font-medium text-gray-900">{cat.nome}</div>
              <div className="text-sm text-gray-500">Slug: {cat.slug}</div>
              {cat.descricao && (
                <div className="text-sm text-gray-600 mt-1">{cat.descricao}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditandoId(cat.id);
                setEditandoNome(cat.nome);
                setEditandoDescricao(cat.descricao || '');
                setEditandoImagemAtual(cat.imagem || '');
                setEditandoImagemPreview(cat.imagem || '');
                setEditandoImagemFile(null);
              }}
              className="px-3 py-1 bg-[#DB1472] text-white rounded text-xs hover:bg-[#DB1472]/90"
            >
              Editar
            </button>
            <button
              onClick={() => handleDeletar(cat.id)}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Deletar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!categoriaPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#DB1472] text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          <button
            className="text-white hover:bg-white/20 transition-colors px-4 py-2 rounded-lg"
            onClick={() => setCategoryPanelOpen(false)}
          >
            ✕ Fechar
          </button>
        </div>

        <div className="p-6">
          {/* Criar nova categoria */}
          <div className="mb-6 p-4 bg-[#F8B81F]/10 rounded-lg border border-[#F8B81F]/30">
            <h3 className="font-semibold mb-3 text-[#333]">Nova Categoria</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome da categoria (ex: Rasteirinhas)"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCriar()}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472]"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] resize-none"
                rows={2}
              />
              
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">
                  Imagem da categoria (opcional)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNovaImagemChange}
                  className="w-full px-3 py-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#DB1472] file:text-white hover:file:bg-[#DB1472]/90 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WebP ou GIF (máx. 5MB)
                </p>
              </label>

              {novaImagemPreview && (
                <div className="relative w-full h-32 rounded overflow-hidden bg-gray-100">
                  <img 
                    src={novaImagemPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x200/e5e7eb/9ca3af?text=Imagem+Inválida';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    ✓ Imagem selecionada
                  </div>
                </div>
              )}

              <button
                onClick={handleCriar}
                disabled={loading || uploadingImagem || !novaCategoria.trim()}
                className="w-full px-6 py-2 bg-[#DB1472] text-white rounded hover:bg-[#DB1472]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {uploadingImagem ? '⏳ Enviando imagem...' : loading ? 'Criando...' : 'Criar Categoria'}
              </button>
            </div>
          </div>

          {/* Lista de categorias */}
          <div className="space-y-2">
            <h3 className="font-semibold mb-3 text-[#333] flex items-center gap-2">
              Categorias Existentes ({Array.isArray(categorias) ? categorias.length : 0})
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#DB1472] border-t-transparent"></div>}
            </h3>
            
            {loading && categorias.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#DB1472] border-t-transparent mx-auto mb-2"></div>
                Carregando categorias...
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                Nenhuma categoria cadastrada ainda.
              </div>
            ) : (
              Array.isArray(categorias) && categorias.map((cat) => renderCategoria(cat))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
