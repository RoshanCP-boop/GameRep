import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  getUserFollowers, 
  getUserFollowing, 
  acceptFollowRequest, 
  declineFollowRequest,
  unfollowUser,
  searchUsers
} from '../services/firestoreService'

export default function FriendsPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('followers')
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const [followersList, followingList, requestsList] = await Promise.all([
        getUserFollowers(user.uid, 'accepted'),
        getUserFollowing(user.uid),
        getUserFollowers(user.uid, 'pending')
      ])
      setFollowers(followersList)
      setFollowing(followingList)
      setRequests(requestsList)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setDataLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setSearchLoading(true)
    try {
      const results = await searchUsers(searchQuery)
      // Filter out self
      setSearchResults(results.filter(u => u.userId !== user.uid))
    } catch (err) {
      console.error('Error searching:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAccept = async (followerId) => {
    setActionLoading(followerId)
    try {
      await acceptFollowRequest(user.uid, followerId)
      await fetchData()
    } catch (err) {
      console.error('Error accepting:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (followerId) => {
    setActionLoading(followerId)
    try {
      await declineFollowRequest(user.uid, followerId)
      await fetchData()
    } catch (err) {
      console.error('Error declining:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnfollow = async (targetUserId) => {
    setActionLoading(targetUserId)
    try {
      await unfollowUser(user.uid, targetUserId)
      await fetchData()
    } catch (err) {
      console.error('Error unfollowing:', err)
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

        {/* Search Users */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Find Users</h2>
          <p className="text-dark-400 text-sm mb-3">Search by username to find and follow other collectors</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map(u => (
                <div key={u.userId} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{u.displayName}</p>
                    <p className="text-dark-400 text-sm">@{u.username}</p>
                  </div>
                  <Link
                    to={`/u/${u.username}`}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
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
                    <Link
                      to={`/u/${f.username}`}
                      className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
                    >
                      View
                    </Link>
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
