"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeColor } from '@/lib/color-utils';
import { ArrowLeft, Trash2, ShoppingCart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export default function CarrinhoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [carrinho, setCarrinho] = useState<GradeItem[]>([]);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');

  useEffect(() => {
    fetchConfig();
    carregarCarrinho();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const carregarCarrinho = () => {
    const carrinhoSalvo = localStorage.getItem('carrinho_grade_fechada');
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  };

  const removerItem = (index: number) => {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    setCarrinho(novoCarrinho);
    localStorage.setItem('carrinho_grade_fechada', JSON.stringify(novoCarrinho));
    toast.success('Item removido do carrinho');
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    localStorage.removeItem('carrinho_grade_fechada');
    toast.success('Carrinho limpo');
  };

  const finalizarPedido = () => {
    if (!clienteNome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    if (!clienteTelefone.trim()) {
      toast.error('Por favor, informe seu telefone');
      return;
    }

    if (carrinho.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (totalGrades < 2) {
      toast.error('Pedido mínimo de 2 grades');
      return;
    }

    // Gerar mensagem para WhatsApp
    let mensagem = `🛍️ *NOVO PEDIDO - GRADE FECHADA*\n\n`;
    mensagem += `👤 *Cliente:* ${clienteNome}\n`;
    mensagem += `📱 *Telefone:* ${clienteTelefone}\n\n`;
    mensagem += `📦 *ITENS DO PEDIDO:*\n`;
    mensagem += `═══════════════════\n\n`;

    carrinho.forEach((item, index) => {
      mensagem += `*${index + 1}. ${item.produto_nome}*\n`;
      mensagem += `   Cor: ${item.cor}\n`;
      mensagem += `   Tipo: ${item.tipo_grade === 'meia' ? 'Meia Grade (6 pares)' : 'Grade Completa (12 pares)'}\n`;
      mensagem += `   Quantidade: ${item.quantidade_grades} grade${item.quantidade_grades > 1 ? 's' : ''}\n`;
      mensagem += `   \n`;
      mensagem += `   📏 *Tamanhos:*\n`;
      Object.entries(item.numeracoes)
        .filter(([, qty]) => qty > 0)
        .forEach(([tamanho, quantidade]) => {
          mensagem += `   • Nº ${tamanho}: ${quantidade} par${quantidade > 1 ? 'es' : ''}\n`;
        });
      mensagem += `   💰 Subtotal: R$ ${item.valor_total.toFixed(2)}\n\n`;
    });

    mensagem += `═══════════════════\n`;
    mensagem += `📊 *RESUMO:*\n`;
    mensagem += `• Total de Grades: ${totalGrades}\n`;
    mensagem += `• Total de Pares: ${totalPares}\n`;
    mensagem += `• *VALOR TOTAL: R$ ${valorTotal.toFixed(2)}*\n\n`;
    mensagem += `⏰ Prazo de produção: 15-20 dias úteis\n`;

    // Enviar para WhatsApp
    const whatsappNumero = String(config?.whatsapp_numero || '').replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/55${whatsappNumero}?text=${encodeURIComponent(mensagem)}`;

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    // Limpar carrinho
    limparCarrinho();
    
    toast.success('Pedido enviado! Aguarde nosso contato no WhatsApp.');
  };

  const totalGrades = carrinho.reduce((sum, item) => sum + item.quantidade_grades, 0);
  const totalPares = carrinho.reduce((sum, item) => {
    const paresPorGrade = item.tipo_grade === 'meia' ? 6 : 12;
    return sum + (paresPorGrade * item.quantidade_grades);
  }, 0);
  const valorTotal = carrinho.reduce((sum, item) => sum + item.valor_total, 0);

  if (carrinho.length === 0) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/loja-grade/${slug}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Catálogo
        </Button>

        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Carrinho Vazio</h2>
          <p className="text-gray-600 mb-6">
            Você ainda não adicionou nenhuma grade ao carrinho
          </p>
          <Button
            onClick={() => router.push(`/loja-grade/${slug}`)}
            style={{ backgroundColor: safeColor(config?.cor_primaria) }}
          >
            Ver Produtos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/loja-grade/${slug}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Continuar Comprando
        </Button>
        <Button variant="outline" onClick={limparCarrinho}>
          Limpar Carrinho
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Itens */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold mb-4">Meu Carrinho</h1>

          {carrinho.map((item, index) => (
            <Card key={index} className="p-6">
              <div className="flex gap-4">
                {/* Imagem */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={item.imagem_url}
                    alt={item.produto_nome}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{item.produto_nome}</h3>
                  <p className="text-sm text-gray-600 mb-2">Cor: {item.cor}</p>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      {item.tipo_grade === 'meia' ? 'Meia Grade (6)' : 'Grade Completa (12)'}
                    </span>
                    <span className="text-sm font-medium">
                      {item.quantidade_grades} grade{item.quantidade_grades > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Tamanhos */}
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Tamanhos:</strong>{' '}
                    {Object.entries(item.numeracoes)
                      .filter(([, qty]) => qty > 0)
                      .map(([tamanho, quantidade]) => `${tamanho}(${quantidade})`)
                      .join(', ')}
                  </div>

                  <p className="text-lg font-bold" style={{ color: safeColor(config?.cor_primaria) }}>
                    R$ {item.valor_total.toFixed(2)}
                  </p>
                </div>

                {/* Remover */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removerItem(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Coluna Direita: Resumo e Checkout */}
        <div className="space-y-4">
          {/* Dados do Cliente */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Seus Dados</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                <Input
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefone / WhatsApp *</label>
                <Input
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  type="tel"
                />
              </div>
            </div>
          </Card>

          {/* Resumo */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total de Grades:</span>
                <span className="font-semibold">{totalGrades} grades</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total de Pares:</span>
                <span className="font-semibold">{totalPares} pares</span>
              </div>
              <div className="flex justify-between text-lg pt-3 border-t">
                <span className="font-bold">Valor Total:</span>
                <span className="font-bold text-2xl" style={{ color: safeColor(config?.cor_primaria) }}>
                  R$ {valorTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {totalGrades < 2 && (
              <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-sm rounded-lg">
                ⚠️ Pedido mínimo: 2 grades
              </div>
            )}

            <Button
              onClick={finalizarPedido}
              disabled={totalGrades < 2 || !clienteNome.trim() || !clienteTelefone.trim()}
              className="w-full gap-2 py-6 text-lg"
              style={{
                backgroundColor: safeColor(config?.cor_primaria),
                opacity: (totalGrades < 2 || !clienteNome.trim() || !clienteTelefone.trim()) ? 0.5 : 1,
              }}
            >
              <MessageCircle className="w-5 h-5" />
              Finalizar pelo WhatsApp
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Você será redirecionado para o WhatsApp para confirmar seu pedido
            </p>
          </Card>

          {/* Info */}
          <Card className="p-4 bg-blue-50">
            <p className="text-sm text-blue-800">
              <strong>📦 Prazo de Produção:</strong> 15-20 dias úteis após confirmação do pedido
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
