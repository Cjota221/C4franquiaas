"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  Check,
  RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Estrutura para calçados
type MedidaCalcado = {
  tamanho: string;
  centimetros: string;
};

type SizeGuideCalcado = {
  image_url?: string;
  instrucoes?: string;
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
  onSave,
}: Props) {
  const supabase = createClient();
  
  // Produtos carregados do banco
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [totalProdutos, setTotalProdutos] = useState(0);
  
  // Abas
  const [activeTab, setActiveTab] = useState<'descricao' | 'guia'>('descricao');
  
  // Seleção de produtos
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  
  // Descrição
  const [descricao, setDescricao] = useState('');
  
  // Guia de Tamanhos
  const [guiaImagem, setGuiaImagem] = useState('');
  const [instrucoes, setInstrucoes] = useState(INSTRUCOES_PADRAO);
  const [medidas, setMedidas] = useState<MedidaCalcado[]>(TAMANHOS_PADRAO);
  
  // Estados de controle
  const [salvando, setSalvando] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Carregar TODOS os produtos do banco
  const carregarTodosProdutos = useCallback(async () => {
    setCarregandoProdutos(true);
    try {
      // Primeiro, buscar contagem total
      const { count } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true });
      
      setTotalProdutos(count || 0);
      
      // Buscar todos os produtos (até 1000)
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, imagem, description, size_guide')
        .order('nome', { ascending: true })
        .limit(1000);
      
      if (error) throw error;
      
      setTodosProdutos(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar produtos' });
    } finally {
      setCarregandoProdutos(false);
    }
  }, [supabase]);

  // Carregar produtos quando abrir modal
  useEffect(() => {
    if (isOpen) {
      carregarTodosProdutos();
      setProdutosSelecionados(new Set());
      setBusca('');
      setDescricao('');
      setGuiaImagem('');
      setInstrucoes(INSTRUCOES_PADRAO);
      setMedidas(TAMANHOS_PADRAO);
      setMensagem(null);
    }
  }, [isOpen, carregarTodosProdutos]);

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Produtos filtrados pela busca
  const produtosFiltrados = todosProdutos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

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

  // Selecionar/deselecionar todos os filtrados
  const toggleTodos = () => {
    if (produtosSelecionados.size === produtosFiltrados.length && produtosFiltrados.length > 0) {
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
      const fileName = `guia-tamanhos/guia-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('reseller-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('reseller-assets')
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
      const ids = Array.from(produtosSelecionados);
      
      // Preparar updates baseado na aba ativa
      if (activeTab === 'descricao') {
        if (!descricao.trim()) {
          setMensagem({ tipo: 'erro', texto: 'Digite uma descrição' });
          setSalvando(false);
          return;
        }
        
        const { error } = await supabase
          .from('produtos')
          .update({ description: descricao.trim() })
          .in('id', ids);
        
        if (error) throw error;
      } else {
        // Guia de tamanhos
        const medidasFiltradas = medidas.filter(m => m.tamanho && m.centimetros);
        
        const sizeGuide: SizeGuideCalcado = {
          image_url: guiaImagem || undefined,
          instrucoes: instrucoes.trim() || undefined,
          measurements: medidasFiltradas.length > 0 ? medidasFiltradas : undefined,
        };
        
        const { error } = await supabase
          .from('produtos')
          .update({ size_guide: sizeGuide })
          .in('id', ids);
        
        if (error) throw error;
      }

      setMensagem({ 
        tipo: 'sucesso', 
        texto: `✅ ${ids.length} produto(s) atualizado(s) com sucesso!` 
      });

      // Callback e fechar
      setTimeout(() => {
        if (onSave) onSave();
        onClose();
      }, 1500);
      
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              Edição em Massa - Descrição e Guia de Tamanhos
            </h2>
            <span className="text-white/70 text-sm">
              ({totalProdutos} produtos no total)
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-1 overflow-hidden">
          {/* Lado esquerdo - Seleção de produtos */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-3 border-b bg-gray-50">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleTodos}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  {produtosSelecionados.size === produtosFiltrados.length && produtosFiltrados.length > 0
                    ? 'Desmarcar todos' 
                    : `Selecionar todos (${produtosFiltrados.length})`
                  }
                </button>
                <button
                  onClick={carregarTodosProdutos}
                  disabled={carregandoProdutos}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${carregandoProdutos ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>
            
            {/* Lista de produtos */}
            <div className="flex-1 overflow-y-auto">
              {carregandoProdutos ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {busca ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </div>
              ) : (
                produtosFiltrados.map(produto => (
                  <div
                    key={produto.id}
                    onClick={() => toggleProduto(produto.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b ${
                      produtosSelecionados.has(produto.id)
                        ? 'bg-pink-50 border-pink-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      produtosSelecionados.has(produto.id)
                        ? 'bg-pink-500 border-pink-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {produtosSelecionados.has(produto.id) && <Check className="w-3 h-3" />}
                    </div>
                    
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                      {produto.imagem ? (
                        <Image
                          src={produto.imagem}
                          alt={produto.nome}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {produto.nome}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {produto.description && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            Descrição ✓
                          </span>
                        )}
                        {produto.size_guide && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Guia ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Rodapé seleção */}
            <div className="p-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-pink-600">{produtosSelecionados.size}</span> produto(s) selecionado(s)
              </div>
            </div>
          </div>
          
          {/* Lado direito - Edição */}
          <div className="flex-1 flex flex-col">
            {/* Abas */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('descricao')}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
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
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
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
                      rows={12}
                      placeholder="Digite a descrição que será aplicada a todos os produtos selecionados..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta descrição será aplicada a todos os produtos selecionados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Imagem ilustrativa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagem Ilustrativa (opcional)
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                        {guiaImagem ? (
                          <Image src={guiaImagem} alt="Guia" width={128} height={128} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-gray-400 text-xs text-center px-2">Sem imagem</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 px-3 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200 transition-colors">
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            Upload
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        {guiaImagem && (
                          <button
                            onClick={() => setGuiaImagem('')}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remover imagem
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Instruções */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instruções de Como Medir
                    </label>
                    <textarea
                      value={instrucoes}
                      onChange={(e) => setInstrucoes(e.target.value)}
                      rows={6}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none text-sm"
                    />
                  </div>
                  
                  {/* Tabela de medidas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Tabela de Medidas (Calçados)
                      </label>
                      <button
                        onClick={adicionarTamanho}
                        className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Tamanho
                      </button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nº</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Centímetros</th>
                            <th className="px-4 py-2 w-10"></th>
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
                                  placeholder="34"
                                  className="w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-pink-500"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={medida.centimetros}
                                  onChange={(e) => atualizarMedida(index, 'centimetros', e.target.value)}
                                  placeholder="22"
                                  className="w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-pink-500"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <button
                                  onClick={() => removerTamanho(index)}
                                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
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
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {mensagem.tipo === 'sucesso' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{mensagem.texto}</span>
              </div>
            )}
            
            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || produtosSelecionados.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Aplicar a {produtosSelecionados.size} produto(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
