"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Upload, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BannerEditorPremium from "./BannerEditorPremium";

interface BannerData {
  templateId: string | null;
  customDesktopUrl?: string;
  customMobileUrl?: string;
  titulo?: string;
  subtitulo?: string;
  textoAdicional?: string;
  fontFamily?: string;
  textColor?: string;
  desktopPosition?: { x: number; y: number };
  mobilePosition?: { x: number; y: number };
  desktopAlignment?: string;
  mobileAlignment?: string;
  desktopFontSize?: number;
  mobileFontSize?: number;
  lineSpacing?: number;
  letterSpacing?: number;
}

interface BannerSelectorProps {
  onSave: (bannerData: BannerData) => Promise<void>;
  onCancel: () => void;
}

export default function BannerSelector({ onSave, onCancel }: BannerSelectorProps) {
  const [mode, setMode] = useState<"select" | "template" | "upload" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{
    desktop: string | null;
    mobile: string | null;
  }>({ desktop: null, mobile: null });
  
  const supabase = createClient();

  // Se escolheu template, mostra o editor
  if (mode === "template") {
    return <BannerEditorPremium onSave={onSave} onCancel={() => setMode("select")} />;
  }

  // Se escolheu upload próprio
  if (mode === "upload") {
    const handleCustomUpload = async (file: File, type: "desktop" | "mobile") => {
      setUploading(true);
      try {
        // Obter sessão do Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type === 'desktop' ? 'header' : 'footer');

        const response = await fetch('/api/revendedora/banners/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao fazer upload');
        }

        setUploadedImages(prev => ({
          ...prev,
          [type]: result.url
        }));
        
        alert(`✅ ${type === 'desktop' ? 'Banner Desktop' : 'Banner Mobile'} enviado com sucesso!`);
      } catch (error) {
        console.error("Erro:", error);
        alert(error instanceof Error ? error.message : "Erro ao fazer upload");
      } finally {
        setUploading(false);
      }
    };

    const handleSubmit = async () => {
      if (!uploadedImages.desktop || !uploadedImages.mobile) {
        alert("⚠️ Por favor, faça upload dos banners Desktop e Mobile");
        return;
      }

      // Criar dados do banner customizado (sem template)
      const bannerData = {
        templateId: null, // Null para banners customizados (sem template)
        titulo: "",
        subtitulo: "",
        textoAdicional: "",
        fontFamily: "",
        desktopPosition: { x: 0, y: 0 },
        mobilePosition: { x: 0, y: 0 },
        desktopAlignment: "center" as const,
        mobileAlignment: "center" as const,
        lineSpacing: 0,
        letterSpacing: 0,
        desktopFontSize: 100,
        mobileFontSize: 100,
        textColor: "#FFFFFF",
        customDesktopUrl: uploadedImages.desktop,
        customMobileUrl: uploadedImages.mobile,
      };

      await onSave(bannerData);
    };

    return (
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <button onClick={() => setMode("select")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900">Upload de Banner Próprio</h2>
          <div className="w-20" /> {/* Spacer */}
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              📌 <strong>Importante:</strong> Faça upload dos banners Desktop (1920x600px) e Mobile (800x800px). 
              Ambos serão enviados para aprovação do administrador.
            </p>
          </div>

          {/* Upload Desktop */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">🖥️ Banner Desktop</h3>
            <p className="text-sm text-gray-600 mb-4">Tamanho recomendado: 1920x600px</p>
            
            {uploadedImages.desktop ? (
              <div className="space-y-3">
                <div className="relative aspect-[1920/600] rounded-lg overflow-hidden border-2 border-green-300">
                  <Image src={uploadedImages.desktop} alt="Desktop" fill className="object-cover" unoptimized />
                </div>
                <button
                  onClick={() => setUploadedImages(prev => ({ ...prev, desktop: null }))}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  🗑️ Remover e enviar outro
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="font-medium text-gray-700">Clique para fazer upload</p>
                  <p className="text-sm text-gray-500 mt-1">ou arraste o arquivo aqui</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCustomUpload(file, "desktop");
                  }}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Upload Mobile */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">📱 Banner Mobile</h3>
            <p className="text-sm text-gray-600 mb-4">Tamanho recomendado: 800x800px (quadrado)</p>
            
            {uploadedImages.mobile ? (
              <div className="space-y-3">
                <div className="relative aspect-square max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-green-300">
                  <Image src={uploadedImages.mobile} alt="Mobile" fill className="object-cover" unoptimized />
                </div>
                <button
                  onClick={() => setUploadedImages(prev => ({ ...prev, mobile: null }))}
                  className="text-sm text-red-600 hover:text-red-700 font-medium block mx-auto"
                >
                  🗑️ Remover e enviar outro
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="font-medium text-gray-700">Clique para fazer upload</p>
                  <p className="text-sm text-gray-500 mt-1">ou arraste o arquivo aqui</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCustomUpload(file, "mobile");
                  }}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Botão Enviar */}
          <button
            onClick={handleSubmit}
            disabled={!uploadedImages.desktop || !uploadedImages.mobile || uploading}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              uploadedImages.desktop && uploadedImages.mobile
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Upload className="w-6 h-6" />
            {uploading ? "Enviando..." : "Enviar para Aprovação"}
          </button>
        </div>
      </div>
    );
  }

  // Tela de seleção inicial
  return (
    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
      <div className="border-b border-gray-200 px-6 py-4">
        <button onClick={onCancel} className="text-gray-600 hover:text-gray-900 mb-2">
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Criar Banner da Loja</h2>
        <p className="text-gray-600 mt-1">Escolha como deseja criar seu banner</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opção 1: Templates Prontos */}
        <button
          onClick={() => setMode("template")}
          className="group bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6 hover:border-pink-400 hover:shadow-lg transition-all text-left"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Templates Prontos</h3>
          <p className="text-sm text-gray-600 mb-4">
            Escolha um template profissional e personalize os textos, cores e posições
          </p>
          <div className="flex items-center gap-2 text-pink-600 font-medium">
            <span>Começar agora</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Opção 2: Upload Próprio */}
        <button
          onClick={() => setMode("upload")}
          className="group bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all text-left"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Próprio</h3>
          <p className="text-sm text-gray-600 mb-4">
            Faça upload dos seus próprios banners (Desktop e Mobile) para aprovação
          </p>
          <div className="flex items-center gap-2 text-blue-600 font-medium">
            <span>Fazer upload</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
