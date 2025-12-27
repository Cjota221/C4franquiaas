'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, ShoppingBag } from 'lucide-react'

interface CustomerData {
  name: string
  phone: string
  email?: string
}

interface CustomerCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomerData) => void
  productName?: string
}

export default function CustomerCaptureModal({
  isOpen,
  onClose,
  onSubmit,
  productName
}: CustomerCaptureModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  // Carregar dados salvos
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem('c4-customer-data')
      if (savedData) {
        const { name: savedName, phone: savedPhone } = JSON.parse(savedData)
        if (savedName) setName(savedName)
        if (savedPhone) setPhone(savedPhone)
      }
    }
  }, [isOpen])

  const formatPhone = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11)
    
    // Formata
    if (limited.length <= 2) return limited
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar telefone (mínimo 10 dígitos)
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      alert('Por favor, insira um telefone válido com DDD')
      return
    }

    setLoading(true)

    // Salvar no localStorage
    const customerData: CustomerData = { name, phone: phoneDigits }
    localStorage.setItem('c4-customer-data', JSON.stringify(customerData))

    onSubmit(customerData)
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Quase lá! 🎉</h2>
          </div>
          
          <p className="text-white/90 text-sm">
            {productName 
              ? `Para adicionar "${productName}" ao carrinho, precisamos dos seus dados.`
              : 'Para continuar sua compra, precisamos de algumas informações.'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu nome
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como podemos te chamar?"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(99) 99999-9999"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usaremos apenas para te ajudar com sua compra
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Continuar para o carrinho'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Ao continuar, você concorda com nossa política de privacidade
          </p>
        </form>
      </div>
    </div>
  )
}
