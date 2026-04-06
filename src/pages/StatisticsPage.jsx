import { useMemo } from 'react'
import { min2hhmm, withinDays } from '../lib/timeUtils'

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-800',
    green:  'bg-green-50  text-green-800',
    amber:  'bg-amber-50  text-amber-800',
    purple: 'bg-purple-50 text-purple-800',
    gray:   'bg-gray-50   text-gray-700',
    red:    'bg-red-50    text-red-800',
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
    const cc       = sum('crossCountry')
    const night    = sum('night')
    const landings = sum('landings')
    const se       = flights.filter(f => f.se).reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)

    // Last 90 days
    const recent          = flights.filter(f => withinDays(f.date, 90))
    const recentHours     = recent.reduce((acc, f) => acc + (f.totalFlightTime || 0), 0)
    const recentLandings  = recent.reduce((acc, f) => acc + (f.landings || 0), 0)

    // By year (sorted newest first)
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

    // By aircraft type
    const byTypeMap = {}
    for (const f of flights) {
      const key = f.model || 'Unknown'
      if (!byTypeMap[key]) byTypeMap[key] = { total: 0, flights: 0 }
      byTypeMap[key].total   += f.totalFlightTime || 0
      byTypeMap[key].flights += 1
    }
    const byType = Object.entries(byTypeMap).sort((a, b) => b[1].total - a[1].total)

    // Monthly bars — last 12 months
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
        <p className="text-lg font-medium text-gray-500">No flight data yet</p>
        <p className="text-sm mt-1">Add flights to see statistics</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5 pb-10">

      {/* ── Totals ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Hours"  value={min2hhmm(s.total)}  color="blue" />
        <StatCard label="Flights"      value={flights.length}     color="blue" />
        <StatCard label="Landings"     value={s.landings}         color="blue" />
      </div>

      {/* ── Time breakdown ── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Time Breakdown</h3>
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
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Last 90 Days</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900">{s.recentCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Flights</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-gray-900">{min2hhmm(s.recentHours) || '0:00'}</div>
            <div className="text-xs text-gray-500 mt-0.5">Hours</div>
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${s.recentLandings >= 3 ? 'text-green-600' : 'text-red-500'}`}>
              {s.recentLandings}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Landings</div>
          </div>
        </div>
        {s.recentLandings < 3 && (
          <p className="mt-3 text-xs text-red-500 text-center font-medium">
            Fewer than 3 landings in last 90 days — check your currency requirements
          </p>
        )}
      </section>

      {/* ── Monthly chart ── */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Hours per Month (last 12)</h3>
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {s.monthly.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <div
                className="w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${Math.round((m.mins / maxBar) * 72)}px`, minHeight: m.mins > 0 ? 3 : 0 }}
                title={`${m.label}${m.year ? ' ' + m.year : ''}: ${min2hhmm(m.mins) || '0:00'}`}
              />
              <span className="text-xs text-gray-400 leading-none">{m.label}</span>
              {m.year && <span className="text-xs text-gray-300 leading-none">{m.year}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── By year ── */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide p-4 pb-2">By Year</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left   px-4 py-2 text-xs font-semibold text-gray-500">Year</th>
              <th className="text-right  px-3 py-2 text-xs font-semibold text-gray-500">Flt</th>
              <th className="text-right  px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
              <th className="text-right  px-3 py-2 text-xs font-semibold text-gray-500">PIC</th>
              <th className="text-right  px-3 py-2 text-xs font-semibold text-gray-500">Dual</th>
              <th className="text-right  px-3 py-2 text-xs font-semibold text-gray-500">Ldg</th>
            </tr>
          </thead>
          <tbody>
            {s.byYear.map(([yr, d]) => (
              <tr key={yr} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-semibold text-gray-900">{yr}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{d.flights}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900">{min2hhmm(d.total)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-600">{min2hhmm(d.pic)  || '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-600">{min2hhmm(d.dual) || '—'}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{d.landings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── By aircraft type ── */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide p-4 pb-2">By Aircraft Type</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left  px-4 py-2 text-xs font-semibold text-gray-500">Type</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Flights</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {s.byType.map(([type, d]) => (
              <tr key={type} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-medium text-gray-900">{type}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{d.flights}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900">{min2hhmm(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  )
}
