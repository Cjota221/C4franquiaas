"use client";

import React, { useState } from "react";
import VideoTutorialButton from "@/components/VideoTutorialButton";
import { Image as ImageIcon, Upload, AlertCircle } from "lucide-react";

export default function BannerPage() {
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-pink-100 rounded-lg">
            <ImageIcon className="text-pink-600" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Banners Personalizados
          </h1>
        </div>
        <p className="text-gray-600">
          Crie banners personalizados para desktop e mobile usando nosso editor visual
        </p>
      </div>

      {/* Info Box */}
      {showInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  📹 Assista ao Tutorial!
                </h3>
                <p className="text-sm text-blue-800">
                  Não sabe como criar banners? Clique no botão flutuante no canto inferior direito para assistir ao vídeo tutorial.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal - Editor de Banner */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <Upload size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Editor de Banners
          </h3>
          <p className="text-gray-600 mb-6">
            O editor visual de banners será carregado aqui.<br/>
            Por enquanto, acesse a página principal de Personalização.
          </p>
          <a
            href="/revendedora/personalizacao"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Ir para Personalização Completa
          </a>
        </div>
      </div>

      {/* Botão de Tutorial */}
      <VideoTutorialButton pagina="personalizacao-banner" />
    </div>
  );
}
