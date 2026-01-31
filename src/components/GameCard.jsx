import { useState } from 'react'
import { useGameStore } from '../hooks/useGameStore.jsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatPrice } from '../api/itad'

export default function GameCard({ game, onSelect, isSearchResult = false, isDraggable = false }) {
  const { addGame, toggleGameStatus, isGameInCollection, getGame } = useGameStore()
  const [showSuccess, setShowSuccess] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const inCollection = isGameInCollection(game.id)
  const storedGame = inCollection ? getGame(game.id) : null
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: game.id,
    disabled: !isDraggable,
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddToCollection = (e) => {
    e.stopPropagation()
    addGame(game)
  }

  const handleToggleStatus = (e) => {
    e.stopPropagation()
    const wasUnplayed = storedGame?.status === 'unplayed'
    if (wasUnplayed) {
      // Show burst animation first, then toggle after a short delay
      setShowSuccess(true)
      setTimeout(() => {
        toggleGameStatus(game.id)
        setShowSuccess(false)
      }, 150)
    } else {
      toggleGameStatus(game.id)
    }
  }

  const getMetacriticColor = (score) => {
    if (score >= 75) return 'bg-green-600'
    if (score >= 50) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  // Get the best image
  const coverImage = game.coverImage || game.bannerImage

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="card group cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-dark-950/50"
      onClick={() => onSelect(game)}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-dark-800">
        {coverImage && !imageError ? (
          <img 
            src={coverImage} 
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
            <svg className="w-10 h-10 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-dark-500 text-center line-clamp-2">{game.name}</span>
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Top left: Drag handle or Sale Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {/* Drag Handle */}
          {isDraggable && (
            <div 
              {...attributes} 
              {...listeners}
              className="p-1.5 bg-dark-900/80 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
          
          {/* Sale Badge */}
          {isSearchResult && game.cut > 0 && (
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
              -{game.cut}%
            </div>
          )}
        </div>
        
        {/* Top right: Metacritic Badge */}
        {game.metacritic > 0 && (
          <div className={`absolute top-2 right-2 ${getMetacriticColor(game.metacritic)} text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg`}>
            {game.metacritic}
          </div>
        )}
        
        {/* Bottom left: Priority Stars (for collection items, not shown for played games) */}
        {!isSearchResult && storedGame?.priority > 0 && storedGame?.status !== 'played' && (
          <div className="absolute bottom-2 left-2 flex gap-0.5 bg-dark-900/60 backdrop-blur-sm rounded px-1 py-0.5">
            {[...Array(storedGame.priority)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 text-yellow-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ))}
          </div>
        )}
        
        {/* Played Checkbox (for collection items) */}
        {!isSearchResult && storedGame && (
          <div className="absolute bottom-2 right-2">
            <button
              onClick={handleToggleStatus}
              className={`relative p-2 bg-dark-900/90 rounded-full hover:bg-dark-800 transition-all ${showSuccess ? 'animate-burst' : ''}`}
              title={storedGame.status === 'played' ? 'Mark as unplayed' : 'Mark as played'}
            >
              {/* Burst rings */}
              {showSuccess && (
                <>
                  <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping" />
                  <span className="absolute inset-[-4px] rounded-full border-2 border-green-500/60 animate-ping" style={{ animationDelay: '0.1s' }} />
                </>
              )}
              {storedGame.status === 'played' || showSuccess ? (
                <svg className={`w-5 h-5 ${showSuccess ? 'text-green-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        )}
        
        {/* Add to Collection Button (for search results) */}
        {isSearchResult && (
          <button
            onClick={handleAddToCollection}
            disabled={inCollection}
            className={`
              absolute bottom-2 right-2 p-2 rounded-full transition-all
              ${inCollection 
                ? 'bg-green-600 text-white cursor-default' 
                : 'bg-primary-600 hover:bg-primary-500 text-white opacity-0 group-hover:opacity-100'
              }
            `}
            title={inCollection ? 'In collection' : 'Add to collection'}
          >
            {inCollection ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-white truncate" title={game.name}>
          {game.name}
        </h3>
        
        <div className="mt-1 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {/* Price */}
            {isSearchResult && game.currentPrice && (
              <span className="text-green-400 font-medium">
                {formatPrice(game.currentPrice.amount, game.currentPrice.currency)}
              </span>
            )}
            
            {/* Steam Rating */}
            {game.steamRating > 0 && (
              <span className="text-blue-400 text-xs">
                {game.steamRating}%
              </span>
            )}
            
            {/* Shop name */}
            {isSearchResult && game.shopName && (
              <span className="text-dark-500 text-xs truncate">
                {game.shopName}
              </span>
            )}
          </div>
          
          {/* Notes indicator (for collection items with notes) */}
          {!isSearchResult && storedGame?.notes && (
            <div className="p-1" title="Has notes">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
