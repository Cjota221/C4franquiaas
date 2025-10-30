/**
 * Gerador de Payload PIX Estático
 * Gera o código "Copia e Cola" no padrão EMV (BR Code)
 */

import Pix from 'pix-payload';

export interface DadosPix {
  chave: string;              // Chave PIX (CPF, email, celular, etc)
  valor: number;              // Valor em reais (ex: 150.00)
  nome: string;               // Nome do recebedor (máx 25 caracteres)
  cidade?: string;            // Cidade do recebedor (máx 15 caracteres)
  identificador?: string;     // ID da transação (opcional)
  descricao?: string;         // Descrição (opcional)
}

/**
 * Gera o payload PIX no formato EMV (string "Copia e Cola")
 * @returns String no formato: "00020126580014br.gov.bcb.pix..."
 */
export function gerarPayloadPix(dados: DadosPix): string {
  try {
    const pix = new Pix(
      dados.chave,
      dados.descricao || 'Pagamento de Comissao',
      dados.identificador || '',
      dados.nome.substring(0, 25),           // Máx 25 chars
      (dados.cidade || 'Sao Paulo').substring(0, 15), // Máx 15 chars
      dados.valor.toFixed(2)
    );

    const payload = pix.getPayload();
    
    console.log('✅ [PIX] Payload gerado:', {
      chave: dados.chave,
      valor: dados.valor,
      tamanho: payload.length
    });

    return payload;
  } catch (error) {
    console.error('❌ [PIX] Erro ao gerar payload:', error);
    throw new Error('Falha ao gerar código PIX');
  }
}

/**
 * Valida se uma chave PIX está no formato correto
 */
export function validarChavePix(chave: string, tipo: string): boolean {
  const regexMap: Record<string, RegExp> = {
    CPF: /^\d{11}$/,
    CNPJ: /^\d{14}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CELULAR: /^\+?55\d{10,11}$/,
    ALEATORIA: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  };

  const regex = regexMap[tipo];
  return regex ? regex.test(chave) : false;
}

/**
 * Formata a chave PIX para exibição
 */
export function formatarChavePix(chave: string, tipo: string): string {
  switch (tipo) {
    case 'CPF':
      return chave.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'CNPJ':
      return chave.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'CELULAR':
      return chave.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    default:
      return chave;
  }
}
