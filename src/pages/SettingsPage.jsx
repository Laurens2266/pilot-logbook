export default function SettingsPage({ connected, syncStatus, onConnect, onDisconnect, onSync }) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-10">

      {/* ── Dropbox ── */}
      <section className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dropbox Sync</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{connected ? 'Connected' : 'Not connected'}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {connected
                ? 'Logbook syncs automatically to /Apps/PilotLogbook/logbook.json'
                : 'Connect Dropbox to sync across devices'}
            </p>
          </div>
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ml-3 ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
        </div>

        {connected ? (
          <div className="space-y-3">
            <button
              onClick={onSync}
              disabled={syncStatus === 'syncing'}
              className="w-full py-3 border border-blue-300 text-blue-600 rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-blue-50"
            >
              {syncStatus === 'syncing' ? 'Syncing…' : 'Sync Now'}
            </button>
            <button
              onClick={onDisconnect}
              className="w-full py-3 border border-red-200 text-red-600 rounded-xl text-sm font-semibold active:bg-red-50"
            >
              Disconnect Dropbox
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-blue-700"
          >
            Connect Dropbox
          </button>
        )}
      </section>

    </div>
  )
}
