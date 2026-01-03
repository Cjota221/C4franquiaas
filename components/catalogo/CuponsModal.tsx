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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resellerId])

  const loadCupons = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('reseller_id', resellerId)
        .eq('is_active', true)
        .not('coupon_code', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar cupons válidos e mapear para o formato esperado
      const cuponsValidos = (data || []).filter((cupom) => {
        // Verificar validade
        if (cupom.ends_at) {
          const dataValidade = new Date(cupom.ends_at)
          if (dataValidade < new Date()) return false
        }
        
        // Verificar limite de uso
        if (cupom.max_uses && cupom.uses_count >= cupom.max_uses) {
          return false
        }
        
        return true
      }).map((cupom) => ({
        id: cupom.id,
        code: cupom.coupon_code,
        type: cupom.type,
        discount_value: cupom.discount_value,
        min_purchase: cupom.min_purchase_value,
        max_discount: cupom.max_discount_value,
        valid_until: cupom.ends_at,
        usage_limit: cupom.max_uses,
        used_count: cupom.uses_count || 0,
        active: cupom.is_active,
        description: cupom.description
      }))

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getDiscountText = (cupom: Cupom) => {
    if (cupom.type === 'frete_gratis') {
      return 'Frete Grátis'
    }
    if (cupom.type === 'cupom_desconto' || cupom.type === 'desconto_percentual') {
      if (cupom.discount_value) {
        return `${cupom.discount_value}% de desconto`
      }
    }
    if (cupom.type === 'desconto_valor' && cupom.discount_value) {
      return `R$ ${cupom.discount_value.toFixed(2)} de desconto`
    }
    return 'Desconto especial'
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Gift size={24} />
            <h2 className="text-xl font-bold">Cupons Disponíveis</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : cupons.length === 0 ? (
            <div className="text-center py-12">
              <Gift size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhum cupom disponível</p>
              <p className="text-gray-400 text-sm mt-2">Volte mais tarde para conferir novidades!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cupons.map((cupom) => (
                <div 
                  key={cupom.id}
                  className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  {/* Tipo e Desconto */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {cupom.type === 'frete_gratis' ? (
                        <Tag className="w-5 h-5 text-white" />
                      ) : (
                        <Percent className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg">
                        {getDiscountText(cupom)}
                      </p>
                      {cupom.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {cupom.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Validade */}
                  {cupom.valid_until && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <Calendar size={12} />
                      Válido até {formatDate(cupom.valid_until)}
                    </p>
                  )}

                  {/* Requisitos */}
                  {cupom.min_purchase && (
                    <p className="text-xs text-gray-500 mb-3">
                      Válido para compras acima de R$ {cupom.min_purchase.toFixed(2)}
                    </p>
                  )}

                  {/* Código e botão copiar */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-dashed border-pink-300">
                    <code className="flex-1 text-lg font-bold text-pink-600 tracking-wider">
                      {cupom.code}
                    </code>
                    
                    <button
                      onClick={() => handleCopy(cupom.code)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        copiedCode === cupom.code
                          ? 'bg-green-500 text-white'
                          : 'bg-pink-500 text-white hover:bg-pink-600'
                      }`}
                    >
                      {copiedCode === cupom.code ? (
                        <>
                          <Check size={16} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>

                  {/* Limite de uso */}
                  {cupom.usage_limit && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {cupom.used_count}/{cupom.usage_limit} usos
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}