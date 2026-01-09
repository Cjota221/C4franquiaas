'use client';"use client";

import React, { useEffect, useState } from 'react';

import { useState, useEffect } from 'react';import { Store, Save, Upload, AlertCircle, Palette, FileText, Share2, BarChart3, Settings, Copy, ExternalLink } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';import { authenticatedFetch } from '@/lib/authenticatedFetch';

import { Button } from '@/components/ui/button';import Tabs from '@/components/Tabs';

import { Save, Eye, EyeOff, Loader2 } from 'lucide-react';import { PageHeader } from '@/components/ui/PageHeader';

import { toast } from 'sonner';import { LoadingState } from '@/components/ui/LoadingState';

import { useLojaConfig } from '@/hooks/useLojaConfig';import { toast } from 'sonner';

import LojaIdentidadeSection from '@/components/loja-config/LojaIdentidadeSection';

import LojaHomeSection from '@/components/loja-config/LojaHomeSection';type Loja = {

import LojaProdutosSection from '@/components/loja-config/LojaProdutosSection';  id: string;

import LojaContatoSection from '@/components/loja-config/LojaContatoSection';  nome: string;

import LojaSeoSection from '@/components/loja-config/LojaSeoSection';  dominio: string;

  logo: string | null;

type SectionId = 'identidade' | 'home' | 'produtos' | 'contato' | 'seo';  cor_primaria: string;

  cor_secundaria: string;

interface Section {  ativo: boolean;

  id: SectionId;  // Novos campos da migration 013

  label: string;  descricao?: string | null;

  icon: string;  slogan?: string | null;

  description: string;  banner_hero?: string | null;

}  texto_hero?: string | null;

  subtexto_hero?: string | null;

const sections: Section[] = [  favicon?: string | null;

  {  whatsapp?: string | null;

    id: 'identidade',  instagram?: string | null;

    label: 'Identidade',  facebook?: string | null;

    icon: '🎨',  email_contato?: string | null;

    description: 'Nome, logo, cores e fontes da sua loja',  telefone?: string | null;

  },  endereco?: string | null;

  {  meta_title?: string | null;

    id: 'home',  meta_description?: string | null;

    label: 'Página Inicial',  google_analytics?: string | null;

    icon: '🏠',  facebook_pixel?: string | null;

    description: 'Banners, textos e conteúdo da home',  fonte_principal?: string | null;

  },  fonte_secundaria?: string | null;

  {  cor_texto?: string | null;

    id: 'produtos',  cor_fundo?: string | null;

    label: 'Produtos',  cor_botao?: string | null;

    icon: '📦',  cor_botao_hover?: string | null;

    description: 'Como seus produtos são exibidos',  cor_link?: string | null;

  },  mostrar_estoque?: boolean;

  {  mostrar_codigo_barras?: boolean;

    id: 'contato',  permitir_carrinho?: boolean;

    label: 'Contato',  modo_catalogo?: boolean;

    icon: '📞',  mensagem_whatsapp?: string | null;

    description: 'WhatsApp, telefone e redes sociais',};

  },

  {export default function LojaPage() {

    id: 'seo',  const [loja, setLoja] = useState<Loja | null>(null);

    label: 'SEO & Analytics',  const [loading, setLoading] = useState(true);

    icon: '📊',  const [saving, setSaving] = useState(false);

    description: 'Meta tags, Google Analytics e Pixel',  const [uploadingLogo, setUploadingLogo] = useState(false);

  },  const [error, setError] = useState('');

];  const [success, setSuccess] = useState('');



export default function LojaConfigPage() {  // Form state - Básico

  const {  const [nome, setNome] = useState('');

    loja,  const [dominio, setDominio] = useState('');

    banners,  const [logo, setLogo] = useState<string | null>(null);

    loading,  const [ativo, setAtivo] = useState(true);

    saving,

    updateLojaField,  // Form state - Identidade Visual

    saveLoja,  const [corPrimaria, setCorPrimaria] = useState('#DB1472');

    uploadImage,  const [corSecundaria, setCorSecundaria] = useState('#F8B81F');

    addBanner,  const [corTexto, setCorTexto] = useState('#1F2937');

    updateBanner,  const [corFundo, setCorFundo] = useState('#FFFFFF');

    deleteBanner,  const [corBotao, setCorBotao] = useState('#DB1472');

    saveBanners,  const [corBotaoHover, setCorBotaoHover] = useState('#B01059');

    uploadBannerImage,  const [corLink, setCorLink] = useState('#F8B81F');

  } = useLojaConfig();  const [fontePrincipal, setFontePrincipal] = useState('Inter');

  const [fonteSecundaria, setFonteSecundaria] = useState('Poppins');

  const [activeSection, setActiveSection] = useState<SectionId>('identidade');  const [bannerHero, setBannerHero] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);  const [favicon, setFavicon] = useState<string | null>(null);

  const [hasChanges, setHasChanges] = useState(false);

  // Form state - Conteúdo

  // Detecta mudanças para mostrar botão de salvar  const [descricao, setDescricao] = useState('');

  useEffect(() => {  const [slogan, setSlogan] = useState('');

    setHasChanges(true);  const [textoHero, setTextoHero] = useState('');

  }, [loja, banners]);  const [subtextoHero, setSubtextoHero] = useState('');



  const handleSave = async () => {  // Form state - Redes Sociais

    try {  const [whatsapp, setWhatsapp] = useState('');

      // Validações básicas  const [instagram, setInstagram] = useState('');

      if (!loja?.nome || loja.nome.trim() === '') {  const [facebook, setFacebook] = useState('');

        toast.error('O nome da loja é obrigatório');  const [emailContato, setEmailContato] = useState('');

        setActiveSection('identidade');  const [telefone, setTelefone] = useState('');

        return;  const [endereco, setEndereco] = useState('');

      }

  // Form state - SEO

      if (!loja?.dominio || loja.dominio.trim() === '') {  const [metaTitle, setMetaTitle] = useState('');

        toast.error('O domínio da loja é obrigatório');  const [metaDescription, setMetaDescription] = useState('');

        setActiveSection('identidade');  const [googleAnalytics, setGoogleAnalytics] = useState('');

        return;  const [facebookPixel, setFacebookPixel] = useState('');

      }

  // Form state - Configurações

      // Salva loja  const [mostrarEstoque, setMostrarEstoque] = useState(true);

      await saveLoja();  const [mostrarCodigoBarras, setMostrarCodigoBarras] = useState(false);

  const [permitirCarrinho, setPermitirCarrinho] = useState(true);

      // Salva banners se houver mudanças  const [modoCatalogo, setModoCatalogo] = useState(false);

      if (banners.length > 0) {  const [mensagemWhatsapp, setMensagemWhatsapp] = useState('Olá! Gostaria de mais informações sobre este produto:');

        await saveBanners();

      }  // Form state - Customização da Logo (Migration 017)

  const [logoLarguraMax, setLogoLarguraMax] = useState(280);

      setHasChanges(false);  const [logoAlturaMax, setLogoAlturaMax] = useState(80);

      toast.success('Configurações salvas com sucesso!');  const [logoFormato, setLogoFormato] = useState<'horizontal' | 'redondo'>('horizontal');

    } catch (error) {

      console.error('Erro ao salvar:', error);  // Função para gerar domínio automaticamente

      toast.error('Erro ao salvar as configurações');  function gerarDominio(nomeLoja: string): string {

    }    return nomeLoja

  };      .toLowerCase()

      .normalize('NFD')

  const handlePreviewToggle = () => {      .replace(/[\u0300-\u036f]/g, '')

    setShowPreview(!showPreview);      .replace(/[^a-z0-9]/g, '')

  };      .substring(0, 50);

  }

  const renderSection = () => {

    if (!loja) return null;  useEffect(() => {

    loadLoja();

    switch (activeSection) {  }, []);

      case 'identidade':

        return (  useEffect(() => {

          <LojaIdentidadeSection    if (nome && !loja) {

            loja={loja}      const novoDominio = gerarDominio(nome);

            onChange={updateLojaField}      setDominio(novoDominio);

            onUpload={uploadImage}    }

          />  }, [nome, loja]);

        );

      case 'home':  async function loadLoja() {

        return (    try {

          <LojaHomeSection      const res = await authenticatedFetch('/api/franqueada/loja');

            loja={loja}      if (!res.ok) throw new Error('Erro ao carregar loja');

            banners={banners}      const json = await res.json();

            onChange={updateLojaField}

            onUpload={uploadImage}      if (json.loja) {

            onAddBanner={addBanner}        const l = json.loja;

            onUpdateBanner={updateBanner}        setLoja(l);

            onDeleteBanner={deleteBanner}        setNome(l.nome);

            onUploadBannerImage={uploadBannerImage}        setDominio(l.dominio);

          />        setLogo(l.logo);

        );        setAtivo(l.ativo);

      case 'produtos':        

        return (        // Identidade Visual

          <LojaProdutosSection loja={loja} onChange={updateLojaField} />        setCorPrimaria(l.cor_primaria || '#DB1472');

        );        setCorSecundaria(l.cor_secundaria || '#F8B81F');

      case 'contato':        setCorTexto(l.cor_texto || '#1F2937');

        return (        setCorFundo(l.cor_fundo || '#FFFFFF');

          <LojaContatoSection loja={loja} onChange={updateLojaField} />        setCorBotao(l.cor_botao || '#DB1472');

        );        setCorBotaoHover(l.cor_botao_hover || '#B01059');

      case 'seo':        setCorLink(l.cor_link || '#F8B81F');

        return <LojaSeoSection loja={loja} onChange={updateLojaField} />;        setFontePrincipal(l.fonte_principal || 'Inter');

      default:        setFonteSecundaria(l.fonte_secundaria || 'Poppins');

        return null;        setBannerHero(l.banner_hero);

    }        setFavicon(l.favicon);

  };

        // Conteúdo

  if (loading) {        setDescricao(l.descricao || '');

    return (        setSlogan(l.slogan || '');

      <div className="flex h-screen items-center justify-center">        setTextoHero(l.texto_hero || '');

        <div className="flex flex-col items-center gap-4">        setSubtextoHero(l.subtexto_hero || '');

          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">        // Redes Sociais

            Carregando configurações...        setWhatsapp(l.whatsapp || '');

          </p>        setInstagram(l.instagram || '');

        </div>        setFacebook(l.facebook || '');

      </div>        setEmailContato(l.email_contato || '');

    );        setTelefone(l.telefone || '');

  }        setEndereco(l.endereco || '');



  return (        // SEO

    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">        setMetaTitle(l.meta_title || '');

      {/* Área de Configuração */}        setMetaDescription(l.meta_description || '');

      <div className="flex-1 flex flex-col overflow-hidden">        setGoogleAnalytics(l.google_analytics || '');

        {/* Header */}        setFacebookPixel(l.facebook_pixel || '');

        <div className="border-b bg-white p-4 lg:p-6">

          <div className="flex items-center justify-between">        // Configurações

            <div>        setMostrarEstoque(l.mostrar_estoque ?? true);

              <h1 className="text-2xl font-bold">Configurar Loja</h1>        setMostrarCodigoBarras(l.mostrar_codigo_barras ?? false);

              <p className="text-sm text-muted-foreground mt-1">        setPermitirCarrinho(l.permitir_carrinho ?? true);

                Personalize a identidade e configurações da sua loja        setModoCatalogo(l.modo_catalogo ?? false);

              </p>        setMensagemWhatsapp(l.mensagem_whatsapp || 'Olá! Gostaria de mais informações sobre este produto:');

            </div>

        // Customização da Logo

            {/* Botão de Preview (Mobile) */}        setLogoLarguraMax(l.logo_largura_max || 280);

            <Button        setLogoAlturaMax(l.logo_altura_max || 80);

              variant="outline"        setLogoFormato(l.logo_formato || 'horizontal');

              size="sm"      }

              onClick={handlePreviewToggle}    } catch (err) {

              className="lg:hidden"      console.error('Erro ao carregar loja:', err);

            >      setError('Erro ao carregar loja');

              {showPreview ? (    } finally {

                <>      setLoading(false);

                  <EyeOff className="h-4 w-4 mr-2" />    }

                  Editar  }

                </>

              ) : (  async function handleSave() {

                <>    if (!nome) {

                  <Eye className="h-4 w-4 mr-2" />      setError('Preencha o nome da loja');

                  Preview      return;

                </>    }

              )}

            </Button>    if (dominio.length < 3) {

          </div>      setError('O nome da loja deve ter pelo menos 3 caracteres válidos');

        </div>      return;

    }

        {/* Tabs de Navegação - Scrollável no mobile */}

        <div className="border-b bg-white overflow-x-auto">    setSaving(true);

          <div className="flex min-w-max lg:min-w-0 px-4 lg:px-6">    setError('');

            {sections.map((section) => (    setSuccess('');

              <button

                key={section.id}    try {

                onClick={() => setActiveSection(section.id)}      const url = loja ? '/api/franqueada/loja/update' : '/api/franqueada/loja';

                className={`      const method = loja ? 'PUT' : 'POST';

                  flex items-center gap-2 px-4 py-3 border-b-2 transition-colors

                  whitespace-nowrap text-sm font-medium      const res = await authenticatedFetch(url, {

                  ${        method,

                    activeSection === section.id        headers: { 'Content-Type': 'application/json' },

                      ? 'border-primary text-primary'        body: JSON.stringify({

                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'          nome,

                  }          dominio,

                `}          logo,

              >          ativo,

                <span className="text-lg">{section.icon}</span>          // Identidade Visual

                <span className="hidden sm:inline">{section.label}</span>          cor_primaria: corPrimaria,

              </button>          cor_secundaria: corSecundaria,

            ))}          cor_texto: corTexto,

          </div>          cor_fundo: corFundo,

        </div>          cor_botao: corBotao,

          cor_botao_hover: corBotaoHover,

        {/* Descrição da Seção Ativa */}          cor_link: corLink,

        <div className="bg-blue-50 border-b px-4 lg:px-6 py-3">          fonte_principal: fontePrincipal,

          <p className="text-sm text-blue-900">          fonte_secundaria: fonteSecundaria,

            {sections.find((s) => s.id === activeSection)?.description}          banner_hero: bannerHero,

          </p>          favicon: favicon,

        </div>          // Conteúdo

          descricao,

        {/* Conteúdo da Seção */}          slogan,

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">          texto_hero: textoHero,

          {!showPreview && renderSection()}          subtexto_hero: subtextoHero,

          // Redes Sociais

          {/* Preview Mobile */}          whatsapp,

          {showPreview && (          instagram,

            <Card className="lg:hidden">          facebook,

              <CardContent className="p-4">          email_contato: emailContato,

                <div className="aspect-[9/16] bg-white rounded-lg shadow-lg overflow-hidden">          telefone,

                  {loja?.dominio ? (          endereco,

                    <iframe          // SEO

                      src={`https://${loja.dominio}.c4lojas.com.br`}          meta_title: metaTitle,

                      className="w-full h-full"          meta_description: metaDescription,

                      title="Preview da Loja"          google_analytics: googleAnalytics,

                    />          facebook_pixel: facebookPixel,

                  ) : (          // Configurações

                    <div className="flex items-center justify-center h-full text-center p-8">          mostrar_estoque: mostrarEstoque,

                      <div>          mostrar_codigo_barras: mostrarCodigoBarras,

                        <p className="text-muted-foreground mb-2">          permitir_carrinho: permitirCarrinho,

                          Configure um domínio para ver o preview          modo_catalogo: modoCatalogo,

                        </p>          mensagem_whatsapp: mensagemWhatsapp,

                        <Button          // Customização da Logo

                          variant="outline"          logo_largura_max: logoLarguraMax,

                          size="sm"          logo_altura_max: logoAlturaMax,

                          onClick={() => {          logo_formato: logoFormato

                            setActiveSection('identidade');        })

                            setShowPreview(false);      });

                          }}

                        >      if (!res.ok) {

                          Configurar Domínio        const json = await res.json();

                        </Button>        throw new Error(json.error || 'Erro ao salvar loja');

                      </div>      }

                    </div>

                  )}      const json = await res.json();

                </div>      setLoja(json.loja);

              </CardContent>      toast.success('Loja salva com sucesso');

            </Card>      setSuccess('Loja salva com sucesso');

          )}      setTimeout(() => setSuccess(''), 3000);

        </div>    } catch (err) {

      console.error('Erro ao salvar loja:', err);

        {/* Botão Fixo de Salvar (Mobile) */}      setError(err instanceof Error ? err.message : 'Erro ao salvar loja');

        {hasChanges && !showPreview && (    } finally {

          <div className="lg:hidden border-t bg-white p-4 shadow-lg">      setSaving(false);

            <Button    }

              onClick={handleSave}  }

              disabled={saving}

              className="w-full h-12 text-base font-medium"  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {

            >    const file = e.target.files?.[0];

              {saving ? (    if (!file) return;

                <>

                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />    setUploadingLogo(true);

                  Salvando...    setError('');

                </>

              ) : (    try {

                <>      const formData = new FormData();

                  <Save className="mr-2 h-5 w-5" />      formData.append('file', file);

                  Salvar Alterações

                </>      const res = await authenticatedFetch('/api/franqueada/loja/upload-logo', {

              )}        method: 'POST',

            </Button>        body: formData

          </div>      });

        )}

      </div>      if (!res.ok) {

        const json = await res.json();

      {/* Preview Desktop - Fixo à direita */}        throw new Error(json.error || 'Erro ao fazer upload');

      <div className="hidden lg:flex lg:w-[400px] xl:w-[480px] border-l bg-gray-100 flex-col">      }

        {/* Header Preview */}

        <div className="border-b bg-white p-4">      const json = await res.json();

          <div className="flex items-center justify-between mb-4">      setLogo(json.url);

            <h2 className="font-semibold">Preview da Loja</h2>      toast.success('Logo enviada com sucesso');

            {hasChanges && (      setSuccess('Logo enviada com sucesso');

              <Button onClick={handleSave} disabled={saving} size="sm">      setTimeout(() => setSuccess(''), 3000);

                {saving ? (    } catch (err) {

                  <>      console.error('Erro ao fazer upload:', err);

                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');

                    Salvando...    } finally {

                  </>      setUploadingLogo(false);

                ) : (    }

                  <>  }

                    <Save className="mr-2 h-4 w-4" />

                    Salvar  function copyLink() {

                  </>    const link = `https://c4franquiaas.netlify.app/loja/${dominio}`;

                )}    navigator.clipboard.writeText(link);

              </Button>    toast.success('Link copiado');

            )}    setSuccess('Link copiado');

          </div>    setTimeout(() => setSuccess(''), 2000);

          <p className="text-xs text-muted-foreground">  }

            {loja?.dominio

              ? `https://${loja.dominio}.c4lojas.com.br`  function openLoja() {

              : 'Configure um domínio para ver o preview'}    window.open(`/loja/${dominio}`, '_blank');

          </p>  }

        </div>

  if (loading) {

        {/* iPhone Mockup */}    return (

        <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">      <div className="p-4 lg:p-6">

          <div className="relative w-full max-w-[320px] aspect-[9/19.5]">        <LoadingState message="Carregando configuracoes da loja..." />

            {/* Moldura do iPhone */}      </div>

            <div className="absolute inset-0 bg-black rounded-[3rem] shadow-2xl p-3">    );

              {/* Notch */}  }

              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />

  const tabs = [

              {/* Tela */}    { id: 'identidade', label: 'Identidade Visual', icon: <Palette size={18} /> },

              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">    { id: 'conteudo', label: 'Conteudo', icon: <FileText size={18} /> },

                {loja?.dominio ? (    { id: 'social', label: 'Redes Sociais', icon: <Share2 size={18} /> },

                  <iframe    { id: 'seo', label: 'SEO e Analytics', icon: <BarChart3 size={18} /> },

                    src={`https://${loja.dominio}.c4lojas.com.br`}    { id: 'config', label: 'Configuracoes', icon: <Settings size={18} /> },

                    className="w-full h-full"  ];

                    title="Preview da Loja Desktop"

                  />  return (

                ) : (    <div className="p-4 lg:p-6">

                  <div className="flex items-center justify-center h-full text-center p-8">      {/* Header com botão de acesso à loja */}

                    <div>      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

                      <p className="text-sm text-muted-foreground mb-3">        <PageHeader

                        Configure um domínio na seção{' '}          title={loja ? 'Configuracoes da Loja' : 'Criar Loja'}

                        <strong>Identidade</strong> para ver o preview          subtitle={loja ? 'Configure todos os aspectos da sua loja online' : 'Crie sua loja online personalizada e comece a vender'}

                      </p>          icon={Store}

                      <Button        />

                        variant="outline"        

                        size="sm"        {/* Botão de acesso rápido à loja */}

                        onClick={() => setActiveSection('identidade')}        {dominio && (

                      >          <button

                        Ir para Identidade            onClick={openLoja}

                      </Button>            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"

                    </div>          >

                  </div>            <Store size={20} />

                )}            <span>Ver Minha Loja</span>

              </div>            <ExternalLink size={16} />

            </div>          </button>

          </div>        )}

        </div>      </div>



        {/* Footer Preview */}      {/* Alertas */}

        <div className="border-t bg-white p-4">      {error && (

          <p className="text-xs text-center text-muted-foreground">        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">

            💡 As alterações aparecerão após salvar          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />

          </p>          <p className="text-red-800">{error}</p>

        </div>        </div>

      </div>      )}

    </div>

  );      {success && (

}        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">

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
                <p className="text-xs text-gray-500 mt-1">
                  Gerada automaticamente a partir do nome da loja
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
