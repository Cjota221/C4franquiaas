"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Palette, 
  Upload, 
  Save, 
  Eye,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Type,
  Square,
  MessageCircle,
  Instagram,
  Facebook,
  Check,
  Loader2,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';

type ThemeSettings = {
  button_style: 'rounded' | 'square';
  card_style: 'shadow' | 'flat' | 'bordered';
  header_style: 'gradient' | 'solid' | 'transparent';
  show_prices: boolean;
  show_stock: boolean;
  show_whatsapp_float: boolean;
};

type ResellerData = {
  id: string;
  store_name: string;
  slug: string;
  phone: string;
  logo_url?: string;
  banner_url?: string;
  banner_mobile_url?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  theme_settings: ThemeSettings;
};

// Paleta de cores sugeridas
const COLOR_PRESETS = [
  { name: 'Rosa', primary: '#ec4899', secondary: '#f472b6' },
  { name: 'Roxo', primary: '#8b5cf6', secondary: '#a78bfa' },
  { name: 'Azul', primary: '#3b82f6', secondary: '#60a5fa' },
  { name: 'Verde', primary: '#10b981', secondary: '#34d399' },
  { name: 'Laranja', primary: '#f97316', secondary: '#fb923c' },
  { name: 'Vermelho', primary: '#ef4444', secondary: '#f87171' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#2dd4bf' },
  { name: 'Índigo', primary: '#6366f1', secondary: '#818cf8' },
];

export default function PersonalizacaoRevendedoraPage() {
  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'identidade' | 'cores' | 'layout' | 'social'>('identidade');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [uploading, setUploading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(''); // Slug atual para o link do catálogo
  
  // Estados editáveis
  const [storeName, setStoreName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState(''); // Desktop
  const [bannerMobileUrl, setBannerMobileUrl] = useState(''); // Mobile
  const [primaryColor, setPrimaryColor] = useState('#ec4899');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    button_style: 'rounded',
    card_style: 'shadow',
    header_style: 'gradient',
    show_prices: true,
    show_stock: false,
    show_whatsapp_float: true,
  });

  const supabase = createClientComponentClient();
  
  // URL do catálogo - usa currentSlug que é atualizado ao salvar
  const catalogUrl = typeof window !== 'undefined' && currentSlug 
    ? `${window.location.origin}/catalogo/${currentSlug}` 
    : '';

  // Copiar link
  const copyLink = () => {
    if (catalogUrl) {
      navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Carregar dados do reseller
  useEffect(() => {
    async function loadReseller() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[Personalização] Usuário não autenticado');
          return;
        }

        console.log('[Personalização] Buscando reseller para user_id:', user.id);

        const { data, error } = await supabase
          .from('resellers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('[Personalização] Erro ao buscar reseller:', error);
          return;
        }

        if (data) {
          console.log('[Personalização] Reseller carregado:', {
            id: data.id,
            name: data.name,
            store_name: data.store_name,
            slug: data.slug
          });
          setReseller(data);
          setCurrentSlug(data.slug || ''); // Setar slug atual
          setStoreName(data.store_name || '');
          setBio(data.bio || '');
          setPhone(data.phone || '');
          setInstagram(data.instagram || '');
          setFacebook(data.facebook || '');
          setLogoUrl(data.logo_url || '');
          setBannerUrl(data.banner_url || '');
          setBannerMobileUrl(data.banner_mobile_url || '');
          setPrimaryColor(data.colors?.primary || '#ec4899');
          setSecondaryColor(data.colors?.secondary || '#8b5cf6');
          setThemeSettings(data.theme_settings || {
            button_style: 'rounded',
            card_style: 'shadow',
            header_style: 'gradient',
            show_prices: true,
            show_stock: false,
            show_whatsapp_float: true,
          });
        } else {
          console.log('[Personalização] Nenhum reseller encontrado para este usuário');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReseller();
  }, [supabase]);

  // Gerar slug a partir do nome da loja
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços viram hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início/fim
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!reseller) {
      alert('Erro: dados da revendedora não carregados.');
      return;
    }

    // Validar nome da loja
    if (!storeName || storeName.trim() === '') {
      alert('Por favor, preencha o nome da sua loja.');
      return;
    }

    setSaving(true);
    try {
      // SEMPRE gerar slug baseado no nome da loja atual
      const newSlug = generateSlug(storeName);
      
      if (!newSlug) {
        alert('Não foi possível gerar o link. Verifique o nome da loja.');
        setSaving(false);
        return;
      }

      console.log('[Personalização] Salvando...', { storeName, newSlug });
      
      const { error } = await supabase
        .from('resellers')
        .update({
          store_name: storeName,
          slug: newSlug,
          bio,
          phone,
          instagram,
          facebook,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          banner_mobile_url: bannerMobileUrl,
          colors: {
            primary: primaryColor,
            secondary: secondaryColor,
          },
          theme_settings: themeSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reseller.id);

      if (error) {
        console.error('[Personalização] Erro Supabase:', error);
        throw error;
      }

      console.log('[Personalização] Salvo com sucesso! Novo slug:', newSlug);

      // Atualizar o reseller local e o slug atual
      setReseller({ ...reseller, slug: newSlug, store_name: storeName });
      setCurrentSlug(newSlug); // Atualiza o slug para o link do catálogo
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Upload de imagem
  const handleImageUpload = async (file: File, type: 'logo' | 'banner' | 'banner_mobile') => {
    if (!reseller) return;

    setUploading(type);
    const fileExt = file.name.split('.').pop();
    const fileName = `${reseller.id}/${type}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('reseller-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reseller-assets')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        setLogoUrl(publicUrl);
      } else if (type === 'banner') {
        setBannerUrl(publicUrl);
      } else {
        setBannerMobileUrl(publicUrl);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload. Verifique se o bucket "reseller-assets" existe no Supabase.');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast de Sucesso */}
      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Salvo com sucesso!</p>
              <p className="text-sm text-green-100">Suas alterações foram aplicadas</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Personalizar Catálogo</h1>
              <p className="text-sm text-gray-500">Configure a aparência da sua loja</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão Ver Catálogo */}
            <a
              href={catalogUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${!catalogUrl ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Eye size={18} />
              Ver Catálogo
            </a>
            
            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : saved ? (
                <Check size={18} />
              ) : (
                <Save size={18} />
              )}
              {saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Link do Catálogo */}
        {currentSlug ? (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Link do seu catálogo:</p>
                  <p className="text-pink-600 font-mono text-sm">{catalogUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-pink-500 text-white hover:bg-pink-600'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </button>
                <a
                  href={catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={16} />
                  Abrir
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Type className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">Configure o nome da sua loja!</p>
                <p className="text-amber-700 text-sm">
                  Preencha o campo &quot;Nome da Loja&quot; na aba Identidade e clique em Salvar para criar seu link personalizado.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Painel de Edição */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'identidade', label: 'Identidade', icon: Type },
                  { id: 'cores', label: 'Cores', icon: Palette },
                  { id: 'layout', label: 'Layout', icon: Square },
                  { id: 'social', label: 'Redes', icon: MessageCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Tab: Identidade */}
                {activeTab === 'identidade' && (
                  <div className="space-y-6">
                    {/* Nome da Loja */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Loja
                      </label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ex: Loja da Maria"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Loja
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Uma breve descrição sobre sua loja..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{bio.length}/200 caracteres</p>
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da Loja
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                          {logoUrl ? (
                            <Image src={logoUrl} alt="Logo" width={96} height={96} className="object-cover w-full h-full" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="cursor-pointer">
                            <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2">
                              <Upload size={16} />
                              Fazer Upload
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'logo');
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">PNG ou JPG. Recomendado: 200x200px</p>
                          {logoUrl && (
                            <button
                              onClick={() => setLogoUrl('')}
                              className="text-xs text-red-500 hover:underline mt-1"
                            >
                              Remover logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Banner Desktop */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Monitor className="inline w-4 h-4 mr-1" />
                        Banner Desktop
                      </label>
                      <div className="aspect-[3/1] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 relative">
                        {uploading === 'banner' && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                          </div>
                        )}
                        {bannerUrl ? (
                          <>
                            <Image src={bannerUrl} alt="Banner Desktop" fill className="object-cover" />
                            <button
                              onClick={() => setBannerUrl('')}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                            <Upload size={24} />
                            <span className="text-sm">Clique para fazer upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'banner');
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Recomendado: 1200x400px (formato horizontal)</p>
                    </div>

                    {/* Banner Mobile */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Smartphone className="inline w-4 h-4 mr-1" />
                        Banner Mobile
                      </label>
                      <div className="aspect-square max-w-[200px] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 relative">
                        {uploading === 'banner_mobile' && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                          </div>
                        )}
                        {bannerMobileUrl ? (
                          <>
                            <Image src={bannerMobileUrl} alt="Banner Mobile" fill className="object-cover" />
                            <button
                              onClick={() => setBannerMobileUrl('')}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                            <Upload size={20} />
                            <span className="text-xs text-center">Clique para<br/>fazer upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'banner_mobile');
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Recomendado: 800x800px (formato quadrado)</p>
                    </div>
                  </div>
                )}

                {/* Tab: Cores */}
                {activeTab === 'cores' && (
                  <div className="space-y-6">
                    {/* Paletas Prontas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Paletas Prontas
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setPrimaryColor(preset.primary);
                              setSecondaryColor(preset.secondary);
                            }}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              primaryColor === preset.primary
                                ? 'border-gray-900 scale-105'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex gap-1 mb-2">
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.secondary }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cores Customizadas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Principal
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
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
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview de cores */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-3">Preview das cores:</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="px-4 py-2 text-white font-medium rounded-lg"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Botão Principal
                        </button>
                        <button
                          className="px-4 py-2 text-white font-medium rounded-lg"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          Botão Secundário
                        </button>
                        <span
                          className="px-4 py-2 font-medium"
                          style={{ color: primaryColor }}
                        >
                          Texto colorido
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Layout */}
                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    {/* Estilo dos Botões */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Estilo dos Botões
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setThemeSettings({ ...themeSettings, button_style: 'rounded' })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            themeSettings.button_style === 'rounded'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full py-2 text-white text-sm font-medium rounded-full mb-2"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Arredondado
                          </div>
                          <span className="text-xs text-gray-600">Cantos arredondados</span>
                        </button>
                        <button
                          onClick={() => setThemeSettings({ ...themeSettings, button_style: 'square' })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            themeSettings.button_style === 'square'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full py-2 text-white text-sm font-medium rounded-md mb-2"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Quadrado
                          </div>
                          <span className="text-xs text-gray-600">Cantos retos</span>
                        </button>
                      </div>
                    </div>

                    {/* Estilo dos Cards */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Estilo dos Cards de Produto
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'shadow', label: 'Com Sombra', className: 'shadow-lg' },
                          { id: 'bordered', label: 'Com Borda', className: 'border-2 border-gray-200' },
                          { id: 'flat', label: 'Minimalista', className: 'bg-gray-50' },
                        ].map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setThemeSettings({ ...themeSettings, card_style: style.id as ThemeSettings['card_style'] })}
                            className={`p-3 border-2 rounded-lg transition-all ${
                              themeSettings.card_style === style.id
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-full aspect-square bg-white rounded-lg mb-2 ${style.className}`} />
                            <span className="text-xs text-gray-600">{style.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Estilo do Header */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Estilo do Cabeçalho
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setThemeSettings({ ...themeSettings, header_style: 'gradient' })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            themeSettings.header_style === 'gradient'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded mb-2"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                          />
                          <span className="text-xs text-gray-600">Gradiente</span>
                        </button>
                        <button
                          onClick={() => setThemeSettings({ ...themeSettings, header_style: 'solid' })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            themeSettings.header_style === 'solid'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded mb-2"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span className="text-xs text-gray-600">Cor Sólida</span>
                        </button>
                        <button
                          onClick={() => setThemeSettings({ ...themeSettings, header_style: 'transparent' })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            themeSettings.header_style === 'transparent'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-8 rounded mb-2 bg-white border border-gray-200" />
                          <span className="text-xs text-gray-600">Transparente</span>
                        </button>
                      </div>
                    </div>

                    {/* Opções Toggle */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Opções de Exibição
                      </label>
                      
                      {[
                        { key: 'show_prices', label: 'Mostrar preços', desc: 'Exibir preços nos cards de produto' },
                        { key: 'show_whatsapp_float', label: 'Botão WhatsApp flutuante', desc: 'Mostra um botão de WhatsApp no canto da tela' },
                      ].map((option) => (
                        <div key={option.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{option.label}</p>
                            <p className="text-xs text-gray-500">{option.desc}</p>
                          </div>
                          <button
                            onClick={() => setThemeSettings({
                              ...themeSettings,
                              [option.key]: !themeSettings[option.key as keyof ThemeSettings]
                            })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              themeSettings[option.key as keyof ThemeSettings]
                                ? 'bg-pink-500'
                                : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                themeSettings[option.key as keyof ThemeSettings]
                                  ? 'translate-x-7'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Redes Sociais */}
                {activeTab === 'social' && (
                  <div className="space-y-6">
                    {/* WhatsApp */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageCircle size={16} className="inline mr-2 text-green-500" />
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este número será usado para receber pedidos
                      </p>
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Instagram size={16} className="inline mr-2 text-pink-500" />
                        Instagram
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                          placeholder="seu.usuario"
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                    </div>

                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Facebook size={16} className="inline mr-2 text-blue-600" />
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="URL ou nome da página"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Pré-visualização</h2>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Smartphone size={16} />
                </button>
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Square size={16} />
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 relative ${
              previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 'w-full'
            }`}>
              {/* Header Preview */}
              <div
                className="p-4 text-white"
                style={{
                  background: themeSettings.header_style === 'gradient'
                    ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    : themeSettings.header_style === 'solid'
                      ? primaryColor
                      : 'white',
                  color: themeSettings.header_style === 'transparent' ? '#1f2937' : 'white',
                  borderBottom: themeSettings.header_style === 'transparent' ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="w-12 h-12 bg-white rounded-lg p-1 overflow-hidden">
                      <Image src={logoUrl} alt="Logo" width={44} height={44} className="object-contain w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <ImageIcon size={20} className={themeSettings.header_style === 'transparent' ? 'text-gray-400' : 'text-white/60'} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{storeName || 'Nome da Loja'}</h3>
                    <p className={`text-sm ${themeSettings.header_style === 'transparent' ? 'text-gray-500' : 'opacity-80'}`}>
                      {bio ? (bio.length > 40 ? bio.substring(0, 40) + '...' : bio) : 'Descrição da sua loja'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Preview */}
              {bannerUrl && (
                <div className="aspect-[3/1] relative bg-gray-100">
                  <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
                </div>
              )}

              {/* Products Grid Preview */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`rounded-lg overflow-hidden ${
                        themeSettings.card_style === 'shadow'
                          ? 'shadow-lg'
                          : themeSettings.card_style === 'bordered'
                            ? 'border-2 border-gray-200'
                            : 'bg-gray-50'
                      }`}
                    >
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-3">
                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2" />
                        {themeSettings.show_prices && (
                          <div
                            className="h-4 rounded w-1/2"
                            style={{ backgroundColor: primaryColor + '30' }}
                          />
                        )}
                        <button
                          className={`w-full mt-3 py-2 text-white text-xs font-medium ${
                            themeSettings.button_style === 'rounded' ? 'rounded-full' : 'rounded-md'
                          }`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          Ver Produto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Float Preview */}
              {themeSettings.show_whatsapp_float && (
                <div className="absolute bottom-4 right-4">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-gray-500">
              As alterações serão aplicadas após salvar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
