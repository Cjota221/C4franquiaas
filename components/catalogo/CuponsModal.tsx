'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Gift, Tag, Calendar, Percent } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Cupom = {
  id: string
  code: string
  type: 'frete_gratis' | 'cupom_desconto' | 'desconto_percentual' | 'desconto_valor'
  discount_value: number | null
  min_purchase: number | null
  max_discount: number | null
  valid_until: string | null
  usage_limit: number | null
  used_count: number
  active: boolean
  description: string | null
}

type CuponsModalProps = {
  isOpen: boolean
  onClose: () => void
  resellerId: string
  onCouponCopy?: (code: string) => void
}

export default function CuponsModal({ isOpen, onClose, resellerId, onCouponCopy }: CuponsModalProps) {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && resellerId) {
      loadCupons()
    }
  }, [isOpen, resellerId])

  const loadCupons = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('reseller_id', resellerId)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar cupons válidos
      const cuponsValidos = (data || []).filter((cupom: Cupom) => {
        // Verificar validade
        if (cupom.valid_until) {
          const dataValidade = new Date(cupom.valid_until)
          if (dataValidade < new Date()) return false
        }
        
        // Verificar limite de uso
        if (cupom.usage_limit && cupom.used_count >= cupom.usage_limit) {
          return false
        }
        
        return true
      })

      setCupons(cuponsValidos)
    } catch (error) {
      console.error('Erro ao carregar cupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      onCouponCopy?.(code)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'frete_gratis': return 'Frete Grátis'
      case 'desconto_percentual': return 'Desconto'
      case 'desconto_valor': return 'Desconto'
      case 'cupom_desconto': return 'Desconto'
      default: return 'Promoção'
    }
  }

  const getDiscountText = (cupom: Cupom) => {
    if (cupom.type === 'frete_gratis') {
      return 'Frete Grátis'
    }
    if (cupom.type === 'desconto_percentual') {
      return `${cupom.discount_value}% OFF`
    }
    if (cupom.type === 'desconto_valor') {
      return `R$ ${cupom.discount_value?.toFixed(2)} OFF`
    }
    return cupom.description || 'Desconto especial'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cupons Disponíveis</h2>
              <p className="text-pink-100 text-sm">Copie e use no carrinho</p>
            </div>
          </div>
        </div>

        {/* Lista de Cupons */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
          ) : cupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Tag className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Nenhum cupom disponível</p>
              <p className="text-gray-400 text-sm mt-1">Volte mais tarde para novas promoções!</p>
            </div>
          ) : (
            cupons.map((cupom) => (
              <div
                key={cupom.id}
                className="border-2 border-gray-200 rounded-2xl p-4 hover:border-pink-300 hover:shadow-lg transition-all"
              >
                {/* Badge do tipo */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                    <Percent className="w-3 h-3" />
                    {getTypeLabel(cupom.type)}
                  </span>
                  
                  {cupom.valid_until && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Até {formatDate(cupom.valid_until)}
                    </span>
                  )}
                </div>

                {/* Valor do desconto */}
                <p className="text-xl font-bold text-gray-900 mb-2">
                  {getDiscountText(cupom)}
                </p>

                {/* Descrição */}
                {cupom.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {cupom.description}
                  </p>
                )}

                {/* Requisitos */}
                {cupom.min_purchase && (
                  <p className="text-xs text-gray-500 mb-3">
                    Válido para compras acima de R$ {cupom.min_purchase.toFixed(2)}
                  </p>
                )}

                {/* Código e botão copiar */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <code className="flex-1 text-lg font-bold text-pink-600 tracking-wider">
                    {cupom.code}
                  </code>
                  
                  <button
                    onClick={() => handleCopy(cupom.code)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      copiedCode === cupom.code
                        ? 'bg-green-500 text-white'
                        : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                  >
                    {copiedCode === cupom.code ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Copiado!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Copiar
                      </span>
                    )}
                  </button>
                </div>

                {/* Limite de uso */}
                {cupom.usage_limit && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {cupom.usage_limit - cupom.used_count} usos restantes
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cupons.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              💡 Copie o código e cole no campo de cupom no carrinho
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
