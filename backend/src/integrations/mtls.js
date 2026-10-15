import { readFileSync } from 'node:fs'
import { Agent } from 'undici'

const dispatchers = new Map()

export function createMutualTlsDispatcher(
  { certPath, keyPath, keyPassphrase, caPath } = {},
  { readFileImpl = readFileSync, AgentImpl = Agent } = {},
) {
  if (!certPath || !keyPath) return undefined
  const cacheKey = `${certPath}|${keyPath}|${caPath ?? ''}`
  if (!dispatchers.has(cacheKey)) {
    dispatchers.set(
      cacheKey,
      new AgentImpl({
        connect: {
          cert: readCertificateFile(readFileImpl, certPath),
          key: readCertificateFile(readFileImpl, keyPath),
          ...(keyPassphrase ? { passphrase: keyPassphrase } : {}),
          ...(caPath ? { ca: readCertificateFile(readFileImpl, caPath) } : {}),
        },
      }),
    )
  }
  return dispatchers.get(cacheKey)
}

export function clearDispatcherCache() {
  dispatchers.clear()
}

function readCertificateFile(readFileImpl, path) {
  try {
    return readFileImpl(path, 'utf8')
  } catch (error) {
    throw new Error(`Certificado mTLS não pôde ser lido em ${path}: ${error.message}`)
  }
}
