"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlayCircle, X } from 'lucide-react';

type TutorialVideo = {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
};

type Props = {
  pagina: 'produtos' | 'carrinhos' | 'promocoes' | 'personalizacao' | 'configuracoes';
};

export default function VideoTutorialButton({ pagina }: Props) {
  const [video, setVideo] = useState<TutorialVideo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
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
      {/* Botão Flutuante */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 group"
        title={video.titulo}
      >
        <div className="relative">
          {/* Bolinha com animação de pulso */}
          <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-75" />
          
          {/* Botão principal */}
          <div className="relative bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform duration-300">
            <PlayCircle size={32} className="drop-shadow-lg" />
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
              <iframe
                src={video.video_url}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.titulo}
              />
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 text-center">
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
