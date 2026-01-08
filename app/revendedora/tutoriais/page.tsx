"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  BookOpen, 
  Search, 
  ChevronRight,
  Clock,
  CheckCircle,
  Video,
  Sparkles,
  ShoppingBag,
  Palette,
  Settings,
  BarChart3,
  MessageCircle,
  Tag,
  X,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface TutorialVideo {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  pagina: string;
  ativo: boolean;
  ordem: number;
  duracao?: string;
}

interface Categoria {
  id: string;
  label: string;
  icon: React.ReactNode;
  descricao: string;
  cor: string;
}

const CATEGORIAS: Categoria[] = [
  { 
    id: 'primeiros-passos', 
    label: 'Primeiros Passos', 
    icon: <Sparkles className="w-6 h-6" />,
    descricao: 'Comece por aqui! Aprenda o básico do sistema',
    cor: 'from-yellow-400 to-orange-500'
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <BarChart3 className="w-6 h-6" />,
    descricao: 'Entenda suas métricas e resultados',
    cor: 'from-blue-400 to-blue-600'
  },
  { 
    id: 'produtos', 
    label: 'Produtos', 
    icon: <ShoppingBag className="w-6 h-6" />,
    descricao: 'Gerencie seus produtos e estoque',
    cor: 'from-purple-400 to-purple-600'
  },
  { 
    id: 'personalizacao', 
    label: 'Personalização', 
    icon: <Palette className="w-6 h-6" />,
    descricao: 'Deixe sua loja com a sua cara',
    cor: 'from-pink-400 to-pink-600'
  },
  { 
    id: 'personalizacao-banner', 
    label: 'Banners', 
    icon: <Palette className="w-6 h-6" />,
    descricao: 'Configure os banners da sua loja',
    cor: 'from-rose-400 to-rose-600'
  },
  { 
    id: 'personalizacao-logo', 
    label: 'Logo', 
    icon: <Palette className="w-6 h-6" />,
    descricao: 'Adicione sua logo personalizada',
    cor: 'from-fuchsia-400 to-fuchsia-600'
  },
  { 
    id: 'personalizacao-cores', 
    label: 'Cores', 
    icon: <Palette className="w-6 h-6" />,
    descricao: 'Personalize as cores da sua loja',
    cor: 'from-violet-400 to-violet-600'
  },
  { 
    id: 'promocoes', 
    label: 'Promoções', 
    icon: <Tag className="w-6 h-6" />,
    descricao: 'Crie promoções e aumente suas vendas',
    cor: 'from-green-400 to-green-600'
  },
  { 
    id: 'carrinhos', 
    label: 'Carrinhos Abandonados', 
    icon: <MessageCircle className="w-6 h-6" />,
    descricao: 'Recupere vendas perdidas',
    cor: 'from-amber-400 to-amber-600'
  },
  { 
    id: 'configuracoes', 
    label: 'Configurações', 
    icon: <Settings className="w-6 h-6" />,
    descricao: 'Ajustes da sua conta',
    cor: 'from-gray-400 to-gray-600'
  },
  { 
    id: 'dicas-vendas', 
    label: 'Dicas de Vendas', 
    icon: <Sparkles className="w-6 h-6" />,
    descricao: 'Aumente suas vendas com nossas dicas',
    cor: 'from-emerald-400 to-teal-600'
  },
];

