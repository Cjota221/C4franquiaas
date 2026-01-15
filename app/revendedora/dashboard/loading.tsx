export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-64" />
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-10 bg-gray-200 rounded w-16" />
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Banner Skeleton */}
      <div className="bg-gradient-to-r from-pink-200 to-purple-200 rounded-lg p-6 h-40" />

      {/* Steps Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-72" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
