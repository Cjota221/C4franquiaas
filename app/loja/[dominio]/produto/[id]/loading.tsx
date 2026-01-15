export default function ProdutoLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-48" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagem */}
          <div className="aspect-square bg-gray-200 rounded-lg" />

          {/* Info */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>

            <div className="pt-6 flex gap-4">
              <div className="h-12 bg-gray-200 rounded flex-1" />
              <div className="h-12 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
