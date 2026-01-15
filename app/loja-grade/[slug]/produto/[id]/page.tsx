"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { safeColor } from '@/lib/color-utils';
import { ArrowLeft, ShoppingCart, Plus, Minus, Info, Check, Lock, Unlock, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

// =====================================================
// TYPES & INTERFACES
// =====================================================
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
  preco_grade: number; // Preço da GRADE COMPLETA (12 pares) = R$ 336,00
  preco_base?: number; // Preço por par (opcional, para exibição)
  usa_variacoes: boolean;
  ativo: boolean;
  variacoes?: Variacao[];
}

// Slot representa uma "metade" da grade dividida
interface SlotGrade {
  variacao: Variacao | null;
  numeracoes: { [tamanho: string]: number };
}

interface GradeItem {
  produto_id: string;
  produto_nome: string;
  modo: 'grade_unica' | 'grade_dividida';
  slots: {
    variacao_id: string;
    cor: string;
    imagem_url: string;
    numeracoes: { [tamanho: string]: number };
    pares: number;
  }[];
  total_pares: number;
  valor_grade: number;
  quantidade_grades: number;
  valor_total: number;
}

// =====================================================
// CONSTANTS
// =====================================================
const TAMANHOS_DISPONIVEIS = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];
const PARES_POR_GRADE = 12;
const PARES_POR_SLOT = 6; // Cada "metade" tem 6 pares
const PRECO_GRADE_PADRAO = 336.00; // R$ 336,00 pela grade de 12 pares

