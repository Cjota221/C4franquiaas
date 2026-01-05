"use client";

import React, { useState } from "react";
import VideoTutorialButton from "@/components/VideoTutorialButton";
import { Type, AlertCircle } from "lucide-react";

export default function EstilosPage() {
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Type className="text-amber-600" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Estilos e Fontes</h1>
        </div>
        <p className="text-gray-600">
          Escolha as fontes, tamanhos e estilos de texto do seu catálogo
        </p>
      </div>

      {showInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">📹 Assista ao Tutorial!</h3>
                <p className="text-sm text-blue-800">
                  Aprenda a personalizar fontes e estilos de texto.
                </p>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="text-blue-600 hover:text-blue-800">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <Type size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Editor de Estilos</h3>
          <p className="text-gray-600 mb-6">
            O editor de estilos será carregado aqui.<br/>Por enquanto, acesse a página principal.
          </p>
          <a
            href="/revendedora/personalizacao"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Ir para Personalização Completa
          </a>
        </div>
      </div>

      <VideoTutorialButton pagina="personalizacao-estilos" />
    </div>
  );
}
