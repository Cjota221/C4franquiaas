/**
 * Utilitário para gerar mensagens do WhatsApp com emojis
 * Garante compatibilidade UTF-8 em todos os ambientes
 */

// Configuração: defina como false se os emojis não funcionarem no dispositivo
const USE_EMOJIS = false

// Emojis como constantes - gerados em runtime para garantir compatibilidade
export const EMOJIS = {
  WAVE: USE_EMOJIS ? String.fromCodePoint(0x1F44B) : '',      // 👋
  SPEECH: USE_EMOJIS ? String.fromCodePoint(0x1F4AC) : '',    // 💬
  CART: USE_EMOJIS ? String.fromCodePoint(0x1F6D2) : '*',     // 🛒
  MONEY: USE_EMOJIS ? String.fromCodePoint(0x1F4B0) : '$',    // 💰
  SMILE: USE_EMOJIS ? String.fromCodePoint(0x1F60A) : '',     // 😊
  GIFT: USE_EMOJIS ? String.fromCodePoint(0x1F381) : '',      // 🎁
  STAR: USE_EMOJIS ? String.fromCodePoint(0x2B50) : '*',      // ⭐
  CHECK: USE_EMOJIS ? String.fromCodePoint(0x2705) : '[OK]',  // ✅
  HEART: USE_EMOJIS ? String.fromCodePoint(0x2764) : '<3',    // ❤
  FIRE: USE_EMOJIS ? String.fromCodePoint(0x1F525) : '',      // 🔥
} as const

export interface CartItem {
  product_name: string
  product_price: number
  quantity: number
  variation_name?: string | null
}

export interface WhatsAppMessageOptions {
  customerName?: string | null
  items?: CartItem[]
  totalValue?: number
  couponCode?: string | null
  customMessage?: string
}

/**
 * Valida se uma string contém caracteres UTF-8 válidos
 */
export function isValidUtf8(str: string): boolean {
  try {
    // Tenta encodar e decodar
    const encoded = encodeURIComponent(str)
    const decoded = decodeURIComponent(encoded)
    return decoded === str
  } catch {
    return false
  }
}

/**
 * Remove caracteres inválidos e normaliza a string
 */
export function sanitizeMessage(message: string): string {
  // Remove caracteres de controle exceto newlines
  return message
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .normalize('NFC')
}

/**
 * Gera mensagem formatada para carrinho abandonado
 */
export function generateAbandonedCartMessage(options: WhatsAppMessageOptions): string {
  const { customerName, items, totalValue, couponCode } = options
  const firstName = customerName?.split(' ')[0] || 'Cliente'
  
  let message = `Ola ${firstName}!${EMOJIS.WAVE ? ' ' + EMOJIS.WAVE : ''}\n\n`
  message += `${EMOJIS.SPEECH ? EMOJIS.SPEECH + ' ' : ''}Vi que voce deixou alguns itens no carrinho. Posso te ajudar?\n\n`
  
  if (items && items.length > 0) {
    message += `${EMOJIS.CART ? EMOJIS.CART + ' ' : ''}*Seu carrinho:*\n`
    items.forEach((item) => {
      const variation = item.variation_name ? ` (${item.variation_name})` : ''
      const price = typeof item.product_price === 'number' ? item.product_price.toFixed(2) : '0.00'
      message += `- ${item.product_name}${variation} - R$ ${price}\n`
    })
    
    const total = typeof totalValue === 'number' ? totalValue.toFixed(2) : '0.00'
    message += `\n${EMOJIS.MONEY ? EMOJIS.MONEY + ' ' : ''}*Total: R$ ${total}*\n\n`
  }
  
  if (couponCode) {
    message += `${EMOJIS.GIFT ? EMOJIS.GIFT + ' ' : ''}Use o cupom *${couponCode}* para desconto!\n\n`
  }
  
  message += `Estou aqui pra te ajudar!${EMOJIS.SMILE ? ' ' + EMOJIS.SMILE : ''}`
  
  return sanitizeMessage(message)
}

/**
 * Gera link do WhatsApp com mensagem
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
  // Remove tudo que não for dígito
  const cleaned = phone.replace(/\D/g, '')
  
  // Adiciona código do Brasil se necessário
  const fullNumber = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
  
  if (!message) {
    return `https://wa.me/${fullNumber}`
  }
  
  // Sanitiza e valida a mensagem
  const sanitized = sanitizeMessage(message)
  
  if (!isValidUtf8(sanitized)) {
    console.warn('[WhatsApp] Mensagem contém caracteres inválidos, removendo...')
    // Fallback: remove todos os caracteres não-ASCII
    const ascii = sanitized.replace(/[^\x20-\x7E\n]/g, '')
    return `https://wa.me/${fullNumber}?text=${encodeURIComponent(ascii)}`
  }
  
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(sanitized)}`
}

/**
 * Função de debug para testar emojis
 * Chame no console do navegador: window.testWhatsAppEmojis()
 */
export function debugEmojis(): void {
  console.log('=== TESTE DE EMOJIS WHATSAPP ===')
  console.log('')
  
  // Teste cada emoji
  Object.entries(EMOJIS).forEach(([name, emoji]) => {
    const codePoint = emoji.codePointAt(0)?.toString(16).toUpperCase()
    console.log(`${name}: "${emoji}" (U+${codePoint})`)
  })
  
  console.log('')
  console.log('=== TESTE DE MENSAGEM COMPLETA ===')
  
  const testMessage = generateAbandonedCartMessage({
    customerName: 'Maria Silva',
    items: [
      { product_name: 'Produto Teste', product_price: 99.90, quantity: 1 },
      { product_name: 'Outro Produto', product_price: 49.90, quantity: 2, variation_name: 'Azul' }
    ],
    totalValue: 199.70
  })
  
  console.log('Mensagem gerada:')
  console.log(testMessage)
  console.log('')
  console.log('Mensagem encodada:')
  console.log(encodeURIComponent(testMessage))
  console.log('')
  console.log('Link completo:')
  console.log(generateWhatsAppLink('11999999999', testMessage))
  console.log('')
  console.log('UTF-8 válido:', isValidUtf8(testMessage))
  console.log('')
  console.log('=== FIM DO TESTE ===')
}

// Expõe função de debug no window para testes no navegador
if (typeof window !== 'undefined') {
  (window as Window & { testWhatsAppEmojis?: () => void }).testWhatsAppEmojis = debugEmojis
}
