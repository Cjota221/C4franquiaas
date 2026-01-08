"use client";
import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import Image from 'next/image';
import { Upload, Plus, Trash2, Save, Image as ImageIcon, Type, Palette, Settings } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

type LojaCustomizacao = {
  id: string;
  nome: string;
  dominio: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  banner_principal: string | null;
  banner_secundario: string | null;
  mensagens_regua: string[];
  icones_confianca: Array<{ icone: string; titulo: string; texto: string }>;
};

type CategoriaDestaque = {
  id?: string;
  nome: string;
  imagem: string;
  ordem: number;
};

export default function CustomizacaoLojaPage({ params }: { params: Promise<{ id: string }> }) {
  const [loja, setLoja] = useState<LojaCustomizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados para edição
  const [mensagensRegua, setMensagensRegua] = useState<string[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [iconesConfianca, setIconesConfianca] = useState<Array<{ icone: string; titulo: string; texto: string }>>([]);
  const [categoriasDestaque, setCategoriasDestaque] = useState<CategoriaDestaque[]>([]);

  useEffect(() => {
    async function init() {
      const { id } = await params;
      await loadLoja(id);
    }
    init();
  }, [params]);

  async function loadLoja(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/franqueadas/customizacao?franqueada_id=${id}`);
      if (!res.ok) throw new Error('Erro ao carregar loja');
      
      const data = await res.json();
      setLoja(data.loja);
      
      // Inicializar estados de edição
      setMensagensRegua(data.loja.mensagens_regua || ['Frete grátis acima de R$ 99', 'Parcele em até 6x sem juros', 'Cupom BEMVINDO10 - 10% OFF']);
      setIconesConfianca(data.loja.icones_confianca || [
        { icone: 'ShieldCheck', titulo: 'Compra Segura', texto: 'Ambiente protegido' },
        { icone: 'Truck', titulo: 'Entrega Rápida', texto: 'Receba em casa' },
        { icone: 'CreditCard', titulo: 'Parcele sem juros', texto: 'Em até 6x' }
      ]);
      setCategoriasDestaque(data.categorias || []);
    } catch (err) {
      console.error('Erro:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar dados da loja' });
    } finally {
      setLoading(false);
    }
  }

  async function salvarCustomizacao() {
    if (!loja) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/franqueadas/customizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loja_id: loja.id,
          mensagens_regua: mensagensRegua,
          icones_confianca: iconesConfianca,
          categorias_destaque: categoriasDestaque
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      toast.success('Customizacao salva com sucesso');
      setStatusMsg({ type: 'success', text: 'Customizacao salva com sucesso' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao salvar customizacao');
      setStatusMsg({ type: 'error', text: 'Erro ao salvar customizacao' });
    } finally {
      setSaving(false);
    }
  }

  function adicionarMensagem() {
    if (!novaMensagem.trim()) return;
    setMensagensRegua([...mensagensRegua, novaMensagem]);
    setNovaMensagem('');
  }

  function removerMensagem(index: number) {
    setMensagensRegua(mensagensRegua.filter((_, i) => i !== index));
  }

  function adicionarCategoria() {
    setCategoriasDestaque([
      ...categoriasDestaque,
      { nome: '', imagem: '', ordem: categoriasDestaque.length }
    ]);
  }

  function removerCategoria(index: number) {
    setCategoriasDestaque(categoriasDestaque.filter((_, i) => i !== index));
  }

  function atualizarCategoria(index: number, campo: keyof CategoriaDestaque, valor: string | number) {
    const novasCategorias = [...categoriasDestaque];
    novasCategorias[index] = { ...novasCategorias[index], [campo]: valor };
    setCategoriasDestaque(novasCategorias);
  }

  if (loading) {
    return (
      <PageWrapper title="Customizacao da Loja">
        <LoadingState message="Carregando configuracoes..." />
      </PageWrapper>
    );
  }

  if (!loja) {
    return (
      <PageWrapper title="Customizacao da Loja">
        <div className="text-center py-12">
          <p className="text-gray-600">Loja nao encontrada</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Customizacao da Loja">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Customizacao da Loja"
          subtitle={`${loja.nome} - ${loja.dominio}`}
          icon={Settings}
          actions={
            <button
              onClick={salvarCustomizacao}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
            >
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          }
        />

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-4 rounded-lg border ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* Cores da Loja */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={24} className="text-pink-600" />
            <h2 className="text-xl font-bold">Cores da Loja</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Primária
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={loja.cor_primaria}
                  onChange={(e) => setLoja({ ...loja, cor_primaria: e.target.value })}
                  className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={loja.cor_primaria}
                  onChange={(e) => setLoja({ ...loja, cor_primaria: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="#DB1472"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Secundária
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={loja.cor_secundaria}
                  onChange={(e) => setLoja({ ...loja, cor_secundaria: e.target.value })}
                  className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={loja.cor_secundaria}
                  onChange={(e) => setLoja({ ...loja, cor_secundaria: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="#F8B81F"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Regua de Anuncios */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Type size={24} className="text-pink-600" />
            <h2 className="text-xl font-bold">Regua de Anuncios (Topo)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Mensagens rotativas que aparecem no topo da loja. Rotacao automatica a cada 3 segundos.
          </p>
          
          <div className="space-y-3">
            {mensagensRegua.map((msg, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1">{msg}</span>
                <button
                  onClick={() => removerMensagem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && adicionarMensagem()}
              placeholder="Ex: Frete gratis acima de R$ 99"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={adicionarMensagem}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              <Plus size={20} />
            </button>
          </div>
        </Card>

        {/* Banners */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon size={24} className="text-pink-600" />
            <h2 className="text-xl font-bold">Banners da Homepage</h2>
          </div>
          
          <div className="space-y-6">
            {/* Banner Principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Principal (Hero) - Recomendado: 1920x1080px
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition cursor-pointer">
                <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Clique para fazer upload ou arraste a imagem</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                <input type="file" accept="image/*" className="hidden" />
              </div>
              {loja.banner_principal && (
                <div className="mt-3 relative h-40 rounded-lg overflow-hidden">
                  <Image 
                    src={loja.banner_principal} 
                    alt="Banner Principal" 
                    fill
                    className="object-cover" 
                  />
                </div>
              )}
            </div>

            {/* Banner Secundário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Secundário - Recomendado: 1920x720px
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition cursor-pointer">
                <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Clique para fazer upload ou arraste a imagem</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                <input type="file" accept="image/*" className="hidden" />
              </div>
              {loja.banner_secundario && (
                <div className="mt-3 relative h-32 rounded-lg overflow-hidden">
                  <Image 
                    src={loja.banner_secundario} 
                    alt="Banner Secundario" 
                    fill
                    className="object-cover" 
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Categorias em Destaque */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon size={24} className="text-pink-600" />
              <h2 className="text-xl font-bold">Categorias em Destaque (Stories)</h2>
            </div>
            <button
              onClick={adicionarCategoria}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              <Plus size={18} />
              Adicionar Categoria
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Categorias aparecerao em formato circular (stories) abaixo do banner. Recomendado: imagens quadradas 400x400px.
          </p>

          <div className="space-y-4">
            {categoriasDestaque.map((cat, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={cat.nome}
                    onChange={(e) => atualizarCategoria(index, 'nome', e.target.value)}
                    placeholder="Nome da categoria"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={cat.imagem}
                    onChange={(e) => atualizarCategoria(index, 'imagem', e.target.value)}
                    placeholder="URL da imagem"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={cat.ordem}
                      onChange={(e) => atualizarCategoria(index, 'ordem', parseInt(e.target.value))}
                      placeholder="Ordem"
                      className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => removerCategoria(index)}
                      className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {cat.imagem && (
                  <div className="mt-3 w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 relative">
                    <Image 
                      src={cat.imagem} 
                      alt={cat.nome} 
                      fill
                      className="object-cover" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Icones de Confianca */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon size={24} className="text-pink-600" />
            <h2 className="text-xl font-bold">Icones de Confianca</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Icones exibidos no rodape da homepage para transmitir confianca.
          </p>

          <div className="space-y-4">
            {iconesConfianca.map((icone, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={icone.titulo}
                    onChange={(e) => {
                      const novosIcones = [...iconesConfianca];
                      novosIcones[index].titulo = e.target.value;
                      setIconesConfianca(novosIcones);
                    }}
                    placeholder="Titulo"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={icone.texto}
                    onChange={(e) => {
                      const novosIcones = [...iconesConfianca];
                      novosIcones[index].texto = e.target.value;
                      setIconesConfianca(novosIcones);
                    }}
                    placeholder="Texto descritivo"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={icone.icone}
                    onChange={(e) => {
                      const novosIcones = [...iconesConfianca];
                      novosIcones[index].icone = e.target.value;
                      setIconesConfianca(novosIcones);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ShieldCheck">Compra Segura</option>
                    <option value="Truck">Entrega</option>
                    <option value="CreditCard">Pagamento</option>
                    <option value="Package">Embalagem</option>
                    <option value="Award">Qualidade</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Botao Salvar (rodape) */}
        <div className="flex justify-end">
          <button
            onClick={salvarCustomizacao}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 text-lg font-semibold"
          >
            <Save size={24} />
            {saving ? 'Salvando...' : 'Salvar Todas as Alteracoes'}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
