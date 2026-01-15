import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabaseClient';
import { safeColor } from '@/lib/color-utils';

interface GradeConfig {
  id: string;
  nome: string;
  descricao?: string;
  cor_primaria?: string;
  revendedora_id: string;
  slug: string;
}

interface Produto {
  id: string;
  nome: string;
  preco_base: number;
  tem_estoque: boolean;
  categoria_nome?: string;
  imagem_principal_url?: string;
  descricao?: string;
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
    const { data: config, error: configError } = await supabase
      .from('grade_configs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (configError || !config) {
      console.error('Erro ao buscar configuração da grade:', configError);
      return null;
    }

    const { data: produtos, error: produtosError } = await supabase
      .from('grade_produtos')
      .select('produtos!inner(id, nome, preco_base, tem_estoque, descricao, categorias(nome), imagens(url))')
      .eq('grade_config_id', config.id);

    if (produtosError) {
      console.error('Erro ao buscar produtos da grade:', produtosError);
      return null;
    }

    const produtosFormatados = produtos?.map((item: { produtos: { id: string; nome: string; preco_base: number; tem_estoque: boolean; descricao?: string; categorias?: { nome: string }; imagens?: { url: string }[] } }) => ({
      id: item.produtos.id,
      nome: item.produtos.nome,
      preco_base: item.produtos.preco_base,
      tem_estoque: item.produtos.tem_estoque,
      categoria_nome: item.produtos.categorias?.nome,
      imagem_principal_url: item.produtos.imagens?.[0]?.url,
      descricao: item.produtos.descricao,
    })) || [];

    return {
      config,
      produtos: produtosFormatados,
      stats: {
        pedidoMinimo: 50,
        diasProducao: 15,
        totalProdutos: produtosFormatados.length,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar dados da grade:', error);
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
              {config.nome}
            </h1>
            {config.descricao && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {config.descricao}
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
            <Link key={produto.id} href={`/produto/${produto.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                <div className="aspect-square relative bg-gray-100">
                  {produto.imagem_principal_url ? (
                    <Image
                      src={produto.imagem_principal_url}
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
                  
                  {!produto.tem_estoque && (
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
                  
                  {produto.categoria_nome && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {produto.categoria_nome}
                    </Badge>
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
