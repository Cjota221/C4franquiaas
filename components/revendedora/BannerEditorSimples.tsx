"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, X, Loader2 } from "lucide-react";
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
  fontStyle: "classic" | "modern" | "elegant" | "bold";
  desktopPosition: { x: number; y: number };
  mobilePosition: { x: number; y: number };
}

interface BannerEditorProps {
  onSave: (bannerData: BannerData) => Promise<void>;
  onCancel: () => void;
}

// Combinações de fontes pré-definidas para estilos diferentes
const FONT_COMBINATIONS = {
  classic: {
    name: "Clássico Elegante",
    description: "Elegância atemporal com serifas refinadas",
    preview: {
      title: "Seu Título Aqui",
      subtitle: "Subtítulo Elegante",
      text: "Texto adicional clássico"
    },
    desktop: {
      title: "text-5xl font-bold font-serif tracking-tight",
      subtitle: "text-2xl font-serif italic",
      text: "text-lg font-sans"
    },
    mobile: {
      title: "text-3xl font-bold font-serif tracking-tight",
      subtitle: "text-xl font-serif italic",
      text: "text-base font-sans"
    }
  },
  modern: {
    name: "Moderno Limpo",
    description: "Design minimalista e contemporâneo",
    preview: {
      title: "Seu Título Aqui",
      subtitle: "Subtítulo Moderno",
      text: "Texto adicional clean"
    },
    desktop: {
      title: "text-5xl font-extrabold font-sans tracking-wide",
      subtitle: "text-2xl font-medium font-sans",
      text: "text-lg font-sans"
    },
    mobile: {
      title: "text-3xl font-extrabold font-sans tracking-wide",
      subtitle: "text-xl font-medium font-sans",
      text: "text-base font-sans"
    }
  },
  elegant: {
    name: "Elegante Sofisticado",
    description: "Refinamento com toques delicados",
    preview: {
      title: "Seu Título Aqui",
      subtitle: "Subtítulo Sofisticado",
      text: "Texto adicional refinado"
    },
    desktop: {
      title: "text-5xl font-light font-serif tracking-wider",
      subtitle: "text-2xl font-light font-serif italic",
      text: "text-lg font-serif"
    },
    mobile: {
      title: "text-3xl font-light font-serif tracking-wider",
      subtitle: "text-xl font-light font-serif italic",
      text: "text-base font-serif"
    }
  },
  bold: {
    name: "Forte Impactante",
    description: "Máximo impacto visual e presença",
    preview: {
      title: "SEU TÍTULO AQUI",
      subtitle: "Subtítulo Forte",
      text: "Texto adicional impactante"
    },
    desktop: {
      title: "text-6xl font-black font-sans uppercase tracking-tighter",
      subtitle: "text-2xl font-bold font-sans",
      text: "text-lg font-sans font-semibold"
    },
    mobile: {
      title: "text-4xl font-black font-sans uppercase tracking-tighter",
      subtitle: "text-xl font-bold font-sans",
      text: "text-base font-sans font-semibold"
    }
  }
};

