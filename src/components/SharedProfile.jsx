import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  getUserGames, 
  getUserDisplayName, 
  getUserIdByUsername, 
  getUserProfile,
  getFollowStatus,
  followUser,
  unfollowUser
} from '../services/firestoreService'
import { sortGames } from '../utils/sorting'
import { useAuth } from '../contexts/AuthContext'
import GameCard from './GameCard'
import GameCardList from './GameCardList'
import GameDetails from './GameDetails'

export default function SharedProfile() {
  const { userId: userIdOrUsername } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [profileUserId, setProfileUserId] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [displayName, setDisplayName] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [followStatus, setFollowStatus] = useState(null) // null, 'pending', 'accepted'
  const [canViewCollection, setCanViewCollection] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null)
  const [activeTab, setActiveTab] = useState('unplayed')
  const [viewModes, setViewModes] = useState({ unplayed: 'grid', played: 'grid' })
  const [sortBy, setSortBy] = useState('priority')
  const [sortOrder, setSortOrder] = useState('desc')
  const [followLoading, setFollowLoading] = useState(false)
  
  // Get current view mode for active tab
  const viewMode = viewModes[activeTab] || 'grid'
  const setViewMode = (mode) => setViewModes(prev => ({ ...prev, [activeTab]: mode }))
  
  // Check if viewing own profile
  const isOwnProfile = user && profileUserId === user.uid

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Determine if this is a username or userId
        let actualUserId = userIdOrUsername
        const looksLikeUsername = /^[a-z0-9-]+$/.test(userIdOrUsername) && userIdOrUsername.length < 28
        
        if (looksLikeUsername) {
          const foundUserId = await getUserIdByUsername(userIdOrUsername)
          if (foundUserId) {
            actualUserId = foundUserId
          }
        }
        
        setProfileUserId(actualUserId)
        
        // Get profile data first to check privacy
        const profile = await getUserProfile(actualUserId)
        setProfileData(profile)
        setDisplayName(profile?.displayName || null)
        
        // Check follow status if logged in
        let currentFollowStatus = null
        if (user && user.uid !== actualUserId) {
          currentFollowStatus = await getFollowStatus(user.uid, actualUserId)
          setFollowStatus(currentFollowStatus)
        }
        
        // Determine if viewer can see the collection
        const isOwner = user?.uid === actualUserId
        const isProfilePublic = profile?.isPublic !== false // Default to public
        const isAcceptedFollower = currentFollowStatus === 'accepted'
        
        const canView = isOwner || isProfilePublic || isAcceptedFollower
        setCanViewCollection(canView)
        
        // Only fetch games if allowed to view
        if (canView) {
          const userGames = await getUserGames(actualUserId)
          setGames(userGames)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Could not load this profile.')
      } finally {
        setLoading(false)
      }
    }

    if (userIdOrUsername) {
      fetchUserData()
    }
  }, [userIdOrUsername, user])
  
  const handleFollow = async () => {
    if (!user || !profileUserId || followLoading) return
    
    setFollowLoading(true)
    try {
      const result = await followUser(user.uid, profileUserId)
      setFollowStatus(result.status)
      
      // If now accepted (public profile), fetch the games
      if (result.status === 'accepted') {
        setCanViewCollection(true)
        const userGames = await getUserGames(profileUserId)
        setGames(userGames)
      }
    } catch (err) {
      console.error('Error following user:', err)
    } finally {
      setFollowLoading(false)
    }
  }
  
  const handleUnfollow = async () => {
    if (!user || !profileUserId || followLoading) return
    
    setFollowLoading(true)
    try {
      await unfollowUser(user.uid, profileUserId)
      setFollowStatus(null)
      
      // If profile is private, hide collection
      if (profileData?.isPublic === false) {
        setCanViewCollection(false)
        setGames([])
      }
    } catch (err) {
      console.error('Error unfollowing user:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  const filteredGames = sortGames(
    games.filter(g => 
      activeTab === 'played' ? g.status === 'played' : g.status !== 'played'
    ),
    sortBy,
    sortOrder
  )

  const playedCount = games.filter(g => g.status === 'played').length
  const unplayedCount = games.filter(g => g.status !== 'played').length

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading collection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <svg className="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-6a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-bold text-white mb-2">Collection Not Found</h1>
          <p className="text-dark-400 mb-6">{error}</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go to GameRep
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top row: Logo and back button */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="GameRep" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-lg sm:text-xl font-bold text-white hidden sm:inline">GameRep</span>
            </Link>
            
            {isAuthenticated && (
              <Link
                to="/"
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
              >
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">My Collection</span>
              </Link>
            )}
          </div>
          
          {/* Bottom row: Profile info and follow button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-dark-400 min-w-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-white font-medium text-sm sm:text-base truncate">{displayName || 'User'}'s Collection</span>
              {profileData?.isPublic === false && (
                <span className="px-1.5 py-0.5 bg-dark-700 text-dark-400 text-xs rounded shrink-0">Private</span>
              )}
            </div>
            
            {/* Follow/Unfollow Button */}
            {isAuthenticated && !isOwnProfile && (
              followStatus === 'accepted' ? (
                <button
                  onClick={handleUnfollow}
                  disabled={followLoading}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0"
                >
                  {followLoading ? '...' : 'Following'}
                </button>
              ) : followStatus === 'pending' ? (
                <button
                  onClick={handleUnfollow}
                  disabled={followLoading}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-300 text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0"
                >
                  {followLoading ? '...' : 'Requested'}
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0"
                >
                  {followLoading ? '...' : 'Follow'}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!canViewCollection ? (
          /* Private Collection Message */
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-20 h-20 text-dark-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Private Collection</h2>
            <p className="text-dark-400 text-center max-w-md mb-6">
              {followStatus === 'pending' 
                ? `Your follow request is pending. ${displayName || 'This user'} needs to accept it before you can view their collection.`
                : `This collection is private. Follow ${displayName || 'this user'} to request access.`
              }
            </p>
            {isAuthenticated && !isOwnProfile && !followStatus && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
              >
                {followLoading ? 'Loading...' : 'Send Follow Request'}
              </button>
            )}
            {!isAuthenticated && (
              <Link
                to="/"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
              >
                Sign in to follow
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-dark-400">Total Games:</span>
                <span className="text-white font-semibold">{games.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-dark-400">Played:</span>
                <span className="text-green-400 font-semibold">{playedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-dark-400">Backlog:</span>
                <span className="text-primary-400 font-semibold">{unplayedCount}</span>
              </div>
            </div>

        {/* Tabs and Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-1 bg-dark-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('unplayed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'unplayed' 
                  ? 'bg-dark-800 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Backlog ({unplayedCount})
            </button>
            <button
              onClick={() => setActiveTab('played')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'played' 
                  ? 'bg-dark-800 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Played ({playedCount})
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-800 border border-dark-700 text-dark-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
            >
              <option value="customOrder">Custom Order</option>
              <option value="name">Name</option>
              <option value="priority">Priority</option>
              <option value="metacritic">Metacritic</option>
              <option value="rating">Rating</option>
              <option value="addedAt">Date Added</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <svg className={`w-4 h-4 text-dark-300 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-dark-900/50 p-1 rounded-xl ml-auto">
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
        </div>

        {/* Games Grid/List */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-400">No games in this section</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredGames.map(game => (
              <GameCardList 
                key={game.id} 
                game={game} 
                onSelect={() => setSelectedGame(game)}
                isSearchResult={false}
              />
            ))}
          </div>
        ) : viewMode === 'covers' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredGames.map(game => (
              <div
                key={game.id}
                className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setSelectedGame(game)}
              >
                {game.coverImage ? (
                  <img 
                    src={game.coverImage} 
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                    <span className="text-dark-500 text-sm text-center px-2">{game.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">{game.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onSelect={() => setSelectedGame(game)}
                isSearchResult={false}
              />
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Game Details Modal (read-only) */}
      {selectedGame && (
        <GameDetails
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          readOnly={true}
        />
      )}
    </div>
  )
}
