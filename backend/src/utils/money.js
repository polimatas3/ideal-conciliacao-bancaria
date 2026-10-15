export function toAbsoluteCents(value) {
  const amount = Number(value)
  if (Number.isNaN(amount)) throw new Error(`Valor monetário inválido: ${value}`)
  return Math.round(Math.abs(amount) * 100)
}

export function toSignedCents(value) {
  const cents = toAbsoluteCents(value)
  return Number(value) < 0 ? -cents : cents
}
