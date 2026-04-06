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
  crossCountry: null,
  night: null,
  se: true,
  flightRules: 'VFR',
  pic: null,
  coPilot: null,
  dual: null,
  fi: null,
  comments: '',
}

// Uncontrolled-friendly duration text input
// Stores minutes in parent; shows/edits as "H:mm" text locally
function DurationInput({ value, onChange, placeholder = '0:00' }) {
  const [text, setText] = useState(() =>
    value !== null && value !== undefined ? min2hhmm(value) : ''
  )

  function handleBlur() {
    const trimmed = text.trim()
    if (!trimmed) { onChange(null); setText(''); return }
    const mins = hhmm2min(trimmed)
    onChange(mins ?? null)
    setText(mins !== null ? min2hhmm(mins) : '')
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

// ── Shared field components (defined outside to avoid remount on re-render) ───

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function TextInput({ field, value, onChange, upper = false, list, maxLength, placeholder, inputMode, error }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(field, upper ? e.target.value.toUpperCase() : e.target.value)}
      list={list}
      maxLength={maxLength}
      placeholder={placeholder}
      inputMode={inputMode}
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
        ${error ? 'border-red-400' : 'border-gray-300'}`}
    />
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

export default function FlightFormPage({ flight, onSave, onDelete, onCancel }) {
  const isEdit = !!flight?.id
  const [form, setForm] = useState(flight ? { ...EMPTY_FLIGHT, ...flight } : { ...EMPTY_FLIGHT })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Auto-calculate total time from start / end
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
    return e
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      await onSave({
        ...form,
        registration: form.registration.toUpperCase(),
        from:         form.from.toUpperCase(),
        to:           form.to.toUpperCase(),
        landings:     Number(form.landings),
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
    <div className="h-full overflow-y-auto">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
        <button onClick={onCancel} className="text-blue-600 font-medium text-sm px-1 py-1">
          Cancel
        </button>
        <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Flight' : 'New Flight'}</h2>
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
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Basic Info</p>

          <Field label="Date" error={errors.date}>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.date ? 'border-red-400' : 'border-gray-300'}`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration" error={errors.registration}>
              <TextInput field="registration" value={form.registration} onChange={set} upper placeholder="PH-ELW" error={errors.registration} />
            </Field>

            <Field label="Model" error={errors.model}>
              <TextInput field="model" value={form.model} onChange={set} placeholder="S200" error={errors.model} />
            </Field>
          </div>
        </section>

        {/* ── Times ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Flight Times</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure Time" error={errors.flightStart}>
              <input
                type="time"
                value={form.flightStart}
                onChange={e => set('flightStart', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.flightStart ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>

            <Field label="Arrival Time" error={errors.flightEnd}>
              <input
                type="time"
                value={form.flightEnd}
                onChange={e => set('flightEnd', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.flightEnd ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Total Flight Time
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono font-semibold text-gray-800">
              {form.totalFlightTime ? min2hhmm(form.totalFlightTime) : '—'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Auto-calculated from departure / arrival time</p>
          </div>
        </section>

        {/* ── Route ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Route</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure (ICAO)" error={errors.from}>
              <TextInput field="from" value={form.from} onChange={set} upper maxLength={4} placeholder="EHTE" error={errors.from} />
            </Field>
            <Field label="Destination (ICAO)" error={errors.to}>
              <TextInput field="to" value={form.to} onChange={set} upper maxLength={4} placeholder="EHTE" error={errors.to} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Landings" error={errors.landings}>
              <input
                type="number"
                min={0}
                value={form.landings ?? ''}
                onChange={e => set('landings', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.landings ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>

            <Field label="Flight Rules">
              <select
                value={form.flightRules}
                onChange={e => set('flightRules', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="VFR">VFR</option>
                <option value="IFR">IFR</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ── Crew & Role ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Crew & Role</p>

          <Field label="Name of PIC" error={errors.nameOfPIC}>
            <TextInput field="nameOfPIC" value={form.nameOfPIC} onChange={set} placeholder="L. Pelgrom" error={errors.nameOfPIC} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="PIC time">
              <DurationInput value={form.pic} onChange={v => set('pic', v)} />
            </Field>
            <Field label="Co-Pilot">
              <DurationInput value={form.coPilot} onChange={v => set('coPilot', v)} />
            </Field>
            <Field label="Dual (with instructor)">
              <DurationInput value={form.dual} onChange={v => set('dual', v)} />
            </Field>
            <Field label="Flight Instructor">
              <DurationInput value={form.fi} onChange={v => set('fi', v)} />
            </Field>
          </div>
        </section>

        {/* ── Additional ── */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Additional</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cross Country">
              <DurationInput value={form.crossCountry} onChange={v => set('crossCountry', v)} />
            </Field>
            <Field label="Night">
              <DurationInput value={form.night} onChange={v => set('night', v)} />
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="se-check"
              checked={!!form.se}
              onChange={e => set('se', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="se-check" className="text-sm font-medium text-gray-700">
              Single Engine (SE)
            </label>
          </div>

          <Field label="Comments">
            <textarea
              value={form.comments ?? ''}
              onChange={e => set('comments', e.target.value)}
              rows={3}
              placeholder="Optional remarks…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                className="w-full py-3 text-red-600 border border-red-200 rounded-xl text-sm font-medium bg-white active:bg-red-50"
              >
                Delete Flight
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-red-700 text-sm font-medium text-center">
                  Delete this flight permanently?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium bg-white"
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
