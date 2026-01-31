import { useGameStore } from '../hooks/useGameStore.jsx'

export default function TabNav({ activeTab, onTabChange }) {
  const { games } = useGameStore()
  
  const unplayedCount = games.filter(g => g.status === 'unplayed').length
  const playedCount = games.filter(g => g.status === 'played').length

  return (
    <div className="mt-8">
      <nav className="flex gap-3">
        {/* To Play Button */}
        <button
          onClick={() => onTabChange('unplayed')}
          className={`
            px-5 py-3 font-semibold text-sm transition-all duration-200 rounded-xl flex items-center gap-2.5 border
            ${activeTab === 'unplayed' 
              ? 'bg-gradient-to-r from-primary-600/20 to-cyan-600/20 border-primary-500/40 text-primary-300 shadow-lg shadow-primary-900/30' 
              : 'bg-dark-800/50 border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 hover:bg-dark-800'
            }
          `}
        >
          <svg className={`w-5 h-5 ${activeTab === 'unplayed' ? 'text-primary-400' : 'text-dark-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>To Play</span>
          <span className={`
            px-2.5 py-1 rounded-lg text-xs font-bold
            ${activeTab === 'unplayed' 
              ? 'bg-primary-500/20 text-primary-300' 
              : 'bg-dark-700 text-dark-400'
            }
          `}>
            {unplayedCount}
          </span>
        </button>

        {/* Played Button */}
        <button
          onClick={() => onTabChange('played')}
          className={`
            px-5 py-3 font-semibold text-sm transition-all duration-200 rounded-xl flex items-center gap-2.5 border
            ${activeTab === 'played' 
              ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/40 text-green-300 shadow-lg shadow-green-900/30' 
              : 'bg-dark-800/50 border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 hover:bg-dark-800'
            }
          `}
        >
          <svg className={`w-5 h-5 ${activeTab === 'played' ? 'text-green-400' : 'text-dark-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Played</span>
          <span className={`
            px-2.5 py-1 rounded-lg text-xs font-bold
            ${activeTab === 'played' 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-dark-700 text-dark-400'
            }
          `}>
            {playedCount}
          </span>
        </button>
      </nav>
    </div>
  )
}
