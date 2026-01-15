"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Check, 
  X, 
  Loader2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ChevronLeft,
  ChevronRight,
  Type,
  Palette,
  Layout,
  SlidersHorizontal,
  Eye,
  Monitor,
  Smartphone,
  Minus,
  Plus,
  Move
} from "lucide-react";
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
  lineSpacing: number;
  letterSpacing: number;
  desktopFontSize: number;
  mobileFontSize: number;
  textColor: string;
  customDesktopUrl?: string;
  customMobileUrl?: string;
}

interface BannerEditorProps {
  onSave: (bannerData: BannerData) => Promise<void>;
  onCancel: () => void;
}

// Combinações de fontes
const FONT_COMBINATIONS = [
  { name: "Elegante Clássica", title: "Playfair Display", body: "Lato", titleWeight: "700", bodyWeight: "400" },
  { name: "Moderna Limpa", title: "Montserrat", body: "Open Sans", titleWeight: "600", bodyWeight: "400" },
  { name: "Impacto Total", title: "Bebas Neue", body: "Roboto", titleWeight: "400", bodyWeight: "400" },
  { name: "Manuscrita Elegante", title: "Dancing Script", body: "Raleway", titleWeight: "700", bodyWeight: "400" },
  { name: "Retrô Divertida", title: "Lobster", body: "Lato", titleWeight: "400", bodyWeight: "400" },
  { name: "Ultra Moderna", title: "Oswald", body: "Poppins", titleWeight: "600", bodyWeight: "400" },
  { name: "Clássica Séria", title: "Merriweather", body: "Open Sans", titleWeight: "700", bodyWeight: "400" },
  { name: "Super Forte", title: "Anton", body: "Roboto", titleWeight: "400", bodyWeight: "400" },
];

// Cores pré-definidas
const PRESET_COLORS = [
  "#FFFFFF", "#000000", "#EC4899", "#A855F7", "#3B82F6", "#10B981",
  "#F59E0B", "#F97316", "#EF4444", "#6B7280", "#FBBF24", "#92400E",
];

// Etapas do wizard
type Step = "template" | "text" | "style" | "preview";

