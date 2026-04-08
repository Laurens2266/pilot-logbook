import { useState, useEffect, useMemo } from 'react'
import { hhmm2min, min2hhmm, today } from '../lib/timeUtils'

const EMPTY_FLIGHT = {
  date: today(),
  registration: '',
  model: '',
  flightStart: '',
  flightEnd: '',
  totalFlightTime: null,
  from: '',
  to: '',
  landings: 1,
  nameOfPIC: '',
  crossCountry: false,
  night: false,
  se: true,
  flightRules: 'VFR',
  pic: null,
  coPilot: null,
  dual: null,
  fi: null,
  comments: '',
}

const ROLES = [
  { key: 'pic',     label: 'PIC' },
  { key: 'coPilot', label: 'Co-Pilot' },
  { key: 'dual',    label: 'Dual' },
  { key: 'fi',      label: 'FI' },
]

function detectRole(flight) {
  if (!flight) return null
  if (flight.pic)     return 'pic'
  if (flight.coPilot) return 'coPilot'
  if (flight.dual)    return 'dual'
  if (flight.fi)      return 'fi'
  return null
}

// ── Shared field components ───────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls = (error) =>
  `w-full min-w-0 px-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100 transition-colors ${
    error
      ? 'border-red-400 dark:border-red-500'
      : 'border-slate-200 dark:border-gray-700 placeholder-slate-400 dark:placeholder-slate-500'
  }`

// ── Autocomplete input ────────────────────────────────────────────────────────

