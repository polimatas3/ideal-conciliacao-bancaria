const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
const isoDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })

export function formatCents(cents: number | null | undefined) {
  if (cents == null) return '—'
  return currencyFormatter.format(cents / 100)
}

export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return dateTimeFormatter.format(new Date(iso))
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function yesterdayIsoDate() {
  return isoDateFormatter.format(new Date(Date.now() - ONE_DAY_MS))
}
