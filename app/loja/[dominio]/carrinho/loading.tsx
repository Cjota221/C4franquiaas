export default function CarrinhoLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-32" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Itens do Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-lg p-6 h-fit space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="h-12 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
