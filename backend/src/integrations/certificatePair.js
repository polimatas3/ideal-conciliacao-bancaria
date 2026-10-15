import { X509Certificate, createPrivateKey } from 'node:crypto'
import { readFileSync } from 'node:fs'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export function verifyCertificatePair({ certPath, keyPath, keyPassphrase }) {
  let certificate
  let privateKey
  try {
    certificate = new X509Certificate(readFileSync(certPath))
  } catch (error) {
    return { matches: false, reason: `certificado não pôde ser lido em ${certPath}: ${error.message}` }
  }
  try {
    privateKey = createPrivateKey({ key: readFileSync(keyPath), passphrase: keyPassphrase })
  } catch (error) {
    return { matches: false, reason: `chave privada não pôde ser lida em ${keyPath}: ${error.message}` }
  }
  if (!certificate.checkPrivateKey(privateKey)) {
    return { matches: false, reason: 'a chave privada não corresponde ao certificado' }
  }
  return { matches: true }
}

export function describeCertificate(certPath) {
  const certificate = new X509Certificate(readFileSync(certPath))
  const validTo = new Date(certificate.validTo)
  return {
    subject: certificate.subject.replace(/\n/g, ', '),
    issuer: certificate.issuer.replace(/\n/g, ', '),
    validFrom: new Date(certificate.validFrom),
    validTo,
    expired: validTo.getTime() < Date.now(),
    daysUntilExpiry: Math.floor((validTo.getTime() - Date.now()) / MILLISECONDS_PER_DAY),
  }
}
