import { mapReceivedPix } from './sicrediPix.mapper.js'

export function buildPixStatement(received) {
  return {
    transactions: received.flatMap(mapReceivedPix),
    closingBalance: null,
  }
}