export default function BannerEditorFinal({ onSave, onCancel }: BannerEditorProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<BannerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [activeView, setActiveView] = useState<"desktop" | "mobile">("mobile");
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [bannerData, setBannerData] = useState<BannerData>({
    templateId: "",
    titulo: "",
    subtitulo: "",
    textoAdicional: "",
    fontFamily: "Moderna Limpa",
    desktopPosition: { x: 70, y: 20 },
    mobilePosition: { x: 50, y: 15 },
    desktopAlignment: "center",
    mobileAlignment: "center",
    lineSpacing: 4,
    letterSpacing: 0,
    desktopFontSize: 100,
    mobileFontSize: 120,
    textColor: "#FFFFFF",
  });

  // Carregar fontes do Google
  useEffect(() => {
    const combo = FONT_COMBINATIONS.find(f => f.name === bannerData.fontFamily);
    if (combo) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${combo.title.replace(' ', '+')}:wght@${combo.titleWeight}&family=${combo.body.replace(' ', '+')}:wght@${combo.bodyWeight}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [bannerData.fontFamily]);

  // Carregar templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data } = await supabase
          .from("banner_templates")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });
        setTemplates(data || []);
      } catch (error) {
        console.error("Erro ao carregar templates:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [supabase]);

  // Handler de arrastar texto
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
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

  // Salvar
  const handleSave = async () => {
    if (!bannerData.titulo) return;
    setSaving(true);
    try {
      await onSave({
        ...bannerData,
        desktopPosition: { x: Math.round(bannerData.desktopPosition.x), y: Math.round(bannerData.desktopPosition.y) },
        mobilePosition: { x: Math.round(bannerData.mobilePosition.x), y: Math.round(bannerData.mobilePosition.y) },
        desktopFontSize: Math.round(bannerData.desktopFontSize),
        mobileFontSize: Math.round(bannerData.mobileFontSize),
        lineSpacing: Math.round(bannerData.lineSpacing),
        letterSpacing: Math.round(bannerData.letterSpacing),
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === bannerData.templateId);
  const currentPosition = activeView === "desktop" ? bannerData.desktopPosition : bannerData.mobilePosition;
  const currentCombo = FONT_COMBINATIONS.find(c => c.name === bannerData.fontFamily) || FONT_COMBINATIONS[1];

  // Steps config
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "template", label: "Modelo", icon: <Layout className="w-5 h-5" /> },
    { key: "text", label: "Textos", icon: <Type className="w-5 h-5" /> },
    { key: "style", label: "Estilo", icon: <Palette className="w-5 h-5" /> },
    { key: "preview", label: "Finalizar", icon: <Eye className="w-5 h-5" /> },
  ];

  const stepIndex = steps.findIndex(s => s.key === currentStep);
  const canGoNext = currentStep === "template" ? !!bannerData.templateId : 
                    currentStep === "text" ? !!bannerData.titulo : true;

  // Componente de Preview do Banner (reutilizado)
  const BannerPreview = ({ clickable = false }: { clickable?: boolean }) => {
    if (!selectedTemplate) return null;
    
    const isMobile = activeView === "mobile";
    
    return (
      <div 
        ref={clickable ? previewRef : undefined}
        onClick={clickable ? handleDrag : undefined}
        className={`
          relative rounded-2xl overflow-hidden shadow-xl 
          ${clickable ? "cursor-crosshair" : ""}
          ${isMobile 
            ? "max-w-sm w-full" 
            : "w-full"
          }
          ${isMobile ? "border-4 border-purple-200" : "border-4 border-pink-200"}
        `}
      >
        <Image
          src={isMobile ? selectedTemplate.mobile_url : selectedTemplate.desktop_url}
          alt="Preview"
          width={isMobile ? 800 : 1920}
          height={isMobile ? 800 : 600}
          className="w-full h-auto"
        />
        {/* Texto sobreposto */}
        <div
          className="absolute"
          style={{
            left: `${currentPosition.x}%`,
            top: `${currentPosition.y}%`,
            transform: 'translate(-50%, 0)',
            maxWidth: isMobile ? '85%' : '400px',
            textAlign: isMobile ? bannerData.mobileAlignment : bannerData.desktopAlignment,
            display: 'flex',
            flexDirection: 'column',
            gap: `${bannerData.lineSpacing}px`,
          }}
        >
          {bannerData.titulo && (
            <h2 
              className="font-bold drop-shadow-2xl whitespace-nowrap"
              style={{
                fontFamily: currentCombo.title,
                fontWeight: currentCombo.titleWeight,
                letterSpacing: `${bannerData.letterSpacing}px`,
                fontSize: `calc(${isMobile ? '2rem' : '3rem'} * ${(isMobile ? bannerData.mobileFontSize : bannerData.desktopFontSize) / 100})`,
                color: bannerData.textColor,
              }}
            >
              {bannerData.titulo}
            </h2>
          )}
          {bannerData.subtitulo && (
            <p 
              className="drop-shadow-xl whitespace-nowrap"
              style={{
                fontFamily: currentCombo.body,
                fontWeight: currentCombo.bodyWeight,
                letterSpacing: `${bannerData.letterSpacing}px`,
                fontSize: `calc(${isMobile ? '1rem' : '1.125rem'} * ${(isMobile ? bannerData.mobileFontSize : bannerData.desktopFontSize) / 100})`,
                color: bannerData.textColor,
                opacity: 0.95,
              }}
            >
              {bannerData.subtitulo}
            </p>
          )}
          {bannerData.textoAdicional && (
            <p 
              className="drop-shadow-xl whitespace-nowrap"
              style={{
                fontFamily: currentCombo.body,
                fontWeight: currentCombo.bodyWeight,
                letterSpacing: `${bannerData.letterSpacing}px`,
                fontSize: `calc(${isMobile ? '0.75rem' : '0.875rem'} * ${(isMobile ? bannerData.mobileFontSize : bannerData.desktopFontSize) / 100})`,
                color: bannerData.textColor,
                opacity: 0.9,
              }}
            >
              {bannerData.textoAdicional}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-500">Carregando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header Fixo */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">Criar Banner</h1>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => {
                    if (idx <= stepIndex || (idx === stepIndex + 1 && canGoNext)) {
                      setCurrentStep(step.key);
                    }
                  }}
                  disabled={idx > stepIndex + 1 || (idx === stepIndex + 1 && !canGoNext)}
                  className={`
                    flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
                    ${currentStep === step.key 
                      ? 'text-pink-600' 
                      : idx < stepIndex 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }
                    ${idx <= stepIndex + 1 && (idx <= stepIndex || canGoNext) ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${currentStep === step.key 
                      ? 'bg-pink-100 text-pink-600' 
                      : idx < stepIndex 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}>
                    {idx < stepIndex ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 ${idx < stepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 pb-32">
          
          {/* STEP 1: Escolher Template */}
          {currentStep === "template" && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Escolha um modelo
                </h2>
                <p className="text-gray-500">
                  Selecione a base do seu banner
                </p>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum modelo disponível</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setBannerData({ ...bannerData, templateId: template.id });
                      }}
                      className={`
                        relative group rounded-2xl overflow-hidden transition-all
                        ${bannerData.templateId === template.id 
                          ? 'ring-4 ring-pink-500 ring-offset-2' 
                          : 'ring-1 ring-gray-200 hover:ring-pink-300 hover:ring-2'
                        }
                      `}
                    >
                      <div className="aspect-[4/3] relative">
                        <Image
                          src={template.mobile_url}
                          alt={template.nome}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {template.nome}
                        </p>
                      </div>
                      {bannerData.templateId === template.id && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Textos - Com preview em tempo real */}
          {currentStep === "text" && selectedTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna de controles */}
              <div className="space-y-6 order-2 lg:order-1">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Adicione seus textos
                  </h2>
                  <p className="text-gray-500">
                    Digite e veja em tempo real no banner
                  </p>
                </div>

                <div className="space-y-5 bg-white rounded-2xl p-5 border border-gray-200">
                  {/* Título */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Título principal <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bannerData.titulo}
                      onChange={(e) => setBannerData({ ...bannerData, titulo: e.target.value })}
                      placeholder="Ex: Conforto"
                      className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                               focus:ring-4 focus:ring-pink-100 focus:border-pink-500 
                               transition-all placeholder:text-gray-300"
                      maxLength={40}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Obrigatório</span>
                      <span>{bannerData.titulo.length}/40</span>
                    </div>
                  </div>

                  {/* Subtítulo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={bannerData.subtitulo}
                      onChange={(e) => setBannerData({ ...bannerData, subtitulo: e.target.value })}
                      placeholder="Ex: em cada passo"
                      className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                               focus:ring-4 focus:ring-pink-100 focus:border-pink-500 
                               transition-all placeholder:text-gray-300"
                      maxLength={50}
                    />
                    <div className="flex justify-end text-xs text-gray-400">
                      <span>{bannerData.subtitulo.length}/50</span>
                    </div>
                  </div>

                  {/* Texto adicional */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Texto adicional
                    </label>
                    <input
                      type="text"
                      value={bannerData.textoAdicional}
                      onChange={(e) => setBannerData({ ...bannerData, textoAdicional: e.target.value })}
                      placeholder="Ex: conheça nossa coleção"
                      className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                               focus:ring-4 focus:ring-pink-100 focus:border-pink-500 
                               transition-all placeholder:text-gray-300"
                      maxLength={60}
                    />
                    <div className="flex justify-end text-xs text-gray-400">
                      <span>{bannerData.textoAdicional.length}/60</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna de Preview - Sempre visível */}
              <div className="order-1 lg:order-2 lg:sticky lg:top-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Prévia em tempo real
                    </p>
                    {/* Toggle Mobile/Desktop */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setActiveView("mobile")}
                        className={`p-2 rounded-md transition-all ${
                          activeView === "mobile" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveView("desktop")}
                        className={`p-2 rounded-md transition-all ${
                          activeView === "desktop" ? "bg-pink-500 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <BannerPreview />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Estilo - Com preview em tempo real */}
          {currentStep === "style" && selectedTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna de controles */}
              <div className="space-y-6 order-2 lg:order-1">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Personalize o estilo
                  </h2>
                  <p className="text-gray-500">
                    Ajuste cores, fontes e posição
                  </p>
                </div>

                {/* Controles de Estilo */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Cor do Texto */}
                  <details className="group" open>
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl border-2 border-gray-200" 
                          style={{ backgroundColor: bannerData.textColor }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Cor do texto</p>
                          <p className="text-sm text-gray-500">{bannerData.textColor}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-6 gap-2 mb-4">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setBannerData({ ...bannerData, textColor: color })}
                            className={`
                              w-full aspect-square rounded-xl border-2 transition-all
                              ${bannerData.textColor.toUpperCase() === color 
                                ? 'border-pink-500 scale-110 shadow-lg' 
                                : 'border-gray-200 hover:scale-105'
                              }
                            `}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={bannerData.textColor}
                          onChange={(e) => setBannerData({ ...bannerData, textColor: e.target.value })}
                          className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-200"
                        />
                        <input
                          type="text"
                          value={bannerData.textColor}
                          onChange={(e) => setBannerData({ ...bannerData, textColor: e.target.value })}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-mono uppercase text-center"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </details>

                  {/* Fonte */}
                  <details className="group border-t border-gray-100">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                          <Type className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Fonte</p>
                          <p className="text-sm text-gray-500">{bannerData.fontFamily}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-2 max-h-64 overflow-y-auto">
                      {FONT_COMBINATIONS.map((combo) => (
                        <button
                          key={combo.name}
                          onClick={() => setBannerData({ ...bannerData, fontFamily: combo.name })}
                          className={`
                            w-full p-4 rounded-xl border-2 text-left transition-all
                            ${bannerData.fontFamily === combo.name 
                              ? 'border-pink-500 bg-pink-50' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <p 
                            className="text-xl font-bold mb-1" 
                            style={{ fontFamily: combo.title, fontWeight: combo.titleWeight }}
                          >
                            {combo.name}
                          </p>
                          <p 
                            className="text-sm text-gray-500"
                            style={{ fontFamily: combo.body, fontWeight: combo.bodyWeight }}
                          >
                            Subtítulo de exemplo
                          </p>
                        </button>
                      ))}
                    </div>
                  </details>

                  {/* Ajustes Finos */}
                  <details className="group border-t border-gray-100">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Ajustes finos</p>
                          <p className="text-sm text-gray-500">Tamanho e espaçamento</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-6">
                      {/* Tamanho da Fonte */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Tamanho ({activeView})</span>
                          <span className="text-sm font-bold text-pink-600">
                            {activeView === "desktop" ? bannerData.desktopFontSize : bannerData.mobileFontSize}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setBannerData({
                              ...bannerData,
                              [activeView === "desktop" ? "desktopFontSize" : "mobileFontSize"]: 
                                Math.max(70, (activeView === "desktop" ? bannerData.desktopFontSize : bannerData.mobileFontSize) - 5)
                            })}
                            className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
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
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                          />
                          <button
                            onClick={() => setBannerData({
                              ...bannerData,
                              [activeView === "desktop" ? "desktopFontSize" : "mobileFontSize"]: 
                                Math.min(150, (activeView === "desktop" ? bannerData.desktopFontSize : bannerData.mobileFontSize) + 5)
                            })}
                            className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Espaçamento entre linhas */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Espaço entre linhas</span>
                          <span className="text-sm text-gray-500">{bannerData.lineSpacing}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={bannerData.lineSpacing}
                          onChange={(e) => setBannerData({ ...bannerData, lineSpacing: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>

                      {/* Espaçamento entre letras */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Espaço entre letras</span>
                          <span className="text-sm text-gray-500">{bannerData.letterSpacing}px</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="10"
                          value={bannerData.letterSpacing}
                          onChange={(e) => setBannerData({ ...bannerData, letterSpacing: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>
                  </details>

                  {/* Alinhamento */}
                  <details className="group border-t border-gray-100">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                          <AlignCenter className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Alinhamento</p>
                          <p className="text-sm text-gray-500">Posição do texto</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-500 mb-3">
                        Alinhamento para {activeView === "desktop" ? "Desktop" : "Mobile"}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "left", icon: AlignLeft, label: "Esquerda" },
                          { value: "center", icon: AlignCenter, label: "Centro" },
                          { value: "right", icon: AlignRight, label: "Direita" },
                        ].map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            onClick={() => setBannerData({
                              ...bannerData,
                              [activeView === "desktop" ? "desktopAlignment" : "mobileAlignment"]: value as "left" | "center" | "right"
                            })}
                            className={`
                              p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                              ${(activeView === "desktop" ? bannerData.desktopAlignment : bannerData.mobileAlignment) === value
                                ? 'border-pink-500 bg-pink-50 text-pink-600'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                              }
                            `}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Coluna de Preview - Sempre visível */}
              <div className="order-1 lg:order-2 lg:sticky lg:top-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Prévia em tempo real
                    </p>
                    {/* Toggle Mobile/Desktop */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setActiveView("mobile")}
                        className={`p-2 rounded-md transition-all ${
                          activeView === "mobile" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveView("desktop")}
                        className={`p-2 rounded-md transition-all ${
                          activeView === "desktop" ? "bg-pink-500 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <BannerPreview />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preview Final - Posicionamento */}
          {currentStep === "preview" && selectedTemplate && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Posicione o texto
                </h2>
                <p className="text-gray-500 flex items-center justify-center gap-2">
                  <Move className="w-4 h-4" />
                  Clique na imagem para mover o texto
                </p>
              </div>

              {/* Toggle Desktop/Mobile */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setActiveView("mobile")}
                  className={`
                    px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                    ${activeView === "mobile" 
                      ? 'bg-purple-500 text-white shadow-lg' 
                      : 'bg-white text-gray-600 border border-gray-200'
                    }
                  `}
                >
                  <Smartphone className="w-5 h-5" />
                  Mobile
                </button>
                <button
                  onClick={() => setActiveView("desktop")}
                  className={`
                    px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                    ${activeView === "desktop" 
                      ? 'bg-pink-500 text-white shadow-lg' 
                      : 'bg-white text-gray-600 border border-gray-200'
                    }
                  `}
                >
                  <Monitor className="w-5 h-5" />
                  Desktop
                </button>
              </div>

              {/* Preview Clicável */}
              <div className="flex justify-center">
                <BannerPreview clickable />
              </div>

              <p className="text-center text-sm text-gray-500">
                Posição atual: X: {Math.round(currentPosition.x)}%, Y: {Math.round(currentPosition.y)}%
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Fixo - Navegação */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          {stepIndex > 0 && (
            <button
              onClick={() => setCurrentStep(steps[stepIndex - 1].key)}
              className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 
                       hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}
          
          {currentStep !== "preview" ? (
            <button
              onClick={() => setCurrentStep(steps[stepIndex + 1].key)}
              disabled={!canGoNext}
              className={`
                flex-1 py-4 px-6 rounded-xl font-semibold transition-all
                flex items-center justify-center gap-2
                ${canGoNext 
                  ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-200' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Continuar
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !bannerData.titulo}
              className={`
                flex-1 py-4 px-6 rounded-xl font-semibold transition-all
                flex items-center justify-center gap-2
                ${!saving && bannerData.titulo
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Enviar para Aprovação
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
