"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Plus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Package,
} from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  grouped: boolean;
}

interface ProductGroup {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco_base: string;
  imagens: UploadedImage[];
  variacoes: {
    imagem_id: string;
    cor: string;
    estoque: string;
  }[];
}

export default function CadastroMassaProdutosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagens, setImagens] = useState<UploadedImage[]>([]);
  const [grupos, setGrupos] = useState<ProductGroup[]>([]);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Upload de imagens
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const novasImagens: UploadedImage[] = files.map(file => ({
      id: `img-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      grouped: false,
    }));

    setImagens(prev => [...prev, ...novasImagens]);
    toast.success(`${files.length} imagem(ns) carregada(s)`);
  };

  // Criar novo grupo
  const criarNovoGrupo = () => {
    const novoGrupo: ProductGroup = {
      id: `grupo-${Date.now()}`,
      nome: '',
      codigo: '',
      descricao: '',
      preco_base: '',
      imagens: [],
      variacoes: [],
    };
    setGrupos(prev => [...prev, novoGrupo]);
  };

  // Drag & Drop handlers
  const handleDragStart = (imagemId: string) => {
    setDraggedImage(imagemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropInGroup = (grupoId: string) => {
    if (!draggedImage) return;

    const imagem = imagens.find(img => img.id === draggedImage);
    if (!imagem || imagem.grouped) return;

    // Atualizar grupo
    setGrupos(prev => prev.map(grupo => {
      if (grupo.id === grupoId) {
        return {
          ...grupo,
          imagens: [...grupo.imagens, imagem],
          variacoes: [
            ...grupo.variacoes,
            { imagem_id: imagem.id, cor: '', estoque: '0' }
          ],
        };
      }
      return grupo;
    }));

    // Marcar imagem como agrupada
    setImagens(prev => prev.map(img => 
      img.id === draggedImage ? { ...img, grouped: true } : img
    ));

    setDraggedImage(null);
  };

  // Remover imagem do grupo
  const removerImagemDoGrupo = (grupoId: string, imagemId: string) => {
    setGrupos(prev => prev.map(grupo => {
      if (grupo.id === grupoId) {
        return {
          ...grupo,
          imagens: grupo.imagens.filter(img => img.id !== imagemId),
          variacoes: grupo.variacoes.filter(v => v.imagem_id !== imagemId),
        };
      }
      return grupo;
    }));

    setImagens(prev => prev.map(img => 
      img.id === imagemId ? { ...img, grouped: false } : img
    ));
  };

  // Remover grupo
  const removerGrupo = (grupoId: string) => {
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    // Desagrupar todas as imagens
    setImagens(prev => prev.map(img => {
      if (grupo.imagens.some(gImg => gImg.id === img.id)) {
        return { ...img, grouped: false };
      }
      return img;
    }));

    setGrupos(prev => prev.filter(g => g.id !== grupoId));
  };

  // Atualizar dados do grupo
  const atualizarGrupo = (grupoId: string, campo: string, valor: string) => {
    setGrupos(prev => prev.map(grupo => 
      grupo.id === grupoId ? { ...grupo, [campo]: valor } : grupo
    ));
  };

  // Atualizar variação
  const atualizarVariacao = (grupoId: string, imagemId: string, campo: string, valor: string) => {
    setGrupos(prev => prev.map(grupo => {
      if (grupo.id === grupoId) {
        return {
          ...grupo,
          variacoes: grupo.variacoes.map(v => 
            v.imagem_id === imagemId ? { ...v, [campo]: valor } : v
          ),
        };
      }
      return grupo;
    }));
  };

  // Salvar todos os produtos
  const salvarProdutos = async () => {
    // Validação
    const gruposValidos = grupos.filter(g => g.nome && g.preco_base && g.imagens.length > 0);
    
    if (gruposValidos.length === 0) {
      toast.error('Crie pelo menos um produto com nome, preço e imagens');
      return;
    }

    setSaving(true);

    try {
      for (const grupo of gruposValidos) {
        // Upload das imagens para o Supabase Storage
        const imagensUpload = await Promise.all(
          grupo.imagens.map(async (img) => {
            const formData = new FormData();
            formData.append('file', img.file);
            
            const response = await fetch('/api/admin/grade-fechada/produtos/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) throw new Error('Erro ao fazer upload da imagem');
            
            const data = await response.json();
            return data.url;
          })
        );

        // Criar produto com variações
        const produtoData = {
          nome: grupo.nome,
          codigo: grupo.codigo,
          descricao: grupo.descricao,
          preco_base: parseFloat(grupo.preco_base),
          ativo: true,
          variacoes: grupo.variacoes.map((v, index) => ({
            imagem_url: imagensUpload[index],
            cor: v.cor,
            estoque: parseInt(v.estoque) || 0,
          })),
        };

        const response = await fetch('/api/admin/grade-fechada/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(produtoData),
        });

        if (!response.ok) throw new Error(`Erro ao salvar produto ${grupo.nome}`);
      }

      toast.success(`${gruposValidos.length} produto(s) cadastrado(s) com sucesso!`);
      router.push('/grade-fechada/produtos');
      
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      toast.error('Erro ao salvar produtos. Verifique o console.');
    } finally {
      setSaving(false);
    }
  };

  const imagensNaoAgrupadas = imagens.filter(img => !img.grouped);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cadastro em Massa</h1>
            <p className="text-sm text-gray-600">Arraste imagens da esquerda para os grupos da direita</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Carregar Imagens
          </Button>
          <Button onClick={criarNovoGrupo} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Novo Grupo
          </Button>
          <Button onClick={salvarProdutos} disabled={saving || grupos.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Layout 2 Colunas: Imagens | Grupos */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: Imagens Disponíveis */}
        <div className="col-span-4">
          <Card className="p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-pink-600" />
                Imagens ({imagensNaoAgrupadas.length})
              </h2>
            </div>

            {/* Grid de imagens não agrupadas - com scroll */}
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                {imagensNaoAgrupadas.map(imagem => (
                  <div
                    key={imagem.id}
                    draggable
                    onDragStart={() => handleDragStart(imagem.id)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-pink-500 cursor-move transition-all hover:scale-105 shadow-sm"
                  >
                    <Image
                      src={imagem.preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => setImagens(prev => prev.filter(img => img.id !== imagem.id))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {imagensNaoAgrupadas.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">Nenhuma imagem disponível</p>
                  <p className="text-xs mt-1">Carregue imagens para começar</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA: Grupos de Produtos */}
        <div className="col-span-8">
          <div className="space-y-6">
        {grupos.map((grupo, index) => (
          <Card key={grupo.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-pink-600" />
                <h3 className="text-lg font-semibold">Produto {index + 1}</h3>
                {grupo.imagens.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({grupo.imagens.length} variação{grupo.imagens.length > 1 ? 'ões' : ''})
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removerGrupo(grupo.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Formulário do Produto */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <Input
                  value={grupo.nome}
                  onChange={(e) => atualizarGrupo(grupo.id, 'nome', e.target.value)}
                  placeholder="Ex: Rasteirinha Mel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <Input
                  value={grupo.codigo}
                  onChange={(e) => atualizarGrupo(grupo.id, 'codigo', e.target.value)}
                  placeholder="Ex: RAST-MEL-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Base *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={grupo.preco_base}
                  onChange={(e) => atualizarGrupo(grupo.id, 'preco_base', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <Textarea
                  value={grupo.descricao}
                  onChange={(e) => atualizarGrupo(grupo.id, 'descricao', e.target.value)}
                  placeholder="Descrição do produto"
                  rows={1}
                />
              </div>
            </div>

            {/* Área de Variações */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Variações do Produto
              </h4>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDropInGroup(grupo.id)}
                className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
                  draggedImage ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {grupo.imagens.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-medium">Arraste imagens aqui</p>
                    <p className="text-xs mt-1">Cada imagem será uma variação (cor) do produto</p>
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    <Plus className="h-5 w-5 mx-auto mb-1" />
                    <p>Arraste mais imagens para adicionar variações</p>
                  </div>
                )}
              </div>

              {/* Grid de Variações */}
              {grupo.imagens.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
                  {grupo.imagens.map((imagem, imgIndex) => {
                    const variacao = grupo.variacoes.find(v => v.imagem_id === imagem.id);
                    return (
                      <div key={imagem.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-pink-400 transition-all">
                        {/* Imagem */}
                        <div className="relative aspect-square">
                          <Image
                            src={imagem.preview}
                            alt={`Variação ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            onClick={() => removerImagemDoGrupo(grupo.id, imagem.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-all hover:scale-110"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-semibold p-2">
                            Variação {imgIndex + 1}
                          </div>
                        </div>
                        
                        {/* Inputs da Variação */}
                        <div className="p-3 space-y-2 bg-gray-50">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Cor *
                            </label>
                            <Input
                              placeholder="Ex: Dourado"
                              value={variacao?.cor || ''}
                              onChange={(e) => atualizarVariacao(grupo.id, imagem.id, 'cor', e.target.value)}
                              className="text-sm h-9"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Estoque
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={variacao?.estoque || '0'}
                              onChange={(e) => atualizarVariacao(grupo.id, imagem.id, 'estoque', e.target.value)}
                              className="text-sm h-9"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}

            {grupos.length === 0 && (
              <Card className="p-12 text-center text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg mb-2">Nenhum grupo criado</p>
                <p className="text-sm mb-4">Clique em &quot;Novo Grupo&quot; para começar</p>
                <Button onClick={criarNovoGrupo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
