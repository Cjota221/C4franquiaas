export default function ExpedicaoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Módulo de Expedição</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Migração Necessária</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Para utilizar o módulo de expedição, você precisa aplicar a migração SQL primeiro.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Como aplicar a migração:</h2>
        
        <ol className="list-decimal list-inside space-y-4">
          <li className="text-gray-700">
            Acesse o Supabase SQL Editor:
            <a 
              href="https://supabase.com/dashboard/project/rprucmoavblepodvanga/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline ml-2"
            >
              Abrir SQL Editor
            </a>
          </li>
          
          <li className="text-gray-700">
            Abra o arquivo da migração localizado em:
            <code className="bg-gray-100 px-2 py-1 rounded text-sm block mt-2 ml-6">
              migrations/create_expedicao_tables.sql
            </code>
          </li>
          
          <li className="text-gray-700">
            Copie todo o conteúdo do arquivo e cole no SQL Editor do Supabase
          </li>
          
          <li className="text-gray-700">
            Execute a query clicando em RUN
          </li>
          
          <li className="text-gray-700">
            Verifique se as tabelas foram criadas com sucesso executando:
            <code className="bg-blue-100 px-2 py-1 rounded text-sm block mt-2 ml-6">
              {SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%expedicao%';}
            </code>
          </li>
        </ol>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-sm font-medium text-green-800 mb-2">Após aplicar a migração:</h3>
          <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
            <li>Novas colunas serão adicionadas à tabela de pedidos</li>
            <li>5 novas tabelas serão criadas para gerenciar a expedição</li>
            <li>Configurações de transportadoras padrão serão inseridas</li>
            <li>Índices serão criados para otimizar performance</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sobre o Módulo de Expedição</h2>
        <p className="text-gray-700 mb-4">
          O módulo de expedição permite gerenciar todo o processo de separação, 
          empacotamento e envio de pedidos.
        </p>
        
        <h3 className="text-lg font-medium mb-2">Funcionalidades:</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
          <li>Separação de itens por pedido</li>
          <li>Controle de rastreamento de envios</li>
          <li>Configuração de transportadoras</li>
          <li>Registro de eventos de rastreamento</li>
          <li>Logs de ações do usuário</li>
          <li>Métricas de desempenho da expedição</li>
        </ul>
      </div>

      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Arquivo da Migração</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Caminho completo: <code className="bg-blue-100 px-1 rounded">C:\Users\carol\c4-franquias-admin\migrations\create_expedicao_tables.sql</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
