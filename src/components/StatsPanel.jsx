import { useState, useRef } from 'react'
import { useGameStore } from '../hooks/useGameStore.jsx'

export default function StatsPanel({ isOpen, onClose }) {
  const { stats, exportCollection, importCollection, games } = useGameStore()
  const [importMode, setImportMode] = useState('merge')
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = importCollection(event.target.result, importMode)
      setImportResult(result)
      setTimeout(() => setImportResult(null), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-dark-950/95 backdrop-blur-md flex items-start justify-center overflow-y-auto p-4"
      onClick={handleBackdropClick}
    >
      <div className="surface-elevated rounded-2xl max-w-lg w-full my-8 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600/50">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-4">Collection Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-700/50 border border-dark-600/30 rounded-xl p-4">
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-dark-400">Total Games</p>
              </div>
              <div className="bg-dark-700/50 border border-dark-600/30 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-400">{stats.completionRate}%</p>
                <p className="text-sm text-dark-400">Completion Rate</p>
              </div>
              <div className="bg-dark-700/50 border border-dark-600/30 rounded-xl p-4">
                <p className="text-3xl font-bold text-primary-400">{stats.unplayed}</p>
                <p className="text-sm text-dark-400">To Play</p>
              </div>
              <div className="bg-dark-700/50 border border-dark-600/30 rounded-xl p-4">
                <p className="text-3xl font-bold text-purple-400">{stats.played}</p>
                <p className="text-sm text-dark-400">Played</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-dark-500 mb-1">
                <span>Progress</span>
                <span>{stats.played} / {stats.total}</span>
              </div>
              <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>

            {/* Priority Stats */}
            {stats.withPriority > 0 && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-dark-400">{stats.withPriority} prioritized</span>
                </div>
                {stats.highPriority > 0 && (
                  <span className="text-dark-500">({stats.highPriority} high priority)</span>
                )}
              </div>
            )}
          </div>

          {/* Export/Import */}
          <div className="border-t border-dark-800 pt-6">
            <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wide mb-4">Backup & Restore</h3>
            
            <div className="space-y-3">
              {/* Export */}
              <button
                onClick={exportCollection}
                disabled={games.length === 0}
                className="w-full flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-dark-100">Export Collection</p>
                    <p className="text-xs text-dark-500">Download as JSON file</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Import */}
              <div className="p-4 bg-dark-800 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-dark-100">Import Collection</p>
                    <p className="text-xs text-dark-500">Restore from backup file</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-dark-300">Merge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-primary-500"
                    />
                    <span className="text-sm text-dark-300">Replace all</span>
                  </label>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-4 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm font-medium text-dark-200 transition-colors"
                >
                  Choose File
                </button>

                {importResult && (
                  <p className={`mt-2 text-sm ${importResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {importResult.success 
                      ? `Successfully imported ${importResult.count} games!`
                      : `Error: ${importResult.error}`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="border-t border-dark-800 pt-6">
            <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wide mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Focus search</span>
                <kbd className="px-2 py-1 bg-dark-800 rounded text-dark-400 font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Close modal</span>
                <kbd className="px-2 py-1 bg-dark-800 rounded text-dark-400 font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Open dashboard</span>
                <kbd className="px-2 py-1 bg-dark-800 rounded text-dark-400 font-mono">D</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Random picker</span>
                <kbd className="px-2 py-1 bg-dark-800 rounded text-dark-400 font-mono">R</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
