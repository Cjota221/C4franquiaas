// ============================================================================
// Types: Grade Fechada (Sistema de Pedidos por Encomenda)
// ============================================================================

export interface GradeFechadaProduto {
  id: string;
  nome: string;
  codigo_interno?: string;
  descricao?: string;
  imagens: string[];
  preco_meia_grade?: number;
  preco_grade_completa?: number;
  permite_meia_grade: boolean;
  permite_grade_completa: boolean;
  cores_disponiveis: string[];
  peso_por_grade?: number;
  comprimento?: number;
  largura?: number;
  altura?: number;
  observacoes?: string;
  aceita_personalizacao: boolean;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

export interface GradeFechadaProdutoInput {
  nome: string;
  codigo_interno?: string;
  descricao?: string;
  imagens?: string[];
  preco_meia_grade?: number;
  preco_grade_completa?: number;
  permite_meia_grade?: boolean;
  permite_grade_completa?: boolean;
  cores_disponiveis?: string[];
  peso_por_grade?: number;
  comprimento?: number;
  largura?: number;
  altura?: number;
  observacoes?: string;
  aceita_personalizacao?: boolean;
  ativo?: boolean;
  ordem?: number;
}

export type TipoGrade = 'meia' | 'completa';

export interface Numeracoes {
  [numeracao: string]: number;
}

export interface ItemPedido {
  produto_id: string;
  produto_nome: string;
  tipo_grade: TipoGrade;
  quantidade_grades: number;
  cor: string;
  numeracoes: Numeracoes;
  valor_unitario: number;
  valor_total: number;
}

export type StatusPedido =
  | 'orcamento'
  | 'aguardando_confirmacao'
  | 'confirmado'
  | 'em_producao'
  | 'finalizado'
  | 'cancelado';

export interface GradeFechadaPedido {
  id: string;
  numero_pedido: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf_cnpj?: string;
  endereco_cep?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  status: StatusPedido;
  valor_total: number;
  valor_frete?: number;
  itens: ItemPedido[];
  observacoes?: string;
  observacoes_internas?: string;
  origem: string;
  finalizado_whatsapp: boolean;
  data_finalizacao_whatsapp?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface GradeFechadaPedidoInput {
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf_cnpj?: string;
  endereco_cep?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  itens: ItemPedido[];
  observacoes?: string;
  origem?: string;
}

export type StatusCarrinho = 'ativo' | 'convertido' | 'expirado';

export interface GradeFechadaCarrinho {
  id: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  itens: ItemPedido[];
  valor_total: number;
  status: StatusCarrinho;
  convertido_em_pedido_id?: string;
  data_conversao?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  criado_em: string;
  atualizado_em: string;
  expira_em: string;
}

export interface GradeFechadaCarrinhoInput {
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  itens: ItemPedido[];
  valor_total: number;
  session_id?: string;
}

export interface GradeFechadaConfiguracao {
  id: string;
  chave: string;
  valor: unknown;
  descricao?: string;
  atualizado_em: string;
}

export interface ConfiguracoesSite {
  site_ativo: boolean;
  pedido_minimo_grades: number;
  prazo_producao_min: number;
  prazo_producao_max: number;
  mensagem_topo: string;
  whatsapp_numero: string;
  cores_padrao: string[];
  numeracoes_padrao: string[];
}
