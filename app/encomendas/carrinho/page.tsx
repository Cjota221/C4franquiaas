"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowLeft, Send, Package, AlertCircle } from 'lucide-react';
import type { ItemPedido } from '@/types/grade-fechada';
import { toast } from 'sonner';

export default function CarrinhoEncomendaPage() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Dados do cliente
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');

  useEffect(() => {
    // Carregar itens do carrinho
    const carrinhoAtual = JSON.parse(
      localStorage.getItem('carrinho_encomendas') || '[]'
    );
    setItens(carrinhoAtual);

    // Carregar dados do cliente salvos
    setClienteNome(localStorage.getItem('cliente_nome_encomenda') || '');
    setClienteTelefone(localStorage.getItem('cliente_telefone_encomenda') || '');
    setClienteEmail(localStorage.getItem('cliente_email_encomenda') || '');

    // Carregar configurações
    fetchConfig();
  }, []);

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

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.valor_total, 0);
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
    localStorage.setItem('carrinho_encomendas', JSON.stringify(novosItens));
    window.dispatchEvent(new Event('carrinho-updated'));
    toast.success('Item removido do carrinho');
  };

  const handleLimparCarrinho = () => {
    if (!confirm('Deseja realmente limpar todo o carrinho?')) return;
    
    setItens([]);
    localStorage.setItem('carrinho_encomendas', '[]');
    window.dispatchEvent(new Event('carrinho-updated'));
    toast.success('Carrinho limpo');
  };

  const gerarMensagemWhatsApp = (numeroPedido: string) => {
    let mensagem = '🛒 *PEDIDO DE ENCOMENDA - GRADE FECHADA*\n\n';
    
    if (clienteNome) {
      mensagem += `👤 *Cliente:* ${clienteNome}\n`;
    }
    if (clienteTelefone) {
      mensagem += `📱 *Telefone:* ${clienteTelefone}\n`;
    }
    if (clienteEmail) {
      mensagem += `📧 *Email:* ${clienteEmail}\n`;
    }
    
    mensagem += '\n━━━━━━━━━━━━━━━━━━━━\n\n';
    
    itens.forEach((item, index) => {
      mensagem += `*📦 Produto ${index + 1}:* ${item.produto_nome}\n`;
      mensagem += `*Tipo:* ${item.tipo_grade === 'meia' ? 'Meia Grade' : 'Grade Completa'}\n`;
      mensagem += `*Quantidade:* ${item.quantidade_grades} ${item.quantidade_grades === 1 ? 'grade' : 'grades'}\n`;
      mensagem += `*Cor:* ${item.cor}\n\n`;
      
      mensagem += `*Numerações:*\n`;
      Object.entries(item.numeracoes)
        .filter(([_, qtd]) => qtd > 0)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([num, qtd]) => {
          mensagem += `  • Nº ${num}: ${qtd} ${qtd === 1 ? 'par' : 'pares'}\n`;
        });
      
      mensagem += `\n💰 *Subtotal:* R$ ${item.valor_total.toFixed(2)}\n`;
      mensagem += '\n━━━━━━━━━━━━━━━━━━━━\n\n';
    });
    
    mensagem += `*💵 VALOR TOTAL: R$ ${calcularTotal().toFixed(2)}*\n\n`;
    mensagem += `📦 *Prazo de produção:* ${config?.prazo_producao_min || 15}-${config?.prazo_producao_max || 20} dias úteis\n`;
    mensagem += `📋 *Número do Pedido:* ${numeroPedido}\n`;
    mensagem += `⚠️ *Pedido mínimo:* ${config?.pedido_minimo_grades || 2} grades\n`;
    
    return encodeURIComponent(mensagem);
  };

  const handleFinalizarPedido = async () => {
    // Validações
    if (itens.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    // Salvar dados do cliente no localStorage
    if (clienteNome) localStorage.setItem('cliente_nome_encomenda', clienteNome);
    if (clienteTelefone) localStorage.setItem('cliente_telefone_encomenda', clienteTelefone);
    if (clienteEmail) localStorage.setItem('cliente_email_encomenda', clienteEmail);

    setSalvando(true);

    try {
      // 1. Criar pedido no banco
      const response = await fetch('/api/encomendas/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nome: clienteNome || undefined,
          cliente_telefone: clienteTelefone || undefined,
          cliente_email: clienteEmail || undefined,
          itens: itens,
          origem: 'site',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pedido');
      }

      const data = await response.json();
      const pedido = data.data;

      // 2. Gerar mensagem WhatsApp
      const mensagem = gerarMensagemWhatsApp(pedido.numero_pedido);
      const whatsappNumero = config?.whatsapp_numero || '';

      if (!whatsappNumero) {
        toast.error('Número do WhatsApp não configurado');
        return;
      }

      // 3. Limpar carrinho
      localStorage.removeItem('carrinho_encomendas');
      window.dispatchEvent(new Event('carrinho-updated'));

      // 4. Abrir WhatsApp
      const url = `https://wa.me/${whatsappNumero}?text=${mensagem}`;
      window.open(url, '_blank');

      // 5. Atualizar pedido como finalizado via WhatsApp
      fetch(`/api/admin/grade-fechada/pedidos/${pedido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalizado_whatsapp: true,
          data_finalizacao_whatsapp: new Date().toISOString(),
        }),
      });

      toast.success('Pedido enviado! Redirecionando para o WhatsApp...');

      // 6. Redirecionar para página de sucesso ou catálogo
      setTimeout(() => {
        router.push('/encomendas?pedido=sucesso');
      }, 2000);
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast.error('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (itens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-600 mb-8">
            Adicione produtos ao carrinho para fazer seu pedido
          </p>
          <button
            onClick={() => router.push('/encomendas')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition"
          >
            Ver Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/encomendas')}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Continuar comprando
        </button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Meu Carrinho
          </h1>
          <button
            onClick={handleLimparCarrinho}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Limpar carrinho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-4">
          {itens.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.produto_nome}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      {item.tipo_grade === 'meia' ? 'Meia Grade' : 'Grade Completa'}
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      {item.quantidade_grades} {item.quantidade_grades === 1 ? 'grade' : 'grades'}
                    </span>
                    <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-medium">
                      Cor: {item.cor}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoverItem(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Remover item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Numerações */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Numerações:</h4>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Object.entries(item.numeracoes)
                    .filter(([_, qtd]) => qtd > 0)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([num, qtd]) => (
                      <div
                        key={num}
                        className="bg-white rounded border border-gray-300 p-2 text-center"
                      >
                        <div className="text-xs text-gray-600">Nº {num}</div>
                        <div className="font-bold text-gray-900">{qtd}</div>
                      </div>
                    ))}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Total:{' '}
                  {Object.values(item.numeracoes).reduce((sum, n) => sum + n, 0)}{' '}
                  pares
                </p>
              </div>

              {/* Valor */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-2xl font-bold text-pink-600">
                  R$ {item.valor_total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo e Dados do Cliente */}
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Seus Dados (Opcional)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone/WhatsApp
                </label>
                <input
                  type="tel"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <p className="text-xs text-gray-500">
                Seus dados ajudarão no atendimento via WhatsApp
              </p>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Resumo do Pedido
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Total de itens:</span>
                <span className="font-semibold">{itens.length}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total de grades:</span>
                <span className="font-semibold">
                  {itens.reduce((sum, item) => sum + item.quantidade_grades, 0)}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Valor Total:
                </span>
                <span className="text-3xl font-bold text-pink-600">
                  R$ {calcularTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizarPedido}
              disabled={salvando}
              className={`w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
                salvando
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90'
              }`}
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Finalizar pelo WhatsApp
                </>
              )}
            </button>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Seu pedido será salvo no sistema</li>
                    <li>• Você será redirecionado para o WhatsApp</li>
                    <li>• Envie a mensagem para confirmar</li>
                    <li>• Aguarde nosso retorno com o orçamento final</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
            <h4 className="font-bold text-gray-900 mb-3">📋 Informações Importantes</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Pedido mínimo: {config?.pedido_minimo_grades || 2} grades</li>
              <li>
                • Prazo de produção: {config?.prazo_producao_min || 15}-
                {config?.prazo_producao_max || 20} dias úteis
              </li>
              <li>• Pagamento será combinado via WhatsApp</li>
              <li>• Frete calculado após confirmação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
