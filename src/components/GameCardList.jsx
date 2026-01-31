import { useState } from 'react'
import { useGameStore } from '../hooks/useGameStore.jsx'
import { formatPrice } from '../api/itad'

export default function GameCardList({ game, onSelect, isSearchResult = false }) {
  const { addGame, toggleGameStatus, isGameInCollection, getGame } = useGameStore()
  const [showSuccess, setShowSuccess] = useState(false)
  
  const inCollection = isGameInCollection(game.id)
  const storedGame = inCollection ? getGame(game.id) : null
  
  const coverImage = game.coverImage || game.bannerImage

  const handleToggleStatus = (e) => {
    e.stopPropagation()
    const wasUnplayed = storedGame?.status === 'unplayed'
    if (wasUnplayed) {
      // Show burst animation first, then toggle after a short delay
      setShowSuccess(true)
      setTimeout(() => {
        toggleGameStatus(game.id)
        setShowSuccess(false)
      }, 600)
    } else {
      toggleGameStatus(game.id)
    }
  }

  const handleAddToCollection = (e) => {
    e.stopPropagation()
    addGame(game)
  }

  return (
    <div 
      className="group flex items-start gap-4 p-3 bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 hover:border-dark-600 rounded-xl cursor-pointer transition-all"
      onClick={() => onSelect(game)}
    >
      {/* Cover */}
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-dark-800 flex-shrink-0">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg">🎮</span>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white truncate">{game.name}</h3>
          {storedGame?.priority > 0 && storedGame?.status !== 'played' && (
            <div className="flex flex-shrink-0">
              {[...Array(storedGame.priority)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-0.5 text-sm text-dark-400">
          {game.steamRating > 0 && (
            <span className="text-primary-400">{game.steamRating}%</span>
          )}
          {isSearchResult && game.currentPrice && (
            <span className="text-green-400 font-medium">
              {formatPrice(game.currentPrice.amount, game.currentPrice.currency)}
            </span>
          )}
        </div>
        
        {/* Notes - Show full text in list view */}
        {storedGame?.notes && (
          <p className="mt-1.5 text-xs text-dark-400 line-clamp-2">{storedGame.notes}</p>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isSearchResult && storedGame && (
          <button
            onClick={handleToggleStatus}
            className={`relative p-2 rounded-lg transition-all ${
              storedGame.status === 'played' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-dark-700 text-dark-400 hover:text-dark-200 hover:bg-dark-600'
            }`}
            title={storedGame.status === 'played' ? 'Mark as unplayed' : 'Mark as played'}
          >
            {/* Burst rings */}
            {showSuccess && (
              <>
                <span className="absolute inset-0 rounded-lg bg-green-500/40 animate-ping" />
                <span className="absolute inset-[-2px] rounded-lg border-2 border-green-500/60 animate-ping" style={{ animationDelay: '0.1s' }} />
              </>
            )}
            {storedGame.status === 'played' || showSuccess ? (
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}
        
        {isSearchResult && (
          <button
            onClick={handleAddToCollection}
            disabled={inCollection}
            className={`p-2 rounded-lg transition-colors ${
              inCollection 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-primary-600 hover:bg-primary-500 text-white'
            }`}
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
        
        <svg className="w-5 h-5 text-dark-600 group-hover:text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
