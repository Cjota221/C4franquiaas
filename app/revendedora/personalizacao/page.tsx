"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Save, Smartphone, Monitor, Image as ImageIcon, Check, Loader2, X, Copy, ExternalLink, ChevronRight, Store, Brush, Share2, Camera, Sparkles, Heart, Palette, CircleIcon, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

type ThemeSettings = {
  button_style: "rounded" | "square";
  card_style: "shadow" | "flat" | "bordered";
  header_style: "gradient" | "solid" | "transparent";
  logo_shape: "circle" | "square" | "rectangle";
  logo_position: "left" | "center" | "right";
  show_prices: boolean;
  show_whatsapp_float: boolean;
  // Novas opções
  border_radius: "none" | "small" | "medium" | "large";
  card_image_style: "square" | "rounded" | "circle";
  announcement_bar: {
    enabled: boolean;
    text: string;
    bg_color: string;
    text_color: string;
  };
  font_style: "modern" | "classic" | "elegant";
  product_name_size: "small" | "medium" | "large";
  button_color?: string; // Cor específica do botão (usa primary se não definido)
  header_color?: string; // Cor específica do cabeçalho (usa primary se não definido)
  // 🆕 Sob Encomenda
  delivery_notice?: {
    enabled: boolean;
    days: number; // Prazo em dias
    message?: string; // Mensagem customizada
  };
  // 🆕 Produtos Relacionados
  show_related_products?: boolean;
  show_related_in_cart?: boolean;
};

type BannerSubmission = {
  id: string;
  banner_type: "desktop" | "mobile";
  image_url: string;
  status: "pending" | "approved" | "rejected";
  admin_feedback: string | null;
  created_at: string;
};

const COLOR_PRESETS = [
  { name: "Rosa", primary: "#ec4899", secondary: "#f472b6" },
  { name: "Roxo", primary: "#8b5cf6", secondary: "#a78bfa" },
  { name: "Azul", primary: "#3b82f6", secondary: "#60a5fa" },
  { name: "Verde", primary: "#10b981", secondary: "#34d399" },
  { name: "Laranja", primary: "#f97316", secondary: "#fb923c" },
  { name: "Vermelho", primary: "#ef4444", secondary: "#f87171" },
  { name: "Dourado", primary: "#d97706", secondary: "#fbbf24" },
  { name: "Turquesa", primary: "#14b8a6", secondary: "#2dd4bf" },
];

const DEFAULT_THEME: ThemeSettings = {
  button_style: "rounded",
  card_style: "shadow",
  header_style: "gradient",
  logo_shape: "circle",
  logo_position: "center",
  show_prices: true,
  show_whatsapp_float: true,
  // Novas opções
  border_radius: "medium",
  card_image_style: "rounded",
  announcement_bar: {
    enabled: false,
    text: "🔥 Frete grátis acima de R$ 150!",
    bg_color: "#000000",
    text_color: "#ffffff",
  },
  font_style: "modern",
  product_name_size: "medium",
  button_color: undefined, // Usa cor primária por padrão
  header_color: undefined, // Usa cor primária por padrão
  // 🆕 Sob Encomenda
  delivery_notice: {
    enabled: false,
    days: 15,
    message: "Produzido sob encomenda"
  },
  // 🆕 Produtos Relacionados
  show_related_products: true,
  show_related_in_cart: true,
};

export default function PersonalizacaoRevendedoraPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reseller, setReseller] = useState<{ id: string; user_id: string } | null>(null);
  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerMobileUrl, setBannerMobileUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ec4899");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [currentSlug, setCurrentSlug] = useState("");
  const [activeSection, setActiveSection] = useState<"main" | "colors" | "logo" | "banner" | "social" | "styles">("main");
  const [uploading, setUploading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCustomColor, setShowCustomColor] = useState(false);
  
  // Estados para moderação de banners
  const [bannerSubmissions, setBannerSubmissions] = useState<BannerSubmission[]>([]);

  const supabase = createClient();
  const catalogUrl = typeof window !== "undefined" && currentSlug ? window.location.origin + "/catalogo/" + currentSlug : "";

  // Carregar submissões de banner
  const loadBannerSubmissions = async (resellerId: string) => {
    try {
      const response = await fetch(`/api/banners?reseller_id=${resellerId}`);
      const data = await response.json();
      if (data.submissions) {
        setBannerSubmissions(data.submissions);
      }
    } catch (error) {
      console.error("Erro ao carregar submissões:", error);
    }
  };

  useEffect(() => {
    async function loadReseller() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from("resellers").select("*").eq("user_id", user.id).single();
        if (error || !data) return;
        setReseller(data);
        setCurrentSlug(data.slug || "");
        setStoreName(data.store_name || "");
        
        // 🆕 Atualizar título da página para Google Analytics
        document.title = `Personalização - ${data.store_name} | C4 Franquias`;
        
        setBio(data.bio || "");
        setPhone(data.phone || "");
        setInstagram(data.instagram || "");
        setFacebook(data.facebook || "");
        setLogoUrl(data.logo_url || "");
        setBannerUrl(data.banner_url || "");
        setBannerMobileUrl(data.banner_mobile_url || "");
        setPrimaryColor(data.colors?.primary || "#ec4899");
        setSecondaryColor(data.colors?.secondary || "#8b5cf6");
        setThemeSettings(data.theme_settings || DEFAULT_THEME);
        
        // Carregar submissões de banner
        loadBannerSubmissions(data.id);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReseller();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!reseller) return;
    setSaving(true);
    try {
      const newSlug = storeName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("resellers").update({ 
        store_name: storeName, slug: newSlug, bio, phone, instagram, facebook, 
        logo_url: logoUrl, banner_url: bannerUrl, banner_mobile_url: bannerMobileUrl, 
        colors: { primary: primaryColor, secondary: secondaryColor }, 
        theme_settings: themeSettings 
      }).eq("id", reseller.id);
      if (error) throw error;
      setCurrentSlug(newSlug);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: "logo" | "banner" | "banner_mobile") => {
    if (!reseller) return;
    setUploading(type);
    const fileExt = file.name.split(".").pop();
    const fileName = reseller.id + "/" + type + "_" + Date.now() + "." + fileExt;
    try {
      const { error: uploadError } = await supabase.storage.from("reseller-assets").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("reseller-assets").getPublicUrl(fileName);
      
      if (type === "logo") {
        // Logo vai direto, sem moderação
        setLogoUrl(publicUrl);
      } else {
        // Banners vão para moderação
        const bannerType = type === "banner" ? "desktop" : "mobile";
        
        const response = await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reseller_id: reseller.id,
            banner_type: bannerType,
            image_url: publicUrl
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert("✅ " + data.message);
          loadBannerSubmissions(reseller.id);
        } else {
          alert("⚠️ " + data.error);
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao enviar imagem.");
    } finally {
      setUploading(null);
    }
  };

  const copyLink = () => {
    if (catalogUrl) {
      navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 text-lg">Carregando sua loja...</p>
      </div>
    );
  }

  // SEÇÃO PRINCIPAL
  if (activeSection === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-32">
        {saved && (
          <div className="fixed top-4 left-4 right-4 z-50">
            <div className="bg-green-500 text-white px-4 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-6 h-6" /></div>
              <div className="flex-1"><p className="font-bold text-lg">Salvo!</p><p className="text-green-100 text-sm">Suas alterações foram aplicadas</p></div>
            </div>
          </div>
        )}

        <div className="p-6 pb-8" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          <div className="text-white text-center">
            <div className="flex justify-center mb-4">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" width={80} height={80} className={`h-20 w-auto object-contain ${themeSettings.logo_shape === "circle" ? "rounded-full" : ""}`} />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center"><Store className="w-10 h-10 text-white/60" /></div>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-1">{storeName || "Sua Loja"}</h1>
            <p className="text-white/80 text-sm">{bio || "Configure sua loja abaixo"}</p>
          </div>
        </div>

        {currentSlug ? (
          <div className="mx-4 -mt-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-2 text-center">SEU LINK DO CATÁLOGO</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 overflow-hidden"><p className="text-pink-600 font-mono text-sm truncate">{catalogUrl}</p></div>
                <button onClick={copyLink} className={`p-3 rounded-xl transition-all ${copied ? "bg-green-500 text-white" : "bg-pink-500 text-white"}`}>{copied ? <Check size={20} /> : <Copy size={20} />}</button>
                <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-xl text-gray-600"><ExternalLink size={20} /></a>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-4 -mt-4 mb-6"><div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4"><p className="text-amber-800 font-medium text-center">Configure o nome da sua loja para criar seu link</p></div></div>
        )}

        <div className="px-4 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Personalize sua loja</h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">NOME DA SUA LOJA</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Loja da Maria" className="w-full text-xl font-bold text-gray-800 border-0 focus:ring-0 p-0 placeholder:text-gray-300" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">DESCRIÇÃO (OPCIONAL)</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 100))} placeholder="Ex: Os melhores produtos para você!" rows={2} className="w-full text-gray-700 border-0 focus:ring-0 p-0 resize-none placeholder:text-gray-300" />
            <p className="text-xs text-gray-400 text-right">{bio.length}/100</p>
          </div>

          <button onClick={() => setActiveSection("logo")} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:bg-gray-50">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center"><Camera className="w-6 h-6 text-pink-600" /></div><div className="text-left"><p className="font-semibold text-gray-800">Logo da Loja</p><p className="text-sm text-gray-500">{logoUrl ? "Logo configurada" : "Adicionar sua logo"}</p></div></div>
            <ChevronRight className="text-gray-400" />
          </button>

          <button onClick={() => setActiveSection("banner")} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:bg-gray-50">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-purple-600" /></div><div className="text-left"><p className="font-semibold text-gray-800">Banner</p><p className="text-sm text-gray-500">{bannerUrl ? "Banner configurado" : "Adicionar imagem de capa"}</p></div></div>
            <ChevronRight className="text-gray-400" />
          </button>

          <button onClick={() => setActiveSection("colors")} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:bg-gray-50">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center"><Brush className="w-6 h-6 text-white" /></div><div className="text-left"><p className="font-semibold text-gray-800">Cores</p><p className="text-sm text-gray-500">Escolha as cores da sua loja</p></div></div>
            <div className="flex gap-1"><div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: primaryColor }} /><div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: secondaryColor }} /></div>
          </button>

          <button onClick={() => setActiveSection("styles")} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:bg-gray-50">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><Palette className="w-6 h-6 text-indigo-600" /></div><div className="text-left"><p className="font-semibold text-gray-800">Estilos</p><p className="text-sm text-gray-500">Botões, cards e visual</p></div></div>
            <ChevronRight className="text-gray-400" />
          </button>

          <button onClick={() => setActiveSection("social")} className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between active:bg-gray-50">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Share2 className="w-6 h-6 text-blue-600" /></div><div className="text-left"><p className="font-semibold text-gray-800">Redes Sociais</p><p className="text-sm text-gray-500">{instagram || facebook || phone ? "Configurado" : "Instagram, Facebook, WhatsApp"}</p></div></div>
            <ChevronRight className="text-gray-400" />
          </button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg lg:left-64">
          <button onClick={handleSave} disabled={saving || !storeName} className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${saved ? "bg-green-500 text-white" : saving ? "bg-pink-300 text-white" : !storeName ? "bg-gray-200 text-gray-400" : "bg-gradient-to-r from-pink-500 to-purple-600 text-white"}`}>
            {saving ? (<><Loader2 className="w-6 h-6 animate-spin" />Salvando...</>) : saved ? (<><Check className="w-6 h-6" />Salvo!</>) : (<><Save className="w-6 h-6" />Salvar Alterações</>)}
          </button>
        </div>
      </div>
    );
  }

  // SEÇÃO CORES
  if (activeSection === "colors") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 z-10">
          <button onClick={() => setActiveSection("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100"><X size={24} /></button>
          <h1 className="text-xl font-bold">Cores da Loja</h1>
        </div>
        <div className="p-6 text-white text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          <p className="text-white/80 text-sm mb-2">PREVIEW</p>
          <h2 className="text-2xl font-bold">{storeName || "Sua Loja"}</h2>
        </div>
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4 px-2">ESCOLHA UMA COR</h3>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button key={preset.name} onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); setShowCustomColor(false); }} className={`p-4 rounded-2xl border-2 transition-all ${primaryColor === preset.primary && !showCustomColor ? "border-gray-900 scale-105 shadow-lg" : "border-gray-200 bg-white"}`}>
                  <div className="h-12 rounded-xl mb-3" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                  <p className="font-medium text-gray-800">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <button onClick={() => setShowCustomColor(!showCustomColor)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 rounded-xl" /><div className="text-left"><p className="font-semibold text-gray-800">Cor Personalizada</p><p className="text-sm text-gray-500">Escolha qualquer cor</p></div></div>
              <ChevronRight className={`text-gray-400 transition-transform ${showCustomColor ? "rotate-90" : ""}`} />
            </button>
            {showCustomColor && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <div><label className="block text-sm text-gray-500 mb-2">Cor Principal</label><div className="flex items-center gap-3"><input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-12 rounded-xl cursor-pointer border-2 border-gray-200" /><input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm" /></div></div>
                <div><label className="block text-sm text-gray-500 mb-2">Cor Secundária</label><div className="flex items-center gap-3"><input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-16 h-12 rounded-xl cursor-pointer border-2 border-gray-200" /><input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm" /></div></div>
              </div>
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:left-64"><button onClick={() => setActiveSection("main")} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"><Check className="inline w-6 h-6 mr-2" />Confirmar Cor</button></div>
      </div>
    );
  }

  // SEÇÃO ESTILOS
  if (activeSection === "styles") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 z-10">
          <button onClick={() => setActiveSection("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100"><X size={24} /></button>
          <h1 className="text-xl font-bold">Estilos</h1>
        </div>
        <div className="p-4 space-y-6">
          
          {/* BARRA DE ANÚNCIO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">📢 Barra de Anúncio</h3>
                <p className="text-sm text-gray-500">Exibe mensagem no topo do catálogo</p>
              </div>
              <button 
                onClick={() => setThemeSettings({ 
                  ...themeSettings, 
                  announcement_bar: { 
                    ...themeSettings.announcement_bar, 
                    enabled: !themeSettings.announcement_bar?.enabled 
                  } 
                })} 
                className={`w-14 h-8 rounded-full transition-colors ${themeSettings.announcement_bar?.enabled ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.announcement_bar?.enabled ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            
            {themeSettings.announcement_bar?.enabled && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {/* Preview Melhorado */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2 font-medium">Prévia da Barra</label>
                  <div 
                    className="p-4 text-center text-sm font-medium rounded-xl border-2 border-gray-200"
                    style={{ 
                      backgroundColor: themeSettings.announcement_bar?.bg_color || "#000000",
                      color: themeSettings.announcement_bar?.text_color || "#ffffff"
                    }}
                  >
                    {themeSettings.announcement_bar?.text || "Sua mensagem aqui"}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-2 font-medium">Texto do Anúncio</label>
                  <input 
                    type="text" 
                    value={themeSettings.announcement_bar?.text || ""} 
                    onChange={(e) => setThemeSettings({ 
                      ...themeSettings, 
                      announcement_bar: { ...themeSettings.announcement_bar, text: e.target.value } 
                    })} 
                    placeholder="Ex: 🔥 Frete grátis acima de R$ 150!"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{(themeSettings.announcement_bar?.text || "").length}/60</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-2 font-medium">Cor de Fundo</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={themeSettings.announcement_bar?.bg_color || "#000000"} 
                        onChange={(e) => setThemeSettings({ 
                          ...themeSettings, 
                          announcement_bar: { ...themeSettings.announcement_bar, bg_color: e.target.value } 
                        })} 
                        className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300" 
                      />
                      <input 
                        type="text" 
                        value={themeSettings.announcement_bar?.bg_color || "#000000"} 
                        onChange={(e) => setThemeSettings({ 
                          ...themeSettings, 
                          announcement_bar: { ...themeSettings.announcement_bar, bg_color: e.target.value } 
                        })} 
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-2 font-medium">Cor do Texto</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={themeSettings.announcement_bar?.text_color || "#ffffff"} 
                        onChange={(e) => setThemeSettings({ 
                          ...themeSettings, 
                          announcement_bar: { ...themeSettings.announcement_bar, text_color: e.target.value } 
                        })} 
                        className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300" 
                      />
                      <input 
                        type="text" 
                        value={themeSettings.announcement_bar?.text_color || "#ffffff"} 
                        onChange={(e) => setThemeSettings({ 
                          ...themeSettings, 
                          announcement_bar: { ...themeSettings.announcement_bar, text_color: e.target.value } 
                        })} 
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* BORDAS ARREDONDADAS */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Bordas Arredondadas</h3>
            <p className="text-sm text-gray-500 mb-4">Define o arredondamento de cards, imagens e botões</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "none", label: "Sem", radius: "0px" },
                { id: "small", label: "Pouco", radius: "4px" },
                { id: "medium", label: "Médio", radius: "12px" },
                { id: "large", label: "Muito", radius: "24px" },
              ].map((opt) => (
                <button 
                  key={opt.id} 
                  onClick={() => setThemeSettings({ ...themeSettings, border_radius: opt.id as "none" | "small" | "medium" | "large" })} 
                  className={`p-3 border-2 transition-all ${themeSettings.border_radius === opt.id ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}
                  style={{ borderRadius: opt.radius }}
                >
                  <div className="bg-gray-300 h-8 mb-2" style={{ borderRadius: opt.radius }} />
                  <p className="text-xs font-medium text-gray-700">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* ESTILO DA IMAGEM DO PRODUTO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Imagem do Produto</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setThemeSettings({ ...themeSettings, card_image_style: "square" })} 
                className={`p-3 rounded-xl border-2 transition-all ${themeSettings.card_image_style === "square" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}
              >
                <div className="bg-gray-300 h-16 mb-2 rounded-none" />
                <p className="text-xs font-medium text-gray-700">Quadrada</p>
              </button>
              <button 
                onClick={() => setThemeSettings({ ...themeSettings, card_image_style: "rounded" })} 
                className={`p-3 rounded-xl border-2 transition-all ${themeSettings.card_image_style === "rounded" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}
              >
                <div className="bg-gray-300 h-16 mb-2 rounded-xl" />
                <p className="text-xs font-medium text-gray-700">Arredondada</p>
              </button>
            </div>
          </div>

          {/* Estilo do Cabeçalho */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Estilo do Cabeçalho</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setThemeSettings({ ...themeSettings, header_style: "gradient" })} className={`p-4 rounded-xl border-2 transition-all ${themeSettings.header_style === "gradient" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                <div className="h-12 rounded-lg mb-3" style={{ background: `linear-gradient(135deg, ${themeSettings.header_color || primaryColor}, ${secondaryColor})` }} />
                <p className="text-sm font-medium text-gray-700">Degradê</p>
              </button>
              <button onClick={() => setThemeSettings({ ...themeSettings, header_style: "solid" })} className={`p-4 rounded-xl border-2 transition-all ${themeSettings.header_style === "solid" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                <div className="h-12 rounded-lg mb-3" style={{ backgroundColor: themeSettings.header_color || primaryColor }} />
                <p className="text-sm font-medium text-gray-700">Cor Sólida</p>
              </button>
            </div>
            
            {/* Cor Personalizada do Cabeçalho */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">Cor do Cabeçalho</p>
                  <p className="text-xs text-gray-500">Diferente da cor primária</p>
                </div>
                <button 
                  onClick={() => setThemeSettings({ ...themeSettings, header_color: themeSettings.header_color ? undefined : primaryColor })}
                  className={`w-14 h-8 rounded-full transition-colors ${themeSettings.header_color ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.header_color ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
              {themeSettings.header_color && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="color" 
                      value={themeSettings.header_color || primaryColor} 
                      onChange={(e) => setThemeSettings({ ...themeSettings, header_color: e.target.value })} 
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300" 
                    />
                    <input 
                      type="text" 
                      value={themeSettings.header_color || ""} 
                      onChange={(e) => setThemeSettings({ ...themeSettings, header_color: e.target.value })} 
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm" 
                      placeholder="#000000"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">💡 <strong>Dica:</strong> Útil quando sua logo é escura e a cor primária também. Use uma cor clara para o cabeçalho para destacar a logo.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Estilo do Botão de Compra</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setThemeSettings({ ...themeSettings, button_style: "rounded" })} className={`p-4 rounded-xl border-2 transition-all ${themeSettings.button_style === "rounded" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                <div className="flex justify-center mb-3"><div className="px-6 py-2 rounded-full text-white text-sm font-medium" style={{ backgroundColor: themeSettings.button_color || primaryColor }}>Comprar</div></div>
                <p className="text-sm font-medium text-gray-700">Arredondado</p>
              </button>
              <button onClick={() => setThemeSettings({ ...themeSettings, button_style: "square" })} className={`p-4 rounded-xl border-2 transition-all ${themeSettings.button_style === "square" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                <div className="flex justify-center mb-3"><div className="px-6 py-2 rounded-md text-white text-sm font-medium" style={{ backgroundColor: themeSettings.button_color || primaryColor }}>Comprar</div></div>
                <p className="text-sm font-medium text-gray-700">Quadrado</p>
              </button>
            </div>
            
            {/* Cor do Botão */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">Cor do Botão</p>
                  <p className="text-xs text-gray-500">Diferente da cor primária</p>
                </div>
                <button 
                  onClick={() => setThemeSettings({ ...themeSettings, button_color: themeSettings.button_color ? undefined : primaryColor })}
                  className={`w-14 h-8 rounded-full transition-colors ${themeSettings.button_color ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.button_color ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
              {themeSettings.button_color && (
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={themeSettings.button_color || primaryColor} 
                    onChange={(e) => setThemeSettings({ ...themeSettings, button_color: e.target.value })} 
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200" 
                  />
                  <input 
                    type="text" 
                    value={themeSettings.button_color || ""} 
                    onChange={(e) => setThemeSettings({ ...themeSettings, button_color: e.target.value })} 
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm" 
                    placeholder="#000000"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Estilo do Card de Produto</h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setThemeSettings({ ...themeSettings, card_style: "shadow" })} className={`p-3 rounded-xl border-2 transition-all ${themeSettings.card_style === "shadow" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}><div className="bg-white rounded-lg shadow-lg h-16 mb-2" /><p className="text-xs font-medium text-gray-700">Sombra</p></button>
              <button onClick={() => setThemeSettings({ ...themeSettings, card_style: "bordered" })} className={`p-3 rounded-xl border-2 transition-all ${themeSettings.card_style === "bordered" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}><div className="bg-white rounded-lg border-2 border-gray-300 h-16 mb-2" /><p className="text-xs font-medium text-gray-700">Borda</p></button>
              <button onClick={() => setThemeSettings({ ...themeSettings, card_style: "flat" })} className={`p-3 rounded-xl border-2 transition-all ${themeSettings.card_style === "flat" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}><div className="bg-gray-100 rounded-lg h-16 mb-2" /><p className="text-xs font-medium text-gray-700">Simples</p></button>
            </div>
          </div>
          
          {/* TAMANHO DO NOME DO PRODUTO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Tamanho do Nome do Produto</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setThemeSettings({ ...themeSettings, product_name_size: "small" })} 
                className={`p-3 rounded-xl border-2 transition-all ${themeSettings.product_name_size === "small" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}
              >
                <p className="text-xs font-medium text-gray-800 mb-2">Rasteirinha</p>
                <p className="text-xs text-gray-500">Pequeno</p>
              </button>
              <button 
                onClick={() => setThemeSettings({ ...themeSettings, product_name_size: "medium" })} 
                className={`p-3 rounded-xl border-2 transition-all ${themeSettings.product_name_size === "medium" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}
              >
                <p className="text-sm font-medium text-gray-800 mb-2">Rasteirinha</p>
                <p className="text-xs text-gray-500">Médio</p>
              </button>
              <button 
                onClick={() => setThemeSettings({ ...themeSettings, product_name_size: "large" })} 
                className={`p-3 rounded-xl border-2 transition-all ${themeSettings.product_name_size === "large" ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}
              >
                <p className="text-base font-medium text-gray-800 mb-2">Rasteirinha</p>
                <p className="text-xs text-gray-500">Grande</p>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-4">
            <h3 className="font-semibold text-gray-800">Opções do Site</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">Mostrar Preços</p>
                <p className="text-sm text-gray-500">Exibe o preço nos produtos</p>
              </div>
              <button onClick={() => setThemeSettings({ ...themeSettings, show_prices: !themeSettings.show_prices })} className={`w-14 h-8 rounded-full transition-colors ${themeSettings.show_prices ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.show_prices ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            
            {/* REMOVIDO TEMPORARIAMENTE - Produtos Relacionados
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">Produtos Relacionados</p>
                <p className="text-sm text-gray-500">Mostra sugestões na página do produto</p>
              </div>
              <button onClick={() => setThemeSettings({ ...themeSettings, show_related_products: !themeSettings.show_related_products })} className={`w-14 h-8 rounded-full transition-colors ${themeSettings.show_related_products ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.show_related_products ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">Relacionados no Carrinho</p>
                <p className="text-sm text-gray-500">Sugestões no carrinho de compras</p>
              </div>
              <button onClick={() => setThemeSettings({ ...themeSettings, show_related_in_cart: !themeSettings.show_related_in_cart })} className={`w-14 h-8 rounded-full transition-colors ${themeSettings.show_related_in_cart ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.show_related_in_cart ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            */}
          </div>
          
          {/* 🆕 Aviso de Sob Encomenda */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Aviso &quot;Sob Encomenda&quot;
                </h3>
                <p className="text-sm text-gray-500 mt-1">Exibe prazo de entrega nos produtos</p>
              </div>
              <button 
                onClick={() => setThemeSettings({ 
                  ...themeSettings, 
                  delivery_notice: { 
                    ...themeSettings.delivery_notice, 
                    enabled: !themeSettings.delivery_notice?.enabled 
                  } 
                })} 
                className={`w-14 h-8 rounded-full transition-colors ${themeSettings.delivery_notice?.enabled ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.delivery_notice?.enabled ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            
            {themeSettings.delivery_notice?.enabled && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {/* Preview */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-1">📦 Preview:</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    {themeSettings.delivery_notice?.message || "Produzido sob encomenda"} • {themeSettings.delivery_notice?.days || 15} dias
                  </div>
                </div>
                
                {/* Prazo em dias */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo de Entrega (dias)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="60"
                    value={themeSettings.delivery_notice?.days || 15} 
                    onChange={(e) => setThemeSettings({ 
                      ...themeSettings, 
                      delivery_notice: { 
                        ...themeSettings.delivery_notice, 
                        days: parseInt(e.target.value) || 15 
                      } 
                    })} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-lg font-semibold text-center"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">Prazo de produção e entrega</p>
                </div>
                
                {/* Mensagem customizada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem (opcional)
                  </label>
                  <input 
                    type="text" 
                    value={themeSettings.delivery_notice?.message || ""} 
                    onChange={(e) => setThemeSettings({ 
                      ...themeSettings, 
                      delivery_notice: { 
                        ...themeSettings.delivery_notice, 
                        message: e.target.value 
                      } 
                    })} 
                    placeholder="Produzido sob encomenda"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{(themeSettings.delivery_notice?.message || "").length}/50</p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Dica:</strong> Esse aviso aparecerá em todos os produtos do seu catálogo, ideal para lojas que trabalham com produção sob encomenda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:left-64"><button onClick={() => setActiveSection("main")} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"><Check className="inline w-6 h-6 mr-2" />Confirmar</button></div>
      </div>
    );
  }

  // SEÇÃO LOGO
  if (activeSection === "logo") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 z-10">
          <button onClick={() => setActiveSection("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100"><X size={24} /></button>
          <h1 className="text-xl font-bold">Logo da Loja</h1>
        </div>
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
            <div className="flex justify-center mb-4">
              {logoUrl ? (<Image src={logoUrl} alt="Logo" width={128} height={128} className={`h-32 w-auto object-contain ${themeSettings.logo_shape === "circle" ? "rounded-full" : ""}`} />) : (<div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center"><Camera className="w-12 h-12 text-gray-300" /></div>)}
            </div>
            <label className="cursor-pointer"><div className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl font-medium">{uploading === "logo" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}{logoUrl ? "Trocar Logo" : "Enviar Logo"}</div><input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "logo"); }} /></label>
            {logoUrl && (<button onClick={() => setLogoUrl("")} className="block mx-auto mt-3 text-red-500 text-sm font-medium">Remover Logo</button>)}
            <p className="text-xs text-gray-500 mt-4">Dica: Use logo com fundo transparente (PNG)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Formato da Logo</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: "circle", label: "Redonda", Icon: CircleIcon, size: "200x200px" }, { id: "rectangle", label: "Horizontal", Icon: ImageIcon, size: "400x100px" }].map((shape) => (
                <button key={shape.id} onClick={() => setThemeSettings({ ...themeSettings, logo_shape: shape.id as "circle" | "square" | "rectangle" })} className={`p-4 rounded-xl border-2 transition-all ${themeSettings.logo_shape === shape.id ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                  <shape.Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <span className="text-sm font-medium block">{shape.label}</span>
                  <span className="text-xs text-gray-500">{shape.size}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800 font-medium">💡 Dicas importantes:</p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• Use imagem com <strong>fundo transparente (PNG)</strong></li>
                <li>• <strong>Redonda:</strong> ideal para logos circulares (200x200px)</li>
                <li>• <strong>Horizontal:</strong> ideal para logos retangulares (400x100px)</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:left-64"><button onClick={() => setActiveSection("main")} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"><Check className="inline w-6 h-6 mr-2" />Confirmar</button></div>
      </div>
    );
  }

  // SEÇÃO BANNER
  if (activeSection === "banner") {
    const pendingMobile = bannerSubmissions.find(s => s.banner_type === "mobile" && s.status === "pending");
    const pendingDesktop = bannerSubmissions.find(s => s.banner_type === "desktop" && s.status === "pending");
    const rejectedMobile = bannerSubmissions.find(s => s.banner_type === "mobile" && s.status === "rejected");
    const rejectedDesktop = bannerSubmissions.find(s => s.banner_type === "desktop" && s.status === "rejected");
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 z-10">
          <button onClick={() => setActiveSection("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100"><X size={24} /></button>
          <h1 className="text-xl font-bold">Banner da Loja</h1>
        </div>
        
        {/* Aviso de Moderação */}
        <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Banners passam por aprovação</p>
              <p className="text-sm text-amber-700 mt-1">
                Para garantir a qualidade do catálogo, todos os banners são revisados antes de aparecer na sua loja. 
                Use apenas imagens de produtos C4.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Banner Mobile */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold text-gray-800">Banner para Celular</h3>
              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">Recomendado</span>
            </div>
            
            {/* Status pendente */}
            {pendingMobile && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm">Banner aguardando aprovação</span>
                </div>
                <div className="mt-2 aspect-square max-w-[150px] mx-auto bg-gray-100 rounded-lg overflow-hidden relative">
                  <Image src={pendingMobile.image_url} alt="Banner pendente" fill className="object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Status recusado */}
            {rejectedMobile && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Banner recusado</span>
                </div>
                <p className="text-xs text-red-600 mb-2">{rejectedMobile.admin_feedback}</p>
                <p className="text-xs text-gray-500">Envie um novo banner seguindo as diretrizes.</p>
              </div>
            )}
            
            {/* Banner atual aprovado */}
            <div className="aspect-square max-w-[200px] mx-auto bg-gray-100 rounded-xl overflow-hidden relative mb-4">
              {uploading === "banner_mobile" && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              )}
              {bannerMobileUrl ? (
                <>
                  <Image src={bannerMobileUrl} alt="Banner Mobile" fill className="object-cover" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded-full text-xs flex items-center gap-1">
                    <CheckCircle size={12} />
                    Aprovado
                  </div>
                </>
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Enviar para aprovação</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "banner_mobile"); }} />
                </label>
              )}
            </div>
            
            {bannerMobileUrl && !pendingMobile && (
              <div className="space-y-2">
                <label className="block">
                  <div className="text-center cursor-pointer text-pink-600 text-sm font-medium hover:text-pink-700">
                    Enviar novo banner para aprovação
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "banner_mobile"); }} />
                </label>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja remover este banner?')) {
                      setBannerMobileUrl("");
                    }
                  }}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remover Banner Mobile
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-2">Tamanho ideal: 800x800 (quadrado)</p>
          </div>
          
          {/* Banner Desktop */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Banner para Computador</h3>
            </div>
            
            {/* Status pendente */}
            {pendingDesktop && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm">Banner aguardando aprovação</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-lg overflow-hidden relative" style={{ aspectRatio: "16/5" }}>
                  <Image src={pendingDesktop.image_url} alt="Banner pendente" fill className="object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Status recusado */}
            {rejectedDesktop && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Banner recusado</span>
                </div>
                <p className="text-xs text-red-600 mb-2">{rejectedDesktop.admin_feedback}</p>
                <p className="text-xs text-gray-500">Envie um novo banner seguindo as diretrizes.</p>
              </div>
            )}
            
            {/* Banner atual aprovado */}
            <div className="w-full bg-gray-100 rounded-xl overflow-hidden relative mb-4" style={{ aspectRatio: "1920/600" }}>
              {uploading === "banner" && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              )}
              {bannerUrl ? (
                <>
                  <Image src={bannerUrl} alt="Banner Desktop" fill className="object-cover" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded-full text-xs flex items-center gap-1">
                    <CheckCircle size={12} />
                    Aprovado
                  </div>
                </>
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Enviar para aprovação</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "banner"); }} />
                </label>
              )}
            </div>
            
            {bannerUrl && !pendingDesktop && (
              <div className="space-y-2">
                <label className="block">
                  <div className="text-center cursor-pointer text-pink-600 text-sm font-medium hover:text-pink-700">
                    Enviar novo banner para aprovação
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "banner"); }} />
                </label>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja remover este banner?')) {
                      setBannerUrl("");
                    }
                  }}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remover Banner Desktop
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-2">Tamanho ideal: 1920x600 (horizontal)</p>
          </div>
          
          {/* Diretrizes */}
          <div className="bg-gray-100 rounded-xl p-4">
            <h4 className="font-medium text-gray-800 mb-2">📋 Diretrizes para Banners</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Use apenas produtos do catálogo C4</li>
              <li>✓ Imagens de alta qualidade</li>
              <li>✓ Evite texto excessivo na imagem</li>
              <li>✗ Não use produtos de outras marcas</li>
              <li>✗ Não use conteúdo impróprio</li>
            </ul>
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:left-64">
          <button onClick={() => setActiveSection("main")} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <Check className="inline w-6 h-6 mr-2" />Voltar
          </button>
        </div>
      </div>
    );
  }

  // SEÇÃO REDES SOCIAIS
  if (activeSection === "social") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 z-10">
          <button onClick={() => setActiveSection("main")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100"><X size={24} /></button>
          <h1 className="text-xl font-bold">Redes Sociais</h1>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"><Heart className="w-5 h-5 text-white" /></div><div><p className="font-semibold text-gray-800">WhatsApp</p><p className="text-xs text-gray-500">Para receber pedidos</p></div></div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"><span className="text-white font-bold">@</span></div><div><p className="font-semibold text-gray-800">Instagram</p><p className="text-xs text-gray-500">Opcional</p></div></div>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden"><span className="px-3 py-3 bg-gray-50 text-gray-500">@</span><input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value.replace("@", ""))} placeholder="seuinstagram" className="flex-1 px-3 py-3 border-0 text-lg" /></div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">f</span></div><div><p className="font-semibold text-gray-800">Facebook</p><p className="text-xs text-gray-500">Opcional</p></div></div>
            <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Link ou nome da página" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between"><div><p className="font-semibold text-gray-800">Botão WhatsApp Flutuante</p><p className="text-sm text-gray-500">Aparece no canto da tela</p></div><button onClick={() => setThemeSettings({ ...themeSettings, show_whatsapp_float: !themeSettings.show_whatsapp_float })} className={`w-14 h-8 rounded-full transition-colors ${themeSettings.show_whatsapp_float ? "bg-green-500" : "bg-gray-300"}`}><div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${themeSettings.show_whatsapp_float ? "translate-x-7" : "translate-x-1"}`} /></button></div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:left-64"><button onClick={() => setActiveSection("main")} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white"><Check className="inline w-6 h-6 mr-2" />Confirmar</button></div>
      </div>
    );
  }

  return null;
}
