import { useState, useCallback, useEffect, useRef } from 'react'
import { searchGamesWithPrices, formatPrice, getFullGameInfo } from '../api/itad'
import { useGameStore } from '../hooks/useGameStore.jsx'

export default function SearchBar({ onResults, onSelectGame, onClearSearch, isSearchActive, inputRef }) {
  const { addGame, isGameInCollection } = useGameStore()
  const [addingGameId, setAddingGameId] = useState(null) // Track which game is being added
  
  // Function to add game with full details
  const handleQuickAdd = async (game) => {
    if (isGameInCollection(game.id)) return
    
    setAddingGameId(game.id)
    try {
      // Try to fetch full game details, but don't let it block adding
      let gameToAdd = { ...game }
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
        const fullDetails = await Promise.race([
          getFullGameInfo(game.id),
          timeoutPromise
        ])
        
        // Only add extra fields if we got them
        if (fullDetails) {
          gameToAdd = {
            ...game,
            metacritic: fullDetails.metacritic ?? game.metacritic,
            steamRating: fullDetails.steamRating ?? game.steamRating,
            developers: fullDetails.developers || game.developers,
            publishers: fullDetails.publishers || game.publishers,
            releaseDate: fullDetails.releaseDate || game.releaseDate,
            tags: fullDetails.tags || game.tags,
            reviews: fullDetails.reviews || game.reviews,
            deals: fullDetails.deals,
            historyLow: fullDetails.historyLow,
            urls: fullDetails.urls,
          }
        }
      } catch (fetchErr) {
        console.warn('Could not fetch full details:', fetchErr)
        // Continue with basic game data
      }
      
      // Always add the game
      addGame(gameToAdd)
    } catch (err) {
      console.error('Failed to add game:', err)
      // Last resort fallback
      addGame(game)
    } finally {
      setAddingGameId(null)
    }
  }
  
  const [query, setQuery] = useState('')
  
  // Clear query when search is no longer active (user returned to homepage)
  useEffect(() => {
    if (!isSearchActive) {
      setQuery('')
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [isSearchActive])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState(null)
  
  const localInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceRef = useRef(null)
  const searchSubmittedRef = useRef(false) // Track if search was submitted
  
  // Combine local ref with passed ref
  const setInputRef = (el) => {
    localInputRef.current = el
    if (inputRef) inputRef.current = el
  }

  // Fetch suggestions as user types
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Don't fetch suggestions if search was just submitted
    if (searchSubmittedRef.current) {
      return
    }

    if (query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      // Double-check in case search was submitted during debounce
      if (searchSubmittedRef.current) return
      
      setLoading(true)
      try {
        const data = await searchGamesWithPrices(query, 8)
        
        // Don't show if search was submitted while fetching
        if (searchSubmittedRef.current) return
        
        // Filter to only show games (not DLC) and sort by those with prices first
        const filtered = data
          .filter(g => g.type === 'game' || !g.type)
          .sort((a, b) => {
            // Games with prices first
            if (a.currentPrice && !b.currentPrice) return -1
            if (!a.currentPrice && b.currentPrice) return 1
            return 0
          })
        
        setSuggestions(filtered.slice(0, 6))
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (err) {
        console.error('Search error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        !localInputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleFullSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          handleFullSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectSuggestion = (game) => {
    setShowSuggestions(false)
    setQuery(game.name)
    onSelectGame(game)
  }

  const handleFullSearch = async () => {
    if (!query.trim()) return
    
    // Mark search as submitted to prevent suggestions from reappearing
    searchSubmittedRef.current = true
    
    // Cancel any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Hide and clear suggestions when performing full search
    setShowSuggestions(false)
    setSuggestions([])
    setLoading(true)
    setError(null)

    try {
      const data = await searchGamesWithPrices(query, 30)
      
      // Filter to only show games (not DLC)
      const filtered = data.filter(g => g.type === 'game' || !g.type)
      
      onResults(filtered)
    } catch (err) {
      setError(err.message)
      onResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setError(null)
    onClearSearch()
  }

  return (
    <div className="mt-6 relative">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            ref={setInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              searchSubmittedRef.current = false // Reset flag when typing
              setQuery(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Only show suggestions if there are any (won't be after a search was performed)
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            placeholder="Search for games..."
            className="w-full pl-12 pr-10 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all"
            autoComplete="off"
          />
          {loading && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl z-50 animate-fade-in max-h-[70vh] overflow-y-auto"
            >
              {suggestions.map((game, index) => {
                const inCollection = isGameInCollection(game.id)
                return (
                  <div
                    key={game.id}
                    className={`flex items-center gap-3 p-3 transition-colors ${
                      index === selectedIndex 
                        ? 'bg-primary-600/20' 
                        : 'hover:bg-dark-800'
                    }`}
                  >
                    {/* Clickable area for game details */}
                    <button
                      onClick={() => handleSelectSuggestion(game)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-800 flex-shrink-0">
                        {game.coverImage ? (
                          <img 
                            src={game.coverImage} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Game Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark-100 truncate">{game.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {game.shopName && (
                            <span className="text-dark-500">{game.shopName}</span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      {game.currentPrice && (
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-400">
                            {formatPrice(game.currentPrice.amount, game.currentPrice.currency)}
                          </p>
                          {game.cut > 0 && (
                            <p className="text-xs text-dark-500">-{game.cut}%</p>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Add to Collection Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!inCollection && addingGameId !== game.id) {
                          handleQuickAdd(game)
                        }
                      }}
                      disabled={inCollection || addingGameId === game.id}
                      className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                        inCollection 
                          ? 'bg-green-600/20 text-green-400 cursor-default' 
                          : addingGameId === game.id
                            ? 'bg-primary-600/50 text-white cursor-wait'
                            : 'bg-primary-600 hover:bg-primary-500 text-white'
                      }`}
                      title={inCollection ? 'In collection' : addingGameId === game.id ? 'Adding...' : 'Add to collection'}
                    >
                      {inCollection ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : addingGameId === game.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}

              {/* View All Results */}
              <button
                onClick={handleFullSearch}
                className="w-full p-3 text-center text-primary-400 hover:bg-dark-800 border-t border-dark-700 text-sm font-medium"
              >
                View all results for "{query}"
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleFullSearch}
          disabled={loading || !query.trim()}
          className="btn-primary px-4 sm:px-6 flex items-center gap-2 shrink-0"
        >
          <span className="hidden sm:inline">Search</span>
          <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
