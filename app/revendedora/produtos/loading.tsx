export default function ProdutosLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-200 rounded w-40 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-64" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded w-24" />
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border overflow-hidden">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
