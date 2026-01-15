import { createClient } from '@/lib/supabase/server';

interface Configuracao {
  slug_site: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  site_ativo: boolean;
  titulo_site: string;
  descricao_site: string;
  whatsapp_numero: string;
}

export async function getConfigBySlug(slug: string): Promise<Configuracao | null> {
  try {
    const supabase = await createClient();
    
    // Buscar configurações com o slug especificado
    const { data, error } = await supabase
      .from('grade_fechada_configuracoes')
      .select('*')
      .eq('chave', 'slug_site')
      .single();

    if (error || !data) {
      return null;
    }

    // Buscar todas as configurações
    const { data: configs, error: configsError } = await supabase
      .from('grade_fechada_configuracoes')
      .select('chave, valor');

    if (configsError || !configs) {
      return null;
    }

    // Montar objeto de configuração
    const config: Partial<Configuracao> = {};
    
    configs.forEach((c: { chave: string; valor: unknown }) => {
      if (c.chave === 'slug_site') config.slug_site = c.valor as string;
      else if (c.chave === 'logo_url') config.logo_url = c.valor as string;
      else if (c.chave === 'cor_primaria') config.cor_primaria = c.valor as string;
      else if (c.chave === 'cor_secundaria') config.cor_secundaria = c.valor as string;
      else if (c.chave === 'site_ativo') config.site_ativo = c.valor as boolean;
      else if (c.chave === 'titulo_site') config.titulo_site = c.valor as string;
      else if (c.chave === 'descricao_site') config.descricao_site = c.valor as string;
      else if (c.chave === 'whatsapp_numero') config.whatsapp_numero = c.valor as string;
    });

    // Verificar se o slug corresponde
    if (config.slug_site !== slug) {
      return null;
    }

    // Verificar se o site está ativo
    if (!config.site_ativo) {
      return null;
    }

    return config as Configuracao;
  } catch (error) {
    console.error('Erro ao buscar config:', error);
    return null;
  }
}
