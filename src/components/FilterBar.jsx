export default function FilterBar({ filters, onFiltersChange }) {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      {/* Sort By */}
      <div className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 px-2 sm:px-3 py-2 rounded-xl transition-all cursor-pointer">
        <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="bg-transparent text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
        >
          <option value="addedAt" className="bg-dark-900">Date Added</option>
          <option value="priority" className="bg-dark-900">Priority</option>
          <option value="name" className="bg-dark-900">Name</option>
          <option value="rating" className="bg-dark-900">Steam Rating</option>
          <option value="metacritic" className="bg-dark-900">Metacritic</option>
        </select>
      </div>

      {/* Sort Order */}
      <button
        onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
        className="flex items-center gap-1 sm:gap-1.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm text-dark-200 hover:text-white transition-all shrink-0"
        title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      >
        {filters.sortOrder === 'asc' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        <span className="hidden sm:inline">{filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
      </button>
    </div>
  )
}
