"use client";

import { ExternalLink, Sparkles, TrendingUp, Calculator, CheckCircle } from 'lucide-react';

interface PromoLucroCertoProps {
  variant?: 'inline' | 'banner' | 'sidebar';
  context?: string;
}

export default function PromoLucroCerto({ variant = 'inline', context }: PromoLucroCertoProps) {
  const linkUrl = "https://sistemalucrocerto.com/?utm_source=c4franquias&utm_medium=academy&utm_campaign=upsell";

  // Variant: Banner flutuante/fixo
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Calculator className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">
              Cansada de fazer contas no papel?
            </h3>
            <p className="text-white/90 text-sm">
              O <span className="font-semibold">Sistema Lucro Certo</span> calcula tudo automaticamente: 
              preço ideal, margem real, controle de estoque e muito mais!
            </p>
          </div>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold 
                     hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl
                     flex items-center gap-2 whitespace-nowrap"
          >
            Testar 7 Dias Grátis
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // Variant: Sidebar card compacto
  if (variant === 'sidebar') {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
            Recomendado
          </span>
        </div>
        <h4 className="font-bold text-gray-900 mb-2">Sistema Lucro Certo</h4>
        <p className="text-sm text-gray-600 mb-4">
          Automatize toda sua precificação e controle financeiro.
        </p>
        <ul className="space-y-2 mb-4">
          {['Precificação automática', 'Controle de estoque', 'Catálogo digital'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-emerald-600 text-white text-center py-3 rounded-xl font-semibold
                   hover:bg-emerald-700 transition-colors text-sm"
        >
          Conhecer o Lucro Certo
        </a>
      </div>
    );
  }

  // Variant: Inline (dentro do conteúdo)
  return (
    <div className="my-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Decoração */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wide">
            Solução Profissional
          </span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {context || "Achou complicado calcular tudo isso na mão?"}
        </h3>
        
        <p className="text-gray-300 mb-6 text-lg leading-relaxed">
          O <span className="text-emerald-400 font-semibold">Sistema Lucro Certo</span> faz 
          automaticamente o que você acabou de aprender. Precificação inteligente, 
          controle de estoque, catálogo digital e muito mais.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white 
                     px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 
                     transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
          >
            Quero Testar o Lucro Certo
            <ExternalLink className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            7 dias grátis, sem cartão
          </div>
        </div>
      </div>
    </div>
  );
}
