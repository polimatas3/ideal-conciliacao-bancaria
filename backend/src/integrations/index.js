import { BANKS } from '../config/enums.js'
import { agrotisIntegration } from './agrotis/index.js'
import { sicrediIntegration } from './sicredi/index.js'

const bankIntegrations = Object.freeze({ [BANKS.SICREDI]: sicrediIntegration })

export function getBankIntegration(bank) {
  const integration = bankIntegrations[bank]
  if (!integration) throw new Error(`Integração bancária não suportada: ${bank}`)
  return integration
}

export function getErpIntegration() {
  return agrotisIntegration
}
