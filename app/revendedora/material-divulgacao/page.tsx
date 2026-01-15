"use client";

import { useEffect, useState } from 'react';
import { 
  FolderOpen, 
  ExternalLink, 
  Camera, 
  Clock, 
  Music2, 
  AtSign, 
  Sparkles,
  Download,
  ImageIcon,
  Video,
  Star,
  Zap
} from 'lucide-react';

// 🔧 CONFIGURAÇÃO: Link do Google Drive (fácil de trocar)
const GOOGLE_DRIVE_LINK = "https://drive.google.com/drive/folders/SEU_ID_AQUI";

// Dicas de postagem
const dicasPostagem = [
  {
    icon: Clock,
    titulo: "Poste Todo Dia",
    descricao: "Consistência é a chave! Poste pelo menos 1x por dia nos stories.",
    cor: "pink"
  },
  {
    icon: Music2,
    titulo: "Use Áudios em Alta",
    descricao: "Vídeos com músicas virais têm 3x mais alcance. Fique de olho nas trends!",
    cor: "purple"
  },
  {
    icon: AtSign,
    titulo: "Marque a Gente",
    descricao: "Ao postar, marque nosso perfil. Repostamos as melhores vendedoras!",
    cor: "blue"
  }
];

// Estatísticas do banco de mídia
const estatisticas = [
  { label: "Fotos HD", valor: "200+", icon: ImageIcon },
  { label: "Vídeos Prontos", valor: "50+", icon: Video },
  { label: "Atualizações", valor: "Semanais", icon: Sparkles },
];

export default function MaterialDivulgacaoPage() {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Atualizar título para Analytics
    document.title = "Material de Divulgação | C4 Franquias";
    
    // Trigger animação de entrada
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  const handleAcessarDrive = () => {
    window.open(GOOGLE_DRIVE_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className={`mb-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Material de Divulgação
          </h1>
          <p className="text-gray-600 mt-1">
            Conteúdo exclusivo para você arrasar nas vendas! 🚀
          </p>
        </div>

        {/* ✨ HERO CARD - Destaque Principal */}
        <div className={`
          relative overflow-hidden
          bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600
          rounded-3xl shadow-2xl
          p-6 md:p-10
          mb-8
          transition-all duration-700 delay-100
          ${animateIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
        `}>
          {/* Decorações de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Conteúdo */}
          <div className="relative z-10 text-center">
            {/* Ícone Principal */}
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
              <FolderOpen className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            
            {/* Título */}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
              Acesse nosso Banco de
              <span className="block mt-1">Imagens & Vídeos</span>
            </h2>
            
            {/* Subtítulo */}
            <p className="text-white/90 text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Baixe fotos em alta qualidade e vídeos prontos para postar nas suas 
              redes sociais e <span className="font-semibold text-yellow-200">vender mais!</span>
            </p>

            {/* Estatísticas Mini */}
            <div className="flex justify-center gap-4 md:gap-8 mb-8">
              {estatisticas.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg mb-2 mx-auto">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">{stat.valor}</p>
                  <p className="text-xs md:text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* 🎯 BOTÃO CTA */}
            <button
              onClick={handleAcessarDrive}
              className="
                group
                inline-flex items-center gap-3
                bg-white text-purple-600
                px-8 py-4 md:px-10 md:py-5
                rounded-2xl
                font-bold text-lg md:text-xl
                shadow-xl hover:shadow-2xl
                transform hover:scale-105 active:scale-100
                transition-all duration-300
              "
            >
              <Download className="w-6 h-6 group-hover:animate-bounce" />
              Acessar Pasta do Drive
              <ExternalLink className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Texto auxiliar */}
            <p className="text-white/60 text-sm mt-4 flex items-center justify-center gap-2">
              <Star className="w-4 h-4" />
              Atualizado toda semana com novidades
              <Star className="w-4 h-4" />
            </p>
          </div>
        </div>

        {/* 💡 SEÇÃO DE DICAS */}
        <div className={`
          transition-all duration-700 delay-300
          ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              Dicas para Bombar nas Redes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dicasPostagem.map((dica, index) => {
              const Icon = dica.icon;
              const corClasses = {
                pink: "bg-pink-100 text-pink-600 border-pink-200",
                purple: "bg-purple-100 text-purple-600 border-purple-200",
                blue: "bg-blue-100 text-blue-600 border-blue-200"
              };
              const iconBg = {
                pink: "bg-pink-500",
                purple: "bg-purple-500",
                blue: "bg-blue-500"
              };

              return (
                <div 
                  key={index}
                  className={`
                    bg-white rounded-2xl p-5 
                    border-2 ${corClasses[dica.cor as keyof typeof corClasses]}
                    hover:shadow-lg hover:-translate-y-1
                    transition-all duration-300
                  `}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className={`
                    w-12 h-12 ${iconBg[dica.cor as keyof typeof iconBg]} 
                    rounded-xl flex items-center justify-center mb-4
                    shadow-md
                  `}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{dica.titulo}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {dica.descricao}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Extra: Precisa de Ajuda? */}
        <div className={`
          mt-8 bg-white rounded-2xl p-6 border border-gray-200
          transition-all duration-700 delay-500
          ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">
                Quer criar conteúdo personalizado?
              </h4>
              <p className="text-sm text-gray-600">
                Entre em contato com a franqueadora para solicitar artes personalizadas 
                com a sua logo e cores da sua loja. Destaque-se da concorrência!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
