'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Wallet,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  X,
  Plus,
  Minus
} from 'lucide-react'
import { formatarMoeda, getTipoTransacaoLabel, isCredito, type WalletTransaction } from '@/lib/wallet'

interface WalletResumo {
  id: string
  revendedora_id: string
  nome_loja: string
  saldo: number
  saldo_bloqueado: number
  status: string
  total_creditos: number
  total_debitos: number
  itens_reservados: number
  valor_reservado: number
  created_at: string
}

export default function GestaoCarteirasPage() {
  const [loading, setLoading] = useState(true)
  const [carteiras, setCarteiras] = useState<WalletResumo[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'bloqueado'>('todos')
  const [estatisticas, setEstatisticas] = useState({
    totalCarteiras: 0,
    saldoTotal: 0,
    reservasTotal: 0
  })
  
  // Modal de detalhes
  const [carteiraDetalhes, setCarteiraDetalhes] = useState<WalletResumo | null>(null)
  const [extrato, setExtrato] = useState<WalletTransaction[]>([])
  const [loadingExtrato, setLoadingExtrato] = useState(false)
  
  // Modal de ajuste
  const [showAjusteModal, setShowAjusteModal] = useState(false)
  const [ajusteCarteira, setAjusteCarteira] = useState<WalletResumo | null>(null)
  const [ajusteTipo, setAjusteTipo] = useState<'credito' | 'debito'>('credito')
  const [ajusteValor, setAjusteValor] = useState('')
  const [ajusteMotivo, setAjusteMotivo] = useState('')
  const [processandoAjuste, setProcessandoAjuste] = useState(false)
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    carregarCarteiras()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  async function carregarCarteiras() {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('vw_wallet_resumo')
        .select('*')
        .order('saldo', { ascending: false })
      
      if (error) throw error
      
      setCarteiras(data || [])
      
      // Calcular estatísticas
      const saldoTotal = data?.reduce((acc, c) => acc + c.saldo, 0) || 0
      const reservasTotal = data?.reduce((acc, c) => acc + c.valor_reservado, 0) || 0
      
      setEstatisticas({
        totalCarteiras: data?.length || 0,
        saldoTotal,
        reservasTotal
      })
      
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function verDetalhes(carteira: WalletResumo) {
    setCarteiraDetalhes(carteira)
    setLoadingExtrato(true)
    
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', carteira.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      setExtrato(data || [])
    } catch (error) {
      console.error('Erro ao carregar extrato:', error)
    } finally {
      setLoadingExtrato(false)
    }
  }
  
  async function alterarStatusCarteira(carteiraId: string, novoStatus: 'ativo' | 'bloqueado') {
    if (!confirm(`Confirma ${novoStatus === 'bloqueado' ? 'BLOQUEAR' : 'DESBLOQUEAR'} esta carteira?`)) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ status: novoStatus })
        .eq('id', carteiraId)
      
      if (error) throw error
      
      alert(`Carteira ${novoStatus === 'bloqueado' ? 'bloqueada' : 'desbloqueada'} com sucesso!`)
      carregarCarteiras()
      setCarteiraDetalhes(null)
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status da carteira')
    }
  }
  
  async function fazerAjuste() {
    if (!ajusteCarteira || !ajusteValor || !ajusteMotivo) {
      alert('Preencha todos os campos')
      return
    }
    
    const valor = parseFloat(ajusteValor.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) {
      alert('Valor inválido')
      return
    }
    
    if (ajusteTipo === 'debito' && valor > ajusteCarteira.saldo) {
      alert('Valor de débito maior que o saldo disponível')
      return
    }
    
    setProcessandoAjuste(true)
    
    try {
      if (ajusteTipo === 'credito') {
        // Creditar usando função RPC
        const { data, error } = await supabase.rpc('creditar_carteira', {
          p_wallet_id: ajusteCarteira.id,
          p_valor: valor,
          p_tipo: 'CREDITO_BONUS',
          p_descricao: `Ajuste manual: ${ajusteMotivo}`,
          p_referencia_tipo: 'admin',
          p_referencia_id: null
        })
        
        if (error) throw error
        
        if (!data.success) {
          throw new Error(data.error)
        }
      } else {
        // Débito manual
        const { data: wallet } = await supabase
          .from('wallets')
          .select('saldo')
          .eq('id', ajusteCarteira.id)
          .single()
        
        if (!wallet) throw new Error('Carteira não encontrada')
        
        // Atualizar saldo
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ saldo: wallet.saldo - valor })
          .eq('id', ajusteCarteira.id)
        
        if (updateError) throw updateError
        
        // Registrar transação
        const { error: transError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: ajusteCarteira.id,
            tipo: 'DEBITO_AJUSTE',
            valor,
            saldo_anterior: wallet.saldo,
            saldo_posterior: wallet.saldo - valor,
            descricao: `Ajuste manual: ${ajusteMotivo}`,
            referencia_tipo: 'admin'
          })
        
        if (transError) throw transError
      }
      
      alert('Ajuste realizado com sucesso!')
      setShowAjusteModal(false)
      setAjusteCarteira(null)
      setAjusteValor('')
      setAjusteMotivo('')
      carregarCarteiras()
      
    } catch (error) {
      console.error('Erro ao fazer ajuste:', error)
      alert(error instanceof Error ? error.message : 'Erro ao realizar ajuste')
    } finally {
      setProcessandoAjuste(false)
    }
  }
  
  // Filtrar carteiras
  const carteirasFiltradas = carteiras.filter(c => {
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
    const matchBusca = !busca || c.nome_loja?.toLowerCase().includes(busca.toLowerCase())
    return matchStatus && matchBusca
  })
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-xl">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestão de Carteiras</h1>
                <p className="text-sm text-gray-500">C4 Wallet - Administração</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={carregarCarteiras}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalCarteiras}</p>
                <p className="text-sm text-gray-500">Carteiras Ativas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatarMoeda(estatisticas.saldoTotal)}</p>
                <p className="text-sm text-gray-500">Saldo Total</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatarMoeda(estatisticas.reservasTotal)}</p>
                <p className="text-sm text-gray-500">Em Reservas</p>
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
                placeholder="Buscar por nome da loja..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroStatus('todos')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtroStatus === 'todos'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroStatus('ativo')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtroStatus === 'ativo'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativas
              </button>
              <button
                onClick={() => setFiltroStatus('bloqueado')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtroStatus === 'bloqueado'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bloqueadas
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Revendedora</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Saldo</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Reservas</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total Créditos</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Carregando carteiras...</p>
                    </td>
                  </tr>
                ) : carteirasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma carteira encontrada
                    </td>
                  </tr>
                ) : (
                  carteirasFiltradas.map((carteira) => (
                    <tr key={carteira.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{carteira.nome_loja || 'Sem nome'}</p>
                        <p className="text-xs text-gray-500">{carteira.revendedora_id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-gray-900">{formatarMoeda(carteira.saldo)}</p>
                        {carteira.saldo_bloqueado > 0 && (
                          <p className="text-xs text-yellow-600">+ {formatarMoeda(carteira.saldo_bloqueado)} bloq.</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-purple-600">{carteira.itens_reservados} itens</p>
                        <p className="text-xs text-gray-500">{formatarMoeda(carteira.valor_reservado)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-green-600">{formatarMoeda(carteira.total_creditos)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          carteira.status === 'ativo'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {carteira.status === 'ativo' ? 'Ativa' : 'Bloqueada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => verDetalhes(carteira)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAjusteCarteira(carteira)
                              setShowAjusteModal(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Fazer ajuste"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          {carteira.status === 'ativo' ? (
                            <button
                              onClick={() => alterarStatusCarteira(carteira.id, 'bloqueado')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Bloquear carteira"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => alterarStatusCarteira(carteira.id, 'ativo')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Desbloquear carteira"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal de Detalhes */}
      {carteiraDetalhes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{carteiraDetalhes.nome_loja}</h2>
                <p className="text-sm text-gray-500">Detalhes da Carteira</p>
              </div>
              <button
                onClick={() => setCarteiraDetalhes(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Info */}
            <div className="p-4 border-b bg-gray-50 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Saldo Disponível</p>
                <p className="text-xl font-bold text-green-600">{formatarMoeda(carteiraDetalhes.saldo)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Em Reservas</p>
                <p className="text-xl font-bold text-purple-600">{formatarMoeda(carteiraDetalhes.valor_reservado)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Creditado</p>
                <p className="text-xl font-bold text-blue-600">{formatarMoeda(carteiraDetalhes.total_creditos)}</p>
              </div>
            </div>
            
            {/* Extrato */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              <h3 className="font-medium text-gray-900 mb-3">Extrato</h3>
              
              {loadingExtrato ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : extrato.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Nenhuma transação</p>
              ) : (
                <div className="space-y-2">
                  {extrato.map((trans) => (
                    <div key={trans.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          isCredito(trans.tipo) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {isCredito(trans.tipo) ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{getTipoTransacaoLabel(trans.tipo)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(trans.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isCredito(trans.tipo) ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredito(trans.tipo) ? '+' : '-'} {formatarMoeda(trans.valor)}
                        </p>
                        <p className="text-xs text-gray-400">Saldo: {formatarMoeda(trans.saldo_posterior)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Ajuste */}
      {showAjusteModal && ajusteCarteira && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Ajuste Manual</h2>
              <button
                onClick={() => {
                  setShowAjusteModal(false)
                  setAjusteCarteira(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Carteira</p>
                <p className="font-medium">{ajusteCarteira.nome_loja}</p>
                <p className="text-sm text-gray-500">Saldo atual: {formatarMoeda(ajusteCarteira.saldo)}</p>
              </div>
              
              {/* Tipo */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAjusteTipo('credito')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                    ajusteTipo === 'credito'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Crédito
                </button>
                <button
                  onClick={() => setAjusteTipo('debito')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                    ajusteTipo === 'debito'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Débito
                </button>
              </div>
              
              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="text"
                    value={ajusteValor}
                    onChange={(e) => setAjusteValor(e.target.value.replace(/[^\d,]/g, ''))}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  placeholder="Descreva o motivo do ajuste..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Aviso */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Esta ação será registrada no histórico e não pode ser desfeita.
                </p>
              </div>
              
              {/* Botão */}
              <button
                onClick={fazerAjuste}
                disabled={processandoAjuste || !ajusteValor || !ajusteMotivo}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition ${
                  ajusteTipo === 'credito'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {processandoAjuste ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {ajusteTipo === 'credito' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    {ajusteTipo === 'credito' ? 'Creditar' : 'Debitar'} R$ {ajusteValor || '0,00'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
