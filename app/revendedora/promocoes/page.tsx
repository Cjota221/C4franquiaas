'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Tag, 
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Percent,
  Truck,
  Gift,
  Edit,
  ToggleLeft,
  ToggleRight,
  XCircle,
  Copy,
  Check
} from 'lucide-react'

interface Promotion {
  id: string
  reseller_id: string
  name: string
  description: string | null
  type: 'frete_gratis' | 'cupom_desconto' | 'leve_pague' | 'desconto_percentual' | 'desconto_valor'
  discount_type: 'percentage' | 'fixed_value' | null
  discount_value: number | null
  buy_quantity: number | null
  pay_quantity: number | null
  free_shipping: boolean
  min_value_free_shipping: number | null
  coupon_code: string | null
  min_purchase_value: number | null
  max_discount_value: number | null
  max_uses: number | null
  uses_count: number
  applies_to: 'all' | 'categories' | 'products'
  starts_at: string
  ends_at: string | null
  is_active: boolean
  created_at: string
}

type PromotionFormData = {
  name: string
  description: string
  type: Promotion['type']
  discount_type: 'percentage' | 'fixed_value'
  discount_value: string
  buy_quantity: string
  pay_quantity: string
  free_shipping: boolean
  min_value_free_shipping: string
  coupon_code: string
  min_purchase_value: string
  max_discount_value: string
  max_uses: string
  ends_at: string
}

const initialFormData: PromotionFormData = {
  name: '',
  description: '',
  type: 'cupom_desconto',
  discount_type: 'percentage',
  discount_value: '',
  buy_quantity: '',
  pay_quantity: '',
  free_shipping: false,
  min_value_free_shipping: '',
  coupon_code: '',
  min_purchase_value: '',
  max_discount_value: '',
  max_uses: '',
  ends_at: ''
}

