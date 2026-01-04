'use client'

import { useEffect, useState } from 'react'
import { 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  AlertTriangle,
  Filter,
  ImagePlus
} from 'lucide-react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Lazy load da página de templates
const AdminBannersPage = dynamic(() => import('../../banners/page'), {
  loading: () => <div className="p-8 text-center">Carregando...</div>
})

interface BannerSubmission {
  id: string
  user_id: string
  template_id: string
  titulo: string
  subtitulo: string | null
  texto_adicional: string | null
  font_family: string
  text_color: string
  desktop_position_x: number
  desktop_position_y: number
  desktop_alignment: string
  desktop_font_size: number
  mobile_position_x: number
  mobile_position_y: number
  mobile_alignment: string
  mobile_font_size: number
  line_spacing: number
  letter_spacing: number
  status: 'pending' | 'approved' | 'rejected'
  desktop_final_url: string | null
  mobile_final_url: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  approved_by: string | null
  reseller: {
    id: string
    store_name: string
    slug: string
    logo_url: string | null
  }
  template?: {
    id: string
    nome: string
    desktop_url: string
    mobile_url: string
  }
}

export default function ModeracaoBannersPage() {
  const [submissions, setSubmissions] = useState<BannerSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedSubmission, setSelectedSubmission] = useState<BannerSubmission | null>(null)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'moderacao' | 'templates'>('moderacao')

  const loadSubmissions = async () => {
    try {
      const response = await fetch(`/api/banners?admin=true&status=${filter}`)
      const data = await response.json()
      if (data.submissions) {
        setSubmissions(data.submissions)
      }
    } catch (err) {
      console.error('Erro ao buscar submissões:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const handleApprove = async (submission: BannerSubmission) => {
    if (!confirm(`Aprovar o banner de "${submission.reseller.store_name}"?`)) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submission.id,
          action: 'approve'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Banner aprovado com sucesso!')
        loadSubmissions()
      } else {
        alert('Erro: ' + data.error)
      }
    } catch (err) {
      console.error('Erro ao aprovar:', err)
      alert('Erro ao aprovar banner')
    } finally {
      setProcessing(false)
    }
  }

  const openRejectModal = (submission: BannerSubmission) => {
    setSelectedSubmission(submission)
    setRejectFeedback('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!selectedSubmission) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          action: 'reject',
          feedback: rejectFeedback || undefined
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Banner recusado')
        setShowRejectModal(false)
        setSelectedSubmission(null)
        loadSubmissions()
      } else {
        alert('Erro: ' + data.error)
      }
    } catch (err) {
      console.error('Erro ao recusar:', err)
      alert('Erro ao recusar banner')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock size={12} />
            Pendente
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle size={12} />
            Aprovado
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle size={12} />
            Recusado
          </span>
        )
      default:
        return null
    }
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-7 h-7 text-pink-500" />
          Gerenciamento de Banners
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie banners das revendedoras e templates pré-definidos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('moderacao')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'moderacao'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Moderação de Banners
          </div>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'templates'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5" />
            Templates Pré-definidos
          </div>
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'templates' ? (
        <AdminBannersPage />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <div className="text-sm text-yellow-600">Pendentes</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-sm text-green-600">Aprovados</div>
              <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="text-sm text-red-600">Recusados</div>
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <Filter size={18} className="text-gray-400" />
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : 
               f === 'pending' ? 'Pendentes' :
               f === 'approved' ? 'Aprovados' : 'Recusados'}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => loadSubmissions()}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Lista de Submissões */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'Nenhum banner pendente de aprovação'
              : 'Nenhum banner encontrado com este filtro'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => (
            <div 
              key={submission.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Preview do Banner */}
              <div className="relative bg-gray-100">
                {/* Preview Desktop */}
                {submission.desktop_final_url && (
                  <div className="mb-2 relative">
                    <div className="relative w-full" style={{ aspectRatio: '16/5' }}>
                      <Image
                        src={submission.desktop_final_url}
                        alt="Banner Desktop"
                        fill
                        className="object-cover"
                      />
                      
                      {/* TEXTO SOBREPOSTO - DESKTOP */}
                      <div
                        className="absolute"
                        style={{
                          left: `${submission.desktop_position_x}%`,
                          top: `${submission.desktop_position_y}%`,
                          transform: 'translate(-50%, 0)',
                          textAlign: submission.desktop_alignment as 'left' | 'center' | 'right',
                          maxWidth: '400px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: `${submission.line_spacing}px`,
                        }}
                      >
                        {submission.titulo && (
                          <h2
                            className="font-bold drop-shadow-2xl text-2xl"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(2rem * ${submission.desktop_font_size / 100})`,
                            }}
                          >
                            {submission.titulo}
                          </h2>
                        )}
                        {submission.subtitulo && (
                          <p
                            className="drop-shadow-xl text-base"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(1rem * ${submission.desktop_font_size / 100})`,
                              opacity: 0.95,
                            }}
                          >
                            {submission.subtitulo}
                          </p>
                        )}
                        {submission.texto_adicional && (
                          <p
                            className="drop-shadow-xl text-sm"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(0.875rem * ${submission.desktop_font_size / 100})`,
                              opacity: 0.9,
                            }}
                          >
                            {submission.texto_adicional}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-black/50 text-white rounded text-xs">
                        🖥️ Desktop
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Preview Mobile */}
                {submission.mobile_final_url && (
                  <div className="relative">
                    <div className="relative w-full max-w-[200px] mx-auto" style={{ aspectRatio: '1/1' }}>
                      <Image
                        src={submission.mobile_final_url}
                        alt="Banner Mobile"
                        fill
                        className="object-cover"
                      />
                      
                      {/* TEXTO SOBREPOSTO - MOBILE */}
                      <div
                        className="absolute"
                        style={{
                          left: `${submission.mobile_position_x}%`,
                          top: `${submission.mobile_position_y}%`,
                          transform: 'translate(-50%, 0)',
                          textAlign: submission.mobile_alignment as 'left' | 'center' | 'right',
                          maxWidth: '85%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: `${submission.line_spacing}px`,
                        }}
                      >
                        {submission.titulo && (
                          <h2
                            className="font-bold drop-shadow-2xl text-lg"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(1.5rem * ${submission.mobile_font_size / 100})`,
                            }}
                          >
                            {submission.titulo}
                          </h2>
                        )}
                        {submission.subtitulo && (
                          <p
                            className="drop-shadow-xl text-sm"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(0.875rem * ${submission.mobile_font_size / 100})`,
                              opacity: 0.95,
                            }}
                          >
                            {submission.subtitulo}
                          </p>
                        )}
                        {submission.texto_adicional && (
                          <p
                            className="drop-shadow-xl text-xs"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(0.75rem * ${submission.mobile_font_size / 100})`,
                              opacity: 0.9,
                            }}
                          >
                            {submission.texto_adicional}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-1 bg-black/50 text-white rounded text-xs">
                        📱 Mobile
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Se não tiver URLs finais, mostrar template COM TEXTO */}
                {!submission.desktop_final_url && !submission.mobile_final_url && submission.template && (
                  <div className="relative">
                    <div className="relative w-full" style={{ aspectRatio: '16/5' }}>
                      <Image
                        src={submission.template.desktop_url}
                        alt="Template"
                        fill
                        className="object-cover"
                      />
                      
                      {/* TEXTO SOBREPOSTO - TEMPLATE */}
                      <div
                        className="absolute"
                        style={{
                          left: `${submission.desktop_position_x}%`,
                          top: `${submission.desktop_position_y}%`,
                          transform: 'translate(-50%, 0)',
                          textAlign: submission.desktop_alignment as 'left' | 'center' | 'right',
                          maxWidth: '400px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: `${submission.line_spacing}px`,
                        }}
                      >
                        {submission.titulo && (
                          <h2
                            className="font-bold drop-shadow-2xl text-2xl"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(2rem * ${submission.desktop_font_size / 100})`,
                            }}
                          >
                            {submission.titulo}
                          </h2>
                        )}
                        {submission.subtitulo && (
                          <p
                            className="drop-shadow-xl text-base"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(1rem * ${submission.desktop_font_size / 100})`,
                              opacity: 0.95,
                            }}
                          >
                            {submission.subtitulo}
                          </p>
                        )}
                        {submission.texto_adicional && (
                          <p
                            className="drop-shadow-xl text-sm"
                            style={{
                              color: submission.text_color,
                              letterSpacing: `${submission.letter_spacing}px`,
                              fontSize: `calc(0.875rem * ${submission.desktop_font_size / 100})`,
                              opacity: 0.9,
                            }}
                          >
                            {submission.texto_adicional}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-amber-500 text-white rounded text-xs">
                        ⏳ Processando
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {submission.reseller.logo_url ? (
                    <Image
                      src={submission.reseller.logo_url}
                      alt={submission.reseller.store_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-pink-600 font-bold">
                        {submission.reseller.store_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-800">
                      {submission.reseller.store_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      /{submission.reseller.slug}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(submission.status)}
                  <span className="text-xs text-gray-500">
                    {formatDate(submission.created_at)}
                  </span>
                </div>

                {/* Feedback de Rejeição */}
                {submission.status === 'rejected' && submission.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                      <p className="text-xs text-red-700">{submission.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Ações */}
                {submission.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleApprove(submission)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => openRejectModal(submission)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Recusar
                    </button>
                  </div>
                )}

                {submission.status !== 'pending' && (
                  <a
                    href={`/catalogo/${submission.reseller.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 mt-4"
                  >
                    <Eye size={16} />
                    Ver Catálogo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Modal de Rejeição */}
      {showRejectModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <XCircle className="text-red-500" />
              Recusar Banner
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Informe o motivo da recusa para <strong>{selectedSubmission.reseller.store_name}</strong>. 
              Essa mensagem será exibida para a revendedora.
            </p>

            <textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="Ex: O banner contém produtos que não fazem parte do catálogo C4. Por favor, envie um banner apenas com nossos produtos."
              className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />

            <p className="text-xs text-gray-500 mt-2 mb-4">
              Se deixar em branco, será usada uma mensagem padrão.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