export default function TutoriaisRevendedoraPage() {
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [videoAberto, setVideoAberto] = useState<TutorialVideo | null>(null);
  const [videosAssistidos, setVideosAssistidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    carregarVideos();
    carregarProgresso();
  }, []);

  async function carregarVideos() {
    try {
      const res = await fetch('/api/tutoriais');
      if (res.ok) {
        const data = await res.json();
        // Filtrar apenas vídeos ativos
        setVideos(Array.isArray(data) ? data.filter((v: TutorialVideo) => v.ativo) : []);
      }
    } catch (error) {
      console.error('Erro ao carregar tutoriais:', error);
    } finally {
      setLoading(false);
    }
  }

  function carregarProgresso() {
    const saved = localStorage.getItem('tutoriais_assistidos');
    if (saved) {
      setVideosAssistidos(new Set(JSON.parse(saved)));
    }
  }

  function marcarComoAssistido(videoId: string) {
    const novosAssistidos = new Set(videosAssistidos);
    novosAssistidos.add(videoId);
    setVideosAssistidos(novosAssistidos);
    localStorage.setItem('tutoriais_assistidos', JSON.stringify([...novosAssistidos]));
  }

  // Filtrar vídeos por busca
  const videosFiltrados = videos.filter(v => {
    const matchBusca = !busca || 
      v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      v.descricao?.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = !categoriaAtiva || v.pagina === categoriaAtiva;
    
    return matchBusca && matchCategoria;
  });

  // Agrupar vídeos por categoria
  const videosPorCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    videos: videos.filter(v => v.pagina === cat.id)
  })).filter(cat => cat.videos.length > 0);

  // Estatísticas
  const totalVideos = videos.length;
  const totalAssistidos = [...videosAssistidos].filter(id => videos.some(v => v.id === id)).length;
  const percentualCompleto = totalVideos > 0 ? Math.round((totalAssistidos / totalVideos) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DB1472] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando tutoriais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#DB1472] to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl md:text-3xl font-bold">Central de Tutoriais</h1>
          </div>
          <p className="text-pink-100 text-sm md:text-base">
            Aprenda a usar todas as funcionalidades do sistema e aumente suas vendas!
          </p>

          {/* Barra de Progresso */}
          <div className="mt-6 bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Seu progresso</span>
              <span className="text-sm">{totalAssistidos} de {totalVideos} vídeos</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${percentualCompleto}%` }}
              />
            </div>
            <p className="text-xs text-pink-100 mt-2">
              {percentualCompleto === 100 
                ? '🎉 Parabéns! Você assistiu todos os tutoriais!' 
                : `Continue assistindo para dominar o sistema!`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar tutorial..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#DB1472] focus:border-transparent text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Filtros de Categoria */}
        {categoriaAtiva && (
          <button
            onClick={() => setCategoriaAtiva(null)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#DB1472] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para todas as categorias
          </button>
        )}

        {/* Se busca ou categoria selecionada, mostrar lista */}
        {(busca || categoriaAtiva) ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {categoriaAtiva 
                ? CATEGORIAS.find(c => c.id === categoriaAtiva)?.label 
                : `Resultados para "${busca}"`
              }
            </h2>
            
            {videosFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum tutorial encontrado</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videosFiltrados.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    assistido={videosAssistidos.has(video.id)}
                    onClick={() => setVideoAberto(video)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Lista por Categorias */
          <div className="space-y-8">
            {/* Destaque: Primeiros Passos */}
            {videosPorCategoria.find(c => c.id === 'primeiros-passos') && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">🚀 Comece por aqui!</h2>
                    <p className="text-sm text-gray-600">Assista esses vídeos primeiro</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {videosPorCategoria.find(c => c.id === 'primeiros-passos')?.videos.map(video => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      assistido={videosAssistidos.has(video.id)}
                      onClick={() => setVideoAberto(video)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outras Categorias */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CATEGORIAS.filter(c => c.id !== 'primeiros-passos').map(categoria => {
                const videosCategoria = videos.filter(v => v.pagina === categoria.id);
                const assistidosCategoria = videosCategoria.filter(v => videosAssistidos.has(v.id)).length;
                
                if (videosCategoria.length === 0) return null;

                return (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaAtiva(categoria.id)}
                    className="bg-white rounded-xl p-5 border border-gray-200 hover:border-[#DB1472] hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${categoria.cor} flex items-center justify-center text-white`}>
                        {categoria.icon}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#DB1472] transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{categoria.label}</h3>
                    <p className="text-sm text-gray-500 mb-3">{categoria.descricao}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{videosCategoria.length} vídeos</span>
                      <span className={assistidosCategoria === videosCategoria.length ? 'text-green-600' : 'text-gray-400'}>
                        {assistidosCategoria}/{videosCategoria.length} assistidos
                      </span>
                    </div>
                    {/* Mini barra de progresso */}
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${categoria.cor}`}
                        style={{ width: `${(assistidosCategoria / videosCategoria.length) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Vídeo */}
      {videoAberto && (
        <VideoModal
          video={videoAberto}
          onClose={() => setVideoAberto(null)}
          onComplete={() => marcarComoAssistido(videoAberto.id)}
          assistido={videosAssistidos.has(videoAberto.id)}
        />
      )}
    </div>
  );
}

// Componente de Card de Vídeo
function VideoCard({ 
  video, 
  assistido, 
  onClick,
  compact = false 
}: { 
  video: TutorialVideo; 
  assistido: boolean; 
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all text-left group w-full ${
        compact ? 'flex items-center gap-3 p-3' : 'flex flex-col'
      }`}
    >
      {/* Thumbnail */}
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative ${
        compact ? 'w-20 h-14 rounded-lg flex-shrink-0' : 'aspect-video'
      }`}>
        <Play className={`text-gray-400 group-hover:text-[#DB1472] transition-colors ${compact ? 'w-6 h-6' : 'w-10 h-10'}`} />
        {assistido && (
          <div className={`absolute bg-green-500 text-white rounded-full flex items-center justify-center ${
            compact ? 'top-1 right-1 w-5 h-5' : 'top-2 right-2 w-6 h-6'
          }`}>
            <CheckCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className={compact ? 'flex-1 min-w-0' : 'p-4'}>
        <h3 className={`font-semibold text-gray-800 group-hover:text-[#DB1472] transition-colors ${
          compact ? 'text-sm truncate' : 'text-base mb-1'
        }`}>
          {video.titulo}
        </h3>
        {!compact && video.descricao && (
          <p className="text-sm text-gray-500 line-clamp-2">{video.descricao}</p>
        )}
        {!compact && video.duracao && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {video.duracao}
          </div>
        )}
      </div>
    </button>
  );
}

// Modal de Vídeo
function VideoModal({ 
  video, 
  onClose, 
  onComplete,
  assistido 
}: { 
  video: TutorialVideo; 
  onClose: () => void;
  onComplete: () => void;
  assistido: boolean;
}) {
  const [marcado, setMarcado] = useState(assistido);

  // Detectar se é YouTube, Vimeo ou vídeo direto
  const getEmbedUrl = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    // URL direta
    return url;
  };

  const embedUrl = getEmbedUrl(video.video_url);
  const isEmbed = embedUrl !== video.video_url;

  const handleMarcarAssistido = () => {
    setMarcado(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-bold text-lg text-gray-800 truncate">{video.titulo}</h2>
            {video.descricao && (
              <p className="text-sm text-gray-500 truncate">{video.descricao}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video bg-black relative">
          {isEmbed ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={video.video_url}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {marcado ? (
              <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Marcado como assistido
              </span>
            ) : (
              <button
                onClick={handleMarcarAssistido}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como assistido
              </button>
            )}
          </div>

          {!isEmbed && (
            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#DB1472]"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em nova aba
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
