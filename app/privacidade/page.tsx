"use client";
import Link from 'next/link';
import { ArrowLeft, Shield, Database, Eye, Lock, UserCheck, Trash2, Mail } from 'lucide-react';

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Política de Privacidade</h1>
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
              <Shield className="w-5 h-5 text-purple-600" />
              1. Introdução
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações 
                pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              <p>
                Ao utilizar nossa plataforma, você consente com a coleta e uso de dados conforme descrito 
                nesta política.
              </p>
            </div>
          </section>

          {/* Dados Coletados */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              2. Dados que Coletamos
            </h2>
            <div className="text-gray-600 space-y-4">
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Para Revendedores(as):</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Nome completo e CPF</li>
                  <li>Data de nascimento</li>
                  <li>Endereço completo (CEP, rua, número, bairro, cidade, estado)</li>
                  <li>Email e telefone</li>
                  <li>Redes sociais (Instagram, Facebook)</li>
                  <li>Nome da loja e informações comerciais</li>
                  <li>Dados de acesso (senha criptografada)</li>
                  <li>Histórico de pedidos e vendas</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Para Clientes Finais:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Nome completo</li>
                  <li>Endereço de entrega</li>
                  <li>Email e telefone</li>
                  <li>CPF (quando necessário para emissão de nota fiscal)</li>
                  <li>Histórico de compras</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Dados Coletados Automaticamente:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Endereço IP</li>
                  <li>Tipo de navegador e dispositivo</li>
                  <li>Páginas visitadas e tempo de permanência</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Uso dos Dados */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              3. Como Usamos seus Dados
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>Utilizamos seus dados para:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Criar e gerenciar sua conta na plataforma;</li>
                <li>Processar pedidos e transações;</li>
                <li>Calcular frete e realizar entregas;</li>
                <li>Enviar comunicações importantes sobre sua conta;</li>
                <li>Melhorar nossos serviços e experiência do usuário;</li>
                <li>Cumprir obrigações legais e regulatórias;</li>
                <li>Prevenir fraudes e atividades ilícitas;</li>
                <li>Gerar estatísticas anônimas sobre uso da plataforma.</li>
              </ul>
            </div>
          </section>

          {/* Compartilhamento */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              4. Compartilhamento de Dados
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Franqueadas:</strong> Para gestão de estoque e atendimento de pedidos;</li>
                <li><strong>Revendedores(as):</strong> Dados de clientes são visíveis apenas ao revendedor responsável pela venda;</li>
                <li><strong>Parceiros de pagamento:</strong> Mercado Pago e outros gateways para processamento de transações;</li>
                <li><strong>Transportadoras:</strong> Para cálculo de frete e entregas (Melhor Envio, Correios, etc.);</li>
                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial.</li>
              </ul>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-green-700 font-medium">
                  ✓ NÃO vendemos seus dados para terceiros para fins de marketing.
                </p>
              </div>
            </div>
          </section>

          {/* Segurança */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              5. Segurança dos Dados
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Criptografia de senhas e dados sensíveis;</li>
                <li>Conexão segura (HTTPS) em toda a plataforma;</li>
                <li>Acesso restrito aos dados por níveis de permissão;</li>
                <li>Backups regulares e proteção contra perda de dados;</li>
                <li>Monitoramento de atividades suspeitas.</li>
              </ul>
            </div>
          </section>

          {/* Retenção */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-600" />
              6. Retenção de Dados
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para 
                cumprir obrigações legais, resolver disputas ou fazer cumprir nossos acordos.
              </p>
              <p>
                Dados de transações financeiras são mantidos pelo período exigido pela legislação fiscal 
                (mínimo de 5 anos).
              </p>
            </div>
          </section>

          {/* Seus Direitos */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              7. Seus Direitos (LGPD)
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>De acordo com a LGPD, você tem direito a:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Confirmação:</strong> Saber se tratamos seus dados;</li>
                <li><strong>Acesso:</strong> Obter cópia dos seus dados;</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou desatualizados;</li>
                <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários;</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado;</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão de dados (quando aplicável);</li>
                <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento.</li>
              </ul>
            </div>
          </section>

          {/* Exclusão de Dados */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              8. Exclusão de Conta e Dados
            </h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Você pode solicitar a exclusão da sua conta e dados pessoais a qualquer momento. 
                Alguns dados poderão ser mantidos para cumprimento de obrigações legais.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Atenção:</strong> A exclusão é irreversível. Certifique-se de concluir todas as 
                  vendas pendentes antes de solicitar.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Cookies</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Utilizamos cookies essenciais para funcionamento da plataforma (autenticação, preferências) 
                e cookies analíticos para melhorar nossos serviços.
              </p>
              <p>
                Você pode gerenciar cookies através das configurações do seu navegador.
              </p>
            </div>
          </section>

          {/* Menores */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Menores de Idade</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente 
                dados de menores. Se identificarmos dados de menores, estes serão excluídos.
              </p>
            </div>
          </section>

          {/* Alterações */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Alterações nesta Política</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Esta política pode ser atualizada periodicamente. Alterações significativas serão 
                comunicadas através da plataforma ou por email.
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contato - Encarregado de Dados (DPO)
            </h2>
            <p className="text-purple-700 text-sm">
              Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados, 
              entre em contato através dos canais oficiais disponíveis na plataforma.
            </p>
          </section>

        </div>

        {/* Link para Termos de Uso */}
        <div className="mt-6 text-center">
          <Link 
            href="/termos" 
            className="text-purple-600 hover:underline font-medium"
          >
            ← Ver também: Termos de Uso
          </Link>
        </div>
      </main>
    </div>
  );
}
