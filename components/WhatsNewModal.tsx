'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, Bug, AlertTriangle, Zap, ArrowRight, Rocket } from 'lucide-react'
import { useNotifications, SystemNotification } from '@/hooks/useNotifications'
import Image from 'next/image'

interface WhatsNewModalProps {
  audience?: 'all' | 'resellers' | 'admin'
}

const typeConfig = {
  feature: {
    icon: Sparkles,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    label: 'Nova Funcionalidade'
  },
  fix: {
    icon: Bug,
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
    label: 'Correção'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    label: 'Alerta Importante'
  },
  improvement: {
    icon: Zap,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    label: 'Melhoria'
  }
}

export default function WhatsNewModal({ audience = 'all' }: WhatsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<SystemNotification | null>(null)
  
  const { priorityNotification, dismissPriorityPopup } = useNotifications({ audience })

  // Mostrar modal quando houver notificação prioritária
  useEffect(() => {
    if (priorityNotification) {
      // Pequeno delay para não aparecer instantaneamente ao carregar
      const timer = setTimeout(() => {
        setCurrentNotification(priorityNotification)
        setIsOpen(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [priorityNotification])

  const handleClose = () => {
    if (currentNotification) {
      dismissPriorityPopup(currentNotification.id)
    }
    setIsOpen(false)
    setCurrentNotification(null)
  }

  if (!isOpen || !currentNotification) return null

  const config = typeConfig[currentNotification.type] || typeConfig.feature
  const TypeIcon = config.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header com gradiente */}
        <div className={`relative bg-gradient-to-br ${config.gradient} p-6 pb-12 text-white`}>
          {/* Decoração de fundo */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl" />
          </div>
          
          {/* Botão fechar */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Ícone e título */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TypeIcon className="w-5 h-5" />
                <Rocket className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-white/90">
                {config.label}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold leading-tight">
              {currentNotification.title}
            </h2>
          </div>
        </div>
        
        {/* Corpo */}
        <div className="p-6 -mt-6 relative">
          {/* Card de conteúdo */}
          <div className="bg-gray-50 rounded-xl p-4">
            {/* Imagem se houver */}
            {currentNotification.image_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <Image
                  src={currentNotification.image_url}
                  alt={currentNotification.title}
                  width={400}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            
            {/* Descrição */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {currentNotification.description}
            </p>
          </div>
          
          {/* Botão de ação */}
          <button
            onClick={handleClose}
            className={`w-full mt-4 py-3 px-4 bg-gradient-to-r ${config.gradient} text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg`}
          >
            <span>Entendi!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {/* Texto auxiliar */}
          <p className="text-center text-xs text-gray-400 mt-3">
            Este popup não aparecerá novamente
          </p>
        </div>
      </div>
    </div>
  )
}
