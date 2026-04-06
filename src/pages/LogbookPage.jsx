import { useState, useMemo } from 'react'
import { min2hhmm, fmtDate } from '../lib/timeUtils'

function roleLabel(f) {
  if (f.pic)     return { label: 'PIC',  cls: 'bg-blue-100 text-blue-700' }
  if (f.fi)      return { label: 'FI',   cls: 'bg-green-100 text-green-700' }
  if (f.coPilot) return { label: 'Co-P', cls: 'bg-purple-100 text-purple-700' }
  if (f.dual)    return { label: 'Dual', cls: 'bg-amber-100 text-amber-700' }
  return { label: '—', cls: 'bg-gray-100 text-gray-500' }
}

export default function LogbookPage({ flights, onAdd, onEdit }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flights
    return flights.filter(f =>
      [f.date, f.registration, f.model, f.from, f.to, f.nameOfPIC, f.comments]
        .some(v => v && String(v).toLowerCase().includes(q))
    )
  }, [flights, search])

  const totalMinutes = filtered.reduce((s, f) => s + (f.totalFlightTime || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <input
          type="search"
          placeholder="Search by date, aircraft, route, PIC…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
            <svg className="w-16 h-16 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-lg font-medium text-gray-500">
              {search ? 'No flights match your search' : 'No flights yet'}
            </p>
            {!search && <p className="text-sm mt-1">Tap + to log your first flight</p>}
          </div>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">Aircraft</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">Route</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">Time</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">Role</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">Landings</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((flight, i) => {
                const role = roleLabel(flight)
                return (
                  <tr
                    key={flight.id}
                    onClick={() => onEdit(flight)}
                    className={`border-b border-gray-100 active:bg-blue-50 cursor-pointer
                      ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{fmtDate(flight.date)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{flight.registration}</div>
                      <div className="text-xs text-gray-500">{flight.model}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">
                      <div>{flight.from} → {flight.to}</div>
                      {flight.nameOfPIC && <div className="text-xs text-gray-500">{flight.nameOfPIC}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                      {min2hhmm(flight.totalFlightTime)}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${role.cls}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{flight.landings}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer totals */}
      {filtered.length > 0 && (
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex justify-between text-sm text-gray-600 flex-shrink-0">
          <span>{filtered.length} flight{filtered.length !== 1 ? 's' : ''}</span>
          <span className="font-mono font-semibold">{min2hhmm(totalMinutes)} total</span>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onAdd}
        className="fixed bottom-20 right-5 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl font-light active:bg-blue-700 z-20 select-none"
        aria-label="Add flight"
      >
        +
      </button>
    </div>
  )
}
