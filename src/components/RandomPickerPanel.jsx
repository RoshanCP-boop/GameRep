import { useState } from 'react'
import { useGameStore } from '../hooks/useGameStore.jsx'

export default function RandomPickerPanel({ isOpen, onClose, onSelectGame }) {
  const { games } = useGameStore()
  const [isSpinning, setIsSpinning] = useState(false)
  const [pickedGame, setPickedGame] = useState(null)
  const [selectedPriority, setSelectedPriority] = useState('')
  
  const unplayedGames = games.filter(g => g.status === 'unplayed')
  
  // Filter games based on priority
  const filteredGames = selectedPriority
    ? unplayedGames.filter(g => g.priority === parseInt(selectedPriority))
    : unplayedGames

  const pickFromCollection = () => {
    if (filteredGames.length === 0) return
    
    setIsSpinning(true)
    setPickedGame(null)
    
    let count = 0
    const maxCount = 12
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredGames.length)
      setPickedGame(filteredGames[randomIndex])
      count++
      
      if (count >= maxCount) {
        clearInterval(interval)
        setIsSpinning(false)
        const finalIndex = Math.floor(Math.random() * filteredGames.length)
        setPickedGame(filteredGames[finalIndex])
      }
    }, 80)
  }

  const handleGameClick = () => {
    if (pickedGame) {
      onSelectGame(pickedGame)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-dark-950/90 backdrop-blur-md z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-dark-900 border-l border-dark-600/50 z-50 overflow-y-auto animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700/50 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Random Picker</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Priority Filter */}
          <div className="space-y-4">
            <div className="p-4 bg-dark-800/60 border border-dark-700/50 rounded-xl">
              <label className="text-xs text-dark-400 font-medium mb-2 block">Filter by Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-dark-900 border-2 border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Any Priority</option>
                <option value="3">High (3 stars)</option>
                <option value="2">Medium (2 stars)</option>
                <option value="1">Low (1 star)</option>
                <option value="0">No Priority</option>
              </select>
            </div>
            
            <p className="text-sm text-dark-500 text-center">
              {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} to pick from
            </p>
          </div>
          
          {/* Pick Button */}
          <button
            onClick={pickFromCollection}
            disabled={isSpinning || filteredGames.length === 0}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSpinning ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Spinning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Pick Random Game
              </>
            )}
          </button>
          
          {/* Picked Game Display */}
          {pickedGame && (
            <div 
              className="p-4 bg-dark-800 rounded-xl cursor-pointer hover:bg-dark-700 transition-colors animate-scale-in"
              onClick={handleGameClick}
            >
              <div className="flex gap-4">
                {(pickedGame.coverImage || pickedGame.bannerImage) && (
                  <img 
                    src={pickedGame.coverImage || pickedGame.bannerImage} 
                    alt={pickedGame.name}
                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-dark-100 text-lg">{pickedGame.name}</h3>
                  
                  {pickedGame.tags && pickedGame.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pickedGame.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {pickedGame.priority > 0 && (
                    <div className="flex gap-0.5 mt-2">
                      {[...Array(pickedGame.priority)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm text-primary-400 mt-3">Click to view details →</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
