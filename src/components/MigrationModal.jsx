import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useGameStore } from '../hooks/useGameStore'
import { migrateLocalGamesToFirestore } from '../services/firestoreService'

export default function MigrationModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const { getLocalGames, clearLocalGames } = useGameStore()
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState(null)

  const localGames = getLocalGames()
  const gameCount = localGames.length

  if (!isOpen || gameCount === 0) return null

  const handleMigrate = async () => {
    if (!user?.uid) return

    setMigrating(true)
    try {
      const result = await migrateLocalGamesToFirestore(user.uid, localGames)
      if (result.success) {
        setResult({ success: true, count: result.count })
        // Clear local games after successful migration
        clearLocalGames()
        // Close after a short delay
        setTimeout(() => {
          onClose()
          setResult(null)
        }, 2000)
      } else {
        setResult({ success: false, error: result.error || 'Migration failed' })
      }
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setMigrating(false)
    }
  }

  const handleSkip = () => {
    // Clear local games to start fresh
    clearLocalGames()
    onClose()
  }

  const handleKeepLocal = () => {
    // Just close without clearing - user can access local games when signed out
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl max-w-md w-full overflow-hidden animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Your Games?</h2>
              <p className="text-sm text-dark-400">We found games saved on this device</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {result ? (
            <div className={`text-center py-4 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? (
                <>
                  <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">Successfully imported {result.count} games!</p>
                  <p className="text-sm text-dark-400 mt-1">Your collection is now synced</p>
                </>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">Import failed</p>
                  <p className="text-sm text-dark-400 mt-1">{result.error}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="bg-dark-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-dark-300">Games found:</span>
                  <span className="text-2xl font-bold text-white">{gameCount}</span>
                </div>
              </div>
              
              <p className="text-sm text-dark-400 mb-6">
                Would you like to import these games to your account? They'll sync across all your devices.
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleMigrate}
                  disabled={migrating}
                  className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {migrating ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import {gameCount} games
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleSkip}
                  disabled={migrating}
                  className="w-full py-3 px-4 bg-dark-800 hover:bg-dark-700 text-dark-300 font-medium rounded-xl transition-colors"
                >
                  Start fresh instead
                </button>
                
                <button
                  onClick={handleKeepLocal}
                  disabled={migrating}
                  className="w-full py-2 text-sm text-dark-500 hover:text-dark-400 transition-colors"
                >
                  Decide later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
