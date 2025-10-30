"use client";
import { useState } from 'react';
import { CreditCard, Smartphone, Barcode, Lock, Loader2 } from 'lucide-react';
import { LojaInfo } from '@/contexts/LojaContext';
import { useCart } from '@/contexts/CartContext';

interface CheckoutFormProps {
  loja: LojaInfo;
}

export default function CheckoutForm({ loja }: CheckoutFormProps) {
  const corPrimaria = loja?.cor_primaria || '#DB1472';
  const { items, getTotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | 'boleto'>('credit');
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
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    installments: '1',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 Iniciando processo de pagamento...');

      // Validações básicas
      if (items.length === 0) {
        throw new Error('Carrinho vazio');
      }

      if (!formData.email || !formData.fullName || !formData.cpf) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // 1. Preparar itens para o Mercado Pago
      const mpItems = items.map(item => ({
        id: item.sku || item.id,
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco_final,
        currency_id: 'BRL',
        picture_url: item.imagens[0],
      }));

      // 2. Calcular totais
      const subtotal = getTotal();
      const frete = subtotal >= 99 ? 0 : 15.90;
      const total = subtotal + frete;

      console.log('💰 Totais:', { subtotal, frete, total });

      // 3. Criar preferência no Mercado Pago
      console.log('📡 Chamando API do Mercado Pago...');
      
      const response = await fetch('/api/mp-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: mpItems,
          payer: {
            email: formData.email,
            name: formData.fullName,
            identification: {
              type: 'CPF',
              number: formData.cpf.replace(/\D/g, ''),
            },
          },
          external_reference: `PEDIDO-${Date.now()}`,
          back_urls: {
            success: `${window.location.origin}/loja/${loja.dominio}/pedido/sucesso`,
            failure: `${window.location.origin}/loja/${loja.dominio}/pedido/falha`,
            pending: `${window.location.origin}/loja/${loja.dominio}/pedido/pendente`,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar preferência de pagamento');
      }

      console.log('✅ Preferência criada:', result.preference_id);

      // 4. Redirecionar para o checkout do Mercado Pago
      const checkoutUrl = result.is_production 
        ? result.init_point 
        : result.sandbox_init_point;

      console.log('🌐 Redirecionando para:', checkoutUrl);
      
      window.location.href = checkoutUrl;

    } catch (err) {
      console.error('❌ Erro ao processar pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
            <label htmlFor="offers" className="ml-2 text-sm text-gray-600">
              Receber ofertas e novidades por e-mail
            </label>
          </div>
        </div>
      </section>

      {/* 2. Informações Pessoais */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          2. Informações Pessoais
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
              placeholder="Seu nome completo"
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
              onChange={(e) => setFormData({...formData, cpf: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
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
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
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
                onChange={(e) => setFormData({...formData, cep: e.target.value})}
                onBlur={handleCepBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="Rua, Avenida, etc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => setFormData({...formData, complement: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="Apto, Bloco, etc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                required
                value={formData.neighborhood}
                onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="Bairro"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="Cidade"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Método de Pagamento */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          4. Método de Pagamento
        </h2>

        {/* Abas de Pagamento */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setPaymentMethod('credit')}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all ${
              paymentMethod === 'credit'
                ? 'border-current text-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={paymentMethod === 'credit' ? { color: corPrimaria } : {}}
          >
            <CreditCard size={20} />
            Cartão de Crédito
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('pix')}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all ${
              paymentMethod === 'pix'
                ? 'border-current text-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={paymentMethod === 'pix' ? { color: corPrimaria } : {}}
          >
            <Smartphone size={20} />
            PIX
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('boleto')}
            className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-all ${
              paymentMethod === 'boleto'
                ? 'border-current text-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={paymentMethod === 'boleto' ? { color: corPrimaria } : {}}
          >
            <Barcode size={20} />
            Boleto
          </button>
        </div>

        {/* Selo de Segurança */}
        <div className="flex items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Lock size={20} style={{ color: corPrimaria }} />
          <span className="text-sm text-gray-700 font-medium">
            Ambiente 100% Seguro - Seus dados estão protegidos
          </span>
        </div>

        {/* Formulário Cartão de Crédito */}
        {paymentMethod === 'credit' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Cartão *
              </label>
              <input
                type="text"
                required
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome no Cartão *
              </label>
              <input
                type="text"
                required
                value={formData.cardName}
                onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                placeholder="Como está impresso no cartão"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validade *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cardExpiry}
                  onChange={(e) => setFormData({...formData, cardExpiry: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cardCvv}
                  onChange={(e) => setFormData({...formData, cardCvv: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                  placeholder="000"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parcelas *
                </label>
                <select
                  required
                  value={formData.installments}
                  onChange={(e) => setFormData({...formData, installments: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
                >
                  <option value="1">1x sem juros</option>
                  <option value="2">2x sem juros</option>
                  <option value="3">3x sem juros</option>
                  <option value="4">4x sem juros</option>
                  <option value="5">5x sem juros</option>
                  <option value="6">6x sem juros</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PIX */}
        {paymentMethod === 'pix' && (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 mb-2">
              Após finalizar, você receberá o QR Code para pagamento
            </p>
            <p className="text-sm text-gray-500">
              Pagamento aprovado na hora
            </p>
          </div>
        )}

        {/* Boleto */}
        {paymentMethod === 'boleto' && (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 mb-2">
              Você receberá o boleto por e-mail
            </p>
            <p className="text-sm text-gray-500">
              Prazo de aprovação: até 2 dias úteis
            </p>
          </div>
        )}
      </section>

      {/* Botão de Finalização */}
      <div className="pt-6 border-t border-gray-200">
        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ❌ {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ backgroundColor: corPrimaria }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </span>
          ) : (
            <>🔒 Finalizar Pagamento</>
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Ao finalizar, você concorda com nossos termos de uso e política de privacidade
        </p>
      </div>
    </form>
  );
}
