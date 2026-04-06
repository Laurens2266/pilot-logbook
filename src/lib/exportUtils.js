import { min2hhmm } from './timeUtils'

function roleLabel(f) {
  if (f.pic)     return 'PIC'
  if (f.coPilot) return 'Co-Pilot'
  if (f.dual)    return 'Dual'
  if (f.fi)      return 'FI'
  return ''
}

function rows(flights) {
  return flights.map(f => ({
    Date:            f.date              || '',
    Registration:    f.registration      || '',
    Model:           f.model             || '',
    From:            f.from              || '',
    To:              f.to                || '',
    'Dep. Time':     f.flightStart       || '',
    'Arr. Time':     f.flightEnd         || '',
    'Total Time':    min2hhmm(f.totalFlightTime) || '',
    Landings:        f.landings          ?? '',
    'Name of PIC':   f.nameOfPIC         || '',
    Role:            roleLabel(f),
    'Cross Country': f.crossCountry ? 'Yes' : 'No',
    Night:           f.night        ? 'Yes' : 'No',
    SE:              f.se           ? 'Yes' : 'No',
    'Flight Rules':  f.flightRules       || '',
    Comments:        f.comments          || '',
  }))
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportExcel(flights) {
  const { utils, write } = await import('xlsx')
  const ws = utils.json_to_sheet(rows(flights))
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Logbook')
  const buf = write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, 'logbook.xlsx')
}

export async function exportPDF(flights) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.text('Pilot Logbook', 14, 14)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Exported ${new Date().toLocaleDateString('en-GB')} — ${flights.length} flights`, 14, 20)

  autoTable(doc, {
    startY: 25,
    columns: [
      { header: 'Date',       dataKey: 'Date' },
      { header: 'Reg.',       dataKey: 'Registration' },
      { header: 'Model',      dataKey: 'Model' },
      { header: 'From',       dataKey: 'From' },
      { header: 'To',         dataKey: 'To' },
      { header: 'Dep.',       dataKey: 'Dep. Time' },
      { header: 'Arr.',       dataKey: 'Arr. Time' },
      { header: 'Time',       dataKey: 'Total Time' },
      { header: 'Ldg',        dataKey: 'Landings' },
      { header: 'PIC',        dataKey: 'Name of PIC' },
      { header: 'Role',       dataKey: 'Role' },
      { header: 'X-C',        dataKey: 'Cross Country' },
      { header: 'Night',      dataKey: 'Night' },
      { header: 'SE',         dataKey: 'SE' },
      { header: 'Rules',      dataKey: 'Flight Rules' },
      { header: 'Comments',   dataKey: 'Comments' },
    ],
    body: rows(flights),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [14, 116, 144], fontSize: 7, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { Comments: { cellWidth: 30 } },
  })

  // Open PDF in a new tab — works on all platforms including iOS
  // On iOS: shows PDF viewer with its own share/save options
  // On desktop: opens in browser PDF viewer where you can save
  const url = URL.createObjectURL(doc.output('blob'))
  window.open(url)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
