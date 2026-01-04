'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Upload, Trash2, Eye, EyeOff, GripVertical, Plus, X } from 'lucide-react'
import Image from 'next/image'

interface BannerTemplate {
  id: string
  nome: string
  desktop_url: string
  mobile_url: string
  ativo: boolean
  ordem: number
  created_at: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    nome: '',
    desktopFile: null as File | null,
    mobileFile: null as File | null,
  })
  const [uploading, setUploading] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_templates')
        .select('*')
        .order('ordem', { ascending: true })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Erro ao carregar banners:', error)
      alert('Erro ao carregar banners')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadBanner = async () => {
    if (!uploadData.nome || !uploadData.desktopFile || !uploadData.mobileFile) {
      alert('Preencha todos os campos e selecione as duas imagens!')
      return
    }

    setUploading(true)
    try {
      // Upload desktop
      const desktopExt = uploadData.desktopFile.name.split('.').pop()
      const desktopPath = `banners/desktop_${Date.now()}.${desktopExt}`
      const { error: desktopError } = await supabase.storage
        .from('reseller-assets')
        .upload(desktopPath, uploadData.desktopFile)

      if (desktopError) throw desktopError

      // Upload mobile
      const mobileExt = uploadData.mobileFile.name.split('.').pop()
      const mobilePath = `banners/mobile_${Date.now()}.${mobileExt}`
      const { error: mobileError } = await supabase.storage
        .from('reseller-assets')
        .upload(mobilePath, uploadData.mobileFile)

      if (mobileError) throw mobileError

      // Pegar URLs públicas
      const { data: { publicUrl: desktopUrl } } = supabase.storage
        .from('reseller-assets')
        .getPublicUrl(desktopPath)

      const { data: { publicUrl: mobileUrl } } = supabase.storage
        .from('reseller-assets')
        .getPublicUrl(mobilePath)

      // Salvar no banco
      const { error: insertError } = await supabase
        .from('banner_templates')
        .insert({
          nome: uploadData.nome,
          desktop_url: desktopUrl,
          mobile_url: mobileUrl,
          ordem: banners.length,
        })

      if (insertError) throw insertError

      alert('✅ Banner adicionado com sucesso!')
      setShowUploadModal(false)
      setUploadData({ nome: '', desktopFile: null, mobileFile: null })
      loadBanners()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload do banner')
    } finally {
      setUploading(false)
    }
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('banner_templates')
        .update({ ativo: !ativo })
        .eq('id', id)

      if (error) throw error
      loadBanners()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const deleteBanner = async (id: string, desktopUrl: string, mobileUrl: string) => {
    if (!confirm('Tem certeza que deseja deletar este banner?')) return

    try {
      // Extrair paths das URLs
      const desktopPath = desktopUrl.split('/reseller-assets/')[1]
      const mobilePath = mobileUrl.split('/reseller-assets/')[1]

      // Deletar arquivos
      await supabase.storage.from('reseller-assets').remove([desktopPath, mobilePath])

      // Deletar registro
      const { error } = await supabase
        .from('banner_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadBanners()
    } catch (error) {
      console.error('Erro ao deletar banner:', error)
      alert('Erro ao deletar banner')
    }
  }

  const updateOrdem = async (id: string, newOrdem: number) => {
    try {
      const { error } = await supabase
        .from('banner_templates')
        .update({ ordem: newOrdem })
        .eq('id', id)

      if (error) throw error
      loadBanners()
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error)
    }
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newBanners = [...banners]
    const temp = newBanners[index - 1]
    newBanners[index - 1] = newBanners[index]
    newBanners[index] = temp
    
    updateOrdem(newBanners[index - 1].id, index - 1)
    updateOrdem(newBanners[index].id, index)
  }

  const moveDown = (index: number) => {
    if (index === banners.length - 1) return
    const newBanners = [...banners]
    const temp = newBanners[index + 1]
    newBanners[index + 1] = newBanners[index]
    newBanners[index] = temp
    
    updateOrdem(newBanners[index + 1].id, index + 1)
    updateOrdem(newBanners[index].id, index)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Banners</h1>
            <p className="text-gray-600 mt-2">
              Banners pré-definidos para as revendedoras personalizarem
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Banner
          </button>
        </div>

        {/* Lista de Banners */}
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum banner cadastrado
            </h3>
            <p className="text-gray-600 mb-6">
              Comece adicionando o primeiro par de banners (Desktop + Mobile)
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Banner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* Controles de Ordem */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 rotate-90" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === banners.length - 1}
                      className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 -rotate-90" />
                    </button>
                  </div>

                  {/* Preview Desktop */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">Desktop</p>
                    <div className="relative w-full aspect-[16/5] bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={banner.desktop_url}
                        alt={`${banner.nome} - Desktop`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Preview Mobile */}
                  <div className="w-48">
                    <p className="text-sm font-medium text-gray-700 mb-2">Mobile</p>
                    <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={banner.mobile_url}
                        alt={`${banner.nome} - Mobile`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Info e Ações */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{banner.nome}</h3>
                      <p className="text-sm text-gray-500">
                        Ordem: {banner.ordem + 1}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleAtivo(banner.id, banner.ativo)}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          banner.ativo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {banner.ativo ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Inativo
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => deleteBanner(banner.id, banner.desktop_url, banner.mobile_url)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Adicionar Novo Banner</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Banner
                </label>
                <input
                  type="text"
                  value={uploadData.nome}
                  onChange={(e) => setUploadData({ ...uploadData, nome: e.target.value })}
                  placeholder="Ex: Banner Verão 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Upload Desktop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem Desktop (1920x600px recomendado)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadData({ ...uploadData, desktopFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {uploadData.desktopFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {uploadData.desktopFile.name}
                  </p>
                )}
              </div>

              {/* Upload Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem Mobile (800x800px recomendado)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadData({ ...uploadData, mobileFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {uploadData.mobileFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {uploadData.mobileFile.name}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadBanner}
                  disabled={uploading || !uploadData.nome || !uploadData.desktopFile || !uploadData.mobileFile}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Enviando...' : 'Adicionar Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
