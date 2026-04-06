import { useState, useEffect } from 'react'
import LogbookPage from './pages/LogbookPage'
import FlightFormPage from './pages/FlightFormPage'
import StatisticsPage from './pages/StatisticsPage'
import SettingsPage from './pages/SettingsPage'
import {
  isConnected, handleOAuthCallback, downloadLogbook,
  uploadLogbook, startOAuthFlow, disconnect,
} from './lib/dropbox'

const STORAGE_KEY = 'logbook_flights'

function sortFlights(flights) {
  return [...flights].sort((a, b) => {
    const d = b.date.localeCompare(a.date)
    return d !== 0 ? d : (b.flightStart || '').localeCompare(a.flightStart || '')
  })
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconBook({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function IconChart({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconCog({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState('logbook')
  const [flights, setFlights] = useState([])
  const [editingFlight, setEditingFlight] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | synced | error
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    // Handle Dropbox OAuth callback
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      try {
        await handleOAuthCallback(code)
        window.history.replaceState({}, '', window.location.pathname)
        setConnected(true)
        await syncDown()
      } catch (e) {
        console.error('OAuth error:', e)
      }
      setLoading(false)
      return
    }

    // Load cached data first so the UI is instant
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try { setFlights(JSON.parse(cached)) } catch {}
    }

    if (isConnected()) {
      setConnected(true)
      await syncDown()
    }

    setLoading(false)
  }

  async function syncDown() {
    setSyncStatus('syncing')
    try {
      const data = await downloadLogbook()
      if (data?.flights) {
        const sorted = sortFlights(data.flights)
        setFlights(sorted)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
      }
      setSyncStatus('synced')
    } catch (e) {
      console.error('Sync error:', e)
      setSyncStatus('error')
    }
  }

  async function persistFlights(updated) {
    const sorted = sortFlights(updated)
    setFlights(sorted)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))

    if (connected) {
      setSyncStatus('syncing')
      try {
        await uploadLogbook({ version: 1, flights: sorted })
        setSyncStatus('synced')
      } catch (e) {
        console.error('Upload error:', e)
        setSyncStatus('error')
      }
    }
  }

  function handleAddFlight() {
    setEditingFlight(null)
    setPage('form')
  }

  function handleEditFlight(flight) {
    setEditingFlight(flight)
    setPage('form')
  }

  async function handleSaveFlight(flightData) {
    const updated = flightData.id
      ? flights.map(f => f.id === flightData.id ? flightData : f)
      : [...flights, { ...flightData, id: crypto.randomUUID() }]
    await persistFlights(updated)
    setPage('logbook')
  }

  async function handleDeleteFlight(id) {
    await persistFlights(flights.filter(f => f.id !== id))
    setPage('logbook')
  }

  function handleDisconnect() {
    disconnect()
    setConnected(false)
    setSyncStatus('idle')
  }

  const navItems = [
    { id: 'logbook',  label: 'Logbook',    Icon: IconBook  },
    { id: 'stats',    label: 'Statistics', Icon: IconChart },
    { id: 'settings', label: 'Settings',   Icon: IconCog   },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading logbook…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white px-4 py-3 pt-safe flex items-center justify-between flex-shrink-0">
        <span className="text-lg font-bold tracking-wide">✈ Pilot Logbook</span>
        <span className="text-sm">
          {syncStatus === 'syncing' && (
            <span className="flex items-center gap-1 text-blue-200">
              <span className="w-3 h-3 border-2 border-blue-200 border-t-transparent rounded-full animate-spin inline-block" />
              Syncing
            </span>
          )}
          {syncStatus === 'synced'  && <span className="text-green-300">✓ Synced</span>}
          {syncStatus === 'error'   && <span className="text-red-300">⚠ Sync error</span>}
          {syncStatus === 'idle' && !connected && <span className="text-blue-300">Offline</span>}
        </span>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">
        {page === 'logbook' && (
          <LogbookPage flights={flights} onAdd={handleAddFlight} onEdit={handleEditFlight} />
        )}
        {page === 'form' && (
          <FlightFormPage
            flight={editingFlight}
            onSave={handleSaveFlight}
            onDelete={handleDeleteFlight}
            onCancel={() => setPage('logbook')}
          />
        )}
        {page === 'stats'    && <StatisticsPage flights={flights} />}
        {page === 'settings' && (
          <SettingsPage
            connected={connected}
            syncStatus={syncStatus}
            onConnect={startOAuthFlow}
            onDisconnect={handleDisconnect}
            onSync={syncDown}
          />
        )}
      </main>

      {/* Bottom navigation */}
      {page !== 'form' && (
        <nav className="bg-white border-t border-gray-200 flex flex-shrink-0 pb-safe">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors
                ${page === id ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <Icon active={page === id} />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
