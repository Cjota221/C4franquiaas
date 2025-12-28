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
  CheckCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Medida = {
  size: string;
  busto?: string;
  cintura?: string;
  quadril?: string;
  comprimento?: string;
  [key: string]: string | undefined;
};

type SizeGuide = {
  image_url?: string;
  measurements?: Medida[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  initialDescription?: string;
  initialSizeGuide?: SizeGuide | null;
  onSave?: () => void;
};

export default function ModalDescricaoGuia({
  isOpen,
  onClose,
  productId,
  productName,
  initialDescription = '',
  initialSizeGuide = null,
  onSave,
}: Props) {
  const supabase = createClient();
  
  // Abas
  const [activeTab, setActiveTab] = useState<'descricao' | 'guia'>('descricao');
  
  // Descrição
  const [descricao, setDescricao] = useState(initialDescription);
  
  // Guia de Tamanhos
  const [guiaImagem, setGuiaImagem] = useState(initialSizeGuide?.image_url || '');
  const [medidas, setMedidas] = useState<Medida[]>(
    initialSizeGuide?.measurements || [
      { size: 'P', busto: '', cintura: '', quadril: '', comprimento: '' },
      { size: 'M', busto: '', cintura: '', quadril: '', comprimento: '' },
      { size: 'G', busto: '', cintura: '', quadril: '', comprimento: '' },
      { size: 'GG', busto: '', cintura: '', quadril: '', comprimento: '' },
    ]
  );
  
  // Estados de controle
  const [salvando, setSalvando] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Reset quando abrir modal
  useEffect(() => {
    if (isOpen) {
      setDescricao(initialDescription || '');
      setGuiaImagem(initialSizeGuide?.image_url || '');
      setMedidas(
        initialSizeGuide?.measurements || [
          { size: 'P', busto: '', cintura: '', quadril: '', comprimento: '' },
          { size: 'M', busto: '', cintura: '', quadril: '', comprimento: '' },
          { size: 'G', busto: '', cintura: '', quadril: '', comprimento: '' },
          { size: 'GG', busto: '', cintura: '', quadril: '', comprimento: '' },
        ]
      );
      setMensagem(null);
    }
  }, [isOpen, initialDescription, initialSizeGuide]);

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Upload de imagem do guia
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileName = `guia-tamanhos/guia-${productId}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('reseller-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        // Se o bucket não existe, tentar criar
        if (error.message.includes('not found')) {
          setMensagem({ 
            tipo: 'erro', 
            texto: 'Bucket de armazenamento não encontrado. Configure o Supabase Storage.' 
          });
          return;
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('reseller-assets')
        .getPublicUrl(data.path);

      setGuiaImagem(publicUrl);
      setMensagem({ tipo: 'sucesso', texto: 'Imagem enviada com sucesso!' });
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      setMensagem({ tipo: 'erro', texto: 'Erro ao enviar imagem' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Adicionar nova linha de medidas
  const adicionarMedida = () => {
    setMedidas([...medidas, { size: '', busto: '', cintura: '', quadril: '', comprimento: '' }]);
  };

  // Remover linha de medidas
  const removerMedida = (index: number) => {
    setMedidas(medidas.filter((_, i) => i !== index));
  };

  // Atualizar medida
  const atualizarMedida = (index: number, campo: string, valor: string) => {
    const novasMedidas = [...medidas];
    novasMedidas[index] = { ...novasMedidas[index], [campo]: valor };
    setMedidas(novasMedidas);
  };

  // Salvar
  const handleSalvar = async () => {
    setSalvando(true);
    setMensagem(null);

    try {
      // Construir size_guide JSON
      const sizeGuide: SizeGuide = {};
      
      if (guiaImagem) {
        sizeGuide.image_url = guiaImagem;
      }
      
      // Filtrar medidas vazias
      const medidasFiltradas = medidas.filter(m => m.size.trim() !== '');
      if (medidasFiltradas.length > 0) {
        sizeGuide.measurements = medidasFiltradas;
      }

      // Atualizar produto
      const { error } = await supabase
        .from('produtos')
        .update({
          description: descricao || null,
          size_guide: Object.keys(sizeGuide).length > 0 ? sizeGuide : null,
        })
        .eq('id', productId);

      if (error) throw error;

      setMensagem({ tipo: 'sucesso', texto: 'Salvo com sucesso!' });
      
      if (onSave) {
        setTimeout(() => {
          onSave();
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar alterações' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Descrição & Guia de Tamanhos</h2>
            <p className="text-sm text-gray-500 truncate max-w-md">{productName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('descricao')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'descricao'
                ? 'text-pink-600 border-b-2 border-pink-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Descrição
          </button>
          <button
            onClick={() => setActiveTab('guia')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'guia'
                ? 'text-pink-600 border-b-2 border-pink-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Ruler className="w-5 h-5" />
            Guia de Tamanhos
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {/* Mensagem de feedback */}
          {mensagem && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
              mensagem.tipo === 'sucesso' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {mensagem.tipo === 'sucesso' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              {mensagem.texto}
            </div>
          )}

          {/* Tab Descrição */}
          {activeTab === 'descricao' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Produto
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Esta descrição aparecerá na página do produto no catálogo da revendedora.
              </p>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o produto: material, características, benefícios, cuidados..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
              <p className="mt-2 text-xs text-gray-400 text-right">
                {descricao.length} caracteres
              </p>
            </div>
          )}

          {/* Tab Guia de Tamanhos */}
          {activeTab === 'guia' && (
            <div className="space-y-6">
              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Guia de Tamanhos (opcional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Você pode adicionar uma imagem com as medidas do produto.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors">
                  {guiaImagem ? (
                    <div className="relative">
                      <div className="relative w-full h-48 mb-3">
                        <Image
                          src={guiaImagem}
                          alt="Guia de tamanhos"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <button
                        onClick={() => setGuiaImagem('')}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remover imagem
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-2" />
                          <span className="text-sm text-gray-500">Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Clique para enviar uma imagem</span>
                          <span className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Tabela de Medidas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tabela de Medidas (opcional)
                  </label>
                  <button
                    onClick={adicionarMedida}
                    className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar tamanho
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Adicione as medidas em centímetros (ex: 88-92).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          Tamanho
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          Busto
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          Cintura
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          Quadril
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                          Comprimento
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border w-10">
                          
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {medidas.map((medida, index) => (
                        <tr key={index}>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={medida.size}
                              onChange={(e) => atualizarMedida(index, 'size', e.target.value)}
                              placeholder="P, M, G..."
                              className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={medida.busto || ''}
                              onChange={(e) => atualizarMedida(index, 'busto', e.target.value)}
                              placeholder="88-92"
                              className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={medida.cintura || ''}
                              onChange={(e) => atualizarMedida(index, 'cintura', e.target.value)}
                              placeholder="68-72"
                              className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={medida.quadril || ''}
                              onChange={(e) => atualizarMedida(index, 'quadril', e.target.value)}
                              placeholder="94-98"
                              className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={medida.comprimento || ''}
                              onChange={(e) => atualizarMedida(index, 'comprimento', e.target.value)}
                              placeholder="100"
                              className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-pink-500 rounded"
                            />
                          </td>
                          <td className="border p-1 text-center">
                            <button
                              onClick={() => removerMedida(index)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Remover"
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