export default function PromocoesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [resellerId, setResellerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState<PromotionFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const loadPromotions = async (rId: string) => {
    try {
      const response = await fetch(`/api/promocoes?reseller_id=${rId}`)
      const data = await response.json()
      if (data.promotions) {
        setPromotions(data.promotions)
      }
    } catch (err) {
      console.error('Erro ao buscar promoções:', err)
    }
  }

  const reloadPromotions = async () => {
    if (resellerId) {
      await loadPromotions(resellerId)
    }
  }

  useEffect(() => {
    const loadResellerAndPromotions = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('Usuário não autenticado')
          setLoading(false)
          return
        }

        const { data: reseller, error: resellerError } = await supabase
          .from('resellers')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (resellerError || !reseller) {
          setError('Revendedora não encontrada')
          setLoading(false)
          return
        }

        setResellerId(reseller.id)
        await loadPromotions(reseller.id)
      } catch (err) {
        console.error('Erro ao carregar:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadResellerAndPromotions()
  }, [])

  const openCreateModal = () => {
    setEditingPromotion(null)
    setFormData(initialFormData)
    setShowModal(true)
  }

  const openEditModal = (promo: Promotion) => {
    setEditingPromotion(promo)
    setFormData({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      discount_type: promo.discount_type || 'percentage',
      discount_value: promo.discount_value?.toString() || '',
      buy_quantity: promo.buy_quantity?.toString() || '',
      pay_quantity: promo.pay_quantity?.toString() || '',
      free_shipping: promo.free_shipping,
      min_value_free_shipping: promo.min_value_free_shipping?.toString() || '',
      coupon_code: promo.coupon_code || '',
      min_purchase_value: promo.min_purchase_value?.toString() || '',
      max_discount_value: promo.max_discount_value?.toString() || '',
      max_uses: promo.max_uses?.toString() || '',
      ends_at: promo.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resellerId) return

    setSaving(true)

    try {
      const payload = {
        ...(editingPromotion && { id: editingPromotion.id }),
        reseller_id: resellerId,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        buy_quantity: formData.buy_quantity ? parseInt(formData.buy_quantity) : null,
        pay_quantity: formData.pay_quantity ? parseInt(formData.pay_quantity) : null,
        free_shipping: formData.free_shipping || formData.type === 'frete_gratis',
        min_value_free_shipping: formData.min_value_free_shipping ? parseFloat(formData.min_value_free_shipping) : null,
        coupon_code: formData.coupon_code || null,
        min_purchase_value: formData.min_purchase_value ? parseFloat(formData.min_purchase_value) : null,
        max_discount_value: formData.max_discount_value ? parseFloat(formData.max_discount_value) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        ends_at: formData.ends_at || null
      }

      const response = await fetch('/api/promocoes', {
        method: editingPromotion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.error) {
        alert(data.error)
      } else {
        setShowModal(false)
        await reloadPromotions()
      }
    } catch (err) {
      console.error('Erro ao salvar promoção:', err)
      alert('Erro ao salvar promoção')
    } finally {
      setSaving(false)
    }
  }

  const togglePromotion = async (promo: Promotion) => {
    try {
      const response = await fetch('/api/promocoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo.id, is_active: !promo.is_active })
      })

      if (response.ok) {
        await reloadPromotions()
      }
    } catch (err) {
      console.error('Erro ao atualizar promoção:', err)
    }
  }

  const deletePromotion = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta promoção?')) return

    try {
      const response = await fetch(`/api/promocoes?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await reloadPromotions()
      }
    } catch (err) {
      console.error('Erro ao deletar promoção:', err)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'frete_gratis':
        return <Truck className="w-5 h-5" />
      case 'cupom_desconto':
        return <Tag className="w-5 h-5" />
      case 'leve_pague':
        return <Gift className="w-5 h-5" />
      case 'desconto_percentual':
        return <Percent className="w-5 h-5" />
      case 'desconto_valor':
        return <Tag className="w-5 h-5" />
      default:
        return <Tag className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'frete_gratis':
        return 'Frete Grátis'
      case 'cupom_desconto':
        return 'Cupom de Desconto'
      case 'leve_pague':
        return 'Leve + Pague -'
      case 'desconto_percentual':
        return 'Desconto %'
      case 'desconto_valor':
        return 'Desconto R$'
      default:
        return type
    }
  }

  const getPromoDescription = (promo: Promotion) => {
    switch (promo.type) {
      case 'frete_gratis':
        if (promo.min_value_free_shipping) {
          return `Frete grátis acima de R$ ${promo.min_value_free_shipping.toFixed(2)}`
        }
        return 'Frete grátis em todos os pedidos'
      case 'cupom_desconto':
        if (promo.discount_type === 'percentage') {
          return `${promo.discount_value}% de desconto com o cupom ${promo.coupon_code}`
        }
        return `R$ ${promo.discount_value?.toFixed(2)} de desconto com o cupom ${promo.coupon_code}`
      case 'leve_pague':
        return `Leve ${promo.buy_quantity} e pague ${promo.pay_quantity}`
      case 'desconto_percentual':
        return `${promo.discount_value}% de desconto`
      case 'desconto_valor':
        return `R$ ${promo.discount_value?.toFixed(2)} de desconto`
      default:
        return promo.description
    }
  }

  const isExpired = (promo: Promotion) => {
    if (!promo.ends_at) return false
    return new Date(promo.ends_at) < new Date()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
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

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500 py-8">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-pink-500" />
            Promoções
          </h1>
          <p className="text-gray-600 mt-1">
            Crie cupons, frete grátis e promoções para sua loja
          </p>
        </div>
        
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            <Plus className="w-4 h-4" />
            Nova Promoção
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Promoções Ativas</div>
            <div className="text-2xl font-bold text-green-600">
              {promotions.filter(p => p.is_active && !isExpired(p)).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total de Usos</div>
            <div className="text-2xl font-bold text-pink-600">
              {promotions.reduce((sum, p) => sum + p.uses_count, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Cupons Ativos</div>
            <div className="text-2xl font-bold text-blue-600">
              {promotions.filter(p => p.coupon_code && p.is_active).length}
            </div>
          </div>
        </div>

        {/* Promotions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {promotions.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma promoção criada</p>
              <p className="text-sm mt-2">
                Crie sua primeira promoção para atrair mais clientes!
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Criar Promoção
              </button>
            </div>
          ) : (
            promotions.map((promo) => (
              <div
                key={promo.id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                  !promo.is_active || isExpired(promo) ? 'opacity-60' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        promo.is_active && !isExpired(promo) 
                          ? 'bg-pink-100 text-pink-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {getTypeIcon(promo.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{promo.name}</div>
                        <div className="text-sm text-gray-500">{getTypeLabel(promo.type)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePromotion(promo)}
                      className="text-gray-400 hover:text-gray-600"
                      title={promo.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {promo.is_active ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    {getPromoDescription(promo)}
                  </div>

                  {promo.coupon_code && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                        {promo.coupon_code}
                      </div>
                      <button
                        onClick={() => copyCode(promo.coupon_code!)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Copiar código"
                      >
                        {copiedCode === promo.coupon_code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                    {promo.min_purchase_value && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        Mínimo R$ {promo.min_purchase_value.toFixed(2)}
                      </span>
                    )}
                    {promo.max_uses && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {promo.uses_count}/{promo.max_uses} usos
                      </span>
                    )}
                    {promo.ends_at && (
                      <span className={`px-2 py-1 rounded ${
                        isExpired(promo) ? 'bg-red-100 text-red-600' : 'bg-gray-100'
                      }`}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {isExpired(promo) ? 'Expirado' : `Até ${formatDate(promo.ends_at)}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <button
                      onClick={() => openEditModal(promo)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => deletePromotion(promo.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Promoção *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ex: Promoção de Verão"
                      required
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Promoção *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        type: e.target.value as Promotion['type'],
                        free_shipping: e.target.value === 'frete_gratis'
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="cupom_desconto">Cupom de Desconto</option>
                      <option value="frete_gratis">Frete Grátis</option>
                      <option value="leve_pague">Leve X Pague Y</option>
                      <option value="desconto_percentual">Desconto Percentual</option>
                      <option value="desconto_valor">Desconto em Valor</option>
                    </select>
                  </div>

                  {/* Cupom Code */}
                  {(formData.type === 'cupom_desconto') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código do Cupom *
                      </label>
                      <input
                        type="text"
                        value={formData.coupon_code}
                        onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                        className="w-full border rounded-lg px-3 py-2 uppercase"
                        placeholder="Ex: VERAO10"
                        required={formData.type === 'cupom_desconto'}
                      />
                    </div>
                  )}

                  {/* Desconto */}
                  {(formData.type === 'cupom_desconto' || formData.type === 'desconto_percentual' || formData.type === 'desconto_valor') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Desconto
                        </label>
                        <select
                          value={formData.discount_type}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            discount_type: e.target.value as 'percentage' | 'fixed_value'
                          })}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="percentage">Percentual (%)</option>
                          <option value="fixed_value">Valor Fixo (R$)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor do Desconto *
                        </label>
                        <input
                          type="number"
                          step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder={formData.discount_type === 'percentage' ? '10' : '20.00'}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Leve X Pague Y */}
                  {formData.type === 'leve_pague' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Leve (quantidade) *
                        </label>
                        <input
                          type="number"
                          value={formData.buy_quantity}
                          onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="3"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pague (quantidade) *
                        </label>
                        <input
                          type="number"
                          value={formData.pay_quantity}
                          onChange={(e) => setFormData({ ...formData, pay_quantity: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="2"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Frete Grátis - Valor Mínimo */}
                  {formData.type === 'frete_gratis' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Mínimo para Frete Grátis (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.min_value_free_shipping}
                        onChange={(e) => setFormData({ ...formData, min_value_free_shipping: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Deixe vazio para qualquer valor"
                      />
                    </div>
                  )}

                  {/* Valor Mínimo de Compra */}
                  {formData.type !== 'frete_gratis' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Mínimo de Compra (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.min_purchase_value}
                        onChange={(e) => setFormData({ ...formData, min_purchase_value: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Deixe vazio para qualquer valor"
                      />
                    </div>
                  )}

                  {/* Limite de Usos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite de Usos (opcional)
                    </label>
                    <input
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Deixe vazio para ilimitado"
                    />
                  </div>

                  {/* Data de Expiração */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Expiração (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={2}
                      placeholder="Descrição da promoção"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : (editingPromotion ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
