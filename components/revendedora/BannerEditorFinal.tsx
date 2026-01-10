"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Check, X, Loader2, AlignLeft, AlignCenter, AlignRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BannerTemplate {
  id: string;
  nome: string;
  desktop_url: string;
  mobile_url: string;
  ativo: boolean;
  ordem: number;
}

interface BannerData {
  templateId: string;
  titulo: string;
  subtitulo: string;
  textoAdicional: string;
  fontFamily: string;
  desktopPosition: { x: number; y: number };
  mobilePosition: { x: number; y: number };
  desktopAlignment: "left" | "center" | "right";
  mobileAlignment: "left" | "center" | "right";
  lineSpacing: number; // Espa�amento entre linhas (gap)
  letterSpacing: number; // Espa�amento entre letras
  desktopFontSize: number; // Escala de tamanho da fonte no desktop (%)
  mobileFontSize: number; // Escala de tamanho da fonte no mobile (%)
  textColor: string; // Cor do texto (hex)
  customDesktopUrl?: string; // URL customizada para desktop
  customMobileUrl?: string; // URL customizada para mobile
}

interface BannerEditorProps {
  onSave: (bannerData: BannerData) => Promise<void>;
  onCancel: () => void;
}

// Combina��es harm�nicas de fontes (t�tulo + corpo)
const FONT_COMBINATIONS = [
  { 
    name: "Elegante Cl�ssica", 
    title: "Playfair Display", 
    body: "Lato",
    titleWeight: "700",
    bodyWeight: "400",
    style: "Sofisticada e Atemporal"
  },
  { 
    name: "Moderna Limpa", 
    title: "Montserrat", 
    body: "Open Sans",
    titleWeight: "600",
    bodyWeight: "400",
    style: "Geom�trica e Profissional"
  },
  { 
    name: "Impacto Total", 
    title: "Bebas Neue", 
    body: "Roboto",
    titleWeight: "400",
    bodyWeight: "400",
    style: "Forte e Direta"
  },
  { 
    name: "Manuscrita Elegante", 
    title: "Dancing Script", 
    body: "Raleway",
    titleWeight: "700",
    bodyWeight: "400",
    style: "Delicada e Refinada"
  },
  { 
    name: "Retr� Divertida", 
    title: "Lobster", 
    body: "Lato",
    titleWeight: "400",
    bodyWeight: "400",
    style: "Chamativa e Casual"
  },
  { 
    name: "Ultra Moderna", 
    title: "Oswald", 
    body: "Poppins",
    titleWeight: "600",
    bodyWeight: "400",
    style: "Condensada e Arrojada"
  },
  { 
    name: "Cl�ssica S�ria", 
    title: "Merriweather", 
    body: "Open Sans",
    titleWeight: "700",
    bodyWeight: "400",
    style: "Tradicional e Confi�vel"
  },
  { 
    name: "Super Forte", 
    title: "Anton", 
    body: "Roboto",
    titleWeight: "400",
    bodyWeight: "400",
    style: "M�ximo Impacto"
  },
];

