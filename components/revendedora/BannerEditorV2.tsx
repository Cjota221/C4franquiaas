"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Check, X, Loader2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BannerTemplate {
  id: string;
  nome: string;
  desktop_url: string;
  mobile_url: string;
  ativo: boolean;
  ordem: number;
}

interface TextConfig {
  text: string;
  fontSize: number;
  show: boolean;
}

interface FormatConfig {
  titulo: TextConfig;
  subtitulo: TextConfig;
  textoAdicional: TextConfig;
  position: { x: number; y: number };
  alignment: "left" | "center" | "right";
  maxWidth: number;
  lineSpacing: number; // espaço entre as linhas (em pixels)
  padding: number; // padding interno da caixa (em pixels)
}

interface BannerData {
  templateId: string;
  desktop: FormatConfig;
  mobile: FormatConfig;
  fontFamily: "serif" | "sans" | "mono";
}

interface BannerEditorProps {
  onSave: (bannerData: BannerData) => Promise<void>;
  onCancel: () => void;
}

export default function BannerEditorV2({ onSave, onCancel }: BannerEditorProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<BannerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");
  
  const [bannerData, setBannerData] = useState<BannerData>({
    templateId: "",
    desktop: {
      titulo: { text: "", fontSize: 48, show: true },
      subtitulo: { text: "", fontSize: 24, show: true },
      textoAdicional: { text: "", fontSize: 18, show: true },
      position: { x: 50, y: 50 },
      alignment: "center",
      maxWidth: 80,
      lineSpacing: 16,
      padding: 24,
    },
    mobile: {
      titulo: { text: "", fontSize: 32, show: true },
      subtitulo: { text: "", fontSize: 20, show: true },
      textoAdicional: { text: "", fontSize: 16, show: true },
      position: { x: 50, y: 50 },
      alignment: "center",
      maxWidth: 85,
      lineSpacing: 12,
      padding: 20,
    },
    fontFamily: "sans",
  });

  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("banner_templates")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (error) {
          console.error("❌ Erro ao carregar templates:", error);
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error("❌ Erro inesperado:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [supabase]);

  const updateText = (format: "desktop" | "mobile", field: "titulo" | "subtitulo" | "textoAdicional", value: string) => {
    setBannerData({
      ...bannerData,
      [format]: {
        ...bannerData[format],
        [field]: {
          ...bannerData[format][field],
          text: value,
        },
      },
    });
  };

  const updateFontSize = (format: "desktop" | "mobile", field: "titulo" | "subtitulo" | "textoAdicional", size: number) => {
    setBannerData({
      ...bannerData,
      [format]: {
        ...bannerData[format],
        [field]: {
          ...bannerData[format][field],
          fontSize: size,
        },
      },
    });
  };

  const updateAlignment = (format: "desktop" | "mobile", alignment: "left" | "center" | "right") => {
    setBannerData({
      ...bannerData,
      [format]: {
        ...bannerData[format],
        alignment,
      },
    });
  };

  const handleDrag = (format: "desktop" | "mobile", e: React.MouseEvent<HTMLDivElement>) => {
    const ref = format === "desktop" ? desktopRef : mobileRef;
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setBannerData({
      ...bannerData,
      [format]: {
        ...bannerData[format],
        position: {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        },
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(bannerData);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const currentFormat = bannerData[activeTab];
  const fontClass = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
  }[bannerData.fontFamily];

  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[currentFormat.alignment];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          ✨ Criar Banner Personalizado ✨
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {!selectedTemplateId ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Escolha um banner base
          </h3>
          {templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                Nenhum banner disponível no momento.
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
                  className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-pink-500 transition-all"
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
          <button
            onClick={() => setSelectedTemplateId(null)}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            ← Escolher outro banner
          </button>

          {/* Tabs Desktop/Mobile */}
          <div className="border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("desktop")}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === "desktop"
                    ? "text-pink-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                💻 Desktop (1920x600)
                {activeTab === "desktop" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("mobile")}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === "mobile"
                    ? "text-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                📱 Mobile (800x800)
                {activeTab === "mobile" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controles */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">
                {activeTab === "desktop" ? "💻" : "📱"} Editar {activeTab === "desktop" ? "Desktop" : "Mobile"}
              </h3>

              {/* Título */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  value={currentFormat.titulo.text}
                  onChange={(e) => updateText(activeTab, "titulo", e.target.value)}
                  placeholder="Ex: Grande Lançamento"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  maxLength={50}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Tamanho: {currentFormat.titulo.fontSize}px</label>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={currentFormat.titulo.fontSize}
                      onChange={(e) => updateFontSize(activeTab, "titulo", parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Subtítulo */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={currentFormat.subtitulo.text}
                  onChange={(e) => updateText(activeTab, "subtitulo", e.target.value)}
                  placeholder="Ex: Coleção Primavera 2026"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  maxLength={60}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Tamanho: {currentFormat.subtitulo.fontSize}px</label>
                    <input
                      type="range"
                      min="14"
                      max="40"
                      value={currentFormat.subtitulo.fontSize}
                      onChange={(e) => updateFontSize(activeTab, "subtitulo", parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Texto Adicional */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Texto Adicional
                </label>
                <input
                  type="text"
                  value={currentFormat.textoAdicional.text}
                  onChange={(e) => updateText(activeTab, "textoAdicional", e.target.value)}
                  placeholder="Ex: Frete grátis acima de R$ 200"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  maxLength={100}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Tamanho: {currentFormat.textoAdicional.fontSize}px</label>
                    <input
                      type="range"
                      min="12"
                      max="30"
                      value={currentFormat.textoAdicional.fontSize}
                      onChange={(e) => updateFontSize(activeTab, "textoAdicional", parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Alinhamento */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Alinhamento
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateAlignment(activeTab, "left")}
                    className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                      currentFormat.alignment === "left"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <AlignLeft className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => updateAlignment(activeTab, "center")}
                    className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                      currentFormat.alignment === "center"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <AlignCenter className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => updateAlignment(activeTab, "right")}
                    className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                      currentFormat.alignment === "right"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <AlignRight className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Largura */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Largura do texto: {currentFormat.maxWidth}%
                </label>
                <input
                  type="range"
                  min="40"
                  max="95"
                  value={currentFormat.maxWidth}
                  onChange={(e) =>
                    setBannerData({
                      ...bannerData,
                      [activeTab]: {
                        ...currentFormat,
                        maxWidth: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Espaçamento entre linhas */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Espaço entre textos: {currentFormat.lineSpacing}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={currentFormat.lineSpacing}
                  onChange={(e) =>
                    setBannerData({
                      ...bannerData,
                      [activeTab]: {
                        ...currentFormat,
                        lineSpacing: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Controla o espaço entre título, subtítulo e texto adicional
                </p>
              </div>

              {/* Padding interno */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Margem interna: {currentFormat.padding}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="60"
                  value={currentFormat.padding}
                  onChange={(e) =>
                    setBannerData({
                      ...bannerData,
                      [activeTab]: {
                        ...currentFormat,
                        padding: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Espaço interno da caixa ao redor dos textos
                </p>
              </div>

              {/* Tipo de Fonte */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Fonte
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["serif", "sans", "mono"] as const).map((font) => (
                    <button
                      key={font}
                      onClick={() => setBannerData({ ...bannerData, fontFamily: font })}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        bannerData.fontFamily === font
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <p className={font === "serif" ? "font-serif" : font === "sans" ? "font-sans" : "font-mono"}>
                        Aa
                      </p>
                      <p className="text-xs mt-1 capitalize">{font}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Preview
              </h3>
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  💡 Clique e arraste para posicionar o texto
                </p>
                
                <div
                  ref={activeTab === "desktop" ? desktopRef : mobileRef}
                  onClick={(e) => handleDrag(activeTab, e)}
                  className={`relative overflow-hidden rounded-lg cursor-crosshair ${
                    activeTab === "desktop" ? "border-4 border-pink-300" : "border-4 border-purple-300"
                  }`}
                  style={{
                    maxWidth: activeTab === "desktop" ? "100%" : "400px",
                    margin: "0 auto",
                  }}
                >
                  <Image
                    src={activeTab === "desktop" ? selectedTemplate!.desktop_url : selectedTemplate!.mobile_url}
                    alt="Preview"
                    width={activeTab === "desktop" ? 1920 : 800}
                    height={activeTab === "desktop" ? 600 : 800}
                    className="w-full h-auto"
                  />
                  
                  {/* Caixa de texto */}
                  <div
                    className="absolute bg-black/60 backdrop-blur-sm rounded-xl border-2 border-white shadow-2xl"
                    style={{
                      left: `${currentFormat.position.x}%`,
                      top: `${currentFormat.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      maxWidth: `${currentFormat.maxWidth}%`,
                      padding: `${currentFormat.padding}px`,
                    }}
                  >
                    <div className={`${fontClass} ${alignmentClass}`} style={{ display: 'flex', flexDirection: 'column', gap: `${currentFormat.lineSpacing}px` }}>
                      {currentFormat.titulo.text && currentFormat.titulo.show && (
                        <h2
                          className="text-white font-bold drop-shadow-lg leading-tight"
                          style={{ fontSize: `${currentFormat.titulo.fontSize}px` }}
                        >
                          {currentFormat.titulo.text}
                        </h2>
                      )}
                      {currentFormat.subtitulo.text && currentFormat.subtitulo.show && (
                        <p
                          className="text-white/95 drop-shadow-lg leading-tight"
                          style={{ fontSize: `${currentFormat.subtitulo.fontSize}px` }}
                        >
                          {currentFormat.subtitulo.text}
                        </p>
                      )}
                      {currentFormat.textoAdicional.text && currentFormat.textoAdicional.show && (
                        <p
                          className="text-white/85 drop-shadow-lg leading-tight"
                          style={{ fontSize: `${currentFormat.textoAdicional.fontSize}px` }}
                        >
                          {currentFormat.textoAdicional.text}
                        </p>
                      )}
                      {!currentFormat.titulo.text && !currentFormat.subtitulo.text && !currentFormat.textoAdicional.text && (
                        <p className="text-white/50 text-sm">Seus textos aparecerão aqui</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !bannerData.templateId}
              className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Enviar para Aprovação
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
