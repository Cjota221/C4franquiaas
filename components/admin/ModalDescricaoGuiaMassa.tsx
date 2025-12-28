"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Save, 
  FileText, 
  Ruler, 
  Plus, 
  Trash2, 
  Upload, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  Search,
  Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Estrutura para calçados
type MedidaCalcado = {
  tamanho: string;      // 34, 35, 36...
  centimetros: string;  // 22, 22.5, 23...
};

type SizeGuideCalcado = {
  image_url?: string;           // Ilustração de como medir
  instrucoes?: string;          // Texto explicativo de como medir
  measurements?: MedidaCalcado[];
};

type Produto = {
  id: string;
  nome: string;
  imagem?: string;
  description?: string;
  size_guide?: SizeGuideCalcado | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  produtos: Produto[];
  onSave?: () => void;
};

// Tamanhos padrão para calçados femininos
const TAMANHOS_PADRAO: MedidaCalcado[] = [
  { tamanho: '33', centimetros: '21.5' },
  { tamanho: '34', centimetros: '22' },
  { tamanho: '35', centimetros: '22.5' },
  { tamanho: '36', centimetros: '23' },
  { tamanho: '37', centimetros: '23.5' },
  { tamanho: '38', centimetros: '24' },
  { tamanho: '39', centimetros: '24.5' },
  { tamanho: '40', centimetros: '25' },
  { tamanho: '41', centimetros: '25.5' },
  { tamanho: '42', centimetros: '26' },
];

const INSTRUCOES_PADRAO = `📏 Como medir seu pé corretamente:

1. Coloque uma folha de papel no chão, encostada na parede
2. Pise na folha com o calcanhar encostado na parede
3. Marque o ponto mais longo do seu pé (geralmente o dedão)
4. Meça a distância da parede até a marca em centímetros
5. Compare com nossa tabela de medidas

💡 Dica: Meça seus pés no final do dia, quando estão mais inchados.`;

