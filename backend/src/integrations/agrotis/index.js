import { agrotisClientFor } from './agrotis.client.js'
import { mapAgrotisTransaction } from './agrotis.mapper.js'

export const agrotisIntegration = {
  async fetchEntries({ account, from, to }) {
    const client = agrotisClientFor(account)
    const [items, closingBalance] = await Promise.all([
      client.fetchEntryItems({ account, from, to }),
      client.fetchBalanceCents({ account, date: to }),
    ])
    return { transactions: items.map(mapAgrotisTransaction), closingBalance }
  },
}
