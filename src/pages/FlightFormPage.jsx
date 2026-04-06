import { useState, useEffect } from 'react'
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

// ── Shared field components (defined outside to avoid remount on re-render) ───

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls = (error) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`

function TextInput({ field, value, onChange, upper = false, maxLength, placeholder, error }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(field, upper ? e.target.value.toUpperCase() : e.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
      className={inputCls(error)}
    />
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

export default function FlightFormPage({ flight, onSave, onDelete, onCancel }) {
  const isEdit = !!flight?.id
  const [form, setForm] = useState(flight ? { ...EMPTY_FLIGHT, ...flight } : { ...EMPTY_FLIGHT })
  const [role, setRole] = useState(() => detectRole(flight))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!form.flightStart || !form.flightEnd) return
    const s = hhmm2min(form.flightStart)
    const e = hhmm2min(form.flightEnd)
    if (s !== null && e !== null && e > s) {
      setForm(f => ({ ...f, totalFlightTime: e - s }))
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
    if (!form.from || form.from.length < 3)      e.from         = '3–4 letter ICAO code'
    if (!form.to   || form.to.length   < 3)      e.to           = '3–4 letter ICAO code'
    if (!form.nameOfPIC)                         e.nameOfPIC    = 'Required'
    if (form.landings === '' || form.landings === null) e.landings = 'Required'
    if (!role)                                   e.role         = 'Select your role'
    return e
  }

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

  const sectionCls = "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4"
  const sectionHeaderCls = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide"

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {/* Sticky header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
        <button onClick={onCancel} className="text-blue-500 font-medium text-sm px-1 py-1">
          Cancel
        </button>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Flight' : 'New Flight'}</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 active:bg-blue-700"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-4 pb-10">

        {/* ── Basic Info ── */}
        <section className={sectionCls}>
          <p className={sectionHeaderCls}>Basic Info</p>

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
              <TextInput field="registration" value={form.registration} onChange={set} upper error={errors.registration} />
            </Field>
            <Field label="Model" error={errors.model}>
              <TextInput field="model" value={form.model} onChange={set} error={errors.model} />
            </Field>
          </div>
        </section>

        {/* ── Times ── */}
        <section className={sectionCls}>
          <p className={sectionHeaderCls}>Flight Times</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure Time" error={errors.flightStart}>
              <input
                type="time"
                value={form.flightStart}
                onChange={e => set('flightStart', e.target.value)}
                className={inputCls(errors.flightStart)}
              />
            </Field>
            <Field label="Arrival Time" error={errors.flightEnd}>
              <input
                type="time"
                value={form.flightEnd}
                onChange={e => set('flightEnd', e.target.value)}
                className={inputCls(errors.flightEnd)}
              />
            </Field>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
              Total Flight Time
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono font-semibold text-gray-800 dark:text-gray-100">
              {form.totalFlightTime ? min2hhmm(form.totalFlightTime) : '—'}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Auto-calculated from departure / arrival time</p>
          </div>
        </section>

        {/* ── Route ── */}
        <section className={sectionCls}>
          <p className={sectionHeaderCls}>Route</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure (ICAO)" error={errors.from}>
              <TextInput field="from" value={form.from} onChange={set} upper maxLength={4} error={errors.from} />
            </Field>
            <Field label="Destination (ICAO)" error={errors.to}>
              <TextInput field="to" value={form.to} onChange={set} upper maxLength={4} error={errors.to} />
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="VFR">VFR</option>
                <option value="IFR">IFR</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ── Crew & Role ── */}
        <section className={sectionCls}>
          <p className={sectionHeaderCls}>Crew & Role</p>

          <Field label="Name of PIC" error={errors.nameOfPIC}>
            <TextInput field="nameOfPIC" value={form.nameOfPIC} onChange={set} error={errors.nameOfPIC} />
          </Field>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">My Role</label>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => { setRole(r.key); setErrors(e => ({ ...e, role: null })) }}
                  className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors
                    ${role === r.key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 active:bg-gray-50 dark:active:bg-gray-600'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            {role && form.totalFlightTime && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {min2hhmm(form.totalFlightTime)} will be logged as {ROLES.find(r => r.key === role)?.label}
              </p>
            )}
          </div>
        </section>

        {/* ── Additional ── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-3">
          <p className={sectionHeaderCls}>Additional</p>

          {[
            { id: 'cc-check',    field: 'crossCountry', label: 'Cross Country' },
            { id: 'night-check', field: 'night',        label: 'Night' },
            { id: 'se-check',    field: 'se',           label: 'Single Engine (SE)' },
          ].map(({ id, field, label }) => (
            <div key={id} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={id}
                checked={!!form[field]}
                onChange={e => set(field, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>
            </div>
          ))}

          <Field label="Comments">
            <textarea
              value={form.comments ?? ''}
              onChange={e => set('comments', e.target.value)}
              rows={3}
              placeholder="Optional remarks…"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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
                className="w-full py-3 text-red-600 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 active:bg-red-50 dark:active:bg-red-950"
              >
                Delete Flight
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
                <p className="text-red-700 dark:text-red-300 text-sm font-medium text-center">
                  Delete this flight permanently?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
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
