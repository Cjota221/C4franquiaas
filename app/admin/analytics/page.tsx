'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ShoppingCart, 
  Search,
  Monitor,
  Smartphone,
  Tablet,
  Calendar,
  ArrowUp,
  ArrowDown,
  Package,
  MousePointer
} from 'lucide-react'

interface AnalyticsData {
  totalPageViews: number
  totalSessions: number
  totalProductViews: number
  totalAddToCart: number
  totalSearches: number
  conversionRate: number
  deviceBreakdown: { device: string; count: number }[]
  topProducts: { produto_nome: string; visualizacoes: number; adicoes_carrinho: number }[]
  topStores: { loja_nome: string; revendedora_nome: string; page_views: number; vendas: number }[]
  topSearches: { search_query: string; total_buscas: number; taxa_clique: number }[]
  dailyViews: { data: string; views: number; sessions: number }[]
  pageTypeBreakdown: { page_type: string; count: number }[]
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const diasAtras = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - diasAtras)

      // Buscar dados em paralelo
      const [
        pageViewsResult,
        sessionsResult,
        productViewsResult,
        cartEventsResult,
        searchEventsResult,
        deviceResult,
        pageTypeResult,
        dailyResult
      ] = await Promise.all([
        // Total de page views
        supabase
          .from('page_views')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dataInicio.toISOString()),
        
        // Total de sessões
        supabase
          .from('page_views')
          .select('session_id')
          .gte('created_at', dataInicio.toISOString()),
        
        // Total de product views
        supabase
          .from('product_views')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dataInicio.toISOString()),
        
        // Eventos de carrinho
        supabase
          .from('cart_events')
          .select('event_type')
          .gte('created_at', dataInicio.toISOString()),
        
        // Eventos de busca
        supabase
          .from('search_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dataInicio.toISOString()),
        
        // Breakdown por dispositivo
        supabase
          .from('page_views')
          .select('device_type')
          .gte('created_at', dataInicio.toISOString()),
        
        // Breakdown por tipo de página
        supabase
          .from('page_views')
          .select('page_type')
          .gte('created_at', dataInicio.toISOString()),
        
        // Views diários
        supabase
          .from('page_views')
          .select('created_at, session_id')
          .gte('created_at', dataInicio.toISOString())
          .order('created_at', { ascending: true })
      ])

      // Top produtos
      const topProductsResult = await supabase
        .from('product_views')
        .select('produto_id, produto_nome')
        .gte('created_at', dataInicio.toISOString())

      // Top buscas
      const topSearchesResult = await supabase
        .from('search_events')
        .select('search_query, clicked_product_id')
        .gte('created_at', dataInicio.toISOString())

      // Processar dados
      const uniqueSessions = new Set(sessionsResult.data?.map(d => d.session_id) || [])
      const cartEvents = cartEventsResult.data || []
      const addToCartCount = cartEvents.filter(e => e.event_type === 'add_to_cart').length
      const purchaseCount = cartEvents.filter(e => e.event_type === 'purchase').length

      // Device breakdown
      const deviceCounts: Record<string, number> = {}
      deviceResult.data?.forEach(d => {
        const device = d.device_type || 'unknown'
        deviceCounts[device] = (deviceCounts[device] || 0) + 1
      })

      // Page type breakdown
      const pageTypeCounts: Record<string, number> = {}
      pageTypeResult.data?.forEach(d => {
        const pageType = d.page_type || 'outro'
        pageTypeCounts[pageType] = (pageTypeCounts[pageType] || 0) + 1
      })

      // Daily views
      const dailyMap: Record<string, { views: number; sessions: Set<string> }> = {}
      dailyResult.data?.forEach(d => {
        const date = d.created_at.split('T')[0]
        if (!dailyMap[date]) {
          dailyMap[date] = { views: 0, sessions: new Set() }
        }
        dailyMap[date].views++
        dailyMap[date].sessions.add(d.session_id)
      })

      // Top produtos agregados
      const productCounts: Record<string, { nome: string; views: number }> = {}
      topProductsResult.data?.forEach(p => {
        if (p.produto_nome) {
          if (!productCounts[p.produto_id]) {
            productCounts[p.produto_id] = { nome: p.produto_nome, views: 0 }
          }
          productCounts[p.produto_id].views++
        }
      })

      // Top searches agregados
      const searchCounts: Record<string, { total: number; clicks: number }> = {}
      topSearchesResult.data?.forEach(s => {
        if (s.search_query) {
          if (!searchCounts[s.search_query]) {
            searchCounts[s.search_query] = { total: 0, clicks: 0 }
          }
          searchCounts[s.search_query].total++
          if (s.clicked_product_id) {
            searchCounts[s.search_query].clicks++
          }
        }
      })

      setData({
        totalPageViews: pageViewsResult.count || 0,
        totalSessions: uniqueSessions.size,
        totalProductViews: productViewsResult.count || 0,
        totalAddToCart: addToCartCount,
        totalSearches: searchEventsResult.count || 0,
        conversionRate: uniqueSessions.size > 0 
          ? (purchaseCount / uniqueSessions.size) * 100 
          : 0,
        deviceBreakdown: Object.entries(deviceCounts).map(([device, count]) => ({
          device,
          count
        })).sort((a, b) => b.count - a.count),
        pageTypeBreakdown: Object.entries(pageTypeCounts).map(([page_type, count]) => ({
          page_type,
          count
        })).sort((a, b) => b.count - a.count),
        topProducts: Object.values(productCounts)
          .map(p => ({ produto_nome: p.nome, visualizacoes: p.views, adicoes_carrinho: 0 }))
          .sort((a, b) => b.visualizacoes - a.visualizacoes)
          .slice(0, 10),
        topStores: [], // Será preenchido com query específica se necessário
        topSearches: Object.entries(searchCounts)
          .map(([query, data]) => ({
            search_query: query,
            total_buscas: data.total,
            taxa_clique: data.total > 0 ? (data.clicks / data.total) * 100 : 0
          }))
          .sort((a, b) => b.total_buscas - a.total_buscas)
          .slice(0, 10),
        dailyViews: Object.entries(dailyMap)
          .map(([data, info]) => ({
            data,
            views: info.views,
            sessions: info.sessions.size
          }))
          .sort((a, b) => a.data.localeCompare(b.data))
      })
    } catch (error) {
      console.error('Erro ao buscar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-5 h-5" />
      case 'tablet': return <Tablet className="w-5 h-5" />
      default: return <Monitor className="w-5 h-5" />
    }
  }

  const getPageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'landing': 'Página Inicial',
      'catalogo': 'Catálogo',
      'produto': 'Produto',
      'checkout': 'Checkout',
      'carrinho': 'Carrinho',
      'admin': 'Admin',
      'franqueada': 'Painel Franqueada',
      'revendedora': 'Painel Revendedora',
      'login': 'Login',
      'cadastro': 'Cadastro',
      'outro': 'Outras'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-pink-500" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-1">Métricas e insights do sistema</p>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPeriodo('7d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              periodo === '7d' 
                ? 'bg-white text-pink-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriodo('30d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              periodo === '30d' 
                ? 'bg-white text-pink-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setPeriodo('90d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              periodo === '90d' 
                ? 'bg-white text-pink-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            90 dias
          </button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard
          title="Visualizações"
          value={data?.totalPageViews || 0}
          icon={<Eye className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Sessões"
          value={data?.totalSessions || 0}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Produtos Vistos"
          value={data?.totalProductViews || 0}
          icon={<Package className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          title="Add ao Carrinho"
          value={data?.totalAddToCart || 0}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="orange"
        />
        <MetricCard
          title="Buscas"
          value={data?.totalSearches || 0}
          icon={<Search className="w-5 h-5" />}
          color="cyan"
        />
        <MetricCard
          title="Taxa Conversão"
          value={`${(data?.conversionRate || 0).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="pink"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de visualizações diárias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Visualizações por Dia
          </h3>
          <div className="h-64">
            {data?.dailyViews && data.dailyViews.length > 0 ? (
              <div className="flex items-end justify-between h-full gap-1">
                {data.dailyViews.slice(-30).map((day, i) => {
                  const maxViews = Math.max(...data.dailyViews.map(d => d.views))
                  const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className="relative w-full">
                        <div
                          className="w-full bg-pink-500 rounded-t transition-all group-hover:bg-pink-600"
                          style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                          {day.views} views
                        </div>
                      </div>
                      {i % Math.ceil(data.dailyViews.length / 7) === 0 && (
                        <span className="text-xs text-gray-400 mt-2">
                          {new Date(day.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Breakdown por dispositivo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-gray-400" />
            Dispositivos
          </h3>
          <div className="space-y-4">
            {data?.deviceBreakdown && data.deviceBreakdown.length > 0 ? (
              data.deviceBreakdown.map((item, i) => {
                const total = data.deviceBreakdown.reduce((sum, d) => sum + d.count, 0)
                const percentage = total > 0 ? (item.count / total) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                      {getDeviceIcon(item.device)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{item.device}</span>
                        <span className="text-sm text-gray-500">{item.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-gray-400 py-8">Nenhum dado disponível</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Páginas mais visitadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-gray-400" />
            Páginas Mais Visitadas
          </h3>
          <div className="space-y-3">
            {data?.pageTypeBreakdown && data.pageTypeBreakdown.length > 0 ? (
              data.pageTypeBreakdown.slice(0, 8).map((item, i) => {
                const total = data.pageTypeBreakdown.reduce((sum, d) => sum + d.count, 0)
                const percentage = total > 0 ? (item.count / total) * 100 : 0
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {getPageTypeLabel(item.page_type)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{item.count}</span>
                      <span className="text-xs text-gray-400 w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-gray-400 py-8">Nenhum dado disponível</div>
            )}
          </div>
        </div>

        {/* Produtos mais visualizados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            Produtos Mais Visualizados
          </h3>
          <div className="space-y-3">
            {data?.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.slice(0, 8).map((produto, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {produto.produto_nome}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {produto.visualizacoes}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">Nenhum dado disponível</div>
            )}
          </div>
        </div>
      </div>

      {/* Termos mais buscados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          Termos Mais Buscados
        </h3>
        {data?.topSearches && data.topSearches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Termo</th>
                  <th className="pb-3 font-medium text-center">Buscas</th>
                  <th className="pb-3 font-medium text-center">Taxa de Clique</th>
                </tr>
              </thead>
              <tbody>
                {data.topSearches.map((search, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">
                      <span className="text-sm font-medium text-gray-700">{search.search_query}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-sm text-gray-600">{search.total_buscas}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-sm font-medium ${
                        search.taxa_clique >= 50 ? 'text-green-600' : 
                        search.taxa_clique >= 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {search.taxa_clique.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">Nenhuma busca registrada</div>
        )}
      </div>

      {/* Aviso sobre Google Analytics */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Dica: Google Analytics 4</h4>
        <p className="text-blue-800 text-sm">
          Para análises mais avançadas (origem do tráfego, comportamento do usuário, funil de conversão), 
          configure o Google Analytics 4. Adicione seu ID de medição (G-XXXXXXXXXX) nas configurações do sistema.
        </p>
      </div>
    </div>
  )
}

// Componente de card de métrica
function MetricCard({ 
  title, 
  value, 
  icon, 
  color,
  change 
}: { 
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink'
  change?: number
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    pink: 'bg-pink-50 text-pink-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}
