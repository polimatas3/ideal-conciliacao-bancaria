import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { describeCertificate, verifyCertificatePair } from './certificatePair.js'

let directory
let certPath
let keyPath
let otherKeyPath

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'certpair-'))
  certPath = join(directory, 'test.crt')
  keyPath = join(directory, 'test.key')
  otherKeyPath = join(directory, 'other.key')
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', certPath, '-days', '2',
    '-subj', '/C=BR/O=Teste/CN=conciliacao.test',
  ])
  execFileSync('openssl', ['genrsa', '-out', otherKeyPath, '2048'])
})

afterAll(() => rmSync(directory, { recursive: true, force: true }))

describe('verifyCertificatePair', () => {
  it('accepts a certificate and its matching key', () => {
    expect(verifyCertificatePair({ certPath, keyPath })).toEqual({ matches: true })
  })

  it('rejects a key that belongs to another certificate', () => {
    expect(verifyCertificatePair({ certPath, keyPath: otherKeyPath })).toEqual({
      matches: false,
      reason: 'a chave privada não corresponde ao certificado',
    })
  })

  it('reports a missing certificate file', () => {
    const result = verifyCertificatePair({ certPath: join(directory, 'nope.crt'), keyPath })
    expect(result.matches).toBe(false)
    expect(result.reason).toContain('não pôde ser lido')
  })
})

describe('describeCertificate', () => {
  it('returns subject, issuer and validity', () => {
    const description = describeCertificate(certPath)
    expect(description.subject).toContain('conciliacao.test')
    expect(description.validTo instanceof Date).toBe(true)
    expect(description.expired).toBe(false)
    expect(description.daysUntilExpiry).toBeGreaterThanOrEqual(0)
  })
})
