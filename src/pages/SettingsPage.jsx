import { useState } from 'react'
import { exportExcel, exportPDF } from '../lib/exportUtils'

// ── Row item for settings list ────────────────────────────────────────────────

function SettingRow({ label, sublabel, action, danger = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{sublabel}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export default function SettingsPage({ connected, syncStatus, onConnect, onDisconnect, onSync, flights }) {
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState(null)

  async function handleExport(type) {
    setExporting(type)
    setExportError(null)
    try {
      if (type === 'excel') await exportExcel(flights)
      else                  await exportPDF(flights)
    } catch (e) {
      setExportError(e?.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const cardCls = "bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-4 space-y-4"

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-10 bg-slate-50 dark:bg-gray-950 scroll-smooth-ios">

      {/* ── Dropbox Sync ── */}
      <section className={cardCls}>
        <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dropbox Sync</h3>

        {/* Connection status */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {connected ? 'Connected' : 'Not connected'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
              {connected
                ? 'Syncs automatically to /Apps/PilotLogbook/logbook.json'
                : 'Connect Dropbox to sync across devices'}
            </p>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-3 ${connected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
        </div>

        {connected ? (
          <div className="space-y-2.5">
            <button
              onClick={onSync}
              disabled={syncStatus === 'syncing'}
              className="w-full py-2.5 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-sky-50 dark:active:bg-sky-950/30 transition-colors"
            >
              {syncStatus === 'syncing' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  Syncing…
                </span>
              ) : 'Sync Now'}
            </button>
            <button
              onClick={onDisconnect}
              className="w-full py-2.5 border border-slate-200 dark:border-gray-700 text-red-500 dark:text-red-400 rounded-xl text-sm font-semibold active:bg-red-50 dark:active:bg-red-950/30 transition-colors"
            >
              Disconnect Dropbox
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="w-full py-2.5 bg-sky-500 active:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-500/20"
          >
            Connect Dropbox
          </button>
        )}
      </section>

      {/* ── Export ── */}
      <section className={cardCls}>
        <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Export</h3>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {flights.length} flight{flights.length !== 1 ? 's' : ''} in logbook
        </p>

        {exportError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-red-600 dark:text-red-400 text-sm">{exportError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting || flights.length === 0}
            className="py-2.5 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-emerald-50 dark:active:bg-emerald-950/30 transition-colors"
          >
            {exporting === 'excel' ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Exporting…
              </span>
            ) : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting || flights.length === 0}
            className="py-2.5 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-slate-50 dark:active:bg-gray-800 transition-colors"
          >
            {exporting === 'pdf' ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Exporting…
              </span>
            ) : 'Export PDF'}
          </button>
        </div>
      </section>

    </div>
  )
}
