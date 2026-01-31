import { useState, useEffect } from 'react'
import { getFullGameInfo, formatPrice, getCountry, COUNTRIES } from '../api/itad'
import { useGameStore } from '../hooks/useGameStore.jsx'
import CustomLinkForm from './CustomLinkForm'

export default function GameDetails({ game, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [notes, setNotes] = useState('')
  
  const { addGame, removeGame, toggleGameStatus, isGameInCollection, getGame, addCustomLink, removeCustomLink, updateNotes, updatePriority, updateGame } = useGameStore()
  
  // Safety check - if game prop is invalid, close the modal
  if (!game || !game.id) {
    onClose?.()
    return null
  }
  
  const inCollection = isGameInCollection(game.id)
  const storedGame = inCollection ? getGame(game.id) : null
  
  const country = getCountry()
  const countryInfo = COUNTRIES[country]
  
  // Initialize notes from stored game
  useEffect(() => {
    if (storedGame) {
      setNotes(storedGame.notes || '')
    }
  }, [storedGame?.notes])

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true)
      setError(null)
      
      try {
        const data = await getFullGameInfo(game.id)
        setDetails(data)
        
        // Save tags to the stored game if it's in the collection
        if (inCollection && data.tags?.length > 0) {
          const currentGame = getGame(game.id)
          if (!currentGame?.tags || currentGame.tags.length === 0) {
            updateGame(game.id, { tags: data.tags })
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDetails()
  }, [game.id, inCollection, getGame, updateGame])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleAddToCollection = () => {
    addGame({
      ...game,
      ...details,
    })
  }

  const handleRemoveFromCollection = () => {
    if (confirm('Remove this game from your collection?')) {
      const gameId = game.id
      // Close modal first, then remove game after a microtask
      // This prevents rendering issues with stale data
      onClose()
      setTimeout(() => {
        removeGame(gameId)
      }, 0)
    }
  }

  const getMetacriticColor = (score) => {
    if (score >= 75) return 'bg-green-600'
    if (score >= 50) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const displayImage = details?.bannerImage || details?.coverImage || game.coverImage || game.bannerImage

  return (
    <div 
      className="fixed inset-0 z-50 bg-dark-950/90 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-900 rounded-2xl max-w-4xl w-full my-8 overflow-hidden animate-scale-in border border-dark-800">
        {/* Header with image */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-dark-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-dark-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
          
          {/* Top buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* Remove button (only if in collection) */}
            {inCollection && (
              <button 
                onClick={handleRemoveFromCollection}
                className="p-2 bg-red-900/80 hover:bg-red-800 rounded-full transition-colors"
                title="Remove from Collection"
              >
                <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {/* Close button */}
            <button 
              onClick={onClose}
              className="p-2 bg-dark-900/80 rounded-full hover:bg-dark-800 transition-colors"
            >
              <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Game title overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{details?.name || game.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {details?.steamRating > 0 && (
                <span className="flex items-center gap-1 text-blue-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  {details.steamRating}% Steam
                </span>
              )}
              {details?.metacritic > 0 && (
                <span className={`px-2 py-0.5 ${getMetacriticColor(details.metacritic)} text-white text-xs font-bold rounded`}>
                  {details.metacritic}
                </span>
              )}
              {details?.releaseDate && (
                <span className="text-dark-300">{details.releaseDate}</span>
              )}
              <span className="text-dark-500">Prices in {countryInfo?.currency || country}</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tags/Genres */}
              {details?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {details.tags.slice(0, 6).map(tag => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>
              )}
              
              {/* Historical Low */}
              {details?.historyLow && (
                <div className="p-4 bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-dark-500 uppercase tracking-wide">Historical Lowest Price</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatPrice(details.historyLow.amount, details.historyLow.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Cheapest store option */}
              {(() => {
                // Find the cheapest deal
                const cheapestDeal = details?.deals?.length > 0 
                  ? details.deals.reduce((min, deal) => 
                      deal.price.amount < min.price.amount ? deal : min
                    , details.deals[0])
                  : null
                
                return (cheapestDeal || storedGame?.customLinks?.length > 0) && (
                  <div>
                    <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-3">
                      Best Price ({countryInfo?.name || country})
                    </h4>
                    <div className="space-y-2">
                      {cheapestDeal && (
                        <a
                          href={cheapestDeal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900/30 to-dark-800 hover:from-green-800/40 rounded-lg transition-colors group border border-green-800/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏷️</span>
                            <div>
                              <span className="font-medium text-dark-100 group-hover:text-white">{cheapestDeal.shopName}</span>
                              {cheapestDeal.drm?.length > 0 && (
                                <p className="text-xs text-dark-500">{cheapestDeal.drm.join(', ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {cheapestDeal.cut > 0 && (
                              <span className="px-2 py-1 bg-green-600 text-white text-sm font-bold rounded">
                                -{cheapestDeal.cut}%
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-400">
                                {formatPrice(cheapestDeal.price.amount, cheapestDeal.price.currency)}
                              </p>
                              {cheapestDeal.regularPrice && cheapestDeal.regularPrice.amount > cheapestDeal.price.amount && (
                                <p className="text-sm text-dark-500 line-through">
                                  {formatPrice(cheapestDeal.regularPrice.amount, cheapestDeal.regularPrice.currency)}
                                </p>
                              )}
                            </div>
                            <svg className="w-6 h-6 text-green-500 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </a>
                      )}
                      
                      {!cheapestDeal && (
                        <p className="text-dark-500 text-sm py-4 text-center">
                          No deals currently available in {countryInfo?.name || country}
                        </p>
                      )}
                    
                    {/* Custom links */}
                    {storedGame?.customLinks?.map(link => (
                      <div key={link.id} className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-between p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🔗</span>
                            <span className="font-medium text-dark-200 group-hover:text-white">{link.label}</span>
                          </div>
                          <svg className="w-5 h-5 text-dark-500 group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => removeCustomLink(game.id, link.id)}
                          className="p-2 text-dark-500 hover:text-red-400 hover:bg-dark-800 rounded-lg"
                          title="Remove link"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    </div>
                  </div>
                )
              })()}
              
              {/* Custom link form */}
              {inCollection && (
                <div>
                  {showLinkForm ? (
                    <CustomLinkForm 
                      onSubmit={(link) => {
                        addCustomLink(game.id, link)
                        setShowLinkForm(false)
                      }}
                      onCancel={() => setShowLinkForm(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowLinkForm(true)}
                      className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add custom link
                    </button>
                  )}
                </div>
              )}
              
              {/* Developers/Publishers */}
              {(details?.developers?.length > 0 || details?.publishers?.length > 0) && (
                <div className="flex flex-wrap gap-6 text-sm">
                  {details.developers?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-1">Developer</h4>
                      <p className="text-dark-300">{details.developers.join(', ')}</p>
                    </div>
                  )}
                  {details.publishers?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-1">Publisher</h4>
                      <p className="text-dark-300">{details.publishers.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Priority & Notes (only for collection items) */}
              {inCollection && (
                <div className="space-y-4 p-4 bg-dark-800/50 rounded-xl">
                  {/* Priority Stars (hidden for played games) */}
                  {storedGame?.status !== 'played' && (
                    <div>
                      <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-2">Priority</h4>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((star) => (
                          <button
                            key={star}
                            onClick={() => updatePriority(game.id, storedGame?.priority === star ? 0 : star)}
                            className="p-1 hover:scale-110 transition-transform"
                            title={`${star} star priority`}
                          >
                            <svg 
                              className={`w-7 h-7 ${star <= (storedGame?.priority || 0) ? 'text-yellow-400' : 'text-dark-600'}`}
                              fill={star <= (storedGame?.priority || 0) ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        ))}
                        {storedGame?.priority > 0 && (
                          <span className="ml-2 text-sm text-dark-400">
                            {storedGame.priority === 3 ? 'High' : storedGame.priority === 2 ? 'Medium' : 'Low'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  <div>
                    <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wide mb-2">Personal Notes</h4>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={() => updateNotes(game.id, notes)}
                      placeholder="Add notes about this game..."
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-dark-800">
                {inCollection ? (
                  <>
                    <button
                      onClick={() => toggleGameStatus(game.id)}
                      className="btn-primary flex items-center gap-2"
                    >
                      {storedGame?.status === 'played' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Unplayed
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Mark as Played
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRemoveFromCollection}
                      className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      Remove from Collection
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddToCollection}
                    className="btn-primary flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Collection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
