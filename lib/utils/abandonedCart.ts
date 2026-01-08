/**
 * Utilitário para salvar carrinho abandonado
 * Usado no checkout para rastrear carrinhos abandonados
 */

interface CartItem {
  id: string;
  nome: string;
  imagem: string;
  preco: number;
  quantidade: number;
  variacaoId?: string | null;
  tamanho?: string;
  sku?: string;
}

interface SaveAbandonedCartParams {
  resellerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: CartItem[];
}

/**
 * Salva o carrinho abandonado no banco de dados para recuperação posterior
 * @param params Dados do carrinho e cliente
 * @returns O token de recuperação se sucesso, null se falha
 */
export async function saveAbandonedCart(params: SaveAbandonedCartParams): Promise<string | null> {
  try {
    // Só salva se tiver dados do cliente
    if (!params.customerPhone && !params.customerEmail) {
      console.debug('[Carrinho Abandonado] Sem dados do cliente, não salvando');
      return null;
    }

    const response = await fetch('/api/abandoned-cart/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resellerId: params.resellerId,
        customerName: params.customerName,
        customerPhone: params.customerPhone?.replace(/\D/g, '') || null,
        customerEmail: params.customerEmail,
        items: params.items.map(item => ({
          productId: item.id,
          productName: item.nome,
          productImage: item.imagem,
          productPrice: item.preco,
          quantity: item.quantidade,
          variationId: item.variacaoId || item.sku,
          variationName: item.tamanho
        }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Carrinho Abandonado] Salvo com sucesso, token:', data.recoveryToken);
      return data.recoveryToken;
    }

    return null;
  } catch (error) {
    console.debug('[Carrinho Abandonado] Erro ao salvar:', error);
    return null;
  }
}
