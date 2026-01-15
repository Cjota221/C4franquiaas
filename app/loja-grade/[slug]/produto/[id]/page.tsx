"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { safeColor } from '@/lib/color-utils';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
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
  preco_grade: number;
  preco_base?: number;
  usa_variacoes: boolean;
  ativo: boolean;
  variacoes?: Variacao[];
}

interface SelecaoCor {
  variacao: Variacao;
  numeracoes: { [tamanho: string]: number };
}

const TAMANHOS = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];
const PARES_GRADE = 12;
const PARES_MEIA_GRADE = 6;
const PRECO_GRADE = 336.00;

export default function ProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const produtoId = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [config, setConfig] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'unica' | 'dividida' | null>(null);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [cor1, setCor1] = useState<SelecaoCor | null>(null);
  const [corSelecionada, setCorSelecionada] = useState<Variacao | null>(null);
  const [numeracoes, setNumeracoes] = useState<{ [key: string]: number }>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, produtoRes] = await Promise.all([
        fetch(`/api/grade-fechada/config?slug=${slug}`),
        fetch(`/api/grade-fechada/produtos/${produtoId}`)
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (produtoRes.ok) {
        const data = await produtoRes.json();
        setProduto({ ...data, preco_grade: data.preco_grade || PRECO_GRADE });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  }, [slug, produtoId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const corPrimaria = safeColor(config?.cor_primaria) || '#8B5CF6';
  const precoGrade = produto?.preco_grade || PRECO_GRADE;
  const totalPares = Object.values(numeracoes).reduce((a, b) => a + b, 0);
  const paresCor1 = cor1 ? Object.values(cor1.numeracoes).reduce((a, b) => a + b, 0) : 0;
  const paresNecessarios = modo === 'dividida' ? PARES_MEIA_GRADE : PARES_GRADE;

  const handleModo = (m: 'unica' | 'dividida') => {
    setModo(m);
    setEtapa(1);
    setCor1(null);
    setCorSelecionada(null);
    setNumeracoes({});
  };

  const handleCor = (v: Variacao) => {
    setCorSelecionada(v);
    setNumeracoes({});
  };

  const handleNum = (tam: string, delta: number) => {
    const atual = numeracoes[tam] || 0;
    const novo = Math.max(0, atual + delta);
    const total = Object.entries(numeracoes)
      .filter(([k]) => k !== tam)
      .reduce((a, [, v]) => a + v, 0);
    if (total + novo <= paresNecessarios) {
      setNumeracoes(p => ({ ...p, [tam]: novo }));
    }
  };

  const distribuirAuto = () => {
    const d: { [k: string]: number } = {};
    const pp = Math.floor(paresNecessarios / TAMANHOS.length);
    const r = paresNecessarios % TAMANHOS.length;
    TAMANHOS.forEach((t, i) => {
      d[t] = pp + (i < r ? 1 : 0);
    });
    setNumeracoes(d);
  };

  const confirmar = () => {
    if (!corSelecionada || totalPares !== paresNecessarios) {
      toast.error(`Selecione exatamente ${paresNecessarios} pares`);
      return;
    }
    
    if (modo === 'unica') {
      const item = {
        produto_id: produto!.id,
        produto_nome: produto!.nome,
        modo: 'grade_unica',
        cor: corSelecionada.cor,
        imagem_url: corSelecionada.imagem_url,
        variacao_id: corSelecionada.id,
        numeracoes,
        total_pares: PARES_GRADE,
        valor_total: precoGrade
      };
      const c = JSON.parse(localStorage.getItem('carrinho_grade_fechada') || '[]');
      c.push(item);
      localStorage.setItem('carrinho_grade_fechada', JSON.stringify(c));
      toast.success('Grade adicionada ao carrinho!');
      router.push(`/loja-grade/${slug}/carrinho`);
    } else if (etapa === 1) {
      setCor1({ variacao: corSelecionada, numeracoes: { ...numeracoes } });
      setCorSelecionada(null);
      setNumeracoes({});
      setEtapa(2);
      toast.success('Agora escolha a 2ª cor!');
    } else {
      const item = {
        produto_id: produto!.id,
        produto_nome: produto!.nome,
        modo: 'grade_dividida',
        cores: [
          {
            cor: cor1!.variacao.cor,
            imagem_url: cor1!.variacao.imagem_url,
            variacao_id: cor1!.variacao.id,
            numeracoes: cor1!.numeracoes,
            pares: PARES_MEIA_GRADE
          },
          {
            cor: corSelecionada.cor,
            imagem_url: corSelecionada.imagem_url,
            variacao_id: corSelecionada.id,
            numeracoes,
            pares: PARES_MEIA_GRADE
          }
        ],
        total_pares: PARES_GRADE,
        valor_total: precoGrade
      };
      const c = JSON.parse(localStorage.getItem('carrinho_grade_fechada') || '[]');
      c.push(item);
      localStorage.setItem('carrinho_grade_fechada', JSON.stringify(c));
      toast.success('Grade dividida adicionada!');
      router.push(`/loja-grade/${slug}/carrinho`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-500 mb-4">Produto não encontrado</p>
        <Button onClick={() => router.push(`/loja-grade/${slug}`)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg truncate flex-1">{produto.nome}</h1>
      </div>

      {/* Imagem Principal - Formato Retrato */}
      <div className="bg-white">
        <div className="relative w-full" style={{ paddingBottom: '125%' }}>
          <Image
            src={corSelecionada?.imagem_url || produto.variacoes?.[0]?.imagem_url || '/placeholder-product.png'}
            alt={produto.nome}
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>
      </div>

      {/* Info do Produto */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Grade Fechada (12 pares)</p>
            <p className="text-3xl font-bold" style={{ color: corPrimaria }}>
              R$ {precoGrade.toFixed(2)}
            </p>
          </div>
          {produto.codigo && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              Cód: {produto.codigo}
            </span>
          )}
        </div>
      </div>

      {/* Seleção de Modo */}
      {!modo && (
        <div className="p-4 space-y-4">
          <h2 className="font-semibold text-lg text-center mb-6">
            Como você quer montar sua grade?
          </h2>
          
          <button
            onClick={() => handleModo('unica')}
            className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-purple-400 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-2xl">
                📦
              </div>
              <div>
                <h3 className="font-bold text-lg">Grade Única</h3>
                <p className="text-sm text-gray-600">12 pares da mesma cor</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleModo('dividida')}
            className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-pink-400 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-purple-200 flex items-center justify-center text-2xl">
                📦📦
              </div>
              <div>
                <h3 className="font-bold text-lg">Dividir Grade</h3>
                <p className="text-sm text-gray-600">6 pares de cada cor (2 cores)</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Fluxo de Seleção */}
      {modo && (
        <div className="p-4 space-y-4">
          {/* Navegação */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (modo === 'dividida' && etapa === 2) {
                  setEtapa(1);
                  setCor1(null);
                  setCorSelecionada(null);
                  setNumeracoes({});
                } else {
                  setModo(null);
                }
              }}
              className="text-sm text-gray-500 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            
            {modo === 'dividida' && (
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${etapa >= 1 ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}>
                  {paresCor1 === PARES_MEIA_GRADE ? <Check className="w-4 h-4" /> : '1'}
                </span>
                <div className="w-8 h-0.5 bg-gray-300" />
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${etapa === 2 ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}>
                  2
                </span>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="text-center py-2">
            <h2 className="font-bold text-xl">
              {modo === 'unica' 
                ? 'Escolha a cor e tamanhos'
                : etapa === 1 
                  ? '1ª Cor: Escolha 6 pares'
                  : '2ª Cor: Escolha 6 pares'
              }
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalPares}/{paresNecessarios} pares selecionados
            </p>
          </div>

          {/* Barra de Progresso */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${(totalPares / paresNecessarios) * 100}%`,
                backgroundColor: corPrimaria
              }}
            />
          </div>

          {/* Seleção de Cor */}
          {produto.variacoes && produto.variacoes.length > 0 && (
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm font-medium mb-3">Selecione a cor:</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {produto.variacoes
                  .filter(v => !(modo === 'dividida' && etapa === 2 && cor1 && v.id === cor1.variacao.id))
                  .map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleCor(v)}
                      className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all ${
                        corSelecionada?.id === v.id 
                          ? 'border-purple-500 ring-2 ring-purple-200' 
                          : 'border-gray-200'
                      }`}
                      style={{ width: 80, height: 100 }}
                    >
                      <Image src={v.imagem_url} alt={v.cor} fill className="object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                        {v.cor}
                      </div>
                      {corSelecionada?.id === v.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Seleção de Tamanhos */}
          {corSelecionada && (
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium">Quantidade por tamanho:</p>
                <button
                  onClick={distribuirAuto}
                  className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium"
                >
                  Distribuir Auto
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {TAMANHOS.map((t) => (
                  <div key={t} className="text-center">
                    <p className="text-xs text-gray-500 mb-1">N° {t}</p>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleNum(t, -1)}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                        disabled={!numeracoes[t]}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold">
                        {numeracoes[t] || 0}
                      </span>
                      <button
                        onClick={() => handleNum(t, 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                        disabled={totalPares >= paresNecessarios}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo da 1ª Cor (quando na etapa 2) */}
          {modo === 'dividida' && etapa === 2 && cor1 && (
            <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden relative flex-shrink-0">
                <Image src={cor1.variacao.imagem_url} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">1ª Cor: {cor1.variacao.cor}</p>
                <p className="text-xs text-gray-600">
                  {Object.entries(cor1.numeracoes)
                    .filter(([, q]) => q > 0)
                    .map(([t, q]) => `${t}(${q})`)
                    .join(', ')}
                </p>
              </div>
              <span className="text-sm font-bold text-purple-600">{paresCor1} pares</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Fixo */}
      {modo && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {modo === 'dividida' 
                  ? `${paresCor1 + totalPares}/12 pares no total`
                  : `${totalPares}/12 pares`
                }
              </p>
              <p className="text-lg font-bold" style={{ color: corPrimaria }}>
                R$ {precoGrade.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={confirmar}
              disabled={!corSelecionada || totalPares !== paresNecessarios}
              className="px-8 py-6 text-base font-semibold rounded-xl gap-2"
              style={{
                backgroundColor: corSelecionada && totalPares === paresNecessarios ? corPrimaria : '#d1d5db'
              }}
            >
              {modo === 'unica' ? (
                <>
                  <ShoppingCart className="w-5 h-5" /> Adicionar
                </>
              ) : etapa === 1 ? (
                'Próxima Cor →'
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" /> Adicionar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Espaço para o footer fixo */}
      {modo && <div className="h-24" />}
    </div>
  );
}
