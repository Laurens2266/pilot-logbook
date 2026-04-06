import { useState, useMemo } from 'react'
import { min2hhmm, fmtDate } from '../lib/timeUtils'

function roleLabel(f) {
  if (f.pic)     return { label: 'PIC',  cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' }
  if (f.fi)      return { label: 'FI',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' }
  if (f.coPilot) return { label: 'Co-P', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' }
  if (f.dual)    return { label: 'Dual', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' }
  return { label: '—', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' }
}

export default function LogbookPage({ flights, onAdd, onEdit, connected, onConnect }) {
  const [search, setSearch] = useState('')

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
        {/* Dropbox cloud icon */}
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.25 5.25 0 011.524 10.32A4.5 4.5 0 0117.25 19.5H6.75z" />
          </svg>
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Connect Dropbox</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Connect your Dropbox account to access and sync your logbook across devices.
          </p>
        </div>
        <button
          onClick={onConnect}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-500/25"
        >
          Connect Dropbox
        </button>
      </div>
    )
  }

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

      {/* Search bar */}
      <div className="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            placeholder="Search by date, aircraft, route, PIC…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scroll-smooth-ios bg-white dark:bg-gray-950">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-slate-600 dark:text-slate-400">
                {search ? 'No flights match your search' : 'No flights yet'}
              </p>
              {!search && (
                <p className="text-sm mt-1 text-slate-400 dark:text-slate-500">Tap + to log your first flight</p>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-slate-50 dark:bg-gray-900 sticky top-0 z-10 border-b border-slate-200 dark:border-gray-800">
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Aircraft</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Route</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Ldg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filtered.map((flight) => {
                const role = roleLabel(flight)
                return (
                  <tr
                    key={flight.id}
                    onClick={() => onEdit(flight)}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-gray-900 active:bg-sky-50 dark:active:bg-sky-950/30"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                      {fmtDate(flight.date)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-wide">{flight.registration}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{flight.model}</div>
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                        <span>{flight.from}</span>
                        <span className="mx-1.5 text-slate-300 dark:text-slate-600">→</span>
                        <span>{flight.to}</span>
                        {flight.crossCountry && (
                          <span className="ml-2 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/40 px-1.5 py-0.5 rounded">XC</span>
                        )}
                      </div>
                      {flight.nameOfPIC && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">{flight.nameOfPIC}</div>
                      )}
                      {flight.comments && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 italic truncate">{flight.comments}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">
                      {min2hhmm(flight.totalFlightTime)}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${role.cls}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 tabular-nums">
                      {flight.landings}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer totals */}
      {filtered.length > 0 && (
        <div className="bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 px-4 py-2.5 flex justify-between items-center text-xs flex-shrink-0">
          <span className="text-slate-400 dark:text-slate-500 font-medium">
            {filtered.length} flight{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            {min2hhmm(totalMinutes)}
            <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">total</span>
          </span>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onAdd}
        className="fixed bottom-28 right-5 w-14 h-14 bg-sky-500 active:bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-500/30 flex items-center justify-center z-20 select-none transition-colors"
        aria-label="Add flight"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}
