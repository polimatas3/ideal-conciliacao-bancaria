const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo'
const PLAIN_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SAO_PAULO_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function toIsoDate(value) {
  if (typeof value === 'string' && PLAIN_ISO_DATE.test(value)) return value
  const instant = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(instant.getTime())) throw new Error(`Data inválida: ${value}`)
  return saoPauloDateFormatter.format(instant)
}

export function yesterdayIsoDate(now = new Date()) {
  const todayInSaoPaulo = toIsoDate(now)
  const todayAtNoonUtc = new Date(`${todayInSaoPaulo}T12:00:00Z`)
  return toIsoDate(new Date(todayAtNoonUtc.getTime() - ONE_DAY_MS))
}

export function saoPauloDayRangeToUtc(from, to) {
  if (from > to) throw new Error(`Período inválido: ${from} é posterior a ${to}`)
  return {
    start: new Date(`${from}T00:00:00.000-03:00`).toISOString(),
    end: new Date(`${to}T23:59:59.999-03:00`).toISOString(),
  }
}
