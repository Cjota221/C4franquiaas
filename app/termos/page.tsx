"use client";
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, AlertTriangle, Users, CreditCard, Lock } from 'lucide-react';

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Termos de Uso</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-8">
          
          {/* Última atualização */}
          <p className="text-sm text-gray-500">Última atualização: 29 de dezembro de 2025</p>

          {/* Introdução */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              1. Introdução
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Bem-vindo(a) à nossa plataforma de revenda. Estes Termos de Uso regulam o acesso e 
                utilização da plataforma por revendedores(as) autorizados(as) e seus respectivos clientes.
              </p>
              <p>
                Ao se cadastrar como revendedor(a) ou realizar compras através de uma loja de revendedor(a), 
                você concorda integralmente com estes termos.
              </p>
            </div>
          </section>

          {/* Definições */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              2. Definições
            </h2>
            <div className="text-gray-600 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Plataforma:</strong> Sistema de gestão de revendas e catálogos online.</li>
                <li><strong>Franqueadora:</strong> Empresa detentora da marca e dos produtos.</li>
                <li><strong>Franqueada:</strong> Distribuidora regional autorizada pela Franqueadora.</li>
                <li><strong>Revendedor(a):</strong> Pessoa física ou jurídica cadastrada para revender produtos através da plataforma.</li>
                <li><strong>Cliente Final:</strong> Consumidor que realiza compras através das lojas dos revendedores.</li>
              </ul>
            </div>
          </section>

          {/* Responsabilidades do Revendedor */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              3. Responsabilidades do(a) Revendedor(a)
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>O(A) Revendedor(a) é integralmente responsável por:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Todas as vendas realizadas através de sua loja virtual;</li>
                <li>A veracidade das informações fornecidas no cadastro;</li>
                <li>O atendimento ao cliente final, incluindo dúvidas, trocas e devoluções;</li>
                <li>O cumprimento das leis de proteção ao consumidor (CDC);</li>
                <li>A emissão de notas fiscais quando aplicável;</li>
                <li>A declaração de impostos sobre suas vendas;</li>
                <li>A não utilização da plataforma para atividades ilícitas, fraudulentas ou enganosas;</li>
                <li>A proteção de dados pessoais de seus clientes conforme a LGPD.</li>
              </ul>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-700 font-medium">
                  ⚠️ IMPORTANTE: A Franqueadora e as Franqueadas NÃO se responsabilizam por:
                </p>
                <ul className="list-disc pl-5 mt-2 text-red-600 text-sm space-y-1">
                  <li>Golpes, fraudes ou práticas enganosas cometidas por revendedores;</li>
                  <li>Produtos não entregues por culpa do(a) revendedor(a);</li>
                  <li>Divergências entre o prometido pelo(a) revendedor(a) e o entregue;</li>
                  <li>Uso indevido de dados de clientes por revendedores.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Proibições */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              4. Condutas Proibidas
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>É expressamente proibido ao(à) Revendedor(a):</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Praticar preços abusivos ou enganosos;</li>
                <li>Fazer propaganda enganosa sobre os produtos;</li>
                <li>Coletar pagamentos e não entregar os produtos;</li>
                <li>Utilizar dados de clientes para fins não autorizados;</li>
                <li>Revender produtos falsificados ou de origem duvidosa;</li>
                <li>Prejudicar a imagem da marca ou de outros revendedores;</li>
                <li>Compartilhar acesso à plataforma com terceiros não autorizados.</li>
              </ul>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800 font-medium">
                  O descumprimento dessas regras resultará em:
                </p>
                <ul className="list-disc pl-5 mt-2 text-yellow-700 text-sm space-y-1">
                  <li>Suspensão imediata do acesso à plataforma;</li>
                  <li>Cancelamento definitivo do cadastro;</li>
                  <li>Responsabilização civil e criminal quando aplicável;</li>
                  <li>Comunicação às autoridades competentes em caso de crimes.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pagamentos */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              5. Pagamentos e Transações
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Os pagamentos realizados pelos clientes são processados diretamente para o(a) revendedor(a) 
                através de gateways de pagamento integrados (Mercado Pago, PIX, etc.).
              </p>
              <p>
                A Franqueadora e as Franqueadas não intermediam pagamentos entre clientes e revendedores, 
                sendo cada revendedor(a) responsável por configurar e gerenciar sua própria conta de recebimentos.
              </p>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              6. Propriedade Intelectual
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Todos os direitos sobre a marca, logotipos, imagens de produtos, textos e demais conteúdos 
                da plataforma pertencem exclusivamente à Franqueadora.
              </p>
              <p>
                O(A) Revendedor(a) recebe apenas uma licença limitada e não exclusiva para utilizar esses 
                materiais exclusivamente para revenda dos produtos oficiais, sendo proibida qualquer outra utilização.
              </p>
            </div>
          </section>

          {/* Rescisão */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Rescisão</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                O acesso à plataforma pode ser suspenso ou cancelado a qualquer momento, sem aviso prévio, 
                em caso de violação destes Termos ou por decisão administrativa.
              </p>
              <p>
                O(A) Revendedor(a) pode solicitar o cancelamento de sua conta a qualquer momento, 
                ficando responsável por concluir todas as vendas pendentes antes do encerramento.
              </p>
            </div>
          </section>

          {/* Disposições Gerais */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Disposições Gerais</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Estes Termos podem ser alterados a qualquer momento, sendo os usuários notificados 
                sobre mudanças significativas.
              </p>
              <p>
                Questões não previstas nestes Termos serão regidas pela legislação brasileira, 
                elegendo-se o foro da comarca da sede da Franqueadora.
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-purple-900 mb-2">Dúvidas ou Denúncias?</h2>
            <p className="text-purple-700 text-sm">
              Para dúvidas sobre estes termos ou para denunciar práticas irregulares de revendedores, 
              entre em contato conosco através dos canais oficiais disponíveis na plataforma.
            </p>
          </section>

        </div>

        {/* Link para Política de Privacidade */}
        <div className="mt-6 text-center">
          <Link 
            href="/privacidade" 
            className="text-purple-600 hover:underline font-medium"
          >
            Ver também: Política de Privacidade →
          </Link>
        </div>
      </main>
    </div>
  );
}