export default function ModalDescricaoGuiaMassa({
  isOpen,
  onClose,
  produtos,
  onSave,
}: Props) {
  const supabase = createClient();
  
  // Abas
  const [activeTab, setActiveTab] = useState<'descricao' | 'guia'>('descricao');
  
  // Seleção de produtos
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  
  // Descrição
  const [descricao, setDescricao] = useState('');
  
  // Guia de Tamanhos (estrutura para calçados)
  const [guiaImagem, setGuiaImagem] = useState('');
  const [instrucoes, setInstrucoes] = useState(INSTRUCOES_PADRAO);
  const [medidas, setMedidas] = useState<MedidaCalcado[]>(TAMANHOS_PADRAO);
  
  // Estados de controle
  const [salvando, setSalvando] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Produtos filtrados pela busca
  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Reset quando abrir modal
  useEffect(() => {
    if (isOpen) {
      setProdutosSelecionados(new Set());
      setBusca('');
      setDescricao('');
      setGuiaImagem('');
      setInstrucoes(INSTRUCOES_PADRAO);
      setMedidas(TAMANHOS_PADRAO);
      setMensagem(null);
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Toggle seleção de produto
  const toggleProduto = (id: string) => {
    const novos = new Set(produtosSelecionados);
    if (novos.has(id)) {
      novos.delete(id);
    } else {
      novos.add(id);
    }
    setProdutosSelecionados(novos);
  };

  // Selecionar/deselecionar todos
  const toggleTodos = () => {
    if (produtosSelecionados.size === produtosFiltrados.length) {
      setProdutosSelecionados(new Set());
    } else {
      setProdutosSelecionados(new Set(produtosFiltrados.map(p => p.id)));
    }
  };

  // Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `guia-tamanhos-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName);

      setGuiaImagem(urlData.publicUrl);
    } catch (err) {
      console.error('Erro upload:', err);
      setMensagem({ tipo: 'erro', texto: 'Erro ao fazer upload da imagem' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Adicionar tamanho
  const adicionarTamanho = () => {
    setMedidas([...medidas, { tamanho: '', centimetros: '' }]);
  };

  // Remover tamanho
  const removerTamanho = (index: number) => {
    setMedidas(medidas.filter((_, i) => i !== index));
  };

  // Atualizar medida
  const atualizarMedida = (index: number, campo: keyof MedidaCalcado, valor: string) => {
    const novas = [...medidas];
    novas[index] = { ...novas[index], [campo]: valor };
    setMedidas(novas);
  };

  // Salvar em massa
  const salvar = async () => {
    if (produtosSelecionados.size === 0) {
      setMensagem({ tipo: 'erro', texto: 'Selecione pelo menos um produto' });
      return;
    }

    setSalvando(true);
    setMensagem(null);

    try {
      const updates: Record<string, unknown> = {};

      // Só atualiza campos que foram preenchidos
      if (activeTab === 'descricao' && descricao.trim()) {
        updates.description = descricao.trim();
      }

      if (activeTab === 'guia') {
        // Filtrar medidas vazias
        const medidasFiltradas = medidas.filter(m => m.tamanho && m.centimetros);
        
        if (medidasFiltradas.length > 0 || guiaImagem || instrucoes.trim()) {
          updates.size_guide = {
            image_url: guiaImagem || null,
            instrucoes: instrucoes.trim() || null,
            measurements: medidasFiltradas.length > 0 ? medidasFiltradas : null,
          };
        }
      }

      if (Object.keys(updates).length === 0) {
        setMensagem({ tipo: 'erro', texto: 'Preencha pelo menos um campo' });
        setSalvando(false);
        return;
      }

      // Atualizar todos os produtos selecionados
      const ids = Array.from(produtosSelecionados);
      
      const { error } = await supabase
        .from('produtos')
        .update(updates)
        .in('id', ids);

      if (error) throw error;

      setMensagem({ 
        tipo: 'sucesso', 
        texto: `${ids.length} produto(s) atualizado(s) com sucesso!` 
      });

      // Callback
      if (onSave) {
        setTimeout(() => {
          onSave();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              Edição em Massa - Descrição e Guia de Tamanhos
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-1 overflow-hidden">
          {/* Lado esquerdo - Seleção de produtos */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-3 border-b bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button
                onClick={toggleTodos}
                className="mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                {produtosSelecionados.size === produtosFiltrados.length 
                  ? 'Desmarcar todos' 
                  : 'Selecionar todos'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                {produtosSelecionados.size} de {produtosFiltrados.length} selecionados
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  onClick={() => toggleProduto(produto.id)}
                  className={`flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    produtosSelecionados.has(produto.id) ? 'bg-pink-50' : ''
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    produtosSelecionados.has(produto.id) 
                      ? 'bg-pink-500 border-pink-500' 
                      : 'border-gray-300'
                  }`}>
                    {produtosSelecionados.has(produto.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {produto.imagem && (
                    <Image
                      src={produto.imagem}
                      alt={produto.nome}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  )}
                  <span className="text-sm truncate flex-1">{produto.nome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lado direito - Formulário */}
          <div className="flex-1 flex flex-col">
            {/* Abas */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('descricao')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === 'descricao'
                    ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Descrição
              </button>
              <button
                onClick={() => setActiveTab('guia')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === 'guia'
                    ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Ruler className="w-4 h-4" />
                Guia de Tamanhos
              </button>
            </div>

            {/* Conteúdo das abas */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'descricao' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Produto
                    </label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Digite a descrição que será aplicada aos produtos selecionados..."
                      className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Esta descrição será aplicada a todos os {produtosSelecionados.size} produtos selecionados.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ilustração */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📐 Ilustração de Como Medir
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {guiaImagem ? (
                        <div className="relative inline-block">
                          <Image
                            src={guiaImagem}
                            alt="Guia de medidas"
                            width={300}
                            height={200}
                            className="rounded-lg"
                          />
                          <button
                            onClick={() => setGuiaImagem('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2 py-4">
                            {uploadingImage ? (
                              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Clique para fazer upload da ilustração
                                </span>
                                <span className="text-xs text-gray-400">
                                  Recomendado: imagem mostrando como medir o pé/solado
                                </span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Instruções */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Instruções de Como Medir
                    </label>
                    <textarea
                      value={instrucoes}
                      onChange={(e) => setInstrucoes(e.target.value)}
                      placeholder="Explique como o cliente deve medir o pé..."
                      className="w-full h-40 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                    />
                  </div>

                  {/* Tabela de Medidas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        👟 Tabela de Medidas (Calçados)
                      </label>
                      <button
                        onClick={adicionarTamanho}
                        className="flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar tamanho
                      </button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Tamanho (Numeração)
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Comprimento (cm)
                            </th>
                            <th className="px-4 py-2 w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {medidas.map((medida, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={medida.tamanho}
                                  onChange={(e) => atualizarMedida(index, 'tamanho', e.target.value)}
                                  placeholder="Ex: 36"
                                  className="w-full px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={medida.centimetros}
                                  onChange={(e) => atualizarMedida(index, 'centimetros', e.target.value)}
                                  placeholder="Ex: 23"
                                  className="w-full px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => removerTamanho(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagem */}
            {mensagem && (
              <div className={`mx-4 mb-2 p-3 rounded-lg flex items-center gap-2 ${
                mensagem.tipo === 'sucesso' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {mensagem.tipo === 'sucesso' 
                  ? <CheckCircle className="w-5 h-5" />
                  : <AlertCircle className="w-5 h-5" />
                }
                <span className="text-sm">{mensagem.texto}</span>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {produtosSelecionados.size} produto(s) selecionado(s)
              </span>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando || produtosSelecionados.size === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Aplicar em {produtosSelecionados.size} Produto(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
