/**
 * Sort games based on filter settings
 */
export function sortGames(games, sortBy, sortOrder) {
  const sorted = [...games].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'rating':
        comparison = (a.steamRating || a.metacritic || 0) - (b.steamRating || b.metacritic || 0)
        break
      case 'metacritic':
        comparison = (a.metacritic || 0) - (b.metacritic || 0)
        break
      case 'priority':
        comparison = (a.priority || 0) - (b.priority || 0)
        break
      case 'released':
        comparison = new Date(a.released || 0) - new Date(b.released || 0)
        break
      case 'customOrder':
        comparison = (a.customOrder || 0) - (b.customOrder || 0)
        break
      case 'addedAt':
      default:
        comparison = new Date(a.addedAt || 0) - new Date(b.addedAt || 0)
        break
    }
    
    return sortOrder === 'desc' ? -comparison : comparison
  })
  
  return sorted
}

/**
 * Filter games based on filter settings
 */
export function filterGames(games, filters) {
  return games.filter(game => {
    // Filter by minimum rating (using Steam rating percentage)
    if (filters.minRating > 0) {
      const rating = game.steamRating || game.metacritic || 0
      if (rating < filters.minRating) return false
    }
    
    // Filter by tag
    if (filters.tag && filters.tag !== '') {
      if (!game.tags || !game.tags.includes(filters.tag)) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Apply both sorting and filtering
 */
export function applyFiltersAndSort(games, filters) {
  const filtered = filterGames(games, filters)
  return sortGames(filtered, filters.sortBy, filters.sortOrder)
}

/**
 * Get unique tags from a list of games
 */
export function getUniqueTags(games) {
  const tags = new Set()
  games.forEach(game => {
    (game.tags || []).forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

/**
 * Get unique platforms from a list of games
 */
export function getUniquePlatforms(games) {
  const platforms = new Set()
  games.forEach(game => {
    (game.platforms || []).forEach(platform => platforms.add(platform))
  })
  return Array.from(platforms).sort()
}
