"use client";
import { useEffect, useState } from 'react';
import { Video, Plus, Edit2, Trash2, Eye, EyeOff, Upload, Link2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type TutorialVideo = {
  id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  pagina: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
};

const PAGINAS = [
  { value: 'produtos', label: 'Produtos' },
  { value: 'carrinhos', label: 'Carrinhos Abandonados' },
  { value: 'promocoes', label: 'Promoções' },
  { value: 'personalizacao', label: 'Personalização - Visão Geral' },
  { value: 'personalizacao-banner', label: 'Personalização - Banners' },
  { value: 'personalizacao-logo', label: 'Personalização - Logo' },
  { value: 'personalizacao-cores', label: 'Personalização - Cores' },
  { value: 'personalizacao-estilos', label: 'Personalização - Estilos' },
  { value: 'personalizacao-redes-sociais', label: 'Personalização - Redes Sociais' },
  { value: 'personalizacao-analytics', label: 'Personalização - Analytics' },
  { value: 'configuracoes', label: 'Configurações' },
];

export default function TutoriaisPage() {
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TutorialVideo | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    video_url: '',
    pagina: 'produtos',
    ordem: 0,
  });

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      const res = await fetch('/api/tutoriais');
      
      if (!res.ok) {
        console.error('Erro ao carregar vídeos:', res.status);
        setVideos([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setVideos(data);
      } else {
        console.error('API retornou formato inválido:', data);
        setVideos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log('📝 Submetendo formulário...');
    console.log('📋 Form Data:', formData);
    console.log('✏️ Editando?', editingVideo ? 'Sim' : 'Não');

    const method = editingVideo ? 'PATCH' : 'POST';
    const body = editingVideo
      ? { ...formData, id: editingVideo.id }
      : formData;

    console.log(`🚀 ${method} /api/tutoriais`, body);

    try {
      const res = await fetch('/api/tutoriais', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('📡 Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Sucesso:', data);
        alert('Vídeo salvo com sucesso!');
        loadVideos();
        setShowModal(false);
        resetForm();
      } else {
        const error = await res.json();
        console.error('❌ Erro na resposta:', error);
        alert(`Erro ao salvar: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      alert('Erro ao salvar vídeo. Verifique o console.');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert('Formato de vídeo não suportado. Use MP4, WebM, OGG ou MOV');
      return;
    }

    // Validar tamanho (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('Vídeo muito grande! Máximo 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Nome único para o arquivo
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${fileName}`;

      // Upload para Supabase Storage
      const { error } = await supabase.storage
        .from('tutorial-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('tutorial-videos')
        .getPublicUrl(filePath);

      // Atualizar form com a URL
      setFormData({ ...formData, video_url: publicUrl });
      setUploadProgress(100);
      alert('Vídeo enviado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar vídeo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await fetch('/api/tutoriais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    loadVideos();
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover este vídeo tutorial?')) return;

    await fetch(`/api/tutoriais?id=${id}`, { method: 'DELETE' });
    loadVideos();
  }

  function openEdit(video: TutorialVideo) {
    setEditingVideo(video);
    setFormData({
      titulo: video.titulo,
      descricao: video.descricao,
      video_url: video.video_url,
      pagina: video.pagina,
      ordem: video.ordem,
    });
    setShowModal(true);
  }

  function resetForm() {
    setEditingVideo(null);
    setFormData({
      titulo: '',
      descricao: '',
      video_url: '',
      pagina: 'produtos',
      ordem: 0,
    });
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Video className="text-pink-500" size={36} />
            Vídeos Tutoriais
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie os vídeos de ajuda que aparecem nas páginas da revendedora
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Novo Vídeo
        </button>
      </div>

      {/* Lista de Vídeos por Página */}
      {PAGINAS.map(({ value, label }) => {
        // Garantir que videos é um array antes de filtrar
        const videosArray = Array.isArray(videos) ? videos : [];
        const videosPage = videosArray.filter((v) => v.pagina === value);
        if (videosPage.length === 0) return null;

        return (
          <div key={value} className="mb-8">
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">
              📍 {label}
            </h2>
            <div className="grid gap-4">
              {videosPage.map((video) => (
                <div
                  key={video.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      {/* Thumbnail */}
                      <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <Video className="text-gray-400" size={32} />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">
                          {video.titulo}
                        </h3>
                        {video.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {video.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Ordem: {video.ordem}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              video.ativo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {video.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAtivo(video.id, video.ativo)}
                        className={`p-2 rounded transition-colors ${
                          video.ativo
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={video.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {video.ativo ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                      <button
                        onClick={() => openEdit(video)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {(!videos || videos.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Video className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 text-lg">
            Nenhum vídeo tutorial cadastrado ainda
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-pink-500 hover:text-pink-600 font-semibold"
          >
            + Adicionar primeiro vídeo
          </button>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo Tutorial'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Vídeo *
                </label>
                
                {/* Tabs para escolher modo */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      uploadMode === 'url'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Link2 className="inline mr-2" size={16} />
                    Link Externo
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                      uploadMode === 'upload'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="inline mr-2" size={16} />
                    Upload Direto
                  </button>
                </div>

                {/* Modo URL */}
                {uploadMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) =>
                        setFormData({ ...formData, video_url: e.target.value })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="https://files.catbox.moe/abc123.mp4"
                      required={uploadMode === 'url'}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Cole o link direto do vídeo (Catbox, YouTube embed, etc)
                    </p>
                  </div>
                )}

                {/* Modo Upload */}
                {uploadMode === 'upload' && (
                  <div>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleFileUpload}
                      className="w-full border rounded-lg px-4 py-2"
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enviando... {uploadProgress}%
                        </p>
                      </div>
                    )}
                    {formData.video_url && !uploading && (
                      <p className="text-xs text-green-600 mt-2">
                        ✅ Vídeo enviado com sucesso!
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      📹 Formatos: MP4, WebM, OGG, MOV (máx 100MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Página *
                  </label>
                  <select
                    value={formData.pagina}
                    onChange={(e) =>
                      setFormData({ ...formData, pagina: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  >
                    {PAGINAS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={formData.ordem}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ordem: parseInt(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || (uploadMode === 'upload' && !formData.video_url)}
                  className={`flex-1 px-6 py-3 rounded-lg transition-colors font-semibold ${
                    uploading || (uploadMode === 'upload' && !formData.video_url)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-500 text-white hover:bg-pink-600'
                  }`}
                >
                  {uploading
                    ? `Enviando... ${uploadProgress}%`
                    : editingVideo
                    ? 'Salvar Alterações'
                    : 'Criar Vídeo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
