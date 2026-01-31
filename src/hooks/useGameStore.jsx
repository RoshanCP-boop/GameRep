import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { useAuth } from '../contexts/AuthContext'
import { 
  syncGameToFirestore, 
  deleteGameFromFirestore, 
  subscribeToGames,
  batchUpdateGames 
} from '../services/firestoreService'

const GameStoreContext = createContext(null)

export function GameStoreProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  
  // localStorage for guests and offline cache
  const [localGames, setLocalGames] = useLocalStorage('gamerep-games', [])
  
  // Firestore games (when authenticated)
  const [firestoreGames, setFirestoreGames] = useState([])
  const [firestoreLoading, setFirestoreLoading] = useState(false)
  
  // Use Firestore games when authenticated, otherwise localStorage
  const games = isAuthenticated ? firestoreGames : localGames
  const setGames = isAuthenticated 
    ? setFirestoreGames 
    : setLocalGames

  // Subscribe to Firestore when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setFirestoreGames([])
      return
    }

    setFirestoreLoading(true)
    
    const unsubscribe = subscribeToGames(user.uid, (games) => {
      setFirestoreGames(games)
      setFirestoreLoading(false)
      // Cache games to localStorage for offline/signed-out viewing
      setLocalGames(games)
    })

    return () => unsubscribe()
  }, [isAuthenticated, user?.uid, setLocalGames])

  // Helper to sync to Firestore
  const syncToFirestore = useCallback(async (game) => {
    if (isAuthenticated && user?.uid) {
      try {
        await syncGameToFirestore(user.uid, game)
      } catch (error) {
        console.error('Failed to sync to Firestore:', error)
      }
    }
  }, [isAuthenticated, user?.uid])

  // Add a game to the collection
  const addGame = useCallback((game) => {
    const newGame = {
      ...game,
      status: 'unplayed',
      addedAt: new Date().toISOString(),
      customOrder: games.length,
      customLinks: [],
      notes: '',
      priority: 0,
    }

    // Check if game already exists
    if (games.some(g => g.id === game.id)) {
      return
    }

    if (isAuthenticated && user?.uid) {
      // For authenticated users, sync to Firestore (real-time listener will update local state)
      syncGameToFirestore(user.uid, newGame)
    } else {
      // For guests, update localStorage
      setLocalGames(prev => [...prev, newGame])
    }
  }, [games, isAuthenticated, user?.uid, setLocalGames])

  // Remove a game from the collection
  const removeGame = useCallback((gameId) => {
    if (isAuthenticated && user?.uid) {
      deleteGameFromFirestore(user.uid, gameId)
    } else {
      setLocalGames(prev => prev.filter(g => g.id !== gameId))
    }
  }, [isAuthenticated, user?.uid, setLocalGames])

  // Update a game's properties
  const updateGame = useCallback((gameId, updates) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    const updatedGame = { ...game, ...updates }

    if (isAuthenticated && user?.uid) {
      syncGameToFirestore(user.uid, updatedGame)
    } else {
      setLocalGames(prev => prev.map(g => 
        g.id === gameId ? updatedGame : g
      ))
    }
  }, [games, isAuthenticated, user?.uid, setLocalGames])

  // Toggle game between played/unplayed
  const toggleGameStatus = useCallback((gameId) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    const newStatus = game.status === 'played' ? 'unplayed' : 'played'
    updateGame(gameId, { status: newStatus })
  }, [games, updateGame])

  // Add a custom link to a game
  const addCustomLink = useCallback((gameId, link) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    const newLinks = [...(game.customLinks || []), { ...link, id: Date.now() }]
    updateGame(gameId, { customLinks: newLinks })
  }, [games, updateGame])

  // Remove a custom link from a game
  const removeCustomLink = useCallback((gameId, linkId) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    const newLinks = (game.customLinks || []).filter(l => l.id !== linkId)
    updateGame(gameId, { customLinks: newLinks })
  }, [games, updateGame])

  // Reorder games (for drag and drop)
  const reorderGames = useCallback((activeId, overId) => {
    const oldIndex = games.findIndex(g => g.id === activeId)
    const newIndex = games.findIndex(g => g.id === overId)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const newGames = [...games]
    const [removed] = newGames.splice(oldIndex, 1)
    newGames.splice(newIndex, 0, removed)
    
    // Update customOrder for all games
    const reorderedGames = newGames.map((g, index) => ({ ...g, customOrder: index }))

    if (isAuthenticated && user?.uid) {
      // Batch update all games with new order
      const updates = reorderedGames.map(g => ({
        gameId: g.id,
        data: { customOrder: g.customOrder }
      }))
      batchUpdateGames(user.uid, updates)
    } else {
      setLocalGames(reorderedGames)
    }
  }, [games, isAuthenticated, user?.uid, setLocalGames])

  // Get games by status
  const getGamesByStatus = useCallback((status) => {
    return games.filter(g => g.status === status)
  }, [games])

  // Check if a game is in the collection
  const isGameInCollection = useCallback((gameId) => {
    return games.some(g => g.id === gameId)
  }, [games])

  // Get a single game by ID
  const getGame = useCallback((gameId) => {
    return games.find(g => g.id === gameId)
  }, [games])

  // Update game notes
  const updateNotes = useCallback((gameId, notes) => {
    updateGame(gameId, { notes })
  }, [updateGame])

  // Update game priority (0-3)
  const updatePriority = useCallback((gameId, priority) => {
    updateGame(gameId, { priority: Math.max(0, Math.min(3, priority)) })
  }, [updateGame])

  // Export collection as JSON
  const exportCollection = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      games: games,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gamerep-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [games])

  // Import collection from JSON
  const importCollection = useCallback(async (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      if (!data.games || !Array.isArray(data.games)) {
        throw new Error('Invalid backup file format')
      }
      
      if (isAuthenticated && user?.uid) {
        // For authenticated users, sync each game to Firestore
        const existingIds = new Set(games.map(g => g.id))
        const gamesToAdd = mode === 'replace' 
          ? data.games 
          : data.games.filter(g => !existingIds.has(g.id))

        for (const game of gamesToAdd) {
          await syncGameToFirestore(user.uid, {
            ...game,
            customOrder: game.customOrder ?? games.length
          })
        }
      } else {
        if (mode === 'replace') {
          setLocalGames(data.games)
        } else {
          setLocalGames(prev => {
            const existingIds = new Set(prev.map(g => g.id))
            const newGames = data.games.filter(g => !existingIds.has(g.id))
            return [...prev, ...newGames]
          })
        }
      }
      return { success: true, count: data.games.length }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [games, isAuthenticated, user?.uid, setLocalGames])

  // Get local games (for migration)
  const getLocalGames = useCallback(() => {
    return localGames
  }, [localGames])

  // Clear local games (after migration)
  const clearLocalGames = useCallback(() => {
    setLocalGames([])
  }, [setLocalGames])

  // Statistics
  const stats = useMemo(() => {
    const total = games.length
    const played = games.filter(g => g.status === 'played').length
    const unplayed = games.filter(g => g.status === 'unplayed').length
    const withPriority = games.filter(g => g.priority > 0).length
    const highPriority = games.filter(g => g.priority === 3).length
    
    return {
      total,
      played,
      unplayed,
      completionRate: total > 0 ? Math.round((played / total) * 100) : 0,
      withPriority,
      highPriority,
    }
  }, [games])

  const value = {
    games,
    addGame,
    removeGame,
    updateGame,
    toggleGameStatus,
    addCustomLink,
    removeCustomLink,
    reorderGames,
    getGamesByStatus,
    isGameInCollection,
    getGame,
    updateNotes,
    updatePriority,
    exportCollection,
    importCollection,
    getLocalGames,
    clearLocalGames,
    stats,
    isLoading: firestoreLoading,
  }

  return (
    <GameStoreContext.Provider value={value}>
      {children}
    </GameStoreContext.Provider>
  )
}

export function useGameStore() {
  const context = useContext(GameStoreContext)
  if (!context) {
    throw new Error('useGameStore must be used within a GameStoreProvider')
  }
  return context
}

export default useGameStore
