"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, X, Loader2, Trash2 } from "lucide-react";
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
  fontSize: number; // em pixels
  show: boolean;
}

interface BannerData {
  templateId: string;
  desktop: {
    titulo: TextConfig;
    subtitulo: TextConfig;
    textoAdicional: TextConfig;
    position: { x: number; y: number };
    alignment: "left" | "center" | "right";
    maxWidth: number; // percentual
  };
  mobile: {
    titulo: TextConfig;
    subtitulo: TextConfig;
    textoAdicional: TextConfig;
    position: { x: number; y: number };
    alignment: "left" | "center" | "right";
    maxWidth: number; // percentual
  };
  fontStyle: "classic" | "modern" | "elegant" | "bold";
}

interface BannerEditorProps {
  onSave: (bannerData: BannerData) => Promise<void>;
  onCancel: () => void;
}

// Combinações harmônicas de fontes
const FONT_COMBINATIONS = {
  classic: {
    name: "Clássica",
    description: "Elegante e atemporal",
    example: {
      title: "Grande Lançamento",
      subtitle: "Coleção Primavera 2026",
      text: "Frete grátis acima de R$ 200"
    },
    desktop: {
      title: "font-serif font-bold text-5xl",
      subtitle: "font-sans font-light text-2xl tracking-wide",
      text: "font-sans text-lg"
    },
    mobile: {
      title: "font-serif font-bold text-3xl",
      subtitle: "font-sans font-light text-xl tracking-wide",
      text: "font-sans text-base"
    }
  },
  modern: {
    name: "Moderna",
    description: "Limpa e contemporânea",
    example: {
      title: "NOVIDADE NA LOJA",
      subtitle: "Conforto em cada passo",
      text: "Parcelamos em até 3x sem juros"
    },
    desktop: {
      title: "font-sans font-black text-5xl tracking-tight",
      subtitle: "font-sans font-normal text-2xl",
      text: "font-sans font-medium text-lg"
    },
    mobile: {
      title: "font-sans font-black text-3xl tracking-tight",
      subtitle: "font-sans font-normal text-xl",
      text: "font-sans font-medium text-base"
    }
  },
  elegant: {
    name: "Elegante",
    description: "Sofisticada e refinada",
    example: {
      title: "Exclusividade",
      subtitle: "Para você que busca o melhor",
      text: "Peças únicas e selecionadas"
    },
    desktop: {
      title: "font-serif font-semibold italic text-6xl",
      subtitle: "font-serif font-light text-2xl",
      text: "font-serif text-lg tracking-wide"
    },
    mobile: {
      title: "font-serif font-semibold italic text-4xl",
      subtitle: "font-serif font-light text-xl",
      text: "font-serif text-base tracking-wide"
    }
  },
  bold: {
    name: "Impactante",
    description: "Forte e chamativa",
    example: {
      title: "SUPER OFERTA",
      subtitle: "ATÉ 50% OFF",
      text: "APROVEITE AGORA!"
    },
    desktop: {
      title: "font-black uppercase text-6xl tracking-wider",
      subtitle: "font-bold uppercase text-3xl tracking-widest",
      text: "font-bold uppercase text-xl tracking-wide"
    },
    mobile: {
      title: "font-black uppercase text-4xl tracking-wider",
      subtitle: "font-bold uppercase text-2xl tracking-widest",
      text: "font-bold uppercase text-lg tracking-wide"
    }
  }
};

const FONT_STYLES = {
  classic: FONT_COMBINATIONS.classic,
  modern: FONT_COMBINATIONS.modern,
  elegant: FONT_COMBINATIONS.elegant,
  bold: FONT_COMBINATIONS.bold,
};

