import { useMemo } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import { useGameStore } from '../hooks/useGameStore.jsx'
import { applyFiltersAndSort } from '../utils/sorting'
import GameCard from './GameCard'
import GameCardList from './GameCardList'

export default function GameList({ 
  games, 
  activeTab, 
  filters, 
  onSelectGame, 
  isSearchResults = false,
  collectionSearch = '',
  viewMode = 'grid'
}) {
  const { games: storedGames, reorderGames, getGame } = useGameStore()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get games to display
  const displayGames = useMemo(() => {
    if (isSearchResults && games) {
      return games
    }
    
    // Filter by tab status
    let tabGames = storedGames.filter(g => g.status === activeTab)
    
    // Filter by collection search
    if (collectionSearch.trim()) {
      const search = collectionSearch.toLowerCase()
      tabGames = tabGames.filter(g => 
        g.name.toLowerCase().includes(search) ||
        g.notes?.toLowerCase().includes(search)
      )
    }
    
    // Apply filters and sorting
    if (filters) {
      return applyFiltersAndSort(tabGames, filters)
    }
    
    return tabGames
  }, [games, storedGames, activeTab, filters, isSearchResults, collectionSearch])

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      // Only allow reordering within same priority
      const activeGame = getGame(active.id)
      const overGame = getGame(over.id)
      
      if (activeGame?.priority === overGame?.priority) {
        reorderGames(active.id, over.id)
      }
    }
  }

  // Enable dragging when sorted by priority (within same priority groups)
  const isDraggable = !isSearchResults && filters?.sortBy === 'priority'

  if (displayGames.length === 0) {
    return (
      <div className="mt-8 text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-dark-300">
          {isSearchResults ? 'No games found' : collectionSearch ? 'No matching games' : 'No games yet'}
        </h3>
        <p className="mt-1 text-dark-500">
          {isSearchResults 
            ? 'Try a different search term'
            : collectionSearch
            ? 'Try a different filter'
            : 'Search for games above to add them to your collection'
          }
        </p>
      </div>
    )
  }

  // Render based on view mode
  const renderContent = () => {
    if (viewMode === 'list') {
      return (
        <div className="mt-6 space-y-2">
          {displayGames.map(game => (
            <GameCardList 
              key={game.id} 
              game={game} 
              onSelect={onSelectGame}
              isSearchResult={isSearchResults}
            />
          ))}
        </div>
      )
    }
    
    // Cover art view - larger images, minimal UI
    if (viewMode === 'covers') {
      return (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayGames.map(game => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              {(game.coverImage || game.bannerImage) ? (
                <img
                  src={game.coverImage || game.bannerImage}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                  <span className="text-dark-500 text-4xl">🎮</span>
                </div>
              )}
              {/* Hover overlay with title */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <h3 className="text-white font-semibold text-sm line-clamp-2">{game.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    // Default grid view
    return (
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {displayGames.map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            onSelect={onSelectGame}
            isSearchResult={isSearchResults}
            isDraggable={isDraggable}
          />
        ))}
      </div>
    )
  }

  if (isDraggable && viewMode === 'grid') {
    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayGames.map(g => g.id)}
          strategy={rectSortingStrategy}
        >
          {renderContent()}
        </SortableContext>
      </DndContext>
    )
  }

  return renderContent()
}