export default function BannerEditorFinal({ onSave, onCancel }: BannerEditorProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<BannerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"desktop" | "mobile">("mobile");
  const [showBackground, setShowBackground] = useState(true); // Toggle para mostrar/ocultar fundo
  const [uploadMode, setUploadMode] = useState<"template" | "custom">("template"); // Modo de sele��o
  const [customImages, setCustomImages] = useState<{ desktop: string | null; mobile: string | null }>({ desktop: null, mobile: null });
  const [uploading, setUploading] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  
  const [bannerData, setBannerData] = useState<BannerData>({
    templateId: "",
    titulo: "",
    subtitulo: "",
    textoAdicional: "",
    fontFamily: "Moderna Limpa",
    desktopPosition: { x: 70, y: 20 }, // Canto direito superior
    mobilePosition: { x: 50, y: 15 }, // Centro superior
    desktopAlignment: "center",
    mobileAlignment: "center",
    lineSpacing: 4, // 4px de espa�amento inicial
    letterSpacing: 0, // sem espa�amento extra inicial
    desktopFontSize: 100, // 100% = tamanho padr�o
    mobileFontSize: 120, // 120% = maior no mobile
    textColor: "#FFFFFF", // Branco padr�o
  });

  // Carregar Google Fonts dinamicamente
  useEffect(() => {
    const combo = FONT_COMBINATIONS.find(f => f.name === bannerData.fontFamily);
    if (combo) {
      // Carregar fonte do t�tulo
      const titleLink = document.createElement('link');
      titleLink.href = `https://fonts.googleapis.com/css2?family=${combo.title.replace(' ', '+')}:wght@${combo.titleWeight}&display=swap`;
      titleLink.rel = 'stylesheet';
      document.head.appendChild(titleLink);
      
      // Carregar fonte do corpo
      const bodyLink = document.createElement('link');
      bodyLink.href = `https://fonts.googleapis.com/css2?family=${combo.body.replace(' ', '+')}:wght@${combo.bodyWeight}&display=swap`;
      bodyLink.rel = 'stylesheet';
      document.head.appendChild(bodyLink);
    }
  }, [bannerData.fontFamily]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("banner_templates")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (error) {
          console.error("? Erro ao carregar templates:", error);
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error("? Erro inesperado:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [supabase]);

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const ref = activeView === "desktop" ? desktopRef : mobileRef;
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setBannerData({
      ...bannerData,
      [activeView === "desktop" ? "desktopPosition" : "mobilePosition"]: {
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(10, Math.min(90, y)),
      },
    });
  };

    const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida.");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      console.log("📤 Enviando banner via API:", { type, fileName: file.name, size: file.size });
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type === 'desktop' ? 'header' : 'footer');

      // Fazer requisição para a API
      const response = await fetch('/api/revendedora/banners/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Erro na API:", result);
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      console.log("✅ Upload bem-sucedido via API:", result);

      setCustomImages({
        ...customImages,
        [type]: result.url,
      });

      console.log(`🎉 Upload ${type} concluído com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro no upload ${type}:`, error);
      alert(`Erro ao fazer upload da imagem ${type}. Tente novamente.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!bannerData.titulo) {
      alert("Por favor, preencha pelo menos o t�tulo!");
      return;
    }

    console.log("?? ESTADO BANNER DATA ANTES DE SALVAR:", bannerData);
    console.log("?? CUSTOM IMAGES:", customImages);

    setSaving(true);
    try {
      // Arredondar todos os valores num�ricos antes de salvar
      const dataToSave = {
        ...bannerData,
        desktopPosition: {
          x: Math.round(bannerData.desktopPosition.x),
          y: Math.round(bannerData.desktopPosition.y)
        },
        mobilePosition: {
          x: Math.round(bannerData.mobilePosition.x),
          y: Math.round(bannerData.mobilePosition.y)
        },
        desktopFontSize: Math.round(bannerData.desktopFontSize),
        mobileFontSize: Math.round(bannerData.mobileFontSize),
        lineSpacing: Math.round(bannerData.lineSpacing),
        letterSpacing: Math.round(bannerData.letterSpacing),
        customDesktopUrl: customImages.desktop || undefined,
        customMobileUrl: customImages.mobile || undefined,
      };
      
      console.log("?? ENVIANDO PARA PARENT:", dataToSave);
      
      await onSave(dataToSave);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const currentPosition = activeView === "desktop" ? bannerData.desktopPosition : bannerData.mobilePosition;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">
          ? Criar Banner Personalizado
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {!selectedTemplateId && !customImages.desktop ? (
        <div className="space-y-6">
          {/* Toggle entre Template e Upload Customizado */}
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={() => setUploadMode("template")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                uploadMode === "template"
                  ? "bg-pink-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ?? Escolher Template
            </button>
            <button
              onClick={() => setUploadMode("custom")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                uploadMode === "custom"
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ?? Fazer Upload Pr�prio
            </button>
          </div>

          {uploadMode === "template" ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Escolha um banner base
              </h3>
              {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    Nenhum banner dispon�vel no momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setBannerData({ ...bannerData, templateId: template.id });
                      }}
                      className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-pink-500 transition-all hover:shadow-xl"
                    >
                      <Image
                        src={template.desktop_url}
                        alt={template.nome}
                        width={960}
                        height={300}
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gradient-to-t from-black/60 to-transparent absolute bottom-0 left-0 right-0">
                        <h4 className="text-white font-semibold text-lg">
                          {template.nome}
                        </h4>
                      </div>
                      <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 transition-colors flex items-center justify-center">
                        <span className="bg-pink-500 text-white px-6 py-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                          Selecionar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  ?? Fazer Upload do Seu Banner
                </h3>
                <p className="text-gray-600 mb-6">
                  Fa�a upload das vers�es Desktop e Mobile do seu banner personalizado.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Upload Desktop */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      ?? Banner Desktop (1920x600px recomendado)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCustomUpload(e, "desktop")}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Fazendo upload...</span>
                      </div>
                    )}
                    {customImages.desktop && (
                      <div className="relative w-full aspect-[1920/600] rounded-lg overflow-hidden border-2 border-purple-300">
                        <Image
                          src={customImages.desktop}
                          alt="Preview Desktop"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload Mobile */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      ?? Banner Mobile (800x800px recomendado)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCustomUpload(e, "mobile")}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Fazendo upload...</span>
                      </div>
                    )}
                    {customImages.mobile && (
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-300">
                        <Image
                          src={customImages.mobile}
                          alt="Preview Mobile"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {customImages.desktop && customImages.mobile && (
                  <button
                    onClick={() => {
                      setBannerData({ ...bannerData, templateId: "custom" });
                    }}
                    className="mt-6 w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 font-semibold"
                  >
                    ? Continuar com Estes Banners
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (selectedTemplateId || customImages.desktop) ? (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedTemplateId(null);
              setCustomImages({ desktop: null, mobile: null });
            }}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            ? Escolher outro banner
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
            {/* Coluna Esquerda - Controles (ROL�VEL) - ORDER 2 no mobile */}
            <div className="order-2 lg:order-1 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-4 pb-20 
                          scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-gray-100 
                          hover:scrollbar-thumb-pink-400">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b sticky top-0 bg-white z-10 -mx-6 -mt-6 px-6 pt-6 rounded-t-xl">
                  ?? Textos (sempre em 1 linha)
                </h3>

                {/* T�tulo */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    T�tulo Principal *
                  </label>
                  <input
                    type="text"
                    value={bannerData.titulo}
                    onChange={(e) => setBannerData({ ...bannerData, titulo: e.target.value })}
                    placeholder="Ex: Conforto"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength={40}
                  />
                  <p className="text-xs text-gray-500">
                    {bannerData.titulo.length}/40 � Fonte ajusta automaticamente
                  </p>
                </div>

                {/* Subt�tulo */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Subt�tulo
                  </label>
                  <input
                    type="text"
                    value={bannerData.subtitulo}
                    onChange={(e) => setBannerData({ ...bannerData, subtitulo: e.target.value })}
                    placeholder="Ex: em cada passo"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    {bannerData.subtitulo.length}/50
                  </p>
                </div>

                {/* Texto Adicional */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Texto Adicional
                  </label>
                  <input
                    type="text"
                    value={bannerData.textoAdicional}
                    onChange={(e) => setBannerData({ ...bannerData, textoAdicional: e.target.value })}
                    placeholder="Ex: conhe�a nossa cole��o completa"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500">
                    {bannerData.textoAdicional.length}/60
                  </p>
                </div>
              </div>

              {/* Alinhamento do Texto */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  ?? Alinhamento
                </h3>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    {activeView === "desktop" ? "?? Desktop" : "?? Mobile"}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setBannerData({ 
                        ...bannerData, 
                        [activeView === "desktop" ? "desktopAlignment" : "mobileAlignment"]: "left"
                      })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        (activeView === "desktop" ? bannerData.desktopAlignment : bannerData.mobileAlignment) === "left"
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <AlignLeft className="w-6 h-6 mx-auto" />
                      <p className="text-xs mt-1 text-center">Esquerda</p>
                    </button>
                    <button
                      onClick={() => setBannerData({ 
                        ...bannerData, 
                        [activeView === "desktop" ? "desktopAlignment" : "mobileAlignment"]: "center"
                      })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        (activeView === "desktop" ? bannerData.desktopAlignment : bannerData.mobileAlignment) === "center"
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <AlignCenter className="w-6 h-6 mx-auto" />
                      <p className="text-xs mt-1 text-center">Centro</p>
                    </button>
                    <button
                      onClick={() => setBannerData({ 
                        ...bannerData, 
                        [activeView === "desktop" ? "desktopAlignment" : "mobileAlignment"]: "right"
                      })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        (activeView === "desktop" ? bannerData.desktopAlignment : bannerData.mobileAlignment) === "right"
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <AlignRight className="w-6 h-6 mx-auto" />
                      <p className="text-xs mt-1 text-center">Direita</p>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Alinha o texto dentro da caixa
                  </p>
                </div>
              </div>

              {/* Tamanho da Fonte */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  ?? Tamanho da Fonte
                </h3>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    {activeView === "desktop" ? "?? Desktop" : "?? Mobile"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tamanho</span>
                      <span className="text-sm font-medium text-pink-600">
                        {activeView === "desktop" ? bannerData.desktopFontSize : bannerData.mobileFontSize}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="150"
                      step="5"
                      value={activeView === "desktop" ? bannerData.desktopFontSize : bannerData.mobileFontSize}
                      onChange={(e) => setBannerData({ 
                        ...bannerData, 
                        [activeView === "desktop" ? "desktopFontSize" : "mobileFontSize"]: Number(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>70% (Menor)</span>
                      <span>100% (Padr�o)</span>
                      <span>150% (Maior)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ajusta o tamanho de toda a fonte do texto
                  </p>
                </div>
              </div>

              {/* Espa�amentos */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  ?? Espa�amentos
                </h3>
                
                {/* Espa�amento entre linhas */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Entre linhas: {bannerData.lineSpacing}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={bannerData.lineSpacing}
                    onChange={(e) => setBannerData({ ...bannerData, lineSpacing: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Espa�o entre t�tulo, subt�tulo e texto
                  </p>
                </div>

                {/* Espa�amento entre letras */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Entre letras: {bannerData.letterSpacing}px
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="10"
                    value={bannerData.letterSpacing}
                    onChange={(e) => setBannerData({ ...bannerData, letterSpacing: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Espa�o entre cada letra do texto
                  </p>
                </div>
              </div>

              {/* Cor do Texto */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  ?? Cor do Texto
                </h3>
                
                <div className="space-y-4">
                  {/* Paleta de cores pr�-definidas */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Cores populares:
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: "Branco", color: "#FFFFFF" },
                        { name: "Preto", color: "#000000" },
                        { name: "Rosa", color: "#EC4899" },
                        { name: "Roxo", color: "#A855F7" },
                        { name: "Azul", color: "#3B82F6" },
                        { name: "Verde", color: "#10B981" },
                        { name: "Amarelo", color: "#F59E0B" },
                        { name: "Laranja", color: "#F97316" },
                        { name: "Vermelho", color: "#EF4444" },
                        { name: "Cinza", color: "#6B7280" },
                        { name: "Dourado", color: "#FBBF24" },
                        { name: "Marrom", color: "#92400E" },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setBannerData({ ...bannerData, textColor: preset.color })}
                          className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                            bannerData.textColor.toUpperCase() === preset.color
                              ? "border-pink-500 ring-2 ring-pink-300"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Seletor de cor personalizada */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Ou escolha uma cor personalizada:
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bannerData.textColor}
                        onChange={(e) => setBannerData({ ...bannerData, textColor: e.target.value })}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={bannerData.textColor}
                          onChange={(e) => setBannerData({ ...bannerData, textColor: e.target.value })}
                          placeholder="#FFFFFF"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm uppercase"
                          maxLength={7}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          C�digo da cor (ex: #FFFFFF)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview da cor */}
                  <div className="p-4 rounded-lg bg-gray-900 flex items-center justify-center">
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: bannerData.textColor }}
                    >
                      Preview da Cor
                    </p>
                  </div>
                </div>
              </div>

              {/* Combina��es de Fonte */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  ? Combina��o de Fontes
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {FONT_COMBINATIONS.map((combo) => (
                    <button
                      key={combo.name}
                      onClick={() => setBannerData({ ...bannerData, fontFamily: combo.name })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        bannerData.fontFamily === combo.name
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm">{combo.name}</p>
                          <p className="text-xs text-gray-500">{combo.style}</p>
                        </div>
                        {bannerData.fontFamily === combo.name && (
                          <Check className="w-5 h-5 text-pink-500" />
                        )}
                      </div>
                      <div className="bg-gray-100 rounded p-3 space-y-1">
                        <p className="text-lg font-bold" style={{ fontFamily: combo.title, fontWeight: combo.titleWeight }}>
                          T�tulo Principal
                        </p>
                        <p className="text-sm" style={{ fontFamily: combo.body, fontWeight: combo.bodyWeight }}>
                          Subt�tulo e texto adicional
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita - Preview (FIXO NO TOPO) - ORDER 1 no mobile */}
            <div className="order-1 lg:order-2 sticky top-0 lg:top-6 self-start space-y-4 lg:max-h-[calc(100vh-100px)] lg:overflow-hidden bg-white z-20 pb-4 lg:pb-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    ??? Preview em Tempo Real
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveView("desktop")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeView === "desktop"
                          ? "bg-pink-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      ?? Desktop
                    </button>
                    <button
                      onClick={() => setActiveView("mobile")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeView === "mobile"
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      ?? Mobile
                    </button>
                  </div>
                </div>

                {/* Toggle para mostrar/ocultar fundo */}
                <div className="flex items-center justify-between bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {showBackground ? "Modo Edi��o (com fundo)" : "Resultado Final (sem fundo)"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBackground(!showBackground)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      showBackground
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {showBackground ? "Ver Resultado Final" : "Voltar para Edi��o"}
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                <p className="text-sm text-gray-600 mb-3 sticky top-0 bg-gray-100 pb-2">
                  ?? {showBackground ? "Clique para mover o texto" : "Assim ficar� no site"} (Desktop e Mobile independentes)
                </p>

                {activeView === "desktop" ? (
                  <div
                    ref={desktopRef}
                    onClick={handleDrag}
                    className="relative rounded-lg overflow-hidden border-4 border-pink-300 shadow-xl cursor-crosshair"
                  >
                    <Image
                      src={selectedTemplate ? selectedTemplate.desktop_url : customImages.desktop!}
                      alt="Preview Desktop"
                      width={1920}
                      height={600}
                      className="w-full h-auto"
                    />
                    
                    {/* Texto */}
                    <div
                      className={`absolute rounded-lg ${showBackground ? 'bg-black/30 backdrop-blur-sm' : ''}`}
                      style={{
                        left: `${currentPosition.x}%`,
                        top: `${currentPosition.y}%`,
                        transform: 'translate(-50%, 0)',
                        padding: showBackground ? '12px 20px' : '0',
                        maxWidth: '400px',
                        textAlign: bannerData.desktopAlignment,
                        gap: `${bannerData.lineSpacing}px`,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {(() => {
                        const combo = FONT_COMBINATIONS.find(c => c.name === bannerData.fontFamily) || FONT_COMBINATIONS[0];
                        return (
                          <>
                            {bannerData.titulo && (
                              <h2 
                                className="font-bold drop-shadow-2xl whitespace-nowrap text-3xl"
                                style={{
                                  fontFamily: combo.title,
                                  fontWeight: combo.titleWeight,
                                  letterSpacing: `${bannerData.letterSpacing}px`,
                                  fontSize: `calc(3rem * ${bannerData.desktopFontSize / 100})`,
                                  color: bannerData.textColor,
                                }}
                              >
                                {bannerData.titulo}
                              </h2>
                            )}
                            {bannerData.subtitulo && (
                              <p 
                                className="drop-shadow-xl whitespace-nowrap text-lg"
                                style={{
                                  fontFamily: combo.body,
                                  fontWeight: combo.bodyWeight,
                                  letterSpacing: `${bannerData.letterSpacing}px`,
                                  fontSize: `calc(1.125rem * ${bannerData.desktopFontSize / 100})`,
                                  color: bannerData.textColor,
                                  opacity: 0.95,
                                }}
                              >
                                {bannerData.subtitulo}
                              </p>
                            )}
                            {bannerData.textoAdicional && (
                              <p 
                                className="drop-shadow-xl whitespace-nowrap text-sm"
                                style={{
                                  fontFamily: combo.body,
                                  fontWeight: combo.bodyWeight,
                                  letterSpacing: `${bannerData.letterSpacing}px`,
                                  fontSize: `calc(0.875rem * ${bannerData.desktopFontSize / 100})`,
                                  color: bannerData.textColor,
                                  opacity: 0.9,
                                }}
                              >
                                {bannerData.textoAdicional}
                              </p>
                            )}
                            {!bannerData.titulo && (
                              <p className="text-white/50 text-sm">Digite o t�tulo ??</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div
                    ref={mobileRef}
                    onClick={handleDrag}
                    className="relative rounded-lg overflow-hidden border-4 border-purple-300 shadow-xl max-w-sm mx-auto cursor-crosshair"
                  >
                    <Image
                      src={selectedTemplate ? selectedTemplate.mobile_url : customImages.mobile!}
                      alt="Preview Mobile"
                      width={800}
                      height={800}
                      className="w-full h-auto"
                    />
                    
                    {/* Texto */}
                    <div
                      className={`absolute rounded-lg ${showBackground ? 'bg-black/30 backdrop-blur-sm' : ''}`}
                      style={{
                        left: `${currentPosition.x}%`,
                        top: `${currentPosition.y}%`,
                        transform: 'translate(-50%, 0)',
                        padding: showBackground ? '10px 16px' : '0',
                        maxWidth: '85%',
                        textAlign: bannerData.mobileAlignment,
                        gap: `${bannerData.lineSpacing}px`,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {(() => {
                        const combo = FONT_COMBINATIONS.find(c => c.name === bannerData.fontFamily) || FONT_COMBINATIONS[0];
                        return (
                          <>
                            {bannerData.titulo && (
                              <h2 
                                className="font-bold drop-shadow-2xl whitespace-nowrap text-2xl"
                                style={{
                                  fontFamily: combo.title,
                                  fontWeight: combo.titleWeight,
                                  letterSpacing: `${bannerData.letterSpacing}px`,
                                  fontSize: `calc(2rem * ${bannerData.mobileFontSize / 100})`,
                                  color: bannerData.textColor,
                                }}
                              >
                                {bannerData.titulo}
                              </h2>
                            )}
                            {bannerData.subtitulo && (
                              <p 
                                className="drop-shadow-xl whitespace-nowrap text-base"
                                style={{
                                  fontFamily: combo.body,
                                  fontWeight: combo.bodyWeight,
                                  letterSpacing: `${bannerData.letterSpacing}px`,
                                  fontSize: `calc(1rem * ${bannerData.mobileFontSize / 100})`,
                                  color: bannerData.textColor,
                                  opacity: 0.95,
                                }}
                              >
                                {bannerData.subtitulo}
                              </p>
                            )}
                            {bannerData.textoAdicional && (
                              <p 
                                className="drop-shadow-xl whitespace-nowrap text-xs"
                                style={{
                                  fontFamily: combo.body,
                                  fontWeight: combo.bodyWeight,
                                  letterSpacing: `${bannerData.letterSpacing}px`,
                                  fontSize: `calc(0.75rem * ${bannerData.mobileFontSize / 100})`,
                                  color: bannerData.textColor,
                                  opacity: 0.9,
                                }}
                              >
                                {bannerData.textoAdicional}
                              </p>
                            )}
                            {!bannerData.titulo && (
                              <p className="text-white/50 text-xs">Digite o t�tulo ??</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bot�es de A��o */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !bannerData.titulo}
              className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Enviar para Aprova��o
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
