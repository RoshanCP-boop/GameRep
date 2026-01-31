// IsThereAnyDeal API Client
// Docs: https://docs.isthereanydeal.com/

const API_KEY = import.meta.env.VITE_ITAD_API_KEY || '11d51c81db36a0b37ce73b6a8a84592b1458d53c'
const BASE_URL = 'https://api.isthereanydeal.com'

// Use allorigins proxy which works in production
async function fetchWithCors(url, options = {}) {
  // allorigins.win is a free CORS proxy that works in production
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  
  const response = await fetch(proxyUrl, options)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API Error: ${response.status} - ${text}`)
  }
  return response.json()
}

// Storage key for country preference
const COUNTRY_STORAGE_KEY = 'gamerep-country'

// Helper to deduplicate similar company names (e.g., "FromSoftware, Inc." vs "FromSoftware Inc.")
function deduplicateNames(names) {
  if (!names || names.length === 0) return []
  
  // Normalize a name for comparison
  const normalize = (name) => {
    return name
      .toLowerCase()
      .replace(/[,.\-_]/g, '') // Remove punctuation
      .replace(/\s+(inc|llc|ltd|corp|entertainment|us|games|studio|studios)$/i, '') // Remove common suffixes
      .replace(/\s+/g, '') // Remove all spaces
      .trim()
  }
  
  const seen = new Map() // normalized -> original name
  
  for (const name of names) {
    const normalized = normalize(name)
    if (!seen.has(normalized)) {
      // Prefer shorter, cleaner names
      seen.set(normalized, name)
    } else {
      // Keep the shorter version
      const existing = seen.get(normalized)
      if (name.length < existing.length) {
        seen.set(normalized, name)
      }
    }
  }
  
  return [...seen.values()]
}

// Load country from localStorage or default to India
function loadCountry() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(COUNTRY_STORAGE_KEY) || 'IN'
  }
  return 'IN'
}

let currentCountry = loadCountry()

export function setCountry(countryCode) {
  currentCountry = countryCode
  if (typeof window !== 'undefined') {
    localStorage.setItem(COUNTRY_STORAGE_KEY, countryCode)
  }
}

export function getCountry() {
  return currentCountry
}

// Supported countries with their currencies
export const COUNTRIES = {
  'IN': { name: 'India', currency: 'INR', symbol: '₹' },
  'US': { name: 'United States', currency: 'USD', symbol: '$' },
  'GB': { name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  'EU': { name: 'Europe', currency: 'EUR', symbol: '€' },
  'CA': { name: 'Canada', currency: 'CAD', symbol: 'C$' },
  'AU': { name: 'Australia', currency: 'AUD', symbol: 'A$' },
  'BR': { name: 'Brazil', currency: 'BRL', symbol: 'R$' },
  'RU': { name: 'Russia', currency: 'RUB', symbol: '₽' },
  'JP': { name: 'Japan', currency: 'JPY', symbol: '¥' },
}

/**
 * Search for games by title
 */
export async function searchGames(query, limit = 20) {
  if (!query.trim()) return []
  
  const params = new URLSearchParams({
    key: API_KEY,
    title: query,
    results: limit.toString(),
  })
  
  const data = await fetchWithCors(`${BASE_URL}/games/search/v1?${params}`)
  
  return data.map(game => ({
    id: game.id,
    slug: game.slug,
    name: game.title,
    type: game.type, // 'game' or 'dlc'
    coverImage: game.assets?.boxart || game.assets?.banner400 || game.assets?.banner300,
    bannerImage: game.assets?.banner600 || game.assets?.banner400,
  }))
}

/**
 * Get game info
 */
export async function getGameInfo(gameId) {
  const params = new URLSearchParams({
    key: API_KEY,
    id: gameId,
  })
  
  return fetchWithCors(`${BASE_URL}/games/info/v2?${params}`)
}

/**
 * Get prices for games
 */
export async function getGamePrices(gameIds, country = currentCountry) {
  const params = new URLSearchParams({
    key: API_KEY,
    country: country,
  })
  
  return fetchWithCors(`${BASE_URL}/games/prices/v3?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Array.isArray(gameIds) ? gameIds : [gameIds]),
  })
}

