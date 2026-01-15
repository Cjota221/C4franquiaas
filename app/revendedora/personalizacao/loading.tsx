export default function PersonalizacaoLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-56 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-80" />
      </div>

      {/* Form Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Card 1 - Identidade */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-40" />
          
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
          
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
          
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>

        {/* Card 2 - Cores */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-10 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
