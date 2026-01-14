"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import Image from 'next/image';
import type { GradeFechadaProduto, GradeFechadaProdutoInput } from '@/types/grade-fechada';

export default function ProdutoFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState<GradeFechadaProdutoInput>({
    nome: '',
    codigo_interno: '',
    descricao: '',
    imagens: [],
    preco_meia_grade: 0,
    preco_grade_completa: 0,
    permite_meia_grade: true,
    permite_grade_completa: true,
    cores_disponiveis: [],
    peso_por_grade: 0,
    comprimento: 0,
    largura: 0,
    altura: 0,
    observacoes: '',
    aceita_personalizacao: false,
    ativo: true,
    ordem: 0,
  });

  const [novaCor, setNovaCor] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchProduto();
    }
  }, [isEdit]);

  const fetchProduto = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/grade-fechada/produtos/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setFormData(data.data);
      } else {
        toast.error('Erro ao carregar produto');
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Aqui você implementaria o upload para o Supabase Storage
        // Por enquanto, vamos usar um placeholder
        const formData = new FormData();
        formData.append('file', file);
        
        // Simulação - na implementação real, fazer upload para Supabase
        // const url = await uploadToSupabase(file);
        const url = URL.createObjectURL(file);
        uploadedUrls.push(url);
      }

      setFormData(prev => ({
        ...prev,
        imagens: [...(prev.imagens || []), ...uploadedUrls]
      }));

      toast.success(`${files.length} imagem(ns) adicionada(s)`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens?.filter((_, i) => i !== index)
    }));
  };

  const handleAddCor = () => {
    if (!novaCor.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      cores_disponiveis: [...(prev.cores_disponiveis || []), novaCor.trim()]
    }));
    setNovaCor('');
  };

  const handleRemoveCor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cores_disponiveis: prev.cores_disponiveis?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    setSaving(true);

    try {
      const url = isEdit
        ? `/api/admin/grade-fechada/produtos/${params.id}`
        : `/api/admin/grade-fechada/produtos`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Produto ${isEdit ? 'atualizado' : 'criado'} com sucesso`);
        router.push('/admin/encomendas/produtos');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <PageHeader
            title={isEdit ? 'Editar Produto' : 'Novo Produto'}
            description="Preencha as informações do produto de grade fechada"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Código Interno
                </label>
                <input
                  type="text"
                  value={formData.codigo_interno}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_interno: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Ex: Aceita personalização com logomarca"
                />
              </div>
            </div>
          </Card>

          {/* Imagens */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Imagens do Produto</h3>
            
            <div className="mb-4">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-500 transition">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-1">
                    Clique para fazer upload ou arraste imagens aqui
                  </p>
                  <p className="text-sm text-gray-400">
                    PNG, JPG ou WebP (máx. 5MB cada)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImages}
                />
              </label>
            </div>

            {formData.imagens && formData.imagens.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.imagens.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={url}
                        alt={`Imagem ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Preços e Grades */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Preços e Tipos de Grade</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.permite_meia_grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, permite_meia_grade: e.target.checked }))}
                  className="w-5 h-5"
                />
                <label className="font-medium">Permite Meia Grade</label>
              </div>

              {formData.permite_meia_grade && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço por Meia Grade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco_meia_grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, preco_meia_grade: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.permite_grade_completa}
                  onChange={(e) => setFormData(prev => ({ ...prev, permite_grade_completa: e.target.checked }))}
                  className="w-5 h-5"
                />
                <label className="font-medium">Permite Grade Completa</label>
              </div>

              {formData.permite_grade_completa && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço por Grade Completa (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.preco_grade_completa}
                    onChange={(e) => setFormData(prev => ({ ...prev, preco_grade_completa: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Cores Disponíveis */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Cores Disponíveis</h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={novaCor}
                onChange={(e) => setNovaCor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCor())}
                placeholder="Digite uma cor e pressione Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
              <Button type="button" onClick={handleAddCor}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {formData.cores_disponiveis && formData.cores_disponiveis.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.cores_disponiveis.map((cor, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {cor}
                    <button
                      type="button"
                      onClick={() => handleRemoveCor(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Dimensões e Peso */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Dimensões e Peso (por grade)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Peso (g)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.peso_por_grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, peso_por_grade: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comprimento (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comprimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, comprimento: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Largura (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.largura}
                  onChange={(e) => setFormData(prev => ({ ...prev, largura: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.altura}
                  onChange={(e) => setFormData(prev => ({ ...prev, altura: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </Card>

          {/* Opções */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Opções</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.aceita_personalizacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, aceita_personalizacao: e.target.checked }))}
                  className="w-5 h-5"
                />
                <label className="font-medium">
                  Aceita personalização/logomarca
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="w-5 h-5"
                />
                <label className="font-medium">
                  Produto ativo (visível no site)
                </label>
              </div>
            </div>
          </Card>

          {/* Botões de ação */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEdit ? 'Atualizar' : 'Criar'} Produto
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
