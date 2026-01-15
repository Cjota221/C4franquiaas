"use client";

import { ExternalLink, Sparkles, TrendingUp, Calculator, CheckCircle, BarChart3, Users, Wallet } from 'lucide-react';

interface PromoLucroCertoProps {
  variant?: 'inline' | 'banner' | 'sidebar';
  context?: string;
}

export default function PromoLucroCerto({ variant = 'inline', context }: PromoLucroCertoProps) {
  const linkUrl = "https://sistemalucrocerto.com/?utm_source=c4franquias&utm_medium=academy&utm_campaign=upsell";

  // Variant: Banner - COMPACTO para mobile
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-tight">
              Cansada das contas?
            </h3>
            <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
              Lucro Certo calcula tudo pra você!
            </p>
          </div>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-white text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm
                     hover:bg-emerald-50 transition-all shadow-md
                     flex items-center gap-1.5 whitespace-nowrap"
          >
            Testar
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Variant: Sidebar card compacto - SEM menção a catálogo
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
          Gestão financeira completa para seu negócio.
        </p>
        <ul className="space-y-2 mb-4">
          {[
            { icon: Wallet, text: 'Precificação automática' },
            { icon: BarChart3, text: 'Controle de vendas' },
            { icon: Users, text: 'Cadastro de clientes' },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-2 text-sm text-gray-700">
              <item.icon className="w-4 h-4 text-emerald-500" />
              {item.text}
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

  // Variant: Inline (dentro do conteúdo) - MAIS COMPACTO
  return (
    <div className="my-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 md:p-6 relative overflow-hidden">
      {/* Decoração - menores */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-500/10 rounded-full blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">
            Gestão Financeira
          </span>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
          {context || "Difícil calcular tudo isso?"}
        </h3>
        
        <p className="text-gray-300 mb-4 text-sm md:text-base leading-relaxed">
          O <span className="text-emerald-400 font-semibold">Sistema Lucro Certo</span> automatiza 
          sua gestão: precificação inteligente, controle de vendas, cadastro de clientes e relatórios completos.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white 
                     px-5 py-3 rounded-xl font-bold text-sm hover:bg-emerald-400 
                     transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
          >
            Testar Lucro Certo
            <ExternalLink className="w-4 h-4" />
          </a>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            7 dias grátis
          </div>
        </div>
      </div>
    </div>
  );
}
