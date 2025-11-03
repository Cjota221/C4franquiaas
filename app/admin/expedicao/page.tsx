export const metadata = {
  title: 'Expedição - Painel Admin',
  description: 'Gerenciamento de pedidos e expedição',
};

export default function ExpedicaoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Módulo de Expedição</h1>
        <p className="text-gray-600 mt-2">
          Sistema de separação, embalagem e envio de pedidos
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h2 className="font-bold text-yellow-800 mb-2"> Configuração Necessária</h2>
        <p className="text-yellow-700 mb-4">
          Para usar o módulo de expedição, você precisa:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-yellow-700">
          <li>Aplicar a migração SQL no banco de dados (arquivo: migrations/create_expedicao_tables.sql)</li>
          <li>Configurar o token do Melhor Envio em /admin/configuracoes/melhorenvio</li>
          <li>Ter pedidos cadastrados no sistema</li>
        </ol>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
             Pipeline de Pedidos
          </h3>
          <p className="text-gray-600 mb-4">
            Visualização Kanban dos pedidos em processo de separação e envio
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
              <span>Aguardando Separação</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span>Em Separação</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Pronto para Envio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span>Aguardando Postagem</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Com Problemas</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
             Interface de Separação
          </h3>
          <p className="text-gray-600 mb-4">
            Sistema guiado para conferência item por item
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li> Scanner de código de barras</li>
            <li> Validação automática</li>
            <li> Fotos dos produtos</li>
            <li> Localização no estoque</li>
            <li> Timer de produtividade</li>
          </ul>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
             Geração de Etiquetas
          </h3>
          <p className="text-gray-600 mb-4">
            Integração com Melhor Envio para etiquetas de envio
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li> Múltiplas transportadoras</li>
            <li> Cálculo automático de frete</li>
            <li> Impressão de etiquetas</li>
            <li> Código de rastreio</li>
          </ul>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
             Rastreamento
          </h3>
          <p className="text-gray-600 mb-4">
            Acompanhamento em tempo real das entregas
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li> Webhook automático</li>
            <li> Timeline de eventos</li>
            <li> Notificações de status</li>
            <li> Dashboard de métricas</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-800 mb-3 text-lg"> Como Aplicar a Migração SQL</h3>
        <ol className="list-decimal list-inside space-y-3 text-blue-700">
          <li>
            <strong>Acesse o SQL Editor do Supabase:</strong>
            <br />
            <a 
              href="https://supabase.com/dashboard/project/rprucmoavblepodvanga/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-6 text-sm"
            >
              https://supabase.com/dashboard/project/rprucmoavblepodvanga/sql/new
            </a>
          </li>
          <li>
            <strong>Copie o SQL:</strong> Abra o arquivo{' '}
            <code className="bg-blue-100 px-2 py-1 rounded text-sm">
              migrations/create_expedicao_tables.sql
            </code>{' '}
            e copie todo o conteúdo
          </li>
          <li>
            <strong>Cole e Execute:</strong> Cole no SQL Editor e clique em <strong>RUN</strong>
          </li>
          <li>
            <strong>Verifique:</strong> Execute{' '}
            <code className="bg-blue-100 px-2 py-1 rounded text-sm block mt-2 ml-6">
              SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%expedicao%';
            </code>
            <span className="ml-6 text-sm">Você deve ver 5 tabelas criadas</span>
          </li>
        </ol>
      </div>

      <div className="mt-6 border-l-4 border-green-500 bg-green-50 p-4 rounded">
        <p className="text-green-800">
          <strong> Dica:</strong> Após aplicar a migração SQL, esta página será atualizada automaticamente 
          com o Pipeline Kanban completo mostrando os pedidos em tempo real!
        </p>
      </div>
    </div>
  );
}
