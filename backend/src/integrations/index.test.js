import { describe, expect, it } from 'vitest'
import { BANKS } from '../config/enums.js'
import { agrotisIntegration } from './agrotis/index.js'
import { getBankIntegration, getErpIntegration } from './index.js'
import { sicrediIntegration } from './sicredi/index.js'

describe('integrations registry', () => {
  it('returns the sicredi integration', () => {
    expect(getBankIntegration(BANKS.SICREDI)).toBe(sicrediIntegration)
  })

  it('fails for unknown banks', () => {
    expect(() => getBankIntegration('itau')).toThrow('Integração bancária não suportada: itau')
  })

  it('returns the agrotis integration as erp', () => {
    expect(getErpIntegration()).toBe(agrotisIntegration)
  })
})
