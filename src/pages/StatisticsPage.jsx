import { useMemo } from 'react'
import { min2hhmm, withinDays } from '../lib/timeUtils'

// ── Stat card variants ────────────────────────────────────────────────────────

const cardVariants = {
  sky:     'bg-sky-50    dark:bg-sky-950/40    border-sky-100    dark:border-sky-900/50  text-sky-900    dark:text-sky-100',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-100',
  amber:   'bg-amber-50  dark:bg-amber-950/40  border-amber-100  dark:border-amber-900/50 text-amber-900  dark:text-amber-100',
  violet:  'bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50 text-violet-900 dark:text-violet-100',
  slate:   'bg-slate-50  dark:bg-gray-800/60   border-slate-200  dark:border-gray-700    text-slate-900  dark:text-slate-100',
  indigo:  'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-100',
}

const labelVariants = {
  sky:     'text-sky-500    dark:text-sky-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber:   'text-amber-600  dark:text-amber-400',
  violet:  'text-violet-600 dark:text-violet-400',
  slate:   'text-slate-500  dark:text-slate-400',
  indigo:  'text-indigo-600 dark:text-indigo-400',
}

function StatCard({ label, value, color = 'sky' }) {
  return (
    <div className={`rounded-xl p-4 border ${cardVariants[color]}`}>
      <div className="text-2xl font-bold font-mono tabular-nums leading-none">{value || '—'}</div>
      <div className={`text-[11px] font-semibold uppercase tracking-wider mt-2 ${labelVariants[color]}`}>{label}</div>
    </div>
  )
}

// ── Currency dot indicator ────────────────────────────────────────────────────

function CurrencyDot({ ok }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  )
}

// ── Statistics page ───────────────────────────────────────────────────────────