export default function BannerEditorSimples({ onSave, onCancel }: BannerEditorProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<BannerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  const [bannerData, setBannerData] = useState<BannerData>({
    templateId: "",
    titulo: "",
    subtitulo: "",
    textoAdicional: "",
    fontFamily: "",
    fontStyle: "classic",
    desktopPosition: { x: 50, y: 50 },
    mobilePosition: { x: 50, y: 20 },
  });

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

  const handleSave = async () => {
    if (!bannerData.titulo) {
      alert("Por favor, preencha pelo menos o título!");
      return;
    }

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
  const fontStyle = FONT_COMBINATIONS[bannerData.fontStyle];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">
          ✨ Criar Banner Personalizado
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
          <button
            onClick={() => setSelectedTemplateId(null)}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            ← Escolher outro banner
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda - Formulário SIMPLES */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  📝 Preencha os Textos
                </h3>

                {/* Campo 1: Título */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    1️⃣ Título Principal *
                  </label>
                  <input
                    type="text"
                    value={bannerData.titulo}
                    onChange={(e) => setBannerData({ ...bannerData, titulo: e.target.value })}
                    placeholder="Ex: Grande Lançamento"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    {bannerData.titulo.length}/50 caracteres
                  </p>
                </div>

                {/* Campo 2: Subtítulo */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    2️⃣ Subtítulo
                  </label>
                  <input
                    type="text"
                    value={bannerData.subtitulo}
                    onChange={(e) => setBannerData({ ...bannerData, subtitulo: e.target.value })}
                    placeholder="Ex: Coleção Primavera 2026"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500">
                    {bannerData.subtitulo.length}/60 caracteres
                  </p>
                </div>

                {/* Campo 3: Texto Adicional */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    3️⃣ Texto Adicional (Opcional)
                  </label>
                  <input
                    type="text"
                    value={bannerData.textoAdicional}
                    onChange={(e) => setBannerData({ ...bannerData, textoAdicional: e.target.value })}
                    placeholder="Ex: Frete grátis acima de R$ 200"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">
                    {bannerData.textoAdicional.length}/100 caracteres
                  </p>
                </div>
              </div>

              {/* Escolha do Estilo de Fonte */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 pb-3 border-b">
                  🎨 Escolha o Estilo
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(FONT_COMBINATIONS).map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => setBannerData({ ...bannerData, fontStyle: key as "classic" | "modern" | "elegant" | "bold" })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        bannerData.fontStyle === key
                          ? "border-pink-500 bg-pink-50 shadow-lg"
                          : "border-gray-200 hover:border-pink-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className={`font-bold ${
                          bannerData.fontStyle === key ? "text-pink-700" : "text-gray-900"
                        }`}>
                          {style.name}
                        </p>
                        {bannerData.fontStyle === key && (
                          <Check className="w-5 h-5 text-pink-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        {style.description}
                      </p>
                      <div className="bg-gray-100 rounded p-3 space-y-1">
                        <p className={`${style.desktop.title.replace(/text-\d+xl/, 'text-sm')} text-gray-800`}>
                          {style.preview.title}
                        </p>
                        <p className={`${style.desktop.subtitle.replace(/text-\d+xl/, 'text-xs')} text-gray-700`}>
                          {style.preview.subtitle}
                        </p>
                        <p className={`${style.desktop.text.replace(/text-\w+/, 'text-xs')} text-gray-600`}>
                          {style.preview.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita - Preview */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                👁️ Visualização
              </h3>

              {/* Preview Desktop */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">💻 Desktop (1920x600)</p>
                <div className="relative rounded-lg overflow-hidden border-4 border-pink-300 shadow-xl">
                  <Image
                    src={selectedTemplate!.desktop_url}
                    alt="Preview Desktop"
                    width={1920}
                    height={600}
                    className="w-full h-auto"
                  />
                  
                  {/* Texto COMPACTO no canto direito superior */}
                  <div
                    className="absolute bg-black/40 backdrop-blur-sm rounded-lg"
                    style={{
                      right: '5%',
                      top: '8%',
                      padding: '20px 24px',
                      maxWidth: '380px',
                    }}
                  >
                    <div className="text-right space-y-2">
                      {bannerData.titulo && (
                        <h2 className={`${fontStyle.desktop.title} text-white drop-shadow-2xl`}>
                          {bannerData.titulo}
                        </h2>
                      )}
                      {bannerData.subtitulo && (
                        <p className={`${fontStyle.desktop.subtitle} text-white/95 drop-shadow-xl`}>
                          {bannerData.subtitulo}
                        </p>
                      )}
                      {bannerData.textoAdicional && (
                        <p className={`${fontStyle.desktop.text} text-white/90 drop-shadow-xl`}>
                          {bannerData.textoAdicional}
                        </p>
                      )}
                      {!bannerData.titulo && (
                        <p className="text-white/50 text-sm">Digite o título acima ☝️</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Mobile */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">📱 Mobile (800x800)</p>
                <div className="relative rounded-lg overflow-hidden border-4 border-purple-300 shadow-xl max-w-sm mx-auto">
                  <Image
                    src={selectedTemplate!.mobile_url}
                    alt="Preview Mobile"
                    width={800}
                    height={800}
                    className="w-full h-auto"
                  />
                  
                  {/* Texto COMPACTO no topo centralizado */}
                  <div
                    className="absolute bg-black/40 backdrop-blur-sm rounded-lg"
                    style={{
                      left: '50%',
                      top: '8%',
                      transform: 'translateX(-50%)',
                      padding: '16px 20px',
                      maxWidth: '80%',
                    }}
                  >
                    <div className="text-center space-y-1.5">
                      {bannerData.titulo && (
                        <h2 className={`${fontStyle.mobile.title} text-white drop-shadow-2xl`}>
                          {bannerData.titulo}
                        </h2>
                      )}
                      {bannerData.subtitulo && (
                        <p className={`${fontStyle.mobile.subtitle} text-white/95 drop-shadow-xl`}>
                          {bannerData.subtitulo}
                        </p>
                      )}
                      {bannerData.textoAdicional && (
                        <p className={`${fontStyle.mobile.text} text-white/90 drop-shadow-xl`}>
                          {bannerData.textoAdicional}
                        </p>
                      )}
                      {!bannerData.titulo && (
                        <p className="text-white/50 text-xs">Digite o título acima ☝️</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
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
