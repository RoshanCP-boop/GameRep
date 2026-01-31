import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'

/**
 * Get the games collection reference for a user
 */
const getGamesCollection = (userId) => {
  if (!db) return null
  return collection(db, 'users', userId, 'games')
}

/**
 * Get a single game document reference
 */
const getGameDoc = (userId, gameId) => {
  if (!db) return null
  return doc(db, 'users', userId, 'games', gameId)
}

/**
 * Sync a single game to Firestore
 */
export const syncGameToFirestore = async (userId, game) => {
  if (!isFirebaseConfigured() || !db) {
    console.warn('Firebase not configured, skipping sync')
    return
  }

  try {
    const gameRef = getGameDoc(userId, game.id)
    if (!gameRef) return

    await setDoc(gameRef, {
      ...game,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Error syncing game to Firestore:', error)
    throw error
  }
}

/**
 * Delete a game from Firestore
 */
export const deleteGameFromFirestore = async (userId, gameId) => {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  try {
    const gameRef = getGameDoc(userId, gameId)
    if (!gameRef) return

    await deleteDoc(gameRef)
  } catch (error) {
    console.error('Error deleting game from Firestore:', error)
    throw error
  }
}

/**
 * Subscribe to real-time updates for a user's games
 * Returns an unsubscribe function
 */
export const subscribeToGames = (userId, callback) => {
  if (!isFirebaseConfigured() || !db) {
    callback([])
    return () => {}
  }

  const gamesRef = getGamesCollection(userId)
  if (!gamesRef) {
    callback([])
    return () => {}
  }

  const q = query(gamesRef, orderBy('customOrder', 'asc'))

  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const games = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      callback(games)
    },
    (error) => {
      console.error('Error subscribing to games:', error)
      callback([])
    }
  )

  return unsubscribe
}

/**
 * Migrate games from localStorage to Firestore
 * Used when a user signs in for the first time
 */
export const migrateLocalGamesToFirestore = async (userId, games) => {
  if (!isFirebaseConfigured() || !db || !games.length) {
    return { success: false, count: 0 }
  }

  try {
    const batch = writeBatch(db)

    games.forEach((game, index) => {
      const gameRef = getGameDoc(userId, game.id)
      if (gameRef) {
        batch.set(gameRef, {
          ...game,
          customOrder: game.customOrder ?? index,
          migratedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
    })

    await batch.commit()
    return { success: true, count: games.length }
  } catch (error) {
    console.error('Error migrating games to Firestore:', error)
    return { success: false, count: 0, error: error.message }
  }
}

/**
 * Batch update multiple games (used for reordering)
 */
export const batchUpdateGames = async (userId, updates) => {
  if (!isFirebaseConfigured() || !db || !updates.length) {
    return
  }

  try {
    const batch = writeBatch(db)

    updates.forEach(({ gameId, data }) => {
      const gameRef = getGameDoc(userId, gameId)
      if (gameRef) {
        batch.set(gameRef, {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true })
      }
    })

    await batch.commit()
  } catch (error) {
    console.error('Error batch updating games:', error)
    throw error
  }
}
