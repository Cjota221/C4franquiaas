"use client";
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, AlertTriangle, Users, CreditCard, Lock, Scale, XCircle } from 'lucide-react';

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
          
          {/* Título e Última atualização */}
          <div className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Termos de Uso – Plataforma de Revenda</h1>
            <p className="text-sm text-gray-500">Última atualização: 29 de dezembro de 2025</p>
          </div>

          {/* 1. Introdução */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              1. Introdução
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Bem-vindo(a) à nossa plataforma de revenda (&quot;Plataforma&quot;).
              </p>
              <p>
                Estes Termos de Uso regulam o acesso e a utilização da Plataforma por franqueadas/revendedoras e por clientes finais.
              </p>
              <p>
                Ao se cadastrar como franqueada/revendedora ou utilizar qualquer funcionalidade da Plataforma, você declara que leu, compreendeu e concorda integralmente com estes Termos.
              </p>
            </div>
          </section>

          {/* 2. Definições */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              2. Definições
            </h2>
            <div className="text-gray-600 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Plataforma:</strong> sistema online de gestão de revendas e catálogos.</li>
                <li><strong>Franqueadora:</strong> empresa detentora da marca, do sistema e dos materiais oficiais.</li>
                <li><strong>Franqueada / Revendedora:</strong> pessoa física ou jurídica autorizada a revender produtos utilizando a Plataforma.</li>
                <li><strong>Cliente Final:</strong> consumidor que realiza pedidos por meio da loja da franqueada/revendedora.</li>
              </ul>
            </div>
          </section>

          {/* 3. Responsabilidades da Franqueada / Revendedora */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              3. Responsabilidades da Franqueada / Revendedora
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>A franqueada/revendedora é integral e diretamente responsável por:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Todas as ofertas e vendas realizadas por meio de sua loja.</li>
                <li>Veracidade e atualização dos dados de cadastro.</li>
                <li>Atendimento ao cliente final (dúvidas, prazos, trocas, cancelamentos, reembolsos).</li>
                <li>Emissão de notas fiscais, quando exigida pela legislação.</li>
                <li>Pagamento de impostos decorrentes de suas vendas.</li>
                <li>Respeito ao Código de Defesa do Consumidor e demais leis aplicáveis.</li>
                <li>Uso adequado de dados pessoais de clientes, conforme a LGPD.</li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-800 text-sm">
                  <strong>Importante:</strong> A franqueadora não participa da negociação individual entre franqueada e cliente final, atuando como fornecedora da Plataforma tecnológica e da estrutura de marca.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Uso Indevido, Golpes e Atividades Ilícitas */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              4. Uso Indevido, Golpes e Atividades Ilícitas
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>É <strong className="text-red-600">expressamente proibido</strong> utilizar a Plataforma para:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Aplicar golpes ou fraudes contra clientes, franqueadas ou terceiros.</li>
                <li>Coletar pagamentos e não entregar produtos ou serviços.</li>
                <li>Divulgar ofertas enganosas ou promessas que não serão cumpridas.</li>
                <li>Utilizar dados de clientes para finalidades não autorizadas.</li>
                <li>Envolver a Plataforma em esquemas de pirâmide, correntes financeiras, produtos falsificados ou de origem ilícita.</li>
              </ul>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-700 font-medium mb-2">
                  Consequências em caso de suspeita ou confirmação de má-fé:
                </p>
                <p className="text-red-600 text-sm mb-2">
                  A franqueadora poderá, a seu exclusivo critério e sem prejuízo das medidas legais cabíveis:
                </p>
                <ul className="list-disc pl-5 text-red-600 text-sm space-y-1">
                  <li>Suspender ou cancelar imediatamente o acesso da franqueada/revendedora à Plataforma.</li>
                  <li>Bloquear temporariamente funcionalidades da conta para investigação interna.</li>
                  <li>Compartilhar dados e registros de acesso com autoridades competentes, mediante requisição legal.</li>
                  <li>Comunicar clientes potencialmente afetados sobre o risco ou ocorrência de golpes, quando necessário para sua proteção.</li>
                </ul>
              </div>

              <p className="text-gray-600 text-sm mt-4">
                A franqueada/revendedora responde direta e individualmente por todos os danos que causar a clientes, a outros revendedores e à imagem da marca, inclusive por atos de seus prepostos ou auxiliares.
              </p>
            </div>
          </section>

          {/* 5. Limitação de Responsabilidade da Franqueadora */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              5. Limitação de Responsabilidade da Franqueadora
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>A franqueadora:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Não recebe valores em nome das franqueadas/revendedoras nem administra saldos das vendas, salvo se isto estiver expressamente previsto em contrato específico.</li>
                <li>Não garante o cumprimento de obrigações assumidas individualmente por franqueadas/revendedoras perante clientes (prazos de entrega, combinações particulares, brindes, descontos extras, etc.).</li>
              </ul>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  Contudo, em respeito ao Código de Defesa do Consumidor e à legislação vigente, a franqueadora poderá ser chamada a responder solidariamente em determinadas situações. Nestes casos, reserva-se o direito de exercer direito de regresso contra a franqueada/revendedora responsável pelo dano e encerrar ou restringir definitivamente o acesso da franqueada à Plataforma.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Pagamentos e Transações */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              6. Pagamentos e Transações
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Os pagamentos realizados pelos clientes finais são processados diretamente pelas franqueadas/revendedoras, por meio de meios de pagamento por elas configurados (PIX, cartões, carteiras digitais, etc.).
              </p>
              <p>
                A configuração e a gestão das contas de recebimento são de responsabilidade exclusiva da franqueada/revendedora.
              </p>
              <p>
                Eventuais cobranças indevidas, duplicidades, estornos ou falhas de entrega devem ser tratados entre franqueada e cliente final, com suporte da franqueadora apenas naquilo que envolver o funcionamento da Plataforma.
              </p>
            </div>
          </section>

          {/* 7. Propriedade Intelectual */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              7. Propriedade Intelectual
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Todo o conteúdo da Plataforma (marca, logotipos, layouts, textos, imagens oficiais de produtos, vídeos institucionais e código-fonte) pertence exclusivamente à franqueadora ou é por ela licenciado.
              </p>
              <p>
                A franqueada/revendedora recebe uma licença limitada, revogável e não exclusiva para usar tais materiais apenas para divulgação e venda dos produtos oficiais.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-800 font-medium mb-2">É proibido:</p>
                <ul className="list-disc pl-5 text-amber-700 text-sm space-y-1">
                  <li>Usar a marca para vender produtos de terceiros que não sejam autorizados.</li>
                  <li>Copiar, modificar ou redistribuir o sistema ou o layout como se fossem próprios.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. Suspensão e Encerramento de Conta */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              8. Suspensão e Encerramento de Conta
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>A franqueadora poderá suspender ou encerrar o acesso à Plataforma, a qualquer tempo, em caso de:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violação destes Termos.</li>
                <li>Suspeita de golpe, fraude, uso indevido da marca ou reclamações recorrentes de clientes.</li>
                <li>Determinação de órgãos reguladores ou ordem judicial.</li>
              </ul>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <p className="text-gray-700 text-sm">
                  A franqueada/revendedora pode solicitar o encerramento de sua conta, ficando responsável por concluir pedidos em aberto e honrar compromissos assumidos com clientes antes do encerramento.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Disposições Gerais */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-600" />
              9. Disposições Gerais
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Estes Termos podem ser alterados periodicamente. Versões atualizadas serão publicadas na Plataforma, e o uso continuado após a atualização implica concordância com as novas condições.
              </p>
              <p>
                Situações não previstas serão resolvidas conforme a legislação brasileira aplicável.
              </p>
              <p>
                Para eventuais disputas com franqueadas/revendedoras, fica eleito o foro da sede da franqueadora, salvo disposições legais em contrário que assegurem foro diverso ao consumidor final.
              </p>
            </div>
          </section>

          {/* Footer - Aceitação */}
          <div className="border-t pt-6 text-center">
            <p className="text-gray-600 text-sm">
              Ao utilizar a Plataforma, você confirma que leu e aceita integralmente estes Termos de Uso.
            </p>
          </div>

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
