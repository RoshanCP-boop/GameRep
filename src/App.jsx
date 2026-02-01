import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GameStoreProvider } from './hooks/useGameStore.jsx'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TabNav from './components/TabNav'
import GameList from './components/GameList'
import GameDetails from './components/GameDetails'
import FilterBar from './components/FilterBar'
import StatsPanel from './components/StatsPanel'
import RandomPickerPanel from './components/RandomPickerPanel'
import { getCountry, setCountry, COUNTRIES } from './api/itad'

function MainApp() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('unplayed')
  const [selectedGame, setSelectedGame] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [showRandomPicker, setShowRandomPicker] = useState(false)
  const [collectionSearch, setCollectionSearch] = useState('')
  const [currentCountry, setCurrentCountry] = useState(getCountry())
  const [viewModes, setViewModes] = useState({ unplayed: 'grid', played: 'grid' }) // per-tab view modes
  
  // Get current view mode for active tab
  const viewMode = viewModes[activeTab] || 'grid'
  const setViewMode = (mode) => setViewModes(prev => ({ ...prev, [activeTab]: mode }))
  const [filters, setFilters] = useState({
    sortBy: 'priority',
    sortOrder: 'desc',
    minRating: 0,
  })
  
  const searchInputRef = useRef(null)

  // Handle opening game details with history
  const handleSelectGame = (game) => {
    setSelectedGame(game)
    window.history.pushState({ modal: 'game', gameId: game.id }, '')
  }

  // Handle closing game details
  const handleCloseGame = () => {
    setSelectedGame(null)
  }

  // Handle search results with history
  const handleSearchResults = (results) => {
    if (results && results.length > 0) {
      window.history.pushState({ view: 'search' }, '')
    }
    setSearchResults(results)
  }

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchResults(null)
  }

  // Listen for browser back button
  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state
      
      // If going back to search view, just close the modal
      if (state?.view === 'search') {
        setSelectedGame(null)
      }
      // If going back to home (no state), close modal and clear search
      else {
        setSelectedGame(null)
        setSearchResults(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      
      if (e.key === 'Escape') {
        if (showRandomPicker) {
          setShowRandomPicker(false)
        } else if (showStats) {
          setShowStats(false)
        } else if (selectedGame) {
          window.history.back()
        }
      }
      
      if (isTyping) return
      
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      if (e.key === 'd' || e.key === 'D') {
        setShowStats(prev => !prev)
      }
      
      if (e.key === 'r' || e.key === 'R') {
        setShowRandomPicker(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGame, showStats, showRandomPicker])

  return (
    <div className="min-h-screen bg-dark-950">
      <Header 
        onOpenStats={() => setShowStats(true)} 
        onOpenRandomPicker={() => setShowRandomPicker(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <SearchBar 
          onResults={handleSearchResults} 
          onSelectGame={handleSelectGame}
          onClearSearch={handleClearSearch}
          isSearchActive={searchResults !== null}
          inputRef={searchInputRef}
        />
        
        {searchResults ? (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                  title="Back to collection"
                >
                  <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-dark-100">
                  Search Results ({searchResults.length})
                </h2>
              </div>
              <button 
                onClick={() => {
                  handleClearSearch()
                  window.history.back()
                }}
                className="btn-ghost text-sm"
              >
                Clear Search
              </button>
            </div>
            <GameList 
              games={searchResults} 
              onSelectGame={handleSelectGame}
              isSearchResults={true}
              viewMode={viewMode}
            />
          </div>
        ) : (
          <>
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            
            {/* Filter Bar with Collection Search and View Mode */}
            <div className="mt-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              {/* Collection Search */}
              <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  placeholder="Search collection..."
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all"
                />
                {collectionSearch && (
                  <button
                    onClick={() => setCollectionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Filters row - all on one line on mobile */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:flex-1">
                <FilterBar filters={filters} onFiltersChange={setFilters} />
                
                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-dark-900/50 p-1 rounded-xl sm:ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-dark-800 text-dark-100' : 'text-dark-500 hover:text-dark-300'}`}
                  title="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('covers')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'covers' ? 'bg-dark-800 text-dark-100' : 'text-dark-500 hover:text-dark-300'}`}
                  title="Cover art view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-dark-800 text-dark-100' : 'text-dark-500 hover:text-dark-300'}`}
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                </div>
              
                {/* Region selector for mobile/tablet - only for non-authenticated users, hidden on xl+ where header shows it */}
                {!isAuthenticated && (
                  <div className="xl:hidden flex items-center gap-1.5 bg-dark-800 border border-dark-700 px-2 py-1.5 rounded-xl">
                    <svg className="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <select
                      value={currentCountry}
                      onChange={(e) => {
                        setCountry(e.target.value)
                        setCurrentCountry(e.target.value)
                        window.location.reload()
                      }}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {Object.entries(COUNTRIES).map(([code, info]) => (
                        <option key={code} value={code} className="bg-dark-900">
                          {info.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <GameList 
              activeTab={activeTab}
              filters={filters}
              onSelectGame={handleSelectGame}
              collectionSearch={collectionSearch}
              viewMode={viewMode}
            />
          </>
        )}
      </main>

      {selectedGame && selectedGame.id && (
        <GameDetails 
          game={selectedGame} 
          onClose={() => {
            // Just go back - popstate handler will clear selectedGame
            window.history.back()
          }}
        />
      )}

      <StatsPanel 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
      />

      <RandomPickerPanel
        isOpen={showRandomPicker}
        onClose={() => setShowRandomPicker(false)}
        onSelectGame={(game) => {
          setShowRandomPicker(false)
          handleSelectGame(game)
        }}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <GameStoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameStoreProvider>
    </AuthProvider>
  )
}

export default App
