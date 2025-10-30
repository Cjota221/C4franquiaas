/**
 * Componente: Checkout Form com Checkout Transparente
 * 
 * Versão atualizada que usa checkout transparente do Mercado Pago
 * com PIX (QR Code) e Cartão de Crédito processados na própria página.
 * 
 * DIFERENÇAS DA VERSÃO ANTERIOR:
 * - ❌ Não redireciona para site do Mercado Pago
 * - ✅ PIX: Gera QR Code na página
 * - ✅ Cartão: Formulário seguro com tokenização
 * - ✅ Aprovação/recusa instantânea
 */

"use client";
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { LojaInfo } from '@/contexts/LojaContext';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore'; // 🔧 Usar Zustand
import PaymentMethodSelector, { type PaymentMethodType } from './PaymentMethodSelector';
import PixPayment from './PixPayment';
import CardPayment from './CardPayment';
import { createBrowserClient } from '@/lib/supabase/client';

interface CheckoutFormProps {
  loja: LojaInfo;
}

type CheckoutStep = 'form' | 'payment' | 'processing' | 'success' | 'error';

export default function CheckoutFormTransparente({ loja }: CheckoutFormProps) {
  const corPrimaria = loja?.cor_primaria || '#DB1472';
  
  // 🔧 Usar Zustand em vez de CartContext
  const items = useCarrinhoStore(state => state.items);
  const clearCarrinho = useCarrinhoStore(state => state.clearCarrinho);
  const getTotal = useCarrinhoStore(state => state.getTotal);
  
  // Calcular totais
  const subtotal = getTotal();
  const frete = subtotal >= 99 ? 0 : 15.90;
  const total = subtotal + frete;
  
  // Estados do checkout
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    copyPasteCode: string;
    expirationDate: string;
    paymentId: string;
    external_reference: string;
  } | null>(null);
  const [publicKey, setPublicKey] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    receiveOffers: false,
    fullName: '',
    cpf: '',
    whatsapp: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  // Buscar Public Key do Mercado Pago
  useEffect(() => {
    async function loadPublicKey() {
      try {
        const response = await fetch('/api/mp-public-key');
        const data = await response.json();
        if (data.publicKey) {
          setPublicKey(data.publicKey);
          console.log('✅ Public Key carregada');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar Public Key:', error);
      }
    }
    loadPublicKey();
  }, []);

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    console.log('🔍 [Validação] Dados do formulário:', formData);
    
    if (!formData.email || !formData.fullName || !formData.cpf) {
      const erro = 'Preencha todos os campos obrigatórios (Nome, Email, CPF)';
      setError(erro);
      console.error('❌ [Validação]', erro);
      // Scroll para o topo para mostrar o erro
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!formData.whatsapp) {
      const erro = 'WhatsApp é obrigatório';
      setError(erro);
      console.error('❌ [Validação]', erro);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!formData.cep || !formData.address || !formData.number) {
      const erro = 'Complete o endereço de entrega (CEP, Rua, Número)';
      setError(erro);
      console.error('❌ [Validação]', erro);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    
    console.log('✅ [Validação] Formulário válido!');
    return true;
  };

  // Avançar para escolha de pagamento
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [Checkout] Botão clicado!');
    
    if (items.length === 0) {
      setError('Carrinho vazio');
      console.error('❌ [Checkout] Carrinho vazio');
      return;
    }

    console.log('📋 [Checkout] Validando formulário...');
    if (!validateForm()) {
      console.error('❌ [Checkout] Validação falhou');
      return;
    }

    console.log('✅ [Checkout] Avançando para pagamento!');
    setError(null);
    setCheckoutStep('payment');
  };

  // 🆕 Salvar venda no banco de dados
  const salvarVenda = async (paymentId: string, metodo: string) => {
    console.log('🔄 [Venda] Iniciando salvamento...');
    console.log('🔄 [Venda] Payment ID:', paymentId);
    console.log('🔄 [Venda] Método:', metodo);
    console.log('🔄 [Venda] Loja ID:', loja.id);
    console.log('🔄 [Venda] Franqueada ID:', loja.franqueada_id);
    
    try {
      const supabase = createBrowserClient();

      // Calcular comissão da franqueada
      const percentualComissao = loja.margem_lucro || 30; // Default 30%
      const comissaoFranqueada = (total * percentualComissao) / 100;

      const vendaData = {
        loja_id: loja.id,
        franqueada_id: loja.franqueada_id,
        items: items.map(item => ({
          id: item.id,
          nome: item.nome,
          tamanho: item.tamanho,
          sku: item.sku,
          quantidade: item.quantidade,
          preco: item.preco,
          imagem: item.imagem
        })),
        valor_total: total,
        comissao_franqueada: comissaoFranqueada,
        percentual_comissao: percentualComissao,
        mp_payment_id: paymentId,
        metodo_pagamento: metodo,
        status_pagamento: 'pending',
        cliente_nome: formData.fullName,
        cliente_email: formData.email,
        cliente_cpf: formData.cpf.replace(/\D/g, ''),
        cliente_telefone: formData.whatsapp,
        endereco_completo: {
          cep: formData.cep,
          rua: formData.address,
          numero: formData.number,
          complemento: formData.complement,
          bairro: formData.neighborhood,
          cidade: formData.city,
          estado: formData.state,
        }
      };

      console.log('📦 [Venda] Dados preparados:', JSON.stringify(vendaData, null, 2));

      const { data, error } = await supabase
        .from('vendas')
        .insert(vendaData)
        .select();

      if (error) {
        console.error('❌ [Venda] Erro no INSERT:', error);
        console.error('❌ [Venda] Error code:', error.code);
        console.error('❌ [Venda] Error message:', error.message);
        console.error('❌ [Venda] Error details:', error.details);
        throw error;
      }

      console.log('✅ [Venda] Salva com sucesso!', data);
      console.log('✅ [Venda] Payment ID:', paymentId);
    } catch (error) {
      console.error('❌ [Venda] EXCEPTION ao salvar:', error);
      // Não bloquear o checkout se falhar ao salvar
    }
  };

  // Processar pagamento PIX
  const handlePixPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const mpItems = items.map(item => ({
        id: item.sku || item.id,
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco,
      }));

      const response = await fetch('/api/mp-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'pix',
          amount: total,
          description: `Pedido - ${items.map(i => i.nome).join(', ')}`,
          payer: {
            email: formData.email,
            firstName: formData.fullName.split(' ')[0],
            lastName: formData.fullName.split(' ').slice(1).join(' ') || formData.fullName.split(' ')[0],
            identification: {
              type: 'CPF',
              number: formData.cpf.replace(/\D/g, ''),
            },
          },
          items: mpItems,
          external_reference: `PEDIDO-${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Erro ao criar pagamento PIX');
      }

      // Salvar dados do PIX
      setPixData({
        qrCode: result.pix.qrCode,
        qrCodeBase64: result.pix.qrCodeBase64,
        copyPasteCode: result.pix.copyPasteCode,
        expirationDate: result.pix.expirationDate,
        paymentId: result.paymentId,
        external_reference: result.external_reference,
      });

      // 🆕 Salvar venda no banco de dados
      await salvarVenda(result.paymentId, 'pix');

      setCheckoutStep('processing');

    } catch (err) {
      console.error('❌ Erro ao criar pagamento PIX:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar PIX');
    } finally {
      setLoading(false);
    }
  };

  // Callbacks do PIX
  const handlePixPaymentConfirmed = () => {
    setCheckoutStep('success');
    clearCarrinho();
  };

  const handlePixPaymentExpired = () => {
    setError('Pagamento PIX expirou. Tente novamente.');
    setCheckoutStep('payment');
    setPixData(null);
  };

  // Callbacks do Cartão
  const handleCardPaymentSuccess = async (paymentIdResult: string) => {
    setPaymentId(paymentIdResult);
    
    // 🆕 Salvar venda no banco de dados
    await salvarVenda(paymentIdResult, 'credit_card');
    
    setCheckoutStep('success');
    clearCarrinho();
  };

  const handleCardPaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setCheckoutStep('error');
  };

  // Voltar para etapa anterior
  const handleBack = () => {
    if (checkoutStep === 'payment') {
      setCheckoutStep('form');
      setSelectedPaymentMethod(null);
    } else if (checkoutStep === 'processing') {
      setCheckoutStep('payment');
      setPixData(null);
    } else if (checkoutStep === 'error') {
      setCheckoutStep('payment');
      setError(null);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL POR ETAPA
  // ==========================================

  // ETAPA: Sucesso
  if (checkoutStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Seu pedido foi recebido e está sendo processado
          </p>
          {paymentId && (
            <p className="text-sm text-gray-500 mb-4">
              ID do Pagamento: <span className="font-mono">{paymentId}</span>
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📧 Próximos Passos</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enviamos um e-mail de confirmação para {formData.email}</li>
            <li>• Você receberá atualizações do pedido no WhatsApp</li>
            <li>• Prazo de entrega: 5-7 dias úteis</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.href = `/loja/${loja.dominio}`}
          className="px-8 py-4 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: corPrimaria }}
        >
          Voltar para a Loja
        </button>
      </div>
    );
  }

  // ETAPA: Erro
  if (checkoutStep === 'error') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Não Aprovado
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Ocorreu um erro ao processar seu pagamento'}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">💡 Sugestões</h3>
          <ul className="text-sm text-yellow-800 space-y-1 text-left">
            <li>• Verifique os dados do cartão</li>
            <li>• Certifique-se de que há saldo disponível</li>
            <li>• Tente outro cartão ou método de pagamento</li>
            <li>• Entre em contato com seu banco se necessário</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleBack}
            className="px-8 py-4 rounded-full bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition-all"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.href = `/loja/${loja.dominio}`}
            className="px-8 py-4 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: corPrimaria }}
          >
            Voltar para a Loja
          </button>
        </div>
      </div>
    );
  }

  // ETAPA: Processando PIX (mostrando QR Code)
  if (checkoutStep === 'processing' && pixData) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <PixPayment
          pixData={pixData}
          onPaymentConfirmed={handlePixPaymentConfirmed}
          onPaymentExpired={handlePixPaymentExpired}
          corPrimaria={corPrimaria}
        />
      </div>
    );
  }

  // ETAPA: Escolha de Método de Pagamento
  if (checkoutStep === 'payment') {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos dados
        </button>

        {/* Resumo do Pedido */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Resumo do Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frete</span>
              <span className="font-medium">
                {frete === 0 ? 'GRÁTIS' : `R$ ${frete.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span style={{ color: corPrimaria }}>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        {/* Seletor de Método */}
        <PaymentMethodSelector
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={setSelectedPaymentMethod}
          corPrimaria={corPrimaria}
        />

        {/* Erro */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Formulário de Pagamento */}
        {selectedPaymentMethod === 'pix' && (
          <div className="mt-6">
            <button
              onClick={handlePixPayment}
              disabled={loading}
              className="w-full py-4 px-6 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: corPrimaria }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando QR Code PIX...
                </span>
              ) : (
                'Gerar QR Code PIX'
              )}
            </button>
          </div>
        )}

        {selectedPaymentMethod === 'credit_card' && publicKey && (
          <div className="mt-6">
            {/* Aviso sobre HTTPS */}
            {typeof window !== 'undefined' && window.location.protocol === 'http:' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-semibold mb-2">
                  ⚠️ Pagamento com Cartão Requer HTTPS
                </p>
                <p className="text-yellow-700 text-xs">
                  O Mercado Pago exige conexão segura (HTTPS) para processar cartões.
                  Para testar cartão em localhost, você precisa:
                </p>
                <ul className="text-yellow-700 text-xs mt-2 ml-4 list-disc">
                  <li>Fazer deploy para produção (Netlify tem HTTPS automático)</li>
                  <li>Ou configurar certificado SSL local</li>
                </ul>
                <p className="text-yellow-700 text-xs mt-2 font-semibold">
                  💡 Use o PIX para testar localmente!
                </p>
              </div>
            )}
            
            <CardPayment
              amount={total}
              publicKey={publicKey}
              onPaymentSuccess={handleCardPaymentSuccess}
              onPaymentError={handleCardPaymentError}
              corPrimaria={corPrimaria}
              payerInfo={{
                email: formData.email,
                firstName: formData.fullName.split(' ')[0],
                lastName: formData.fullName.split(' ').slice(1).join(' ') || formData.fullName.split(' ')[0],
                docType: 'CPF',
                docNumber: formData.cpf.replace(/\D/g, ''),
              }}
              items={items.map(item => ({
                id: item.sku || item.id,
                title: item.nome,
                quantity: item.quantidade,
                unit_price: item.preco,
              }))}
            />
          </div>
        )}
      </div>
    );
  }

  // ETAPA: Formulário (padrão)
  return (
    <form onSubmit={handleContinueToPayment} className="space-y-8">
      {/* 1. Informações de Contato */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          1. Informações de Contato
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crie sua senha *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Para acompanhar seu pedido e facilitar compras futuras
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="offers"
              checked={formData.receiveOffers}
              onChange={(e) => setFormData({...formData, receiveOffers: e.target.checked})}
              className="w-4 h-4 rounded border-gray-300"
              style={{ accentColor: corPrimaria }}
            />
            <label htmlFor="offers" className="ml-2 text-sm text-gray-700">
              Quero receber ofertas e novidades por e-mail
            </label>
          </div>
        </div>
      </section>

      {/* 2. Dados Pessoais */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          2. Dados Pessoais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              placeholder="Como na identidade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF *
            </label>
            <input
              type="text"
              required
              value={formData.cpf}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                  setFormData({...formData, cpf: value});
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp *
            </label>
            <input
              type="tel"
              required
              value={formData.whatsapp}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                  setFormData({...formData, whatsapp: value});
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
        </div>
      </section>

      {/* 3. Endereço de Entrega */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          3. Endereço de Entrega
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP *
              </label>
              <input
                type="text"
                required
                value={formData.cep}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 8) {
                    value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                    setFormData({...formData, cep: value});
                  }
                }}
                onBlur={handleCepBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              placeholder="Rua, avenida, etc"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                placeholder="123"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => setFormData({...formData, complement: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                placeholder="Apto, bloco, etc (opcional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                required
                value={formData.neighborhood}
                onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all"
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Botão Continuar */}
      <div className="pt-6 border-t border-gray-200">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation"
          style={{ backgroundColor: corPrimaria }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </span>
          ) : (
            'Continuar para Pagamento →'
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Seus dados estão seguros e serão usados apenas para processar seu pedido
        </p>
      </div>
    </form>
  );
}
