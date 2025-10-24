"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Image as ImageIcon, Ruler, Palette, Square, Sparkles } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LogoConfig {
  logo_largura_max: number;
  logo_altura_max: number;
  logo_padding: number;
  logo_fundo_tipo: 'transparente' | 'solido' | 'redondo';
  logo_fundo_cor: string | null;
  logo_border_radius: number;
  logo_mostrar_sombra: boolean;
}

export default function CustomizacoesLogo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [config, setConfig] = useState<LogoConfig>({
    logo_largura_max: 280,
    logo_altura_max: 80,
    logo_padding: 0,
    logo_fundo_tipo: 'transparente',
    logo_fundo_cor: null,
    logo_border_radius: 0,
    logo_mostrar_sombra: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      const { data: loja } = await supabase
        .from('lojas')
        .select('*')
        .eq('franqueada_id', franqueada.id)
        .single();

      if (loja) {
        setConfig({
          logo_largura_max: loja.logo_largura_max || 280,
          logo_altura_max: loja.logo_altura_max || 80,
          logo_padding: loja.logo_padding || 0,
          logo_fundo_tipo: loja.logo_fundo_tipo || 'transparente',
          logo_fundo_cor: loja.logo_fundo_cor || '#FFFFFF',
          logo_border_radius: loja.logo_border_radius || 0,
          logo_mostrar_sombra: loja.logo_mostrar_sombra ?? false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) throw new Error('Franqueada não encontrada');

      const { error } = await supabase
        .from('lojas')
        .update({
          logo_largura_max: config.logo_largura_max,
          logo_altura_max: config.logo_altura_max,
          logo_padding: config.logo_padding,
          logo_fundo_tipo: config.logo_fundo_tipo,
          logo_fundo_cor: config.logo_fundo_tipo === 'transparente' ? null : config.logo_fundo_cor,
          logo_border_radius: config.logo_border_radius,
          logo_mostrar_sombra: config.logo_mostrar_sombra,
        })
        .eq('franqueada_id', franqueada.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Configurações da logo salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: '❌ Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="text-pink-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold">Customização Avançada da Logo</h2>
            <p className="text-gray-600 text-sm">Configure a aparência da logomarca no cabeçalho do site</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Tamanho */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold">Dimensões</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Largura Máxima (px)
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={config.logo_largura_max}
                  onChange={(e) => setConfig({ ...config, logo_largura_max: parseInt(e.target.value) || 280 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: 200-350px</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Altura Máxima (px)
                </label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={config.logo_altura_max}
                  onChange={(e) => setConfig({ ...config, logo_altura_max: parseInt(e.target.value) || 80 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: 60-100px</p>
              </div>
            </div>
          </div>

          {/* Espaçamento */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Square className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold">Espaçamento</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Padding Interno (px)
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={config.logo_padding}
                onChange={(e) => setConfig({ ...config, logo_padding: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0px (sem espaço)</span>
                <span className="font-semibold text-pink-600">{config.logo_padding}px</span>
                <span>40px (muito espaço)</span>
              </div>
            </div>
          </div>

          {/* Fundo */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold">Fundo e Formato</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Fundo
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logo_fundo_tipo: 'transparente' })}
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                      config.logo_fundo_tipo === 'transparente'
                        ? 'border-pink-600 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Transparente
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logo_fundo_tipo: 'solido' })}
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                      config.logo_fundo_tipo === 'solido'
                        ? 'border-pink-600 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Fundo Sólido
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logo_fundo_tipo: 'redondo' })}
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                      config.logo_fundo_tipo === 'redondo'
                        ? 'border-pink-600 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Redondo/Circular
                  </button>
                </div>
              </div>

              {(config.logo_fundo_tipo === 'solido' || config.logo_fundo_tipo === 'redondo') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor de Fundo
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={config.logo_fundo_cor || '#FFFFFF'}
                      onChange={(e) => setConfig({ ...config, logo_fundo_cor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.logo_fundo_cor || '#FFFFFF'}
                      onChange={(e) => setConfig({ ...config, logo_fundo_cor: e.target.value })}
                      placeholder="#FFFFFF"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              )}

              {config.logo_fundo_tipo !== 'redondo' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Arredondamento das Bordas (px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={config.logo_border_radius}
                    onChange={(e) => setConfig({ ...config, logo_border_radius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0px (quadrado)</span>
                    <span className="font-semibold text-pink-600">{config.logo_border_radius}px</span>
                    <span>50px (muito arredondado)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Efeitos */}
          <div className="pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold">Efeitos Visuais</h3>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.logo_mostrar_sombra}
                onChange={(e) => setConfig({ ...config, logo_mostrar_sombra: e.target.checked })}
                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
              />
              <span className="text-sm font-medium">Adicionar sombra ao redor da logo</span>
            </label>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
