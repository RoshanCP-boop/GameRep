import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
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
 * Sanitize game ID for use as Firestore document ID
 * Firestore doc IDs cannot contain forward slashes
 */
const sanitizeGameId = (gameId) => {
  if (!gameId) return null
  // Replace forward slashes with double underscores
  return String(gameId).replace(/\//g, '__')
}

/**
 * Get a single game document reference
 */
const getGameDoc = (userId, gameId) => {
  if (!db) return null
  const sanitizedId = sanitizeGameId(gameId)
  if (!sanitizedId) return null
  return doc(db, 'users', userId, 'games', sanitizedId)
}

/**
 * Sync a single game to Firestore
 */
/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
const cleanUndefinedValues = (obj) => {
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // Recursively clean nested objects (but not arrays)
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanUndefinedValues(value)
      } else {
        cleaned[key] = value
      }
    }
  }
  return cleaned
}

export const syncGameToFirestore = async (userId, game) => {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  try {
    const gameRef = getGameDoc(userId, game.id)
    if (!gameRef) {
      throw new Error('Invalid game ID: ' + game.id)
    }

    // Clean undefined values - Firestore doesn't accept them
    const cleanedGame = cleanUndefinedValues(game)

    await setDoc(gameRef, {
      ...cleanedGame,
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
      const games = snapshot.docs.map(doc => {
        const data = doc.data()
        // Use the original game ID from the data, not the sanitized doc.id
        return {
          ...data,
          id: data.id || doc.id
        }
      })
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

/**
 * Get all games for a user (one-time fetch for shared profiles)
 */
export const getUserGames = async (userId) => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured')
  }

  try {
    const gamesRef = getGamesCollection(userId)
    if (!gamesRef) {
      throw new Error('Could not access user games')
    }

    const q = query(gamesRef, orderBy('customOrder', 'asc'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: data.id || doc.id
      }
    })
  } catch (error) {
    console.error('Error fetching user games:', error)
    throw error
  }
}

/**
 * Get user's profile data (display name, username, etc.)
 */
export const getUserProfile = async (userId) => {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Get user's display name from their profile
 */
export const getUserDisplayName = async (userId) => {
  const profile = await getUserProfile(userId)
  return profile?.displayName || profile?.name || null
}

/**
 * Create a URL-friendly username from display name
 */
const createUsername = (displayName) => {
  if (!displayName) return null
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
}

/**
 * Save user profile data (display name, etc.)
 */
export const saveUserProfile = async (userId, profileData) => {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  try {
    const userRef = doc(db, 'users', userId)
    
    // Create username from display name
    const username = createUsername(profileData.displayName)
    
    await setDoc(userRef, {
      ...cleanUndefinedValues(profileData),
      username,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return username
  } catch (error) {
    console.error('Error saving user profile:', error)
    throw error
  }
}

/**
 * Look up user ID by username
 */
export const getUserIdByUsername = async (username) => {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  try {
    const { query: firestoreQuery, where, collection: firestoreCollection, limit } = await import('firebase/firestore')
    const usersRef = firestoreCollection(db, 'users')
    const q = firestoreQuery(usersRef, where('username', '==', username.toLowerCase()), limit(1))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    return snapshot.docs[0].id
  } catch (error) {
    console.error('Error looking up user by username:', error)
    return null
  }
}
