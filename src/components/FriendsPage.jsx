import { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  getUserFollowers, 
  getUserFollowing, 
  acceptFollowRequest, 
  declineFollowRequest,
  unfollowUser,
  removeFollower,
  getAllUsers
} from '../services/firestoreService'

export default function FriendsPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTabState] = useState(() => {
    const tab = searchParams.get('tab')
    return ['followers', 'following', 'requests'].includes(tab) ? tab : 'followers'
  })
  
  // Update URL when tab changes
  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    setSearchParams({ tab }, { replace: true })
  }
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [allUsers, setAllUsers] = useState([]) // Preloaded users for instant search
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState(null)
  const usersLoaded = allUsers.length > 0
  const [actionLoading, setActionLoading] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])
  
  // Filter locally as user types (instant!)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    
    if (!allUsers || allUsers.length === 0) {
      setSearchResults([])
      return
    }
    
    const searchLower = searchQuery.toLowerCase().trim()
    const filtered = allUsers.filter(u => 
      u && (
        u.username?.toLowerCase().includes(searchLower) ||
        u.displayName?.toLowerCase().includes(searchLower)
      )
    ).slice(0, 10)
    
    setSearchResults(filtered)
    setSelectedIndex(-1)
    setShowDropdown(true)
  }, [searchQuery, allUsers])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    setDataLoading(true)
    setError(null)
    
    const errors = []
    
    try {
      // Fetch each independently so one failure doesn't break others
      const [followersList, followingList, requestsList, usersList] = await Promise.all([
        getUserFollowers(user.uid, 'accepted').catch(e => { errors.push('followers: ' + e.message); return [] }),
        getUserFollowing(user.uid).catch(e => { errors.push('following: ' + e.message); return [] }),
        getUserFollowers(user.uid, 'pending').catch(e => { errors.push('requests: ' + e.message); return [] }),
        getAllUsers(100).catch(e => { errors.push('users: ' + e.message); return [] })
      ])
      setFollowers(followersList || [])
      setFollowing(followingList || [])
      setRequests(requestsList || [])
      setAllUsers(usersList || [])
      
      if (errors.length > 0) {
        setError(errors.join(' | '))
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setDataLoading(false)
    }
  }

  const handleSelectUser = (username) => {
    setShowDropdown(false)
    setSearchQuery('')
    setSelectedIndex(-1)
    navigate(`/u/${username}`)
  }
  
  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : searchResults.length - 1
      )
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelectUser(searchResults[selectedIndex].username)
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSelectedIndex(-1)
    }
  }

  const handleAccept = async (followerId) => {
    setActionLoading(followerId)
    try {
      await acceptFollowRequest(user.uid, followerId)
      // Immediately update local state
      const acceptedUser = requests.find(r => r.userId === followerId)
      setRequests(prev => prev.filter(r => r.userId !== followerId))
      if (acceptedUser) {
        setFollowers(prev => [...prev, { ...acceptedUser, status: 'accepted' }])
      }
    } catch (err) {
      console.error('Error accepting:', err)
      // Refresh on error to sync state
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (followerId) => {
    setActionLoading(followerId)
    try {
      await declineFollowRequest(user.uid, followerId)
      // Immediately update local state
      setRequests(prev => prev.filter(r => r.userId !== followerId))
    } catch (err) {
      console.error('Error declining:', err)
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnfollow = async (targetUserId) => {
    setActionLoading(targetUserId)
    try {
      await unfollowUser(user.uid, targetUserId)
      // Immediately update local state
      setFollowing(prev => prev.filter(f => f.userId !== targetUserId))
    } catch (err) {
      console.error('Error unfollowing:', err)
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFollower = async (followerId) => {
    setActionLoading(followerId)
    try {
      await removeFollower(user.uid, followerId)
      // Immediately update local state
      setFollowers(prev => prev.filter(f => f.userId !== followerId))
    } catch (err) {
      console.error('Error removing follower:', err)
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/logo.svg" alt="GameRep" className="w-10 h-10" />
                <span className="text-xl font-bold text-white">GameRep</span>
              </Link>
            </div>
            <Link
              to="/"
              className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-200 text-sm font-medium rounded-lg transition-colors"
            >
              Back to Collection
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Friends</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <p className="font-medium">Error loading data:</p>
            <p className="text-xs mt-1 break-all">{error}</p>
            <p className="text-xs mt-2 text-red-300">Check Firestore rules include followers/following collections</p>
          </div>
        )}

        {/* Search Users */}
        <div className="mb-8" ref={searchRef}>
          <h2 className="text-lg font-semibold text-white mb-3">Find Users</h2>
          <p className="text-dark-400 text-sm mb-3">Search by username to find and follow other collectors</p>
          <div className="relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search by username..."
                className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-10 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
              {!usersLoaded && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {searchQuery && usersLoaded && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowDropdown(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-dark-400">
                    No users found matching "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((u, index) => (
                    <button
                      key={u.userId}
                      onClick={() => handleSelectUser(u.username)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                        index === selectedIndex ? 'bg-dark-700' : 'hover:bg-dark-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                        {(u.displayName || u.username || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{u.displayName}</p>
                        <p className="text-dark-400 text-sm truncate">@{u.username}</p>
                      </div>
                      <svg className="w-5 h-5 text-dark-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-900 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'followers' ? 'bg-dark-800 text-white' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'following' ? 'bg-dark-800 text-white' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Following ({following.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              activeTab === 'requests' ? 'bg-dark-800 text-white' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Requests
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === 'followers' && (
              followers.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No followers yet</p>
              ) : (
                followers.map(f => (
                  <div key={f.userId} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{f.displayName}</p>
                      <p className="text-dark-400 text-sm">@{f.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/u/${f.username}`}
                        className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleRemoveFollower(f.userId)}
                        disabled={actionLoading === f.userId}
                        className="px-3 py-1.5 bg-dark-700 hover:bg-red-600/20 text-dark-300 hover:text-red-400 text-sm font-medium rounded-lg transition-colors"
                      >
                        {actionLoading === f.userId ? '...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'following' && (
              following.length === 0 ? (
                <p className="text-dark-400 text-center py-8">Not following anyone yet</p>
              ) : (
                following.map(f => (
                  <div key={f.userId} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{f.displayName}</p>
                      <p className="text-dark-400 text-sm">@{f.username}</p>
                      {f.status === 'pending' && (
                        <span className="text-yellow-400 text-xs">Pending</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/u/${f.username}`}
                        className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleUnfollow(f.userId)}
                        disabled={actionLoading === f.userId}
                        className="px-3 py-1.5 bg-dark-700 hover:bg-red-600/20 text-dark-300 hover:text-red-400 text-sm font-medium rounded-lg transition-colors"
                      >
                        {actionLoading === f.userId ? '...' : 'Unfollow'}
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'requests' && (
              requests.length === 0 ? (
                <p className="text-dark-400 text-center py-8">No pending requests</p>
              ) : (
                requests.map(r => (
                  <div key={r.userId} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{r.displayName}</p>
                      <p className="text-dark-400 text-sm">@{r.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(r.userId)}
                        disabled={actionLoading === r.userId}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {actionLoading === r.userId ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(r.userId)}
                        disabled={actionLoading === r.userId}
                        className="px-3 py-1.5 bg-dark-700 hover:bg-red-600/20 text-dark-300 hover:text-red-400 text-sm font-medium rounded-lg transition-colors"
                      >
                        {actionLoading === r.userId ? '...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </main>
    </div>
  )
}
