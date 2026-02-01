import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getCountry, setCountry, COUNTRIES } from '../api/itad'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ onRegionChange, onOpenStats, onOpenRandomPicker }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentCountry, setCurrentCountry] = useState(getCountry())
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const userButtonRef = useRef(null)

  // Capture the install prompt
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  // Update menu position when opening
  useEffect(() => {
    if (showUserMenu && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [showUserMenu])

  
  const { user, username, isPublic, isAuthenticated, loading, signInWithGoogle, signOut, togglePrivacy, firebaseEnabled } = useAuth()
  
  const countryInfo = COUNTRIES[currentCountry]

  const handleCountryChange = (code) => {
    setCountry(code)
    setCurrentCountry(code)
    setShowDropdown(false)
    if (onRegionChange) {
      onRegionChange(code)
    }
    // Reload to fetch new prices
    window.location.reload()
  }

  const handleSignIn = async () => {
    await signInWithGoogle()
    // Games sync automatically via Firestore subscription
  }

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 relative">
      {/* Gradient glow below header - fades downward */}
      <div className="absolute top-full left-0 right-0 h-20 pointer-events-none bg-gradient-to-b from-blue-500/15 via-purple-500/10 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
            <img 
              src="/logo.svg" 
              alt="GameRep Logo" 
              className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">GameRep</h1>
              <p className="text-sm text-dark-400 hidden lg:block">Your personal games repository</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Install App Button */}
            {installPrompt && !isInstalled && (
                      <button
                        onClick={handleInstall}
                        className="p-2 sm:px-3 sm:py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-lg sm:rounded-xl transition-all text-sm flex items-center gap-2"
                        title="Install App"
                      >
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="text-primary-400 hidden md:inline">Install</span>
                      </button>
            )}

            {/* Random Picker Button */}
            <button
              onClick={onOpenRandomPicker}
              className="p-2 sm:p-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 rounded-lg sm:rounded-xl transition-all group"
              title="Random Picker (R)"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-dark-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {/* Shuffle */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
            </button>
            
            {/* Dashboard Button */}
            <button
              onClick={onOpenStats}
              className="p-2 sm:p-2.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 rounded-lg sm:rounded-xl transition-all group"
              title="Dashboard (D)"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-dark-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            
            {/* Region Selector - hidden until xl screens */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 rounded-xl transition-all text-sm"
              >
                <span className="text-dark-400">Region:</span>
                <span className="font-medium text-white">{countryInfo?.name || currentCountry}</span>
                <span className="text-dark-400">({countryInfo?.currency})</span>
                <svg className={`w-4 h-4 text-dark-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 surface-elevated rounded-xl z-20 overflow-hidden animate-fade-in">
                    {Object.entries(COUNTRIES).map(([code, info]) => (
                      <button
                        key={code}
                        onClick={() => handleCountryChange(code)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-dark-700 transition-colors ${
                          code === currentCountry ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
                        }`}
                      >
                        <span className="font-medium text-white">{info.name}</span>
                        <span className="text-dark-400">{info.symbol} {info.currency}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Auth Section */}
            {firebaseEnabled && (
              <div className="relative ml-1 sm:ml-2 shrink-0">
                {loading ? (
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-dark-700 animate-pulse" />
                ) : isAuthenticated && user ? (
                  <>
                    <button
                      ref={userButtonRef}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center p-0.5 sm:p-1 rounded-full hover:bg-white/10 transition-all"
                      title={user.displayName || user.email}
                    >
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-primary-500/50"
                        />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </button>
                    
                    {showUserMenu && createPortal(
                      <>
                        <div 
                          className="fixed inset-0 z-[9999]"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <div 
                          className="fixed w-56 sm:w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl z-[10000] overflow-hidden animate-fade-in shadow-2xl"
                          style={{ top: menuPosition.top, right: Math.max(8, menuPosition.right) }}
                        >
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="font-medium text-white truncate">{user.displayName}</p>
                            <p className="text-xs text-dark-400 truncate">{user.email}</p>
                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Syncing across devices
                            </p>
                          </div>
                          
                          {/* Region selector in dropdown */}
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-xs text-dark-400 mb-2">Region</p>
                            <select
                              value={currentCountry}
                              onChange={(e) => handleCountryChange(e.target.value)}
                              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                            >
                              {Object.entries(COUNTRIES).map(([code, info]) => (
                                <option key={code} value={code} className="bg-dark-900">
                                  {info.name} ({info.symbol} {info.currency})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Privacy Toggle */}
                          <div className="px-4 py-3 border-b border-white/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-white">Public Collection</p>
                                <p className="text-xs text-dark-400">Anyone can view your games</p>
                              </div>
                              <button
                                onClick={togglePrivacy}
                                className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-primary-600' : 'bg-dark-600'}`}
                              >
                                <span 
                                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'left-6' : 'left-1'}`}
                                />
                              </button>
                            </div>
                          </div>
                          
                          {/* Friends Page Link */}
                          <a
                            href="/friends"
                            onClick={(e) => {
                              e.preventDefault()
                              setShowUserMenu(false)
                              window.location.href = '/friends'
                            }}
                            className="w-full px-4 py-3 text-left text-dark-200 hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/10"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Friends
                          </a>
                          
                          {/* Share Profile Link */}
                          <button
                            onClick={() => {
                              // Use username if available, otherwise fall back to uid
                              const shareUrl = `${window.location.origin}/u/${username || user.uid}`
                              navigator.clipboard.writeText(shareUrl)
                              // Show brief feedback
                              const btn = document.getElementById('share-btn')
                              if (btn) {
                                btn.textContent = 'Link copied!'
                                setTimeout(() => {
                                  btn.textContent = 'Share collection'
                                }, 2000)
                              }
                            }}
                            id="share-btn"
                            className="w-full px-4 py-3 text-left text-dark-200 hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share collection
                          </button>
                          
                          <button
                            onClick={handleSignOut}
                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </>,
                      document.body
                    )}
                  </>
                ) : (
                    <button
                      onClick={handleSignIn}
                      className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg sm:rounded-xl transition-all text-sm shrink-0"
                      title="Sign in to sync across devices"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-white hidden md:inline">Sign in</span>
                    </button>
                )}
              </div>
            )}
            
                    {/* Guest mode indicator */}
                    {firebaseEnabled && !isAuthenticated && !loading && (
                      <span className="text-xs text-dark-500 hidden xl:block ml-1">
                        to sync
                      </span>
                    )}

                    <a 
                      href="https://isthereanydeal.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-dark-500 hover:text-primary-400 transition-colors hidden lg:block ml-2"
                    >
                      Powered by ITAD
                    </a>
          </div>
        </div>
      </div>
    </header>
  )
}