/**
 * Get price overview for games
 */
export async function getPriceOverview(gameIds, country = currentCountry) {
  const params = new URLSearchParams({
    key: API_KEY,
    country: country,
  })
  
  return fetchWithCors(`${BASE_URL}/games/overview/v2?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Array.isArray(gameIds) ? gameIds : [gameIds]),
  })
}

/**
 * Get current deals
 */
export async function getDeals(options = {}) {
  const params = new URLSearchParams({
    key: API_KEY,
    country: options.country || currentCountry,
    limit: (options.limit || 20).toString(),
    offset: (options.offset || 0).toString(),
  })
  
  if (options.sort) params.append('sort', options.sort)
  
  return fetchWithCors(`${BASE_URL}/deals/v2?${params}`)
}

/**
 * Get list of shops
 */
export async function getShops() {
  const params = new URLSearchParams({
    key: API_KEY,
  })
  
  return fetchWithCors(`${BASE_URL}/shops/v1?${params}`)
}

// Cache for shops
let shopsCache = null

export async function getShopsWithCache() {
  if (shopsCache) return shopsCache
  shopsCache = await getShops()
  return shopsCache
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount, currency) {
  if (amount === 0) return 'FREE'
  
  const countryData = Object.values(COUNTRIES).find(c => c.currency === currency)
  const symbol = countryData?.symbol || currency + ' '
  
  // Format based on currency
  if (currency === 'INR') {
    return `${symbol}${Math.round(amount)}`
  }
  
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Get full game info with prices
 */
export async function getFullGameInfo(gameId) {
  const [info, pricesData] = await Promise.all([
    getGameInfo(gameId),
    getGamePrices([gameId]),
  ])
  
  const prices = pricesData[0] || {}
  
  return {
    id: info.id,
    slug: info.slug,
    name: info.title,
    type: info.type,
    coverImage: info.assets?.boxart || info.assets?.banner600,
    bannerImage: info.assets?.banner600,
    releaseDate: info.releaseDate,
    developers: deduplicateNames(info.developers?.map(d => d.name) || []),
    publishers: deduplicateNames(info.publishers?.map(p => p.name) || []),
    tags: info.tags || [],
    reviews: info.reviews || [],
    steamRating: info.reviews?.find(r => r.source === 'Steam')?.score,
    metacritic: info.reviews?.find(r => r.source === 'Metascore')?.score,
    historyLow: prices.historyLow?.all,
    deals: prices.deals?.map(deal => ({
      shopId: deal.shop.id,
      shopName: deal.shop.name,
      price: deal.price,
      regularPrice: deal.regular,
      cut: deal.cut,
      url: deal.url,
      platforms: deal.platforms?.map(p => p.name) || [],
      drm: deal.drm?.map(d => d.name) || [],
      timestamp: deal.timestamp,
      expiry: deal.expiry,
    })) || [],
    urls: info.urls,
  }
}

/**
 * Search games and get prices in one call
 */
export async function searchGamesWithPrices(query, limit = 15) {
  if (!query.trim()) return []
  
  // First search for games
  const games = await searchGames(query, limit)
  
  if (games.length === 0) return []
  
  // Get prices for all found games
  const gameIds = games.map(g => g.id)
  const pricesData = await getPriceOverview(gameIds)
  
  // Merge prices with game data
  const pricesMap = {}
  pricesData.prices?.forEach(p => {
    pricesMap[p.id] = p
  })
  
  return games.map(game => {
    const priceInfo = pricesMap[game.id]
    return {
      ...game,
      currentPrice: priceInfo?.current?.price,
      regularPrice: priceInfo?.current?.regular,
      cut: priceInfo?.current?.cut || 0,
      shopName: priceInfo?.current?.shop?.name,
      shopId: priceInfo?.current?.shop?.id,
      historyLow: priceInfo?.lowest?.price,
      dealUrl: priceInfo?.current?.url,
    }
  })
}
