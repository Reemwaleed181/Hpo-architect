export function formatMinutes(minutes: number): string {
  if (!isFinite(minutes) || minutes === null || minutes === undefined) return ''
  const m = Math.round(minutes)
  if (m < 60) return `${m} min`
  if (m < 1440) {
    const h = m / 60
    // show 1 decimal if fractional, otherwise integer
    const as = Number.isInteger(h) ? `${Math.round(h)} h` : `${+h.toFixed(1)} h`
    return as
  }
  const days = Math.floor(m / 1440)
  const rem = m - days * 1440
  const hours = Math.floor(rem / 60)
  return `${days} d${hours ? ` ${hours} h` : ''}`
}

export function formatMinutesWithMinutesDetail(minutes: number): string {
  // e.g. show both human readable and exact minutes in parentheses when useful
  const human = formatMinutes(minutes)
  return `${human}`
}
