'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  RefreshCw,
  Box
} from 'lucide-react'

interface ReservaSeparacao {
  reserva_id: string
  revendedora_id: string
  nome_revendedora: string
  produto_id: string
  produto_nome: string
  produto_imagem: string
  tamanho: string | null
  cor: string | null
  quantidade: number
  preco_total: number
  status: string
  reservado_em: string
  horas_aguardando: number
}

export default function SeparacaoPage() {
  const [loading, setLoading] = useState(true)
  const [reservas, setReservas] = useState<ReservaSeparacao[]>([])
  const [filtro, setFiltro] = useState<'todos' | 'RESERVADO' | 'EM_SEPARACAO'>('todos')
  const [busca, setBusca] = useState('')
  const [processando, setProcessando] = useState<string | null>(null)
  const [estatisticas, setEstatisticas] = useState({
    aguardando: 0,
    emSeparacao: 0,
    separadosHoje: 0
  })
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    carregarReservas()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarReservas, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  async function carregarReservas() {
    setLoading(true)
    
    try {
      // Buscar da view otimizada
      const { data, error } = await supabase
        .from('vw_fila_separacao')
        .select('*')
        .order('reservado_em', { ascending: true })
      
      if (error) throw error
      
      setReservas(data || [])
      
      // Calcular estatísticas
      const aguardando = data?.filter(r => r.status === 'RESERVADO').length || 0
      const emSeparacao = data?.filter(r => r.status === 'EM_SEPARACAO').length || 0
      
      // Buscar separados hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const { count } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'SEPARADO')
        .gte('separado_em', hoje.toISOString())
      
      setEstatisticas({
        aguardando,
        emSeparacao,
        separadosHoje: count || 0
      })
      
    } catch (error) {
      console.error('Erro ao carregar reservas:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function iniciarSeparacao(reservaId: string) {
    setProcessando(reservaId)
    
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ status: 'EM_SEPARACAO' })
        .eq('id', reservaId)
      
      if (error) throw error
      
      await carregarReservas()
    } catch (error) {
      console.error('Erro ao iniciar separação:', error)
      alert('Erro ao iniciar separação')
    } finally {
      setProcessando(null)
    }
  }
  
  async function marcarSeparado(reservaId: string) {
    setProcessando(reservaId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('reservas')
        .update({ 
          status: 'SEPARADO',
          separado_por: user?.id,
          separado_em: new Date().toISOString()
        })
        .eq('id', reservaId)
      
      if (error) throw error
      
      await carregarReservas()
    } catch (error) {
      console.error('Erro ao marcar como separado:', error)
      alert('Erro ao marcar como separado')
    } finally {
      setProcessando(null)
    }
  }
  
  // Filtrar e buscar
  const reservasFiltradas = reservas.filter(r => {
    const matchFiltro = filtro === 'todos' || r.status === filtro
    const matchBusca = !busca || 
      r.produto_nome.toLowerCase().includes(busca.toLowerCase()) ||
      r.nome_revendedora.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })
  
  // Agrupar por revendedora
  const reservasPorRevendedora = reservasFiltradas.reduce((acc, reserva) => {
    if (!acc[reserva.revendedora_id]) {
      acc[reserva.revendedora_id] = {
        nome: reserva.nome_revendedora,
        reservas: []
      }
    }
    acc[reserva.revendedora_id].reservas.push(reserva)
    return acc
  }, {} as Record<string, { nome: string; reservas: ReservaSeparacao[] }>)
  
  function formatarTempo(horas: number): string {
    if (horas < 1) return 'Agora mesmo'
    if (horas < 24) return `${Math.floor(horas)}h atrás`
    const dias = Math.floor(horas / 24)
    return `${dias} dia${dias > 1 ? 's' : ''} atrás`
  }
  
  function getCorUrgencia(horas: number): string {
    if (horas >= 48) return 'bg-red-100 border-red-300 text-red-800'
    if (horas >= 24) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-green-100 border-green-300 text-green-800'
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-xl">
                <Box className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Separação de Reservas</h1>
                <p className="text-sm text-gray-500">Fila de itens para separar na caixinha</p>
              </div>
            </div>
            
            <button
              onClick={carregarReservas}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.aguardando}</p>
                <p className="text-sm text-gray-500">Aguardando</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.emSeparacao}</p>
                <p className="text-sm text-gray-500">Em Separação</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.separadosHoje}</p>
                <p className="text-sm text-gray-500">Separados Hoje</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto ou revendedora..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todos')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtro === 'todos'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({reservas.length})
              </button>
              <button
                onClick={() => setFiltro('RESERVADO')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtro === 'RESERVADO'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aguardando ({estatisticas.aguardando})
              </button>
              <button
                onClick={() => setFiltro('EM_SEPARACAO')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtro === 'EM_SEPARACAO'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Em Separação ({estatisticas.emSeparacao})
              </button>
            </div>
          </div>
        </div>
        
        {/* Lista agrupada por revendedora */}
        {loading && reservas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-gray-500">Carregando reservas...</p>
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Tudo em dia! 🎉</p>
            <p className="text-gray-500">Nenhuma reserva pendente para separar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(reservasPorRevendedora).map(([revendedoraId, dados]) => (
              <div key={revendedoraId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header da revendedora */}
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dados.nome}</p>
                      <p className="text-xs text-gray-500">{dados.reservas.length} itens na caixinha</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      R$ {dados.reservas.reduce((acc, r) => acc + r.preco_total, 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">valor total</p>
                  </div>
                </div>
                
                {/* Lista de produtos */}
                <div className="divide-y">
                  {dados.reservas.map((reserva) => (
                    <div key={reserva.reserva_id} className="p-4 flex gap-4">
                      {/* Imagem */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {reserva.produto_imagem ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={reserva.produto_imagem}
                            alt={reserva.produto_nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{reserva.produto_nome}</p>
                            {(reserva.tamanho || reserva.cor) && (
                              <p className="text-sm text-gray-500">
                                {reserva.tamanho && `Tam: ${reserva.tamanho}`}
                                {reserva.tamanho && reserva.cor && ' • '}
                                {reserva.cor && `Cor: ${reserva.cor}`}
                              </p>
                            )}
                            <p className="text-sm font-bold text-purple-600">
                              Qtd: {reserva.quantidade}
                            </p>
                          </div>
                          
                          {/* Status badge */}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reserva.status === 'RESERVADO'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {reserva.status === 'RESERVADO' ? 'Aguardando' : 'Separando'}
                          </span>
                        </div>
                        
                        {/* Tempo e ações */}
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getCorUrgencia(reserva.horas_aguardando)}`}>
                            {reserva.horas_aguardando >= 48 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                            {formatarTempo(reserva.horas_aguardando)}
                          </span>
                          
                          {/* Botões de ação */}
                          <div className="flex gap-2">
                            {reserva.status === 'RESERVADO' && (
                              <button
                                onClick={() => iniciarSeparacao(reserva.reserva_id)}
                                disabled={processando === reserva.reserva_id}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 transition"
                              >
                                {processando === reserva.reserva_id ? 'Iniciando...' : 'Iniciar Separação'}
                              </button>
                            )}
                            
                            {reserva.status === 'EM_SEPARACAO' && (
                              <button
                                onClick={() => marcarSeparado(reserva.reserva_id)}
                                disabled={processando === reserva.reserva_id}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-1"
                              >
                                {processando === reserva.reserva_id ? (
                                  'Marcando...'
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Marcar Separado
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
