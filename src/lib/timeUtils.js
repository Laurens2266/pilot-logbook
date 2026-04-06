// Convert "H:mm" or "HH:mm" string to minutes integer, returns null if invalid/empty
export function hhmm2min(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// Convert minutes integer to "H:mm" display string
export function min2hhmm(min) {
  if (min === null || min === undefined || min === '') return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

// Format ISO date "2024-02-07" to "07 Feb 2024"
export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ISO date string for today
export function today() {
  return new Date().toISOString().slice(0, 10)
}

// Check if ISO date is within the last N days
export function withinDays(iso, days) {
  if (!iso) return false
  const then = new Date(iso + 'T00:00:00').getTime()
  return Date.now() - then <= days * 86400_000
}

// Sum a minute-valued field across an array of flights
export function sumField(flights, field) {
  return flights.reduce((s, f) => s + (f[field] || 0), 0)
}
