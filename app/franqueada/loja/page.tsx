"use client";
import React, { useEffect, useState } from 'react';
import { Store, Save, Upload, AlertCircle, Palette, FileText, Share2, BarChart3, Settings, Copy, ExternalLink } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import Tabs from '@/components/Tabs';

type Loja = {
  id: string;
  nome: string;
  dominio: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  // Novos campos da migration 013
  descricao?: string | null;
  slogan?: string | null;
  banner_hero?: string | null;
  texto_hero?: string | null;
  subtexto_hero?: string | null;
  favicon?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  email_contato?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  google_analytics?: string | null;
  facebook_pixel?: string | null;
  fonte_principal?: string | null;
  fonte_secundaria?: string | null;
  cor_texto?: string | null;
  cor_fundo?: string | null;
  cor_botao?: string | null;
  cor_botao_hover?: string | null;
  cor_link?: string | null;
  mostrar_estoque?: boolean;
  mostrar_codigo_barras?: boolean;
  permitir_carrinho?: boolean;
  modo_catalogo?: boolean;
  mensagem_whatsapp?: string | null;
};

export default function LojaPage() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state - Básico
  const [nome, setNome] = useState('');
  const [dominio, setDominio] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);

  // Form state - Identidade Visual
  const [corPrimaria, setCorPrimaria] = useState('#DB1472');
  const [corSecundaria, setCorSecundaria] = useState('#F8B81F');
  const [corTexto, setCorTexto] = useState('#1F2937');
  const [corFundo, setCorFundo] = useState('#FFFFFF');
  const [corBotao, setCorBotao] = useState('#DB1472');
  const [corBotaoHover, setCorBotaoHover] = useState('#B01059');
  const [corLink, setCorLink] = useState('#F8B81F');
  const [fontePrincipal, setFontePrincipal] = useState('Inter');
  const [fonteSecundaria, setFonteSecundaria] = useState('Poppins');
  const [bannerHero, setBannerHero] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);

  // Form state - Conteúdo
  const [descricao, setDescricao] = useState('');
  const [slogan, setSlogan] = useState('');
  const [textoHero, setTextoHero] = useState('');
  const [subtextoHero, setSubtextoHero] = useState('');

  // Form state - Redes Sociais
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  // Form state - SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [googleAnalytics, setGoogleAnalytics] = useState('');
  const [facebookPixel, setFacebookPixel] = useState('');

  // Form state - Configurações
  const [mostrarEstoque, setMostrarEstoque] = useState(true);
  const [mostrarCodigoBarras, setMostrarCodigoBarras] = useState(false);
  const [permitirCarrinho, setPermitirCarrinho] = useState(true);
  const [modoCatalogo, setModoCatalogo] = useState(false);
  const [mensagemWhatsapp, setMensagemWhatsapp] = useState('Olá! Gostaria de mais informações sobre este produto:');

  // Form state - Customização da Logo (Migration 017)
  const [logoLarguraMax, setLogoLarguraMax] = useState(280);
  const [logoAlturaMax, setLogoAlturaMax] = useState(80);
  const [logoFormato, setLogoFormato] = useState<'horizontal' | 'redondo'>('horizontal');

  // Função para gerar domínio automaticamente
  function gerarDominio(nomeLoja: string): string {
    return nomeLoja
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);
  }

  useEffect(() => {
    loadLoja();
  }, []);

  useEffect(() => {
    if (nome && !loja) {
      const novoDominio = gerarDominio(nome);
      setDominio(novoDominio);
    }
  }, [nome, loja]);

  async function loadLoja() {
    try {
      const res = await authenticatedFetch('/api/franqueada/loja');
      if (!res.ok) throw new Error('Erro ao carregar loja');
      const json = await res.json();

      if (json.loja) {
        const l = json.loja;
        setLoja(l);
        setNome(l.nome);
        setDominio(l.dominio);
        setLogo(l.logo);
        setAtivo(l.ativo);
        
        // Identidade Visual
        setCorPrimaria(l.cor_primaria || '#DB1472');
        setCorSecundaria(l.cor_secundaria || '#F8B81F');
        setCorTexto(l.cor_texto || '#1F2937');
        setCorFundo(l.cor_fundo || '#FFFFFF');
        setCorBotao(l.cor_botao || '#DB1472');
        setCorBotaoHover(l.cor_botao_hover || '#B01059');
        setCorLink(l.cor_link || '#F8B81F');
        setFontePrincipal(l.fonte_principal || 'Inter');
        setFonteSecundaria(l.fonte_secundaria || 'Poppins');
        setBannerHero(l.banner_hero);
        setFavicon(l.favicon);

        // Conteúdo
        setDescricao(l.descricao || '');
        setSlogan(l.slogan || '');
        setTextoHero(l.texto_hero || '');
        setSubtextoHero(l.subtexto_hero || '');

        // Redes Sociais
        setWhatsapp(l.whatsapp || '');
        setInstagram(l.instagram || '');
        setFacebook(l.facebook || '');
        setEmailContato(l.email_contato || '');
        setTelefone(l.telefone || '');
        setEndereco(l.endereco || '');

        // SEO
        setMetaTitle(l.meta_title || '');
        setMetaDescription(l.meta_description || '');
        setGoogleAnalytics(l.google_analytics || '');
        setFacebookPixel(l.facebook_pixel || '');

        // Configurações
        setMostrarEstoque(l.mostrar_estoque ?? true);
        setMostrarCodigoBarras(l.mostrar_codigo_barras ?? false);
        setPermitirCarrinho(l.permitir_carrinho ?? true);
        setModoCatalogo(l.modo_catalogo ?? false);
        setMensagemWhatsapp(l.mensagem_whatsapp || 'Olá! Gostaria de mais informações sobre este produto:');

        // Customização da Logo
        setLogoLarguraMax(l.logo_largura_max || 280);
        setLogoAlturaMax(l.logo_altura_max || 80);
        setLogoFormato(l.logo_formato || 'horizontal');
      }
    } catch (err) {
      console.error('Erro ao carregar loja:', err);
      setError('Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!nome) {
      setError('Preencha o nome da loja');
      return;
    }

    if (dominio.length < 3) {
      setError('O nome da loja deve ter pelo menos 3 caracteres válidos');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = loja ? '/api/franqueada/loja/update' : '/api/franqueada/loja';
      const method = loja ? 'PUT' : 'POST';

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          dominio,
          logo,
          ativo,
          // Identidade Visual
          cor_primaria: corPrimaria,
          cor_secundaria: corSecundaria,
          cor_texto: corTexto,
          cor_fundo: corFundo,
          cor_botao: corBotao,
          cor_botao_hover: corBotaoHover,
          cor_link: corLink,
          fonte_principal: fontePrincipal,
          fonte_secundaria: fonteSecundaria,
          banner_hero: bannerHero,
          favicon: favicon,
          // Conteúdo
          descricao,
          slogan,
          texto_hero: textoHero,
          subtexto_hero: subtextoHero,
          // Redes Sociais
          whatsapp,
          instagram,
          facebook,
          email_contato: emailContato,
          telefone,
          endereco,
          // SEO
          meta_title: metaTitle,
          meta_description: metaDescription,
          google_analytics: googleAnalytics,
          facebook_pixel: facebookPixel,
          // Configurações
          mostrar_estoque: mostrarEstoque,
          mostrar_codigo_barras: mostrarCodigoBarras,
          permitir_carrinho: permitirCarrinho,
          modo_catalogo: modoCatalogo,
          mensagem_whatsapp: mensagemWhatsapp,
          // Customização da Logo
          logo_largura_max: logoLarguraMax,
          logo_altura_max: logoAlturaMax,
          logo_formato: logoFormato
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erro ao salvar loja');
      }

      const json = await res.json();
      setLoja(json.loja);
      setSuccess('✅ Loja salva com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar loja:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar loja');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authenticatedFetch('/api/franqueada/loja/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Erro ao fazer upload');
      }

      const json = await res.json();
      setLogo(json.url);
      setSuccess('✅ Logo enviada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploadingLogo(false);
    }
  }

  function copyLink() {
    const link = `https://c4franquiaas.netlify.app/loja/${dominio}`;
    navigator.clipboard.writeText(link);
    setSuccess('✅ Link copiado!');
    setTimeout(() => setSuccess(''), 2000);
  }

  function openLoja() {
    window.open(`/loja/${dominio}`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'identidade', label: 'Identidade Visual', icon: <Palette size={18} /> },
    { id: 'conteudo', label: 'Conteúdo', icon: <FileText size={18} /> },
    { id: 'social', label: 'Redes Sociais', icon: <Share2 size={18} /> },
    { id: 'seo', label: 'SEO & Analytics', icon: <BarChart3 size={18} /> },
    { id: 'config', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
          <Store className="text-pink-600" size={28} />
          <span className="hidden sm:inline">Customização Avançada da Loja</span>
          <span className="sm:hidden">Minha Loja</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          {loja ? 'Configure todos os aspectos da sua loja online' : 'Crie sua loja online personalizada e comece a vender!'}
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Formulário com Tabs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <Tabs tabs={tabs}>
            {/* ABA 1: IDENTIDADE VISUAL */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Identidade Visual</h3>

              {/* Nome da Loja */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome da Loja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Cosméticos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* URL da Loja */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  URL da Loja
                </label>
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">
                    c4franquiaas.netlify.app/loja/
                  </p>
                  <p className="text-xl font-mono font-bold text-pink-600 break-all">
                    {dominio || '(digite o nome acima)'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span>✨</span>
                  <span>Gerada automaticamente a partir do nome da loja</span>
                </p>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {logo && (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain border-2 border-gray-200 rounded-lg p-1" 
                      />
                    </div>
                  )}
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                    <Upload size={16} />
                    {uploadingLogo ? 'Enviando...' : 'Escolher Arquivo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP ou SVG (máximo 2MB)
                </p>
              </div>

              {/* Customização da Logo */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Customização da Logo</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">
                      Largura Máxima (px)
                    </label>
                    <input
                      type="number"
                      value={logoLarguraMax}
                      onChange={(e) => setLogoLarguraMax(parseInt(e.target.value) || 280)}
                      min="50"
                      max="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">
                      Altura Máxima (px)
                    </label>
                    <input
                      type="number"
                      value={logoAlturaMax}
                      onChange={(e) => setLogoAlturaMax(parseInt(e.target.value) || 80)}
                      min="30"
                      max="200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">
                      Formato
                    </label>
                    <select
                      value={logoFormato}
                      onChange={(e) => setLogoFormato(e.target.value as 'horizontal' | 'redondo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="horizontal">Retangular</option>
                      <option value="redondo">Circular</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Configure o tamanho e formato de exibição da sua logo no site
                </p>
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor Primária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor do Texto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corTexto}
                      onChange={(e) => setCorTexto(e.target.value)}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={corTexto}
                      onChange={(e) => setCorTexto(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor de Fundo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corFundo}
                      onChange={(e) => setCorFundo(e.target.value)}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={corFundo}
                      onChange={(e) => setCorFundo(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor do Botão
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corBotao}
                      onChange={(e) => setCorBotao(e.target.value)}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={corBotao}
                      onChange={(e) => setCorBotao(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cor Botão Hover
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corBotaoHover}
                      onChange={(e) => setCorBotaoHover(e.target.value)}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={corBotaoHover}
                      onChange={(e) => setCorBotaoHover(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Fontes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fonte Principal
                  </label>
                  <select
                    value={fontePrincipal}
                    onChange={(e) => setFontePrincipal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Montserrat">Montserrat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fonte Secundária
                  </label>
                  <select
                    value={fonteSecundaria}
                    onChange={(e) => setFonteSecundaria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Poppins">Poppins</option>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Montserrat">Montserrat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ABA 2: CONTEÚDO */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Conteúdo da Loja</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ex: Os melhores produtos com o melhor preço!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição da Loja
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Conte aos seus clientes sobre sua loja, produtos e diferenciais..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Texto Principal do Banner (Hero)
                </label>
                <input
                  type="text"
                  value={textoHero}
                  onChange={(e) => setTextoHero(e.target.value)}
                  placeholder="Ex: Bem-vindo à Nossa Loja!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subtexto do Banner
                </label>
                <input
                  type="text"
                  value={subtextoHero}
                  onChange={(e) => setSubtextoHero(e.target.value)}
                  placeholder="Ex: Produtos de qualidade com entrega rápida"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* ABA 3: REDES SOCIAIS */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Redes Sociais & Contato</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 5511987654321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código do país + DDD + número (sem espaços ou caracteres especiais)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Ex: @minhaloja"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Facebook
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="Ex: facebook.com/minhaloja"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  placeholder="Ex: contato@minhaloja.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço
                </label>
                <textarea
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Rua Exemplo, 123 - Bairro - Cidade/UF"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* ABA 4: SEO & ANALYTICS */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">SEO & Analytics</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Título SEO (Meta Title)
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Ex: Minha Loja - Os Melhores Produtos"
                  maxLength={60}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {metaTitle.length}/60 caracteres (ideal: 50-60)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição SEO (Meta Description)
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Ex: Encontre os melhores produtos com preços incríveis. Entrega rápida e segura para todo o Brasil!"
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {metaDescription.length}/160 caracteres (ideal: 150-160)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={googleAnalytics}
                  onChange={(e) => setGoogleAnalytics(e.target.value)}
                  placeholder="Ex: G-XXXXXXXXXX ou UA-XXXXXXXXX-X"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ID de rastreamento do Google Analytics
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={facebookPixel}
                  onChange={(e) => setFacebookPixel(e.target.value)}
                  placeholder="Ex: 1234567890123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ID do Pixel do Facebook para rastreamento de conversões
                </p>
              </div>
            </div>

            {/* ABA 5: CONFIGURAÇÕES */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configurações da Loja</h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-sm font-medium block">Loja Ativa</span>
                    <span className="text-xs text-gray-500">
                      {ativo ? 'Sua loja está online e visível' : 'Sua loja está offline'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={mostrarEstoque}
                    onChange={(e) => setMostrarEstoque(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-sm font-medium block">Mostrar Estoque</span>
                    <span className="text-xs text-gray-500">
                      Exibir quantidade disponível dos produtos
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={mostrarCodigoBarras}
                    onChange={(e) => setMostrarCodigoBarras(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-sm font-medium block">Mostrar Código de Barras</span>
                    <span className="text-xs text-gray-500">
                      Exibir código de barras na página do produto
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={permitirCarrinho}
                    onChange={(e) => setPermitirCarrinho(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-sm font-medium block">Permitir Carrinho</span>
                    <span className="text-xs text-gray-500">
                      Clientes podem adicionar produtos ao carrinho
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={modoCatalogo}
                    onChange={(e) => setModoCatalogo(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-sm font-medium block">Modo Catálogo</span>
                    <span className="text-xs text-gray-500">
                      Desabilita compras, apenas exibe produtos (ideal para WhatsApp)
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mensagem Padrão WhatsApp
                </label>
                <textarea
                  value={mensagemWhatsapp}
                  onChange={(e) => setMensagemWhatsapp(e.target.value)}
                  placeholder="Ex: Olá! Gostaria de mais informações sobre este produto:"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mensagem que aparecerá ao clicar em &ldquo;Comprar pelo WhatsApp&rdquo;
                </p>
              </div>
            </div>
          </Tabs>

          {/* Botão Salvar */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving || !nome || dominio.length < 3}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Todas as Alterações'}
            </button>
          </div>
        </div>

        {/* Coluna Lateral: Preview e Links */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>

            <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
              {/* Header Preview */}
              <div 
                className="p-4 flex items-center justify-between"
                style={{ backgroundColor: corPrimaria }}
              >
                <div className="flex items-center gap-3">
                  {logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain bg-white rounded p-1" />
                  ) : (
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-xl font-bold" style={{ color: corPrimaria }}>
                      {nome.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-white font-bold truncate text-sm">{nome || 'Nome da Loja'}</span>
                </div>
              </div>

              {/* Hero Preview */}
              {textoHero && (
                <div className="p-6 text-center" style={{ backgroundColor: corFundo, color: corTexto }}>
                  <h3 className="text-lg font-bold mb-2">{textoHero}</h3>
                  {subtextoHero && <p className="text-sm opacity-80">{subtextoHero}</p>}
                </div>
              )}

              {/* Content Preview */}
              <div className="p-4" style={{ backgroundColor: corFundo }}>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white p-2 rounded-lg shadow-sm border">
                      <div className="w-full h-16 bg-gray-200 rounded mb-2"></div>
                      <p className="text-xs font-medium text-gray-800 truncate">Produto</p>
                      <p className="text-sm font-bold" style={{ color: corPrimaria }}>
                        R$ 99,90
                      </p>
                      <button
                        className="w-full mt-1 py-1 text-xs font-medium text-white rounded transition"
                        style={{ backgroundColor: corBotao }}
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Link da Loja */}
          {loja && dominio && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">🔗 Link da Loja</h2>
              <p className="text-sm text-gray-600 mb-2 break-all">
                https://c4franquiaas.netlify.app/loja/{dominio}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copiar
                </button>
                <button
                  onClick={openLoja}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Abrir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
