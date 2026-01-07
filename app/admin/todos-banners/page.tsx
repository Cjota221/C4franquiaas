'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ImageIcon, ExternalLink } from 'lucide-react'

interface RevendedoraComBanner {
  id: string
  name: string
  store_name: string
  slug: string
  status: string
  logo_url: string | null
  banner_url: string | null
  banner_mobile_url: string | null
}

export default function TodosBannersPage() {
  const [revendedoras, setRevendedoras] = useState<RevendedoraComBanner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      const supabase = createClient()
      
      // Buscar revendedoras que TÊM banner (banner_url OU banner_mobile_url preenchidos)
      const { data, error } = await supabase
        .from('resellers')
        .select('id, name, store_name, slug, status, logo_url, banner_url, banner_mobile_url')
        .or('banner_url.neq.null,banner_mobile_url.neq.null')
        .order('name')

      if (error) {
        console.error('❌ Erro:', error)
        return
      }

      console.log('✅ Banners carregados:', data?.length)
      setRevendedoras(data || [])
    } catch (err) {
      console.error('❌ Erro fatal:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando banners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-pink-500" />
            Todos os Banners das Revendedoras
          </h1>
          <p className="text-gray-600 mt-2">
            {revendedoras.length} revendedoras com banners personalizados
          </p>
        </div>

        {/* Grid de Banners */}
        {revendedoras.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma revendedora com banner encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {revendedoras.map((rev) => (
              <div key={rev.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header do Card */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {rev.logo_url && (
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={rev.logo_url}
                            alt={rev.store_name}
                            width={64}
                            height={64}
                            className="object-contain p-1"
                          />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">{rev.store_name}</h2>
                        <p className="text-pink-100 text-sm">{rev.name}</p>
                        <p className="text-pink-200 text-xs">/{rev.slug}</p>
                      </div>
                    </div>
                    <a
                      href={`https://cjotarasteirinhas.com.br/${rev.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver Loja
                    </a>
                  </div>
                </div>

                {/* Banners */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Banner Desktop */}
                    {rev.banner_url && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700">🖥️ Banner Desktop</h3>
                          <span className="text-xs text-gray-500">1920x600px</span>
                        </div>
                        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/5' }}>
                          <Image
                            src={rev.banner_url}
                            alt="Banner Desktop"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                        <a
                          href={rev.banner_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir em tamanho original
                        </a>
                      </div>
                    )}

                    {/* Banner Mobile */}
                    {rev.banner_mobile_url && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700">📱 Banner Mobile</h3>
                          <span className="text-xs text-gray-500">800x800px</span>
                        </div>
                        <div className="relative w-full max-w-[300px] mx-auto bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                          <Image
                            src={rev.banner_mobile_url}
                            alt="Banner Mobile"
                            fill
                            sizes="300px"
                            className="object-cover"
                          />
                        </div>
                        <a
                          href={rev.banner_mobile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 justify-center"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir em tamanho original
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-sm text-gray-600">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rev.status === 'aprovada' ? 'bg-green-100 text-green-800' :
                      rev.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Status: {rev.status}
                    </span>
                    {rev.logo_url && <span>✅ Com Logo</span>}
                    {rev.banner_url && <span>✅ Banner Desktop</span>}
                    {rev.banner_mobile_url && <span>✅ Banner Mobile</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