// =====================================================
// COMPONENT
// =====================================================
export default function ProdutoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const produtoId = params.id as string;

  // =====================================================
  // STATE
  // =====================================================
  const [produto, setProduto] = useState<Produto | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modo de grade
  const [dividirGrade, setDividirGrade] = useState(false);
  const [quantidadeGrades, setQuantidadeGrades] = useState(1);
  
  // Grade única (modo normal)
  const [variacaoUnica, setVariacaoUnica] = useState<Variacao | null>(null);
  const [numeracoesUnicas, setNumeracoesUnicas] = useState<{ [key: string]: number }>({});
  
  // Grade dividida (2 slots de 6 pares cada)
  const [slot1, setSlot1] = useState<SlotGrade>({ variacao: null, numeracoes: {} });
  const [slot2, setSlot2] = useState<SlotGrade>({ variacao: null, numeracoes: {} });
  const [slotAtivo, setSlotAtivo] = useState<1 | 2>(1);

  // =====================================================
  // EFFECTS
  // =====================================================
  useEffect(() => {
    fetchConfig();
    fetchProduto();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================
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
        // Garantir que temos o preço da grade
        const produtoData: Produto = {
          ...data,
          preco_grade: data.preco_grade || PRECO_GRADE_PADRAO,
          preco_base: data.preco_base || (data.preco_grade || PRECO_GRADE_PADRAO) / PARES_POR_GRADE
        };
        setProduto(produtoData);
        
        // Selecionar primeira variação por padrão
        if (data.variacoes && data.variacoes.length > 0) {
          setVariacaoUnica(data.variacoes[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // COMPUTED VALUES (useMemo)
  // =====================================================
  const precoGrade = produto?.preco_grade || PRECO_GRADE_PADRAO;
  
  // Total de pares selecionados em cada modo
  const totalParesUnica = useMemo(() => 
    Object.values(numeracoesUnicas).reduce((sum, qty) => sum + qty, 0),
    [numeracoesUnicas]
  );
  
  const totalParesSlot1 = useMemo(() => 
    Object.values(slot1.numeracoes).reduce((sum, qty) => sum + qty, 0),
    [slot1.numeracoes]
  );
  
  const totalParesSlot2 = useMemo(() => 
    Object.values(slot2.numeracoes).reduce((sum, qty) => sum + qty, 0),
    [slot2.numeracoes]
  );
  
  const totalParesDividida = totalParesSlot1 + totalParesSlot2;
  
  // Total de pares necessários
  const totalParesNecessarios = PARES_POR_GRADE * quantidadeGrades;
  const paresNecessariosPorSlot = PARES_POR_SLOT * quantidadeGrades;
  
  // Verificações de estado
  const slot1Completo = totalParesSlot1 === paresNecessariosPorSlot;
  const slot2Completo = totalParesSlot2 === paresNecessariosPorSlot;
  const slot2Desbloqueado = slot1Completo && slot1.variacao !== null;
  
  // Validação do carrinho
  const podeAdicionarAoCarrinho = useMemo(() => {
    if (dividirGrade) {
      return (
        slot1.variacao !== null &&
        slot2.variacao !== null &&
        slot1Completo &&
        slot2Completo &&
        slot1.variacao.id !== slot2.variacao.id // Cores diferentes
      );
    } else {
      return variacaoUnica !== null && totalParesUnica === totalParesNecessarios;
    }
  }, [dividirGrade, slot1, slot2, slot1Completo, slot2Completo, variacaoUnica, totalParesUnica, totalParesNecessarios]);
  
  // Progresso visual
  const progressoTotal = dividirGrade 
    ? totalParesDividida 
    : totalParesUnica;
  const progressoPorcentagem = (progressoTotal / totalParesNecessarios) * 100;

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleToggleDividirGrade = (checked: boolean) => {
    setDividirGrade(checked);
    // Reset states
    setNumeracoesUnicas({});
    setSlot1({ variacao: null, numeracoes: {} });
    setSlot2({ variacao: null, numeracoes: {} });
    setSlotAtivo(1);
  };

  const handleNumeracaoChange = (
    tamanho: string, 
    quantidade: number, 
    modo: 'unica' | 'slot1' | 'slot2'
  ) => {
    const novaQtd = Math.max(0, quantidade);
    
    if (modo === 'unica') {
      const novoTotal = Object.entries(numeracoesUnicas)
        .reduce((sum, [key, val]) => sum + (key === tamanho ? novaQtd : val), 0);
      if (novoTotal <= totalParesNecessarios) {
        setNumeracoesUnicas(prev => ({ ...prev, [tamanho]: novaQtd }));
      }
    } else if (modo === 'slot1') {
      const novoTotal = Object.entries(slot1.numeracoes)
        .reduce((sum, [key, val]) => sum + (key === tamanho ? novaQtd : val), 0);
      if (novoTotal <= paresNecessariosPorSlot) {
        setSlot1(prev => ({ ...prev, numeracoes: { ...prev.numeracoes, [tamanho]: novaQtd } }));
      }
    } else {
      const novoTotal = Object.entries(slot2.numeracoes)
        .reduce((sum, [key, val]) => sum + (key === tamanho ? novaQtd : val), 0);
      if (novoTotal <= paresNecessariosPorSlot) {
        setSlot2(prev => ({ ...prev, numeracoes: { ...prev.numeracoes, [tamanho]: novaQtd } }));
      }
    }
  };

  const selecionarCorSlot = (variacao: Variacao, slot: 1 | 2) => {
    if (slot === 1) {
      // Se mudar a cor, reseta as numerações
      if (slot1.variacao?.id !== variacao.id) {
        setSlot1({ variacao, numeracoes: {} });
      }
    } else {
      if (slot2.variacao?.id !== variacao.id) {
        setSlot2({ variacao, numeracoes: {} });
      }
    }
    setSlotAtivo(slot);
  };

  const distribuirAutomaticamente = (modo: 'unica' | 'slot1' | 'slot2') => {
    const totalPares = modo === 'unica' ? totalParesNecessarios : paresNecessariosPorSlot;
    const distribuicao: { [key: string]: number } = {};
    const paresPorTamanho = Math.floor(totalPares / TAMANHOS_DISPONIVEIS.length);
    const resto = totalPares % TAMANHOS_DISPONIVEIS.length;

    TAMANHOS_DISPONIVEIS.forEach((tamanho, index) => {
      distribuicao[tamanho] = paresPorTamanho + (index < resto ? 1 : 0);
    });

    if (modo === 'unica') {
      setNumeracoesUnicas(distribuicao);
    } else if (modo === 'slot1') {
      setSlot1(prev => ({ ...prev, numeracoes: distribuicao }));
    } else {
      setSlot2(prev => ({ ...prev, numeracoes: distribuicao }));
    }
    toast.success('Tamanhos distribuídos automaticamente!');
  };

  const adicionarAoCarrinho = () => {
    if (!podeAdicionarAoCarrinho) {
      if (dividirGrade) {
        if (!slot1Completo || !slot2Completo) {
          toast.error(
            'Para dividir a grade, você precisa escolher a segunda cor para completar os 12 pares.',
            { duration: 5000, icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> }
          );
        }
      } else {
        toast.error('Selecione todos os pares necessários.');
      }
      return;
    }

    // Criar item de grade
    const gradeItem: GradeItem = {
      produto_id: produto!.id,
      produto_nome: produto!.nome,
      modo: dividirGrade ? 'grade_dividida' : 'grade_unica',
      slots: dividirGrade 
        ? [
            {
              variacao_id: slot1.variacao!.id,
              cor: slot1.variacao!.cor,
              imagem_url: slot1.variacao!.imagem_url,
              numeracoes: slot1.numeracoes,
              pares: totalParesSlot1
            },
            {
              variacao_id: slot2.variacao!.id,
              cor: slot2.variacao!.cor,
              imagem_url: slot2.variacao!.imagem_url,
              numeracoes: slot2.numeracoes,
              pares: totalParesSlot2
            }
          ]
        : [
            {
              variacao_id: variacaoUnica!.id,
              cor: variacaoUnica!.cor,
              imagem_url: variacaoUnica!.imagem_url,
              numeracoes: numeracoesUnicas,
              pares: totalParesUnica
            }
          ],
      total_pares: totalParesNecessarios,
      valor_grade: precoGrade,
      quantidade_grades: quantidadeGrades,
      valor_total: precoGrade * quantidadeGrades
    };

    // Salvar no localStorage
    const carrinhoAtual = JSON.parse(localStorage.getItem('carrinho_grade_fechada') || '[]');
    carrinhoAtual.push(gradeItem);
    localStorage.setItem('carrinho_grade_fechada', JSON.stringify(carrinhoAtual));

    toast.success(
      dividirGrade 
        ? `Grade dividida (${slot1.variacao!.cor} + ${slot2.variacao!.cor}) adicionada!` 
        : 'Grade adicionada ao carrinho!',
      { duration: 3000 }
    );
    
    router.push(`/loja-grade/${slug}/carrinho`);
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================
  const corPrimaria = safeColor(config?.cor_primaria) || '#8B5CF6';
  
  const renderSeletorTamanhos = (
    numeracoes: { [key: string]: number },
    modo: 'unica' | 'slot1' | 'slot2',
    paresNecessarios: number,
    paresSelecionados: number
  ) => (
    <div className="space-y-2">
      {TAMANHOS_DISPONIVEIS.map((tamanho) => (
        <div key={tamanho} className="flex items-center gap-3">
          <span className="font-medium w-12 text-sm">Nº {tamanho}</span>
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNumeracaoChange(tamanho, (numeracoes[tamanho] || 0) - 1, modo)}
              className="h-8 w-8 p-0"
              disabled={!numeracoes[tamanho]}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              min="0"
              value={numeracoes[tamanho] || 0}
              onChange={(e) => handleNumeracaoChange(tamanho, parseInt(e.target.value) || 0, modo)}
              className="w-14 text-center h-8 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNumeracaoChange(tamanho, (numeracoes[tamanho] || 0) + 1, modo)}
              className="h-8 w-8 p-0"
              disabled={paresSelecionados >= paresNecessarios}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (loading || !produto) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
             style={{ borderColor: corPrimaria }}></div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="space-y-6 pb-8">
      {/* Header com Voltar */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/loja-grade/${slug}`)}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* =====================================================
            COLUNA ESQUERDA: Imagem e Info do Produto
        ===================================================== */}
        <div className="space-y-6">
          {/* Imagem Principal */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={
                  dividirGrade 
                    ? (slotAtivo === 1 ? slot1.variacao?.imagem_url : slot2.variacao?.imagem_url) || '/placeholder-product.png'
                    : variacaoUnica?.imagem_url || '/placeholder-product.png'
                }
                alt={produto.nome}
                fill
                className="object-cover"
              />
              {/* Badge de modo */}
              {dividirGrade && (
                <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Grade Dividida
                </div>
              )}
            </div>
          </Card>

          {/* Info do Produto */}
          <Card className="p-6">
            {produto.codigo && (
              <p className="text-sm text-gray-500 mb-2">Cód: {produto.codigo}</p>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">{produto.nome}</h1>
            {produto.descricao && (
              <p className="text-gray-600 mb-4">{produto.descricao}</p>
            )}
            
            {/* PREÇO DA GRADE - Destacado */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Preço da Grade Completa (12 pares)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: corPrimaria }}>
                  R$ {precoGrade.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Equivalente a R$ {(precoGrade / PARES_POR_GRADE).toFixed(2)} por par
              </p>
            </div>
          </Card>
        </div>

        {/* =====================================================
            COLUNA DIREITA: Configuração da Grade
        ===================================================== */}
        <div className="space-y-6">
          {/* Toggle Dividir Grade */}
          <Card className="p-6 border-2" style={{ borderColor: dividirGrade ? corPrimaria : 'transparent' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Dividir Grade</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monte sua grade com 2 cores diferentes (6 pares de cada)
                </p>
              </div>
              <Switch
                checked={dividirGrade}
                onCheckedChange={handleToggleDividirGrade}
              />
            </div>
            
            {dividirGrade && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-700 text-sm">
                  <Info className="w-4 h-4" />
                  <span>Escolha a Cor A (6 pares) → Depois escolha a Cor B (6 pares)</span>
                </div>
              </div>
            )}
          </Card>

          {/* Quantidade de Grades */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Quantidade de Grades:</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantidadeGrades(Math.max(1, quantidadeGrades - 1))}
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
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total de pares:</span>
                <span className="font-semibold">{totalParesNecessarios} pares</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Valor total:</span>
                <span className="font-bold text-lg" style={{ color: corPrimaria }}>
                  R$ {(precoGrade * quantidadeGrades).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* =====================================================
              MODO GRADE ÚNICA (Normal)
          ===================================================== */}
          {!dividirGrade && (
            <>
              {/* Seletor de Cor */}
              {produto.variacoes && produto.variacoes.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Escolha a Cor:</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {produto.variacoes.map((variacao) => (
                      <button
                        key={variacao.id}
                        onClick={() => {
                          setVariacaoUnica(variacao);
                          setNumeracoesUnicas({});
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          variacaoUnica?.id === variacao.id ? 'ring-2 ring-offset-2 ring-purple-500' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          borderColor: variacaoUnica?.id === variacao.id ? corPrimaria : 'transparent'
                        }}
                      >
                        <Image src={variacao.imagem_url} alt={variacao.cor} fill className="object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                          {variacao.cor}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Distribuição de Tamanhos */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Distribuição de Tamanhos:</h3>
                  <Button variant="outline" size="sm" onClick={() => distribuirAutomaticamente('unica')}>
                    Distribuir Auto
                  </Button>
                </div>
                {renderSeletorTamanhos(numeracoesUnicas, 'unica', totalParesNecessarios, totalParesUnica)}
              </Card>
            </>
          )}

          {/* =====================================================
              MODO GRADE DIVIDIDA (2 Slots)
          ===================================================== */}
          {dividirGrade && (
            <div className="space-y-4">
              {/* Barra de Progresso Visual */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Progresso da Grade</span>
                  <span className={`font-bold ${progressoTotal === totalParesNecessarios ? 'text-green-600' : 'text-gray-600'}`}>
                    {progressoTotal} / {totalParesNecessarios} pares
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300 rounded-full"
                    style={{ 
                      width: `${progressoPorcentagem}%`,
                      background: progressoTotal === totalParesNecessarios 
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                        : `linear-gradient(90deg, ${corPrimaria}, #ec4899)`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Cor A: {totalParesSlot1}/{paresNecessariosPorSlot}</span>
                  <span>Cor B: {totalParesSlot2}/{paresNecessariosPorSlot}</span>
                </div>
              </Card>

              {/* SLOT 1 - Primeira Cor */}
              <Card 
                className={`p-4 border-2 transition-all ${slotAtivo === 1 ? 'shadow-lg' : ''}`}
                style={{ borderColor: slotAtivo === 1 ? corPrimaria : slot1Completo ? '#22c55e' : '#e5e7eb' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      slot1Completo ? 'bg-green-500' : 'bg-purple-500'
                    }`}>
                      {slot1Completo ? <Check className="w-5 h-5" /> : '1'}
                    </div>
                    <div>
                      <h4 className="font-semibold">Cor A - Primeira Metade</h4>
                      <p className="text-xs text-gray-500">{totalParesSlot1}/{paresNecessariosPorSlot} pares</p>
                    </div>
                  </div>
                  {slot1Completo && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      ✓ Completo
                    </span>
                  )}
                </div>

                {/* Seletor de Cor do Slot 1 */}
                {produto.variacoes && produto.variacoes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Escolha a cor:</p>
                    <div className="flex gap-2 flex-wrap">
                      {produto.variacoes.map((variacao) => (
                        <button
                          key={variacao.id}
                          onClick={() => selecionarCorSlot(variacao, 1)}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            slot1.variacao?.id === variacao.id ? 'ring-2 ring-offset-1 ring-purple-500' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ 
                            borderColor: slot1.variacao?.id === variacao.id ? corPrimaria : 'transparent'
                          }}
                        >
                          <Image src={variacao.imagem_url} alt={variacao.cor} fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                    {slot1.variacao && (
                      <p className="text-sm font-medium mt-2" style={{ color: corPrimaria }}>
                        Selecionado: {slot1.variacao.cor}
                      </p>
                    )}
                  </div>
                )}

                {/* Tamanhos do Slot 1 */}
                {slot1.variacao && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600">Selecione os tamanhos:</p>
                      <Button variant="outline" size="sm" onClick={() => distribuirAutomaticamente('slot1')}>
                        Distribuir Auto
                      </Button>
                    </div>
                    {renderSeletorTamanhos(slot1.numeracoes, 'slot1', paresNecessariosPorSlot, totalParesSlot1)}
                  </>
                )}
              </Card>

              {/* SLOT 2 - Segunda Cor */}
              <Card 
                className={`p-4 border-2 transition-all ${!slot2Desbloqueado ? 'opacity-60' : slotAtivo === 2 ? 'shadow-lg' : ''}`}
                style={{ borderColor: slotAtivo === 2 ? corPrimaria : slot2Completo ? '#22c55e' : '#e5e7eb' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      slot2Completo ? 'bg-green-500' : slot2Desbloqueado ? 'bg-purple-500' : 'bg-gray-400'
                    }`}>
                      {slot2Completo ? <Check className="w-5 h-5" /> : slot2Desbloqueado ? '2' : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold">Cor B - Segunda Metade</h4>
                      <p className="text-xs text-gray-500">
                        {slot2Desbloqueado ? `${totalParesSlot2}/${paresNecessariosPorSlot} pares` : 'Complete a Cor A primeiro'}
                      </p>
                    </div>
                  </div>
                  {slot2Desbloqueado && !slot2Completo && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Desbloqueado
                    </span>
                  )}
                  {slot2Completo && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      ✓ Completo
                    </span>
                  )}
                </div>

                {slot2Desbloqueado ? (
                  <>
                    {/* Seletor de Cor do Slot 2 */}
                    {produto.variacoes && produto.variacoes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Escolha uma cor diferente:</p>
                        <div className="flex gap-2 flex-wrap">
                          {produto.variacoes
                            .filter(v => v.id !== slot1.variacao?.id) // Exclui a cor já selecionada no slot 1
                            .map((variacao) => (
                              <button
                                key={variacao.id}
                                onClick={() => selecionarCorSlot(variacao, 2)}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  slot2.variacao?.id === variacao.id ? 'ring-2 ring-offset-1 ring-purple-500' : 'opacity-60 hover:opacity-100'
                                }`}
                                style={{ 
                                  borderColor: slot2.variacao?.id === variacao.id ? corPrimaria : 'transparent'
                                }}
                              >
                                <Image src={variacao.imagem_url} alt={variacao.cor} fill className="object-cover" />
                              </button>
                            ))}
                        </div>
                        {slot2.variacao && (
                          <p className="text-sm font-medium mt-2" style={{ color: corPrimaria }}>
                            Selecionado: {slot2.variacao.cor}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tamanhos do Slot 2 */}
                    {slot2.variacao && (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600">Selecione os tamanhos:</p>
                          <Button variant="outline" size="sm" onClick={() => distribuirAutomaticamente('slot2')}>
                            Distribuir Auto
                          </Button>
                        </div>
                        {renderSeletorTamanhos(slot2.numeracoes, 'slot2', paresNecessariosPorSlot, totalParesSlot2)}
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Complete a seleção da Cor A para desbloquear</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* =====================================================
              RESUMO E BOTÃO DE COMPRA
          ===================================================== */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 sticky bottom-4">
            {/* Resumo da seleção */}
            <div className="space-y-3 mb-4">
              {dividirGrade ? (
                <>
                  <div className="flex items-center gap-3">
                    {slot1.variacao && (
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg flex-1">
                        <div className="w-8 h-8 rounded overflow-hidden relative">
                          <Image src={slot1.variacao.imagem_url} alt="" fill className="object-cover" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">{slot1.variacao.cor}</p>
                          <p className="text-xs text-gray-500">{totalParesSlot1} pares</p>
                        </div>
                      </div>
                    )}
                    <span className="text-gray-400">+</span>
                    {slot2.variacao ? (
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg flex-1">
                        <div className="w-8 h-8 rounded overflow-hidden relative">
                          <Image src={slot2.variacao.imagem_url} alt="" fill className="object-cover" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">{slot2.variacao.cor}</p>
                          <p className="text-xs text-gray-500">{totalParesSlot2} pares</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 border-2 border-dashed border-gray-300">
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          <p className="font-medium">Cor B</p>
                          <p className="text-xs">0 pares</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                variacaoUnica && (
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg">
                    <div className="w-10 h-10 rounded overflow-hidden relative">
                      <Image src={variacaoUnica.imagem_url} alt="" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{variacaoUnica.cor}</p>
                      <p className="text-xs text-gray-500">{totalParesUnica}/{totalParesNecessarios} pares selecionados</p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Valor Total */}
            <div className="flex justify-between items-center py-3 border-t border-purple-200">
              <div>
                <span className="text-gray-700">Valor Total:</span>
                <p className="text-xs text-gray-500">{quantidadeGrades} grade(s) × R$ {precoGrade.toFixed(2)}</p>
              </div>
              <span className="font-bold text-3xl" style={{ color: corPrimaria }}>
                R$ {(precoGrade * quantidadeGrades).toFixed(2)}
              </span>
            </div>

            {/* Botão de Compra */}
            <Button
              onClick={adicionarAoCarrinho}
              className="w-full gap-2 py-6 text-lg mt-4 transition-all"
              disabled={!podeAdicionarAoCarrinho}
              style={{
                backgroundColor: podeAdicionarAoCarrinho ? corPrimaria : '#9ca3af',
                cursor: podeAdicionarAoCarrinho ? 'pointer' : 'not-allowed',
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              {podeAdicionarAoCarrinho 
                ? 'Adicionar ao Carrinho' 
                : dividirGrade 
                  ? `Complete os ${totalParesNecessarios} pares`
                  : 'Selecione os pares'
              }
            </Button>

            {/* Mensagem de ajuda */}
            {!podeAdicionarAoCarrinho && (
              <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {dividirGrade 
                    ? !slot1Completo
                      ? `Selecione ${paresNecessariosPorSlot - totalParesSlot1} pares da Cor A`
                      : !slot2.variacao
                        ? 'Escolha a segunda cor para completar a grade'
                        : `Selecione ${paresNecessariosPorSlot - totalParesSlot2} pares da Cor B`
                    : `Faltam ${totalParesNecessarios - totalParesUnica} pares para completar a grade`
                  }
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
