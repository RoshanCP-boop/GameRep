import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  browserPopupRedirectResolver
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase'
import { saveUserProfile, getUserProfile } from '../services/firestoreService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if Firebase is configured
  const firebaseEnabled = isFirebaseConfigured()

  useEffect(() => {
    // If Firebase isn't configured, just set loading to false
    if (!firebaseEnabled || !auth) {
      setLoading(false)
      return
    }

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      // Fetch or create username if user is logged in
      if (user) {
        try {
          console.log('Fetching profile for user:', user.uid, 'displayName:', user.displayName)
          const profile = await getUserProfile(user.uid)
          console.log('Got profile:', profile)
          
          // If user doesn't have a username yet, create one
          if (!profile?.username) {
            console.log('No username found, creating one...')
            const newUsername = await saveUserProfile(user.uid, {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            })
            console.log('Created username:', newUsername)
            setUsername(newUsername)
          } else {
            console.log('Using existing username:', profile.username)
            setUsername(profile.username)
          }
        } catch (err) {
          console.error('Error fetching/creating username:', err)
        }
      } else {
        setUsername(null)
      }
      
      setLoading(false)
    }, (error) => {
      console.error('Auth state change error:', error)
      setError(error.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [firebaseEnabled])

  const signInWithGoogle = async () => {
    if (!firebaseEnabled || !auth || !googleProvider) {
      setError('Firebase is not configured. Please add your Firebase config to .env')
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      setError(null)
      // Use browserPopupRedirectResolver to ensure popup behavior
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
      
      // Save user profile to Firestore (for shared profile display name)
      if (result.user) {
        const userUsername = await saveUserProfile(result.user.uid, {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        })
        setUsername(userUsername)
      }
      
      return { success: true, user: result.user, isNewUser: result._tokenResponse?.isNewUser }
    } catch (error) {
      console.error('Sign in error:', error)
      // If popup was blocked, the error code will be 'auth/popup-blocked'
      if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.')
      } else {
        setError(error.message)
      }
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    if (!firebaseEnabled || !auth) {
      return
    }

    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      setError(error.message)
    }
  }

  const value = {
    user,
    username,
    loading,
    error,
    firebaseEnabled,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
