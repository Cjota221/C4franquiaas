export default function LojaLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-12 w-32 bg-gray-200 rounded" />
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Banner Skeleton */}
      <div className="h-48 bg-gray-200" />

      {/* Categories */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-200 rounded-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
