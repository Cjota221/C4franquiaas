export default function AdminProdutosLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-56" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-36" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg border">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="h-10 bg-gray-200 rounded w-48" />
        <div className="h-10 bg-gray-200 rounded w-36" />
        <div className="h-10 bg-gray-200 rounded w-36" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="h-12 bg-gray-100 border-b" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <div className="w-16 h-16 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
