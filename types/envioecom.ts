/**
 * Tipos TypeScript para integração com API Envioecom
 * Documentação: https://docs.envioecom.com.br/
 */

// ========== COTAÇÃO DE FRETE ==========

export interface EnderecoCotacao {
  cep: string;
  cidade?: string;
  estado?: string;
}

export interface PacoteCotacao {
  peso: number; // em gramas
  altura: number; // em cm
  largura: number; // em cm
  comprimento: number; // em cm
  valor_declarado: number; // em reais
}

export interface CotacaoRequest {
  origem: EnderecoCotacao;
  destino: EnderecoCotacao;
  pacotes: PacoteCotacao[];
}

export interface ServicoCotacao {
  servico_id: string;
  nome: string;
  preco: number;
  prazo_entrega: number; // em dias úteis
  transportadora: string;
  descricao?: string;
}

export interface CotacaoResponse {
  sucesso: boolean;
  servicos: ServicoCotacao[];
  erro?: string;
  mensagem?: string;
}

// ========== GERAÇÃO DE ETIQUETA ==========

export interface EnderecoCompleto {
  nome: string;
  telefone: string;
  email?: string;
  documento?: string; // CPF ou CNPJ
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface ProdutoEtiqueta {
  nome: string;
  quantidade: number;
  valor_unitario: number;
}

export interface EtiquetaRequest {
  servico_id: string;
  remetente: EnderecoCompleto;
  destinatario: EnderecoCompleto;
  pacotes: PacoteCotacao[];
  produtos: ProdutoEtiqueta[];
  numero_pedido?: string;
  observacoes?: string;
}

export interface EtiquetaResponse {
  sucesso: boolean;
  codigo_rastreio: string;
  url_etiqueta: string; // URL do PDF
  protocolo?: string;
  erro?: string;
  mensagem?: string;
}

// ========== RASTREAMENTO ==========

export interface EventoRastreio {
  data: string;
  hora: string;
  status: string;
  descricao: string;
  local?: string;
}

export interface RastreioResponse {
  sucesso: boolean;
  codigo_rastreio: string;
  status_atual: string;
  ultima_atualizacao: string;
  eventos: EventoRastreio[];
  entregue: boolean;
  erro?: string;
  mensagem?: string;
}

// ========== ESTADOS DE LOADING ==========

export interface EnvioecomState {
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

// ========== CONFIGURAÇÃO ==========

export interface EnvioecomConfig {
  slug: string;
  eToken: string;
  baseUrl?: string;
}
