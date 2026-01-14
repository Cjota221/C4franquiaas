"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Check, AlertCircle, Loader2, Package, Info } from 'lucide-react';
import type { GradeFechadaProduto, ItemPedido, Numeracoes, TipoGrade } from '@/types/grade-fechada';
import { toast } from 'sonner';

export default function ProdutoDetalheEncomedaPage() {
  const params = useParams();
  const router = useRouter();
  const [produto, setProduto] = useState<GradeFechadaProduto | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagemAtual, setImagemAtual] = useState(0);

  // Estado do montador de grade
  const [tipoGrade, setTipoGrade] = useState<TipoGrade>('completa');
  const [quantidadeGrades, setQuantidadeGrades] = useState(2);
  const [cor, setCor] = useState('');
  const [numeracoes, setNumeracoes] = useState<Numeracoes>({});

  useEffect(() => {
    fetchProduto();
    fetchConfig();
  }, [params.id]);

  const fetchProduto = async () => {
    try {
      const response = await fetch(`/api/encomendas/produtos/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setProduto(data.data);
      } else {
        toast.error('Produto não encontrado');
        router.push('/encomendas');
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/encomendas/configuracoes');
      const data = await response.json();
      if (response.ok) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Definir pares por tipo de grade (ajustar conforme necessário)
  const paresPorTipo = {
    meia: 6,
    completa: 12,
  };

  // Calcular totais
  const totalPares = Object.values(numeracoes).reduce((sum, n) => sum + n, 0);
  const paresEsperados = quantidadeGrades * paresPorTipo[tipoGrade];
  const isValid = totalPares === paresEsperados && cor !== '' && quantidadeGrades >= 2;

  // Calcular valor
  const valorUnitario = tipoGrade === 'meia' 
    ? (produto?.preco_meia_grade || 0)
    : (produto?.preco_grade_completa || 0);
  const valorTotal = valorUnitario * quantidadeGrades;

  const handleNumeracaoChange = (num: string, valor: string) => {
    const numValue = parseInt(valor) || 0;
    setNumeracoes(prev => ({
      ...prev,
      [num]: numValue
    }));
  };

  const handleAdicionarCarrinho = () => {
    if (!isValid) {
      toast.error('Por favor, complete a montagem da grade corretamente');
      return;
    }

    if (!produto) return;

    // Criar item do carrinho
    const item: ItemPedido = {
      produto_id: produto.id,
      produto_nome: produto.nome,
      tipo_grade: tipoGrade,
      quantidade_grades: quantidadeGrades,
      cor: cor,
      numeracoes: numeracoes,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
    };

    // Pegar carrinho atual do localStorage
    const carrinhoAtual = JSON.parse(
      localStorage.getItem('carrinho_encomendas') || '[]'
    );

    // Adicionar item
    carrinhoAtual.push(item);

    // Salvar no localStorage
    localStorage.setItem('carrinho_encomendas', JSON.stringify(carrinhoAtual));

    // Disparar evento para atualizar contador
    window.dispatchEvent(new Event('carrinho-updated'));

    toast.success('Produto adicionado ao carrinho!');

    // Resetar formulário
    setNumeracoes({});
    setCor('');

    // Opcional: redirecionar para carrinho
    setTimeout(() => {
      router.push('/encomendas/carrinho');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
        <button
          onClick={() => router.push('/encomendas')}
          className="text-pink-600 hover:underline"
        >
          Voltar ao catálogo
        </button>
      </div>
    );
  }

  const numeracoesDisponiveis = config?.numeracoes_padrao || ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar ao catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galeria de Imagens */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="relative w-full h-96 bg-gray-100">
              {produto.imagens && produto.imagens.length > 0 ? (
                <Image
                  src={produto.imagens[imagemAtual]}
                  alt={produto.nome}
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Miniaturas */}
          {produto.imagens && produto.imagens.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {produto.imagens.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImagemAtual(index)}
                  className={`relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden border-2 transition ${
                    imagemAtual === index ? 'border-pink-500' : 'border-transparent'
                  }`}
                >
                  <Image src={img} alt={`Imagem ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Informações do Produto */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {produto.nome}
            </h1>
            
            {produto.codigo_interno && (
              <p className="text-gray-500 mb-4">Código: {produto.codigo_interno}</p>
            )}

            {produto.descricao && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Descrição:</h3>
                <p className="text-gray-700">{produto.descricao}</p>
              </div>
            )}

            {produto.observacoes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Observações:</h4>
                    <p className="text-blue-800 text-sm">{produto.observacoes}</p>
                  </div>
                </div>
              </div>
            )}

            {produto.aceita_personalizacao && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-900 font-medium text-center">
                  ✨ Este produto aceita personalização com logomarca
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Montador de Grade */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Monte sua Encomenda
            </h2>

            {/* Tipo de Grade */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 mb-3">
                1. Escolha o Tipo de Grade:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {produto.permite_meia_grade && (
                  <button
                    onClick={() => {
                      setTipoGrade('meia');
                      setNumeracoes({});
                    }}
                    className={`p-4 rounded-lg border-2 transition ${
                      tipoGrade === 'meia'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-300 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Meia Grade</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {paresPorTipo.meia} pares
                      </p>
                      <p className="text-lg font-bold text-pink-600 mt-2">
                        R$ {produto.preco_meia_grade?.toFixed(2)}
                      </p>
                    </div>
                  </button>
                )}
                {produto.permite_grade_completa && (
                  <button
                    onClick={() => {
                      setTipoGrade('completa');
                      setNumeracoes({});
                    }}
                    className={`p-4 rounded-lg border-2 transition ${
                      tipoGrade === 'completa'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-300 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Grade Completa</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {paresPorTipo.completa} pares
                      </p>
                      <p className="text-lg font-bold text-pink-600 mt-2">
                        R$ {produto.preco_grade_completa?.toFixed(2)}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Quantidade de Grades */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 mb-3">
                2. Quantidade de Grades:
              </label>
              <input
                type="number"
                min="2"
                value={quantidadeGrades}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 2;
                  setQuantidadeGrades(Math.max(2, val));
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-lg font-semibold"
              />
              <p className="text-sm text-gray-600 mt-2">
                ⚠️ Pedido mínimo: {config?.pedido_minimo_grades || 2} grades
              </p>
            </div>

            {/* Cor */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 mb-3">
                3. Escolha a Cor:
              </label>
              <select
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Selecione uma cor</option>
                {produto.cores_disponiveis.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Montagem de Numerações */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 mb-3">
                4. Monte a Numeração da Grade:
              </label>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-700 text-center">
                  Total de pares: <span className="font-bold">{totalPares}</span> /{' '}
                  <span className="font-bold">{paresEsperados}</span>
                </p>
                <div className="mt-2">
                  {totalPares === paresEsperados ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Grade completa!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-orange-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {totalPares < paresEsperados
                          ? `Faltam ${paresEsperados - totalPares} pares`
                          : `${totalPares - paresEsperados} pares a mais`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {numeracoesDisponiveis.map((num) => (
                  <div key={num} className="flex flex-col">
                    <label className="text-xs text-gray-600 font-medium mb-1 text-center">
                      Nº {num}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={numeracoes[num] || ''}
                      onChange={(e) => handleNumeracaoChange(num, e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Valor Total */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-6 border-2 border-pink-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Valor Total:</span>
                <span className="text-2xl font-bold text-pink-600">
                  R$ {valorTotal.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                {quantidadeGrades} {quantidadeGrades === 1 ? 'grade' : 'grades'} × R${' '}
                {valorUnitario.toFixed(2)}
              </p>
            </div>

            {/* Botão Adicionar */}
            <button
              onClick={handleAdicionarCarrinho}
              disabled={!isValid}
              className={`w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
                isValid
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              Adicionar ao Carrinho
            </button>

            {!isValid && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ Complete todos os campos e ajuste as numerações
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
