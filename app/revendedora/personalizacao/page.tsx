"use client";

import React from 'react';
import { Palette, Upload, Save, AlertCircle } from 'lucide-react';

export default function PersonalizacaoRevendedoraPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personalização da Loja</h1>
              <p className="text-gray-600">Configure a aparência da sua loja virtual</p>
            </div>
          </div>
        </div>

        {/* Aviso de Funcionalidade em Desenvolvimento */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Funcionalidade em Desenvolvimento
              </h3>
              <p className="text-amber-800 mb-3">
                A página de personalização está sendo construída e estará disponível em breve.
              </p>
              <p className="text-amber-700 text-sm">
                Em breve você poderá personalizar:
              </p>
              <ul className="list-disc list-inside text-amber-700 text-sm mt-2 space-y-1">
                <li>Logo da sua loja</li>
                <li>Cores e tema</li>
                <li>Banner principal</li>
                <li>Informações de contato</li>
                <li>Redes sociais</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview das Funcionalidades Futuras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Logo */}
          <div className="bg-white rounded-lg shadow p-6 opacity-50">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Logo da Loja</h3>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Palette className="w-12 h-12 text-gray-300" />
            </div>
            <button 
              disabled 
              className="w-full py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Fazer Upload (Em breve)
            </button>
          </div>

          {/* Card Cores */}
          <div className="bg-white rounded-lg shadow p-6 opacity-50">
            <h3 className="font-semibold text-gray-900 mb-4">Cores do Tema</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Cor Principal</label>
                <div className="h-10 bg-gray-100 rounded-lg"></div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Cor Secundária</label>
                <div className="h-10 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Card Banner */}
          <div className="bg-white rounded-lg shadow p-6 opacity-50">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Banner Principal</h3>
            </div>
            <div className="aspect-[16/6] bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Palette className="w-12 h-12 text-gray-300" />
            </div>
            <button 
              disabled 
              className="w-full py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Fazer Upload (Em breve)
            </button>
          </div>

          {/* Card Informações */}
          <div className="bg-white rounded-lg shadow p-6 opacity-50">
            <h3 className="font-semibold text-gray-900 mb-4">Informações de Contato</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">WhatsApp</label>
                <div className="h-10 bg-gray-100 rounded-lg"></div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Instagram</label>
                <div className="h-10 bg-gray-100 rounded-lg"></div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Facebook</label>
                <div className="h-10 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar (Desabilitado) */}
        <div className="mt-8 flex justify-end">
          <button 
            disabled 
            className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Salvar Alterações (Em breve)
          </button>
        </div>
      </div>
    </div>
  );
}