export default function StatisticsPage({ flights }) {
  const s = useMemo(() => {
    const sum = field => flights.reduce((acc, f) => acc + (f[field] || 0), 0)

    const total    = sum('totalFlightTime')
    const pic      = sum('pic')
    const dual     = sum('dual')
    const coPilot  = sum('coPilot')
    const fi       = sum('fi')
    const cc       = flights.filter(f => f.crossCountry).reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)
    const night    = flights.filter(f => f.night).reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)
    const landings = sum('landings')
    const se       = flights.filter(f => f.se).reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)

    const recent         = flights.filter(f => withinDays(f.date, 90))
    const recentHours    = recent.reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)
    const recentLandings = recent.reduce((acc, f) => acc + (f.landings || 0), 0)

    const byYearMap = {}
    for (const f of flights) {
      const yr = (f.date || '').slice(0, 4)
      if (!yr) continue
      if (!byYearMap[yr]) byYearMap[yr] = { total: 0, pic: 0, dual: 0, flights: 0, landings: 0 }
      byYearMap[yr].total    += f.totalFlightTime || 0
      byYearMap[yr].pic      += f.pic             || 0
      byYearMap[yr].dual     += f.dual            || 0
      byYearMap[yr].flights  += 1
      byYearMap[yr].landings += f.landings        || 0
    }
    const byYear = Object.entries(byYearMap).sort((a, b) => b[0].localeCompare(a[0]))

    const byTypeMap = {}
    for (const f of flights) {
      const key = f.model || 'Unknown'
      if (!byTypeMap[key]) byTypeMap[key] = { total: 0, flights: 0 }
      byTypeMap[key].total   += f.totalFlightTime || 0
      byTypeMap[key].flights += 1
    }
    const byType = Object.entries(byTypeMap).sort((a, b) => b[1].total - a[1].total)

    const now = new Date()
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const d     = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-GB', { month: 'short' })
      const year  = d.getFullYear() !== now.getFullYear() ? String(d.getFullYear()).slice(2) : ''
      const mins  = flights
        .filter(f => (f.date || '').startsWith(key))
        .reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)
      return { key, label, year, mins }
    })

    return {
      total, pic, dual, coPilot, fi, cc, night, se, landings,
      recentHours, recentLandings, recentCount: recent.length,
      byYear, byType, monthly,
    }
  }, [flights])

  const maxBar = Math.max(...s.monthly.map(m => m.mins), 1)
  const currencyOk = s.recentLandings >= 3

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-slate-600 dark:text-slate-400">No flight data yet</p>
          <p className="text-sm mt-1 text-slate-400 dark:text-slate-500">Add flights to see statistics</p>
        </div>
      </div>
    )
  }

  const cardCls = "bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800"
  const thCls = "text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
  const sectionHeaderCls = "text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3"

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-10 scroll-smooth-ios bg-slate-50 dark:bg-gray-950">

      {/* ── Totals ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Hours" value={min2hhmm(s.total)} color="sky" />
        <StatCard label="Flights"     value={flights.length}    color="sky" />
        <StatCard label="Landings"    value={s.landings}        color="sky" />
      </div>

      {/* ── Time breakdown ── */}
      <section>
        <h3 className={sectionHeaderCls}>Time Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="PIC"               value={min2hhmm(s.pic)     || '—'} color="emerald" />
          <StatCard label="Dual"              value={min2hhmm(s.dual)    || '—'} color="amber"   />
          <StatCard label="Co-Pilot"          value={min2hhmm(s.coPilot) || '—'} color="violet"  />
          <StatCard label="Flight Instructor" value={min2hhmm(s.fi)      || '—'} color="slate"   />
          <StatCard label="Cross Country"     value={min2hhmm(s.cc)      || '—'} color="emerald" />
          <StatCard label="Night"             value={min2hhmm(s.night)   || '—'} color="indigo"  />
        </div>
      </section>

      {/* ── 90-day currency ── */}
      <section className={`${cardCls} p-4`}>
        <h3 className={sectionHeaderCls}>Last 90 Days</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">{s.recentCount}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Flights</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">{min2hhmm(s.recentHours) || '0:00'}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hours</div>
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono tabular-nums ${currencyOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {s.recentLandings}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Landings</div>
          </div>
        </div>
        {/* Currency status row */}
        <div className={`mt-4 pt-3 border-t ${currencyOk ? 'border-emerald-100 dark:border-emerald-900/40' : 'border-red-100 dark:border-red-900/40'}`}>
          <p className={`text-xs font-medium text-center ${currencyOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            <CurrencyDot ok={currencyOk} />
            {currencyOk
              ? '3-landing currency satisfied'
              : 'Fewer than 3 landings in last 90 days — check your currency requirements'}
          </p>
        </div>
      </section>

      {/* ── Monthly chart ── */}
      <section className={`${cardCls} p-4`}>
        <h3 className={sectionHeaderCls}>Hours per Month (last 12)</h3>
        <div className="flex items-end gap-1" style={{ height: 110 }}>
          {s.monthly.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              {m.mins > 0 && (
                <span className="text-slate-500 dark:text-slate-400 font-mono leading-none mb-0.5" style={{ fontSize: 9 }}>
                  {min2hhmm(m.mins)}
                </span>
              )}
              <div
                className="w-full bg-sky-500 dark:bg-sky-600 rounded-t transition-all"
                style={{ height: `${Math.round((m.mins / maxBar) * 72)}px`, minHeight: m.mins > 0 ? 3 : 0 }}
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mt-1">{m.label}</span>
              {m.year && (
                <span className="text-slate-300 dark:text-slate-600 leading-none" style={{ fontSize: 9 }}>{m.year}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── By year ── */}
      <section className={`${cardCls} overflow-hidden`}>
        <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-4 pb-2">By Year</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 dark:border-gray-800">
            <tr>
              <th className={`text-left  px-4 py-2 ${thCls}`}>Year</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Flt</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Total</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>PIC</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Dual</th>
              <th className={`text-right px-4 py-2 ${thCls}`}>Ldg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {s.byYear.map(([yr, d]) => (
              <tr key={yr}>
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">{yr}</td>
                <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums">{d.flights}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{min2hhmm(d.total)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">{min2hhmm(d.pic)  || '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">{min2hhmm(d.dual) || '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums">{d.landings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── By aircraft type ── */}
      <section className={`${cardCls} overflow-hidden`}>
        <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-4 pb-2">By Aircraft Type</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 dark:border-gray-800">
            <tr>
              <th className={`text-left  px-4 py-2 ${thCls}`}>Type</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Flights</th>
              <th className={`text-right px-4 py-2 ${thCls}`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {s.byType.map(([type, d]) => (
              <tr key={type}>
                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{type}</td>
                <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums">{d.flights}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{min2hhmm(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  )
}
