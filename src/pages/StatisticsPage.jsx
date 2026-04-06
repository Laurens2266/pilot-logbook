import { useMemo } from 'react'
import { min2hhmm, withinDays } from '../lib/timeUtils'

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-800   dark:bg-blue-950  dark:text-blue-300',
    green:  'bg-green-50  text-green-800  dark:bg-green-950 dark:text-green-300',
    amber:  'bg-amber-50  text-amber-800  dark:bg-amber-950 dark:text-amber-300',
    purple: 'bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    gray:   'bg-gray-50   text-gray-700   dark:bg-gray-800  dark:text-gray-300',
    red:    'bg-red-50    text-red-800    dark:bg-red-950   dark:text-red-300',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold font-mono">{value || '—'}</div>
      <div className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-70">{label}</div>
    </div>
  )
}

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

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No flight data yet</p>
        <p className="text-sm mt-1 dark:text-gray-500">Add flights to see statistics</p>
      </div>
    )
  }

  const sectionCls = "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
  const thCls = "text-xs font-semibold text-gray-500 dark:text-gray-400"

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5 pb-10">

      {/* ── Totals ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Hours" value={min2hhmm(s.total)} color="blue" />
        <StatCard label="Flights"     value={flights.length}    color="blue" />
        <StatCard label="Landings"    value={s.landings}        color="blue" />
      </div>

      {/* ── Time breakdown ── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Time Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="PIC"              value={min2hhmm(s.pic)     || '—'} color="green"  />
          <StatCard label="Dual"             value={min2hhmm(s.dual)    || '—'} color="amber"  />
          <StatCard label="Co-Pilot"         value={min2hhmm(s.coPilot) || '—'} color="purple" />
          <StatCard label="Flight Instructor" value={min2hhmm(s.fi)     || '—'} color="gray"   />
          <StatCard label="Cross Country"    value={min2hhmm(s.cc)      || '—'} color="green"  />
          <StatCard label="Night"            value={min2hhmm(s.night)   || '—'} color="gray"   />
        </div>
      </section>

      {/* ── 90-day currency ── */}
      <section className={sectionCls}>
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Last 90 Days</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">{s.recentCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Flights</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">{min2hhmm(s.recentHours) || '0:00'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hours</div>
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${s.recentLandings >= 3 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {s.recentLandings}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Landings</div>
          </div>
        </div>
        {s.recentLandings < 3 && (
          <p className="mt-3 text-xs text-red-500 text-center font-medium">
            Fewer than 3 landings in last 90 days — check your currency requirements
          </p>
        )}
      </section>

      {/* ── Monthly chart ── */}
      <section className={sectionCls}>
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Hours per Month (last 12)</h3>
        <div className="flex items-end gap-1" style={{ height: 110 }}>
          {s.monthly.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              {m.mins > 0 && (
                <span className="text-gray-600 dark:text-gray-400 font-mono leading-none mb-0.5" style={{ fontSize: 9 }}>
                  {min2hhmm(m.mins)}
                </span>
              )}
              <div
                className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all"
                style={{ height: `${Math.round((m.mins / maxBar) * 72)}px`, minHeight: m.mins > 0 ? 3 : 0 }}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 leading-none">{m.label}</span>
              {m.year && <span className="text-gray-300 dark:text-gray-600 leading-none" style={{ fontSize: 9 }}>{m.year}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── By year ── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide p-4 pb-2">By Year</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className={`text-left  px-4 py-2 ${thCls}`}>Year</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Flt</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Total</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>PIC</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Dual</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Ldg</th>
            </tr>
          </thead>
          <tbody>
            {s.byYear.map(([yr, d]) => (
              <tr key={yr} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100">{yr}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">{d.flights}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">{min2hhmm(d.total)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">{min2hhmm(d.pic)  || '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">{min2hhmm(d.dual) || '—'}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">{d.landings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── By aircraft type ── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide p-4 pb-2">By Aircraft Type</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className={`text-left  px-4 py-2 ${thCls}`}>Type</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Flights</th>
              <th className={`text-right px-3 py-2 ${thCls}`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {s.byType.map(([type, d]) => (
              <tr key={type} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{type}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">{d.flights}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">{min2hhmm(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  )
}