export default function BannerEditor({ onSave, onCancel }: BannerEditorProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<BannerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState<"desktop" | "mobile">("desktop");
  const [isDraggingDesktop, setIsDraggingDesktop] = useState(false);
  const [isDraggingMobile, setIsDraggingMobile] = useState(false);
  const [bannerData, setBannerData] = useState<BannerData>({
    templateId: "",
    desktop: {
      titulo: { text: "", fontSize: 48, show: true },
      subtitulo: { text: "", fontSize: 24, show: true },
      textoAdicional: { text: "", fontSize: 18, show: true },
      position: { x: 50, y: 50 },
      alignment: "center",
      maxWidth: 80,
    },
    mobile: {
      titulo: { text: "", fontSize: 32, show: true },
      subtitulo: { text: "", fontSize: 20, show: true },
      textoAdicional: { text: "", fontSize: 16, show: true },
      position: { x: 50, y: 50 },
      alignment: "center",
      maxWidth: 85,
    },
    fontStyle: "classic",
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        console.log("🔍 Buscando templates...");
        console.log("👤 User ID:", (await supabase.auth.getUser()).data.user?.id);
        console.log("🔑 Role:", (await supabase.auth.getUser()).data.user?.user_metadata?.role);
        
        const { data, error } = await supabase
          .from("banner_templates")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (error) {
          console.error("❌ Erro ao buscar templates:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error
          });
          throw error;
        }
        console.log("✅ Templates carregados:", data);
        console.log("📊 Total de templates:", data?.length || 0);
        setTemplates(data || []);
      } catch (error) {
        console.error("Erro ao carregar templates:", error);
        alert("Erro ao carregar opções de banners. Verifique se a migration foi aplicada no Supabase.");
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, [supabase]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, mode: "desktop" | "mobile") => {
    setIsDragging(true);
    setDraggingMode(mode);
    updateTextPosition(e);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateTextPosition(e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const updateTextPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Limitar entre 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    if (draggingMode === "desktop") {
      setBannerData({ ...bannerData, textPositionDesktop: { x: clampedX, y: clampedY } });
    } else {
      setBannerData({ ...bannerData, textPositionMobile: { x: clampedX, y: clampedY } });
    }
  };

  const handleSave = async () => {
    if (!selectedTemplateId) {
      alert("Selecione um banner!");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...bannerData,
        templateId: selectedTemplateId,
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar banner");
    } finally {
      setSaving(false);
    }
  };

  const fontStyle = FONT_STYLES[bannerData.fontStyle];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
          <p className="text-gray-600 mt-4">Carregando banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full my-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">✨ Criar Banner Personalizado</h2>
            <p className="text-gray-600 mt-1">
              Escolha um template e personalize os textos
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!selectedTemplateId ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Escolha um Banner
              </h3>
              {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    Nenhum banner disponível no momento.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Entre em contato com o administrador.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className="group relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-pink-500 transition-all hover:shadow-lg"
                    >
                      <div className="aspect-[16/9] relative">
                        <Image
                          src={template.desktop_url}
                          alt={template.nome}
                          fill
                          className="object-cover"
                        />
                      </div>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Personalize os Textos
                  </h3>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Título
                      </label>
                      {bannerData.titulo && (
                        <button
                          onClick={() => setBannerData({ ...bannerData, titulo: "" })}
                          className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={bannerData.titulo}
                      onChange={(e) => setBannerData({ ...bannerData, titulo: e.target.value })}
                      placeholder="Digite o título principal (Ex: Novidade na loja!)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bannerData.titulo.length}/50 caracteres • Use frases curtas e impactantes
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Subtítulo
                      </label>
                      {bannerData.subtitulo && (
                        <button
                          onClick={() => setBannerData({ ...bannerData, subtitulo: "" })}
                          className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={bannerData.subtitulo}
                      onChange={(e) => setBannerData({ ...bannerData, subtitulo: e.target.value })}
                      placeholder="Adicione um subtítulo (Ex: Promoção válida até domingo)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bannerData.subtitulo.length}/60 caracteres
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Texto Adicional (Opcional)
                      </label>
                      {bannerData.textoAdicional && (
                        <button
                          onClick={() => setBannerData({ ...bannerData, textoAdicional: "" })}
                          className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                    <textarea
                      value={bannerData.textoAdicional}
                      onChange={(e) => setBannerData({ ...bannerData, textoAdicional: e.target.value })}
                      placeholder="Informações extras (Ex: Frete grátis • Parcelamos em até 3x)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      rows={3}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bannerData.textoAdicional.length}/100 caracteres • Use para descontos, frete, condições
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Estilo da Fonte
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(FONT_STYLES).map(([key, style]) => (
                        <button
                          key={key}
                          onClick={() => setBannerData({ ...bannerData, fontStyle: key as "classic" | "modern" | "elegant" | "bold" })}
                          className={`p-5 rounded-lg border-2 transition-all text-left ${
                            bannerData.fontStyle === key
                              ? "border-pink-500 bg-pink-50 shadow-lg"
                              : "border-gray-200 hover:border-pink-300 bg-white"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-semibold ${
                                bannerData.fontStyle === key ? "text-pink-700" : "text-gray-900"
                              }`}>
                                {style.name}
                              </p>
                              {bannerData.fontStyle === key && (
                                <span className="text-pink-500">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                              {style.description}
                            </p>
                            <div className="space-y-1 bg-gray-50 rounded p-3">
                              <p className={`${style.desktop.title.replace(/text-\d+xl/, 'text-base')} leading-tight`}>
                                {style.example.title}
                              </p>
                              <p className={`${style.desktop.subtitle.replace(/text-\w+/, 'text-xs')} leading-tight`}>
                                {style.example.subtitle}
                              </p>
                              <p className={`${style.desktop.text.replace(/text-\w+/, 'text-xs')} leading-tight opacity-75`}>
                                {style.example.text}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Preview e Posicionamento</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">💡 Como posicionar o texto:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>Clique e arraste</strong> a caixa de texto nas imagens abaixo</li>
                      <li>• <strong>Desktop</strong> (borda rosa) e <strong>Mobile</strong> (borda roxa) têm posições independentes</li>
                      <li>• Posicione onde o texto fica mais legível sobre sua imagem</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">🖥️ Desktop (1920x600)</p>
                    <div 
                      className="relative w-full aspect-[16/5] bg-gray-100 rounded-lg overflow-hidden border-2 border-pink-300 cursor-crosshair"
                      onMouseDown={(e) => handleDragStart(e, "desktop")}
                      onMouseMove={handleDrag}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                    >
                      <Image
                        src={selectedTemplate!.desktop_url}
                        alt="Preview Desktop"
                        fill
                        className="object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />
                      
                      {/* Caixa de Texto Arrastável */}
                      <div 
                        className="absolute bg-black/60 backdrop-blur-sm rounded-xl p-6 text-center border-2 border-pink-400 shadow-2xl transition-all hover:border-pink-300"
                        style={{
                          left: `${bannerData.textPositionDesktop.x}%`,
                          top: `${bannerData.textPositionDesktop.y}%`,
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '80%',
                          cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                      >
                        {bannerData.titulo && (
                          <h2 className={`${fontStyle.desktop.title} text-white drop-shadow-lg mb-2`}>
                            {bannerData.titulo}
                          </h2>
                        )}
                        {bannerData.subtitulo && (
                          <p className={`${fontStyle.desktop.subtitle} text-white drop-shadow-lg mb-2`}>
                            {bannerData.subtitulo}
                          </p>
                        )}
                        {bannerData.textoAdicional && (
                          <p className={`${fontStyle.desktop.text} text-white/90 drop-shadow-lg`}>
                            {bannerData.textoAdicional}
                          </p>
                        )}
                        {!bannerData.titulo && !bannerData.subtitulo && !bannerData.textoAdicional && (
                          <p className="text-white/50 text-sm">Seus textos aparecerão aqui</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">📱 Mobile (800x800)</p>
                    <div 
                      className="relative w-full max-w-sm mx-auto aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-purple-300 cursor-crosshair"
                      onMouseDown={(e) => handleDragStart(e, "mobile")}
                      onMouseMove={handleDrag}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                    >
                      <Image
                        src={selectedTemplate!.mobile_url}
                        alt="Preview Mobile"
                        fill
                        className="object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />
                      
                      {/* Caixa de Texto Arrastável */}
                      <div 
                        className="absolute bg-black/60 backdrop-blur-sm rounded-xl p-4 text-center border-2 border-purple-400 shadow-2xl transition-all hover:border-purple-300"
                        style={{
                          left: `${bannerData.textPositionMobile.x}%`,
                          top: `${bannerData.textPositionMobile.y}%`,
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '80%',
                          cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                      >
                        {bannerData.titulo && (
                          <h2 className={`${fontStyle.mobile.title} text-white drop-shadow-lg mb-2`}>
                            {bannerData.titulo}
                          </h2>
                        )}
                        {bannerData.subtitulo && (
                          <p className={`${fontStyle.mobile.subtitle} text-white drop-shadow-lg mb-2`}>
                            {bannerData.subtitulo}
                          </p>
                        )}
                        {bannerData.textoAdicional && (
                          <p className={`${fontStyle.mobile.text} text-white/90 drop-shadow-lg`}>
                            {bannerData.textoAdicional}
                          </p>
                        )}
                        {!bannerData.titulo && !bannerData.subtitulo && !bannerData.textoAdicional && (
                          <p className="text-white/50 text-xs">Seus textos aparecerão aqui</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando para Aprovação...
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
      </div>
    </div>
  );
}
