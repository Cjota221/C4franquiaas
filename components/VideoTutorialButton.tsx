"use client";
import { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlayCircle, X, Volume2, VolumeX } from 'lucide-react';

type TutorialVideo = {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
};

type Props = {
  pagina: 
    | 'produtos' 
    | 'carrinhos' 
    | 'promocoes' 
    | 'personalizacao'
    | 'personalizacao-banner'
    | 'personalizacao-logo'
    | 'personalizacao-cores'
    | 'personalizacao-estilos'
    | 'personalizacao-redes-sociais'
    | 'personalizacao-analytics'
    | 'configuracoes';
};

export default function VideoTutorialButton({ pagina }: Props) {
  const [video, setVideo] = useState<TutorialVideo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAudio, setHasAudio] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadVideo() {
      const { data } = await supabase
        .from('tutorial_videos')
        .select('id, titulo, descricao, video_url')
        .eq('pagina', pagina)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setVideo(data);
      }
      setLoading(false);
    }

    loadVideo();
  }, [pagina, supabase]);

  if (loading || !video) {
    return null;
  }

  return (
    <>
      {/* Botão Flutuante com Preview */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 group"
        title={video.titulo}
      >
        <div className="relative">
          {/* Animação de pulso ao redor */}
          <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-75" />
          
          {/* Container do botão */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-2xl hover:scale-110 transition-transform duration-300 border-4 border-white">
            {/* Preview do vídeo rodando (sem áudio, loop) */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src={video.video_url}
            />
            
            {/* Overlay escuro para dar contraste */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Ícone de Play centralizado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle size={28} className="text-white drop-shadow-2xl" strokeWidth={2.5} />
            </div>
          </div>
          
          {/* Tooltip ao passar o mouse */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
              🎥 {video.titulo}
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      </button>

      {/* Modal do Vídeo */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{video.titulo}</h3>
                {video.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{video.descricao}</p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Vídeo */}
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              {video.video_url.includes('youtube.com') || video.video_url.includes('vimeo.com') ? (
                // YouTube/Vimeo embed
                <iframe
                  src={video.video_url}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.titulo}
                />
              ) : (
                // Vídeo direto (Catbox, Supabase Storage, etc) - COM ÁUDIO
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full bg-black"
                  src={video.video_url}
                  title={video.titulo}
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget as HTMLVideoElement & {
                      mozHasAudio?: boolean;
                      webkitAudioDecodedByteCount?: number;
                      audioTracks?: { length: number };
                    };
                    
                    // Detecta se o vídeo tem trilha de áudio
                    const hasAudioTrack = vid.mozHasAudio || 
                                         Boolean(vid.webkitAudioDecodedByteCount) || 
                                         Boolean(vid.audioTracks && vid.audioTracks.length);
                    setHasAudio(hasAudioTrack);
                    
                    // Garante que o volume está no máximo
                    vid.volume = 1.0;
                    vid.muted = false;
                    
                    // Força play com som (contorna bloqueios do navegador)
                    vid.play().catch(() => {
                      console.log('Autoplay bloqueado, usuário precisa clicar no vídeo');
                    });
                  }}
                >
                  Seu navegador não suporta vídeos HTML5.
                </video>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 text-center space-y-2">
              {!hasAudio && (
                <div className="flex items-center justify-center gap-2 text-yellow-600 text-sm">
                  <VolumeX size={16} />
                  <span>⚠️ Este vídeo não possui áudio</span>
                </div>
              )}
              {hasAudio && (
                <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                  <Volume2 size={16} />
                  <span>🔊 Áudio disponível - ajuste o volume se necessário</span>
                </div>
              )}
              <p className="text-sm text-gray-600">
                💡 Dica: Assista em tela cheia para melhor experiência
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
