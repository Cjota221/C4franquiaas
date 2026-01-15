"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ShoppingCart, Plus, Minus, Info } from 'lucide-react';
import { toast } from 'sonner';

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
  descricao?: string;
  preco_base: number;
  usa_variacoes: boolean;
  ativo: boolean;
  variacoes?: Variacao[];
}

interface GradeItem {
  produto_id: string;
  produto_nome: string;
  variacao_id: string;
  cor: string;
  imagem_url: string;
  tipo_grade: 'meia' | 'completa';
  quantidade_grades: number;
  numeracoes: { [tamanho: string]: number };
  valor_unitario: number;
  valor_total: number;
}

const TAMANHOS_DISPONIVEIS = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

export default function ProdutoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const produtoId = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Seleções
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(null);
  const [tipoGrade, setTipoGrade] = useState<'meia' | 'completa'>('completa');
  const [quantidadeGrades, setQuantidadeGrades] = useState(2); // Mínimo 2 grades
  const [numeracoes, setNumeracoes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchConfig();
    fetchProduto();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/grade-fechada/config?slug=' + slug);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    }
  };

  const fetchProduto = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grade-fechada/produtos/${produtoId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProduto(data);
        
        // Selecionar primeira variação por padrão
        if (data.variacoes && data.variacoes.length > 0) {
          setVariacaoSelecionada(data.variacoes[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleNumeracaoChange = (tamanho: string, quantidade: number) => {
    setNumeracoes(prev => ({
      ...prev,
      [tamanho]: Math.max(0, quantidade)
    }));
  };

  const totalParesSelecionados = Object.values(numeracoes).reduce((sum, qty) => sum + qty, 0);
  const paresNecessarios = tipoGrade === 'meia' ? 6 : 12;
  const totalPares = paresNecessarios * quantidadeGrades;

  const adicionarAoCarrinho = () => {
    if (!variacaoSelecionada) {
      toast.error('Selecione uma cor');
      return;
    }

    if (totalParesSelecionados !== totalPares) {
      toast.error(`Você precisa selecionar exatamente ${totalPares} pares (${quantidadeGrades} grade${quantidadeGrades > 1 ? 's' : ''} de ${paresNecessarios})`);
      return;
    }

    // Criar item de grade
    const gradeItem: GradeItem = {
      produto_id: produto!.id,
      produto_nome: produto!.nome,
      variacao_id: variacaoSelecionada.id,
      cor: variacaoSelecionada.cor,
      imagem_url: variacaoSelecionada.imagem_url,
      tipo_grade: tipoGrade,
      quantidade_grades: quantidadeGrades,
      numeracoes: numeracoes,
      valor_unitario: produto!.preco_base,
      valor_total: produto!.preco_base * totalPares,
    };

    // Salvar no localStorage (carrinho)
    const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho_grade_fechada') || '[]');
    carrinhoAtual.push(gradeItem);
    localStorage.setItem('carrinho_grade_fechada', JSON.stringify(carrinhoAtual));

    toast.success('Grade adicionada ao carrinho!');
    
    // Redirecionar para carrinho
    router.push(`/loja-grade/${slug}/carrinho`);
  };

  const distribuirAutomaticamente = () => {
    const distribuicao: { [key: string]: number } = {};
    const paresPorTamanho = Math.floor(totalPares / TAMANHOS_DISPONIVEIS.length);
    const resto = totalPares % TAMANHOS_DISPONIVEIS.length;

    TAMANHOS_DISPONIVEIS.forEach((tamanho, index) => {
      distribuicao[tamanho] = paresPorTamanho + (index < resto ? 1 : 0);
    });

    setNumeracoes(distribuicao);
    toast.success('Tamanhos distribuídos automaticamente!');
  };

  if (loading || !produto) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
             style={{ borderColor: String(config?.cor_primaria || '#8B5CF6') }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/loja-grade/${slug}`)}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda: Imagem e Variações */}
        <div className="space-y-6">
          {/* Imagem Principal */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={variacaoSelecionada?.imagem_url || '/placeholder-product.png'}
                alt={produto.nome}
                fill
                className="object-cover"
              />
            </div>
          </Card>

          {/* Seletor de Cores */}
          {produto.variacoes && produto.variacoes.length > 1 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Escolha a Cor:</h3>
              <div className="grid grid-cols-4 gap-3">
                {produto.variacoes.map((variacao) => (
                  <button
                    key={variacao.id}
                    onClick={() => setVariacaoSelecionada(variacao)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      variacaoSelecionada?.id === variacao.id
                        ? 'ring-2 ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: variacaoSelecionada?.id === variacao.id
                        ? String(config?.cor_primaria || '#8B5CF6')
                        : 'transparent',

                    }}
                  >
                    <Image
                      src={variacao.imagem_url}
                      alt={variacao.cor}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                      {variacao.cor}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Coluna Direita: Informações e Configuração */}
        <div className="space-y-6">
          {/* Info do Produto */}
          <Card className="p-6">
            {produto.codigo && (
              <p className="text-sm text-gray-500 mb-2">Cód: {produto.codigo}</p>
            )}
            <h1 className="text-3xl font-bold mb-2">{produto.nome}</h1>
            {produto.descricao && (
              <p className="text-gray-600 mb-4">{produto.descricao}</p>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: String(config?.cor_primaria || '#8B5CF6') }}>
                R$ {produto.preco_base.toFixed(2)}
              </span>
              <span className="text-gray-500">por par</span>
            </div>
          </Card>

          {/* Seletor de Tipo de Grade */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Tipo de Grade:</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setTipoGrade('meia');
                  setNumeracoes({});
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipoGrade === 'meia' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">📦</div>
                <div className="font-semibold">Meia Grade</div>
                <div className="text-sm text-gray-600">6 pares</div>
              </button>
              <button
                onClick={() => {
                  setTipoGrade('completa');
                  setNumeracoes({});
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipoGrade === 'completa' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">📦📦</div>
                <div className="font-semibold">Grade Completa</div>
                <div className="text-sm text-gray-600">12 pares</div>
              </button>
            </div>
          </Card>

          {/* Quantidade de Grades */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Quantidade de Grades:</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidadeGrades(Math.max(2, quantidadeGrades - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-bold w-16 text-center">{quantidadeGrades}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidadeGrades(quantidadeGrades + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Total: {totalPares} pares ({quantidadeGrades} × {paresNecessarios})
            </p>
          </Card>

          {/* Distribuição de Tamanhos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Distribuição de Tamanhos:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={distribuirAutomaticamente}
              >
                Distribuir Auto
              </Button>
            </div>

            <div className="space-y-2 mb-4">
              {TAMANHOS_DISPONIVEIS.map((tamanho) => (
                <div key={tamanho} className="flex items-center gap-3">
                  <span className="font-medium w-12">Nº {tamanho}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumeracaoChange(tamanho, (numeracoes[tamanho] || 0) - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={numeracoes[tamanho] || 0}
                      onChange={(e) => handleNumeracaoChange(tamanho, parseInt(e.target.value) || 0)}
                      className="w-16 text-center h-8"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumeracaoChange(tamanho, (numeracoes[tamanho] || 0) + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-medium">Total Selecionado:</span>
              <span className={`text-xl font-bold ${
                totalParesSelecionados === totalPares
                  ? 'text-green-600'
                  : totalParesSelecionados > totalPares
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {totalParesSelecionados} / {totalPares} pares
              </span>
            </div>
          </Card>

          {/* Resumo e Botão */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-700">Preço por par:</span>
                <span className="font-semibold">R$ {produto.preco_base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total de pares:</span>
                <span className="font-semibold">{totalPares} pares</span>
              </div>
              <div className="flex justify-between text-lg pt-3 border-t">
                <span className="font-bold">Valor Total:</span>
                <span className="font-bold text-2xl" style={{ color: String(config?.cor_primaria || '#8B5CF6') }}>
                  R$ {(produto.preco_base * totalPares).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={adicionarAoCarrinho}
              className="w-full gap-2 py-6 text-lg"
              disabled={totalParesSelecionados !== totalPares || !variacaoSelecionada}
              style={{
                backgroundColor: String(config?.cor_primaria || '#8B5CF6'),
                opacity: (totalParesSelecionados !== totalPares || !variacaoSelecionada) ? 0.5 : 1,
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              Adicionar ao Carrinho
            </Button>

            {totalParesSelecionados !== totalPares && (
              <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {totalParesSelecionados < totalPares
                    ? `Faltam ${totalPares - totalParesSelecionados} pares para completar a grade`
                    : `Você selecionou ${totalParesSelecionados - totalPares} pares a mais`}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
