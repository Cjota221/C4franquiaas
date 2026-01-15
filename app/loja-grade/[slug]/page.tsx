import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabaseClient';
import { safeColor } from '@/lib/color-utils';

interface GradeConfig {
  slug_site?: string;
  titulo_site?: string;
  descricao_site?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  site_ativo?: boolean;
  [key: string]: unknown;
}

interface Variacao {
  id: string;
  cor: string;
  imagem_url: string;
  estoque_disponivel: number;
}

interface Produto {
  id: string;
  codigo?: string;
  nome: string;
  preco_base: number;
  ativo: boolean;
  usa_variacoes: boolean;
  variacoes?: Variacao[];
}

interface GradeData {
  config: GradeConfig;
  produtos: Produto[];
  stats: {
    pedidoMinimo: number;
    diasProducao: number;
    totalProdutos: number;
  };
}

async function getGradeData(slug: string): Promise<GradeData | null> {
  try {
    console.log('🔍 Buscando grade com slug:', slug);
    
    // Buscar configurações da grade fechada
    const { data: configs, error: configError } = await supabase
      .from('grade_fechada_configuracoes')
      .select('chave, valor');

    if (configError) {
      console.error('❌ Erro ao buscar configuração:', configError);
      return null;
    }

    // Montar objeto de configuração
    const config: GradeConfig = {};
    configs?.forEach((c: { chave: string; valor: unknown }) => {
      config[c.chave] = c.valor;
    });

    console.log('📊 Config resultado:', config);
    console.log('🔍 Verificando slug_site:', config.slug_site, 'vs slug:', slug);

    // Verificar se o slug corresponde
    if (config.slug_site !== slug) {
      console.error('❌ Slug não corresponde:', { slug_site: config.slug_site, slug });
      return null;
    }

    // Verificar se o site está ativo
    if (!config.site_ativo) {
      console.error('❌ Site não está ativo');
      return null;
    }

    // Buscar produtos da grade fechada
    const { data: produtos, error: produtosError } = await supabase
      .from('grade_fechada_produtos')
      .select(`
        id,
        codigo,
        nome,
        descricao,
        preco_base,
        usa_variacoes,
        ativo,
        variacoes:grade_fechada_variacoes(
          id,
          cor,
          imagem_url,
          estoque_disponivel,
          ativo,
          ordem
        )
      `)
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (produtosError) {
      console.error('❌ Erro ao buscar produtos:', produtosError);
      return null;
    }

    console.log('📦 Produtos encontrados:', produtos?.length);

    // Filtrar variações ativas e ordenar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const produtosFormatados = (produtos || []).map((produto: any) => {
      const variacoesAtivas = produto.variacoes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ?.filter((v: any) => v.ativo)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
      
      return {
        ...produto,
        variacoes: variacoesAtivas,
      };
    });

    return {
      config,
      produtos: produtosFormatados,
      stats: {
        pedidoMinimo: Number(config.pedido_minimo) || 50,
        diasProducao: Number(config.dias_producao) || 15,
        totalProdutos: produtosFormatados.length,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados da grade:', error);
    return null;
  }
}

export default async function GradePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getGradeData(slug);

  if (!data) {
    notFound();
  }

  const { config, produtos, stats } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {String(config.titulo_site || 'Grade Fechada')}
            </h1>
            {config.descricao_site && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {String(config.descricao_site)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-lg font-bold" style={{ color: safeColor(config?.cor_primaria) }}>
              R$ {stats.pedidoMinimo}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pedido Mínimo</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-lg font-bold" style={{ color: safeColor(config?.cor_primaria) }}>
              {stats.diasProducao} dias
            </div>
            <p className="text-xs text-gray-500 mt-1">Produção</p>
          </Card>
          
          <Card className="p-4 text-center col-span-2 md:col-span-1">
            <div className="text-lg font-bold" style={{ color: safeColor(config?.cor_primaria) }}>
              {stats.totalProdutos}
            </div>
            <p className="text-xs text-gray-500 mt-1">Produtos</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {produtos.map((produto) => (
            <Link key={produto.id} href={`/loja-grade/${slug}/produto/${produto.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                <div className="aspect-square relative bg-gray-100">
                  {produto.variacoes && produto.variacoes.length > 0 && produto.variacoes[0].imagem_url ? (
                    <Image
                      src={produto.variacoes[0].imagem_url}
                      alt={produto.nome}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                      <span className="text-xs text-center px-2">Sem imagem</span>
                    </div>
                  )}
                  
                  {!produto.ativo && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="bg-red-500 text-white">
                        Esgotado
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                    {produto.nome}
                  </h3>
                  
                  {produto.codigo && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {produto.codigo}
                    </Badge>
                  )}
                  
                  {/* Cores disponíveis */}
                  {produto.variacoes && produto.variacoes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {produto.variacoes.slice(0, 4).map((v) => (
                        <div
                          key={v.id}
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: v.cor }}
                          title={v.cor}
                        />
                      ))}
                      {produto.variacoes.length > 4 && (
                        <span className="text-xs text-gray-500">+{produto.variacoes.length - 4}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-sm font-bold" style={{ color: safeColor(config?.cor_primaria) }}>
                        R$ {produto.preco_base.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">por par</p>
                    </div>
                    <Button 
                      size="sm"
                      className="text-xs px-2 py-1 h-7 rounded-full"
                      style={{ backgroundColor: safeColor(config?.cor_primaria) }}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Como funciona?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-3xl mb-2">1</div>
                <p className="font-medium mb-1">Escolha o Produto</p>
                <p className="text-gray-600">Selecione modelo e cor desejados</p>
              </div>
              <div>
                <div className="text-3xl mb-2">2</div>
                <p className="font-medium mb-1">Faça seu Pedido</p>
                <p className="text-gray-600">Defina quantidade e finalize</p>
              </div>
              <div>
                <div className="text-3xl mb-2">3</div>
                <p className="font-medium mb-1">Receba em Casa</p>
                <p className="text-gray-600">Produtos chegam em até {stats.diasProducao} dias</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
