/**
 * Tipos TypeScript para o Módulo Financeiro
 */

// Tipos de Chave PIX
export type TipoChavePix = 'CPF' | 'CNPJ' | 'EMAIL' | 'CELULAR' | 'ALEATORIA';

// Status da Comissão
export type StatusComissao = 'pendente' | 'paga';

// Interface: Dados de Pagamento PIX da Franqueada
export interface DadosPagamentoPix {
  id: string;
  franqueada_id: string;
  tipo_chave_pix: TipoChavePix;
  chave_pix: string;
  nome_completo: string;
  cidade?: string;
  created_at: string;
  updated_at: string;
}

// Interface: Histórico de Pagamento de Comissão
export interface PagamentoComissao {
  id: string;
  franqueada_id: string;
  valor_total: number;
  quantidade_vendas: number;
  vendas_ids: string[];
  chave_pix_usada: string;
  tipo_chave_pix: TipoChavePix;
  payload_pix: string;
  pago_por: string;
  observacoes?: string;
  created_at: string;
}

// Interface: Venda com campos de comissão
export interface VendaComComissao {
  id: string;
  loja_id: string;
  franqueada_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_cpf: string;
  valor_total: number;
  comissao_franqueada: number;
  percentual_comissao: number;
  status_pagamento: string;
  status_comissao: StatusComissao;
  data_pagamento_comissao?: string;
  pago_por?: string;
  mp_payment_id: string;
  metodo_pagamento: string;
  items: unknown[];
  created_at: string;
  updated_at: string;
}

// Interface: Resumo de Comissões por Franqueada
export interface ResumoComissaoFranqueada {
  franqueada_id: string;
  franqueada_nome: string;
  franqueada_email: string;
  total_vendas: number;
  total_comissao_pendente: number;
  total_comissao_paga: number;
  quantidade_vendas_pendentes: number;
  quantidade_vendas_pagas: number;
  chave_pix?: string;
  tipo_chave_pix?: TipoChavePix;
  tem_dados_pix: boolean;
}

// Interface: Dados para gerar PIX
export interface DadosGeracaoPix {
  franqueada_id: string;
  franqueada_nome: string;
  valor_total: number;
  chave_pix: string;
  tipo_chave_pix: TipoChavePix;
  cidade?: string;
  vendas_ids: string[];
  quantidade_vendas: number;
}

// Interface: Resposta da API de geração de PIX
export interface RespostaGeracaoPix {
  payload: string;
  qrCode: string;
  valor: number;
  vendasIds: string[];
  franqueadaNome: string;
  chavePix: string;
  tipoChavePix: TipoChavePix;
}

// Interface: Formulário de Dados PIX
export interface FormDadosPix {
  tipo_chave_pix: TipoChavePix;
  chave_pix: string;
  nome_completo: string;
  cidade: string;
}
