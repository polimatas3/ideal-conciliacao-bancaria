export function readCredentials(credentialsRef) {
  const raw = process.env[credentialsRef]
  if (!raw) throw new Error(`Credenciais não encontradas: variável de ambiente ${credentialsRef} não definida`)
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`Credenciais inválidas em ${credentialsRef}: esperado JSON`)
  }
}
