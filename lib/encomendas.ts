/**
 * Funções de busca de dados para o sistema de Encomendas
 * 
 * Essas funções são executadas no SERVIDOR (Server Components)
 * para evitar waterfalls e melhorar performance.
 */

import { createClient } from '@supabase/supabase-js';
import type { GradeFechadaProduto } from '@/types/grade-fechada';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface EncomendasConfig {
  mensagem_topo?: string;
  pedido_minimo_grades?: number;
  prazo_producao_min?: number;
  prazo_producao_max?: number;
  whatsapp_numero?: string;
}

/**
 * Busca configurações do sistema de encomendas
 * @returns Configurações ou objeto vazio em caso de erro
 */
export async function getEncomendasConfig(): Promise<EncomendasConfig> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('grade_fechada_configuracoes')
      .select('chave, valor');

    if (error) {
      console.error('[getEncomendasConfig] Erro:', error);
      return {};
    }

    // Transformar array em objeto
    const config: EncomendasConfig = {};
    data?.forEach((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any)[item.chave] = item.valor;
    });

    return config;
  } catch (error) {
    console.error('[getEncomendasConfig] Exceção:', error);
    return {};
  }
}

/**
 * Busca produtos ativos para encomendas
 * @returns Lista de produtos ou array vazio em caso de erro
 */
export async function getEncomendasProdutos(): Promise<GradeFechadaProduto[]> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('grade_fechada_produtos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[getEncomendasProdutos] Erro:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getEncomendasProdutos] Exceção:', error);
    return [];
  }
}

/**
 * Busca dados combinados para a página de encomendas
 * Executa em PARALELO para evitar waterfalls
 */
export async function getEncomendasPageData() {
  const [config, produtos] = await Promise.all([
    getEncomendasConfig(),
    getEncomendasProdutos(),
  ]);

  return { config, produtos };
}
