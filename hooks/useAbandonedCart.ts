import { useState, useEffect, useCallback } from 'react'

interface CustomerData {
  name: string
  phone: string
  email?: string
}

interface CartItemData {
  resellerId: string
  productId: string
  productName: string
  productImage?: string
  productPrice: number
  quantity: number
  variationId?: string
  variationName?: string
}

interface UseAbandonedCartReturn {
  customerData: CustomerData | null
  needsCustomerData: boolean
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  setCustomerData: (data: CustomerData) => void
  trackCartItem: (item: CartItemData) => Promise<void>
  clearCustomerData: () => void
}

export function useAbandonedCart(resellerId?: string): UseAbandonedCartReturn {
  const [customerData, setCustomerDataState] = useState<CustomerData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingItem, setPendingItem] = useState<CartItemData | null>(null)

  // Carregar dados do cliente do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('c4-customer-data')
    if (saved) {
      try {
        setCustomerDataState(JSON.parse(saved))
      } catch (e) {
        console.error('Erro ao carregar dados do cliente:', e)
      }
    }
  }, [])

  const needsCustomerData = !customerData?.phone

  const openModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setPendingItem(null)
  }, [])

  const setCustomerData = useCallback((data: CustomerData) => {
    setCustomerDataState(data)
    localStorage.setItem('c4-customer-data', JSON.stringify(data))
    setIsModalOpen(false)

    // Se tinha um item pendente, enviar agora
    if (pendingItem && resellerId) {
      sendToAbandonedCart(data, pendingItem, resellerId)
      setPendingItem(null)
    }
  }, [pendingItem, resellerId])

  const sendToAbandonedCart = async (
    customer: CustomerData,
    item: CartItemData,
    rId: string
  ) => {
    try {
      await fetch('/api/carrinho-abandonado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reseller_id: rId,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          product_id: item.productId,
          product_name: item.productName,
          product_image: item.productImage,
          product_price: item.productPrice,
          quantity: item.quantity,
          variation_id: item.variationId,
          variation_name: item.variationName
        })
      })
      console.log('✅ Item rastreado no carrinho abandonado')
    } catch (error) {
      console.error('Erro ao rastrear carrinho abandonado:', error)
    }
  }

  const trackCartItem = useCallback(async (item: CartItemData) => {
    if (!resellerId) {
      console.warn('resellerId não fornecido, pulando rastreamento')
      return
    }

    if (!customerData?.phone) {
      // Salvar item pendente e abrir modal
      setPendingItem(item)
      setIsModalOpen(true)
      return
    }

    // Já tem dados do cliente, enviar direto
    await sendToAbandonedCart(customerData, item, resellerId)
  }, [customerData, resellerId])

  const clearCustomerData = useCallback(() => {
    setCustomerDataState(null)
    localStorage.removeItem('c4-customer-data')
  }, [])

  return {
    customerData,
    needsCustomerData,
    isModalOpen,
    openModal,
    closeModal,
    setCustomerData,
    trackCartItem,
    clearCustomerData
  }
}

// Hook simplificado para usar na loja
export function useCustomerData() {
  const [data, setData] = useState<CustomerData | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('c4-customer-data')
    if (saved) {
      try {
        setData(JSON.parse(saved))
      } catch (e) {
        console.error('Erro ao carregar dados do cliente:', e)
      }
    }
  }, [])

  const hasCustomerData = !!data?.phone

  const saveCustomerData = (newData: CustomerData) => {
    setData(newData)
    localStorage.setItem('c4-customer-data', JSON.stringify(newData))
  }

  return { data, hasCustomerData, saveCustomerData }
}