function AutocompleteInput({ field, value, onChange, suggestions, upper = false, maxLength, placeholder, error }) {
  const [open, setOpen] = useState(false)

  const q = (value ?? '').toLowerCase()
  const filtered = useMemo(() =>
    suggestions.filter(s => !q || s.toLowerCase().includes(q)).slice(0, 8),
    [suggestions, q]
  )

  function handleChange(e) {
    const v = upper ? e.target.value.toUpperCase() : e.target.value
    onChange(field, v)
  }

  function select(s) {
    onChange(field, upper ? s.toUpperCase() : s)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value ?? ''}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={inputCls(error)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize={upper ? 'characters' : 'words'}
        spellCheck={false}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => select(s)}
              className="w-full text-left px-3 py-3 text-sm text-slate-700 dark:text-slate-200 active:bg-sky-50 dark:active:bg-sky-950/30 border-b border-slate-100 dark:border-gray-700 last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-4 space-y-4">
      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
      {children}
    </section>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

export default function FlightFormPage({ flight, flights = [], onSave, onDelete, onCancel }) {
  const isEdit = !!flight?.id
  const [form, setForm] = useState(flight ? { ...EMPTY_FLIGHT, ...flight } : { ...EMPTY_FLIGHT })
  const [role, setRole] = useState(() => detectRole(flight))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Suggestion lists derived from previous flights
  const suggestions = useMemo(() => {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort()
    const airports = uniq([...flights.map(f => f.from), ...flights.map(f => f.to)])
    return {
      airports,
      models:  uniq(flights.map(f => f.model)),
      pics:    uniq(flights.map(f => f.nameOfPIC)),
    }
  }, [flights])

  // Auto-calculate total flight time; clear it when times are invalid
  useEffect(() => {
    if (!form.flightStart || !form.flightEnd) return
    const s = hhmm2min(form.flightStart)
    const e = hhmm2min(form.flightEnd)
    if (s !== null && e !== null && e > s) {
      setForm(f => ({ ...f, totalFlightTime: e - s }))
      setErrors(err => ({ ...err, flightEnd: null }))
    } else if (s !== null && e !== null) {
      setForm(f => ({ ...f, totalFlightTime: null }))
    }
  }, [form.flightStart, form.flightEnd])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.date)                              e.date         = 'Required'
    if (!form.registration)                      e.registration = 'Required'
    if (!form.model)                             e.model        = 'Required'
    if (!form.flightStart)                       e.flightStart  = 'Required'
    if (!form.flightEnd)                         e.flightEnd    = 'Required'
    if (form.flightStart && form.flightEnd) {
      const s = hhmm2min(form.flightStart)
      const e2 = hhmm2min(form.flightEnd)
      if (s !== null && e2 !== null && e2 <= s)  e.flightEnd    = 'Must be after departure time'
    }
    if (!form.from || form.from.length < 3)      e.from         = '3–4 letter ICAO code'
    if (!form.to   || form.to.length   < 3)      e.to           = '3–4 letter ICAO code'
    if (!form.nameOfPIC)                         e.nameOfPIC    = 'Required'
    if (form.landings === '' || form.landings === null) e.landings = 'Required'
    if (!role)                                   e.role         = 'Select your role'
    return e
  }

  // Live time error shown below arrival field
  const timeOrderError = form.flightStart && form.flightEnd && (() => {
    const s = hhmm2min(form.flightStart)
    const e = hhmm2min(form.flightEnd)
    return s !== null && e !== null && e <= s
  })()

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const roleFields = { pic: null, coPilot: null, dual: null, fi: null }
      if (role) roleFields[role] = form.totalFlightTime
      await onSave({
        ...form,
        ...roleFields,
        registration: form.registration.toUpperCase(),
        from:         form.from.toUpperCase(),
        to:           form.to.toUpperCase(),
        landings:     Number(form.landings),
        crossCountry: !!form.crossCountry,
        night:        !!form.night,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    await onDelete(flight.id)
    setSaving(false)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-gray-950 scroll-smooth-ios">

      {/* Sticky header */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onCancel}
          className="text-sky-500 font-medium text-sm px-1 py-1 active:text-sky-700"
        >
          Cancel
        </button>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-[15px]">
          {isEdit ? 'Edit Flight' : 'New Flight'}
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-500 active:bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-3 pb-10">

        {/* ── Basic Info ── */}
        <Section title="Basic Info">
          <Field label="Date" error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className={inputCls(errors.date)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration" error={errors.registration}>
              <input
                type="text"
                value={form.registration ?? ''}
                onChange={e => set('registration', e.target.value.toUpperCase())}
                className={inputCls(errors.registration)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </Field>
            <Field label="Model" error={errors.model}>
              <AutocompleteInput
                field="model"
                value={form.model}
                onChange={set}
                suggestions={suggestions.models}
                error={errors.model}
              />
            </Field>
          </div>
        </Section>

        {/* ── Times ── */}
        <Section title="Flight Times">
          <div className="space-y-3">
            <Field label="Departure Time" error={errors.flightStart}>
              <input
                type="time"
                value={form.flightStart}
                onChange={e => set('flightStart', e.target.value)}
                className={inputCls(errors.flightStart)}
              />
            </Field>
            <Field
              label="Arrival Time"
              error={errors.flightEnd || (timeOrderError ? 'Must be after departure time' : null)}
            >
              <input
                type="time"
                value={form.flightEnd}
                onChange={e => set('flightEnd', e.target.value)}
                className={inputCls(errors.flightEnd || timeOrderError)}
              />
            </Field>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Total Flight Time
            </label>
            <div className="px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {form.totalFlightTime ? min2hhmm(form.totalFlightTime) : '—'}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Auto-calculated from departure / arrival time
            </p>
          </div>
        </Section>

        {/* ── Route ── */}
        <Section title="Route">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure (ICAO)" error={errors.from}>
              <AutocompleteInput
                field="from"
                value={form.from}
                onChange={set}
                suggestions={suggestions.airports}
                upper
                maxLength={4}
                error={errors.from}
              />
            </Field>
            <Field label="Destination (ICAO)" error={errors.to}>
              <AutocompleteInput
                field="to"
                value={form.to}
                onChange={set}
                suggestions={suggestions.airports}
                upper
                maxLength={4}
                error={errors.to}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Landings" error={errors.landings}>
              <input
                type="number"
                min={0}
                value={form.landings ?? ''}
                onChange={e => set('landings', e.target.value)}
                className={inputCls(errors.landings)}
              />
            </Field>
            <Field label="Flight Rules">
              <select
                value={form.flightRules}
                onChange={e => set('flightRules', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100 transition-colors"
              >
                <option value="VFR">VFR</option>
                <option value="IFR">IFR</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Crew & Role ── */}
        <Section title="Crew & Role">
          <Field label="Name of PIC" error={errors.nameOfPIC}>
            <AutocompleteInput
              field="nameOfPIC"
              value={form.nameOfPIC}
              onChange={set}
              suggestions={suggestions.pics}
              error={errors.nameOfPIC}
            />
          </Field>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              My Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => { setRole(r.key); setErrors(e => ({ ...e, role: null })) }}
                  className={`py-3 rounded-lg text-sm font-semibold border transition-all
                    ${role === r.key
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/25'
                      : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-700 active:bg-slate-50 dark:active:bg-gray-700'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.role}</p>}
            {role && form.totalFlightTime && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                <span className="font-mono tabular-nums">{min2hhmm(form.totalFlightTime)}</span>
                {' '}will be logged as {ROLES.find(r => r.key === role)?.label}
              </p>
            )}
          </div>
        </Section>

        {/* ── Additional ── */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-4 space-y-3">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Additional</p>

          {[
            { id: 'cc-check',    field: 'crossCountry', label: 'Cross Country' },
            { id: 'night-check', field: 'night',        label: 'Night' },
            { id: 'se-check',    field: 'se',           label: 'Single Engine (SE)' },
          ].map(({ id, field, label }) => (
            <label key={id} htmlFor={id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id={id}
                checked={!!form[field]}
                onChange={e => set(field, e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-gray-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
            </label>
          ))}

          <Field label="Comments">
            <textarea
              value={form.comments ?? ''}
              onChange={e => set('comments', e.target.value)}
              rows={3}
              placeholder="Optional remarks…"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
            />
          </Field>
        </section>

        {/* ── Delete ── */}
        {isEdit && (
          <section>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 text-red-500 dark:text-red-400 border border-slate-200 dark:border-gray-800 rounded-xl text-sm font-medium bg-white dark:bg-gray-900 active:bg-red-50 dark:active:bg-red-950/30 transition-colors"
              >
                Delete Flight
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">
                  Delete this flight permanently?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-red-500 active:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  )
}
