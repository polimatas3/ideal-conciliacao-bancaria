const EXPLANATIONS = [
  {
    matches: ({ status }) => status === 403,
    unless: ({ text }) => /full authentication/i.test(text),
    explain: () =>
      'a autenticação mTLS falhou: o servidor não aceitou o certificado. Confirme que o .crt é o emitido pelo Sicredi (não o .csr), que está em formato PEM e que a chave privada corresponde a ele.',
  },
  {
    matches: ({ text }) => /thumbprint/i.test(text),
    explain: () =>
      'as credenciais foram geradas para outro certificado. Gere novas credenciais no Portal do Desenvolvedor selecionando exatamente o certificado usado nesta conexão.',
  },
  {
    matches: ({ status, text }) => status === 428 || /não informado/i.test(text),
    explain: () =>
      'o servidor não recebeu o certificado ou o token. Verifique se o certificado cliente está sendo enviado na conexão (mTLS).',
  },
  {
    matches: ({ text }) =>
      /full authentication is required/i.test(text) ||
      /invalid_client/i.test(text) ||
      /authorization ou certificado inv/i.test(text),
    explain: () =>
      'o certificado passou, mas clientId/clientSecret foram recusados. Confira os valores e o ambiente (produção x homologação) da credencial.',
  },
  {
    matches: ({ text }) => /escopo (vazio|negado)/i.test(text),
    explain: ({ text }) =>
      `o escopo pedido não está liberado para esta credencial (${text.trim()}). Solicite a modalidade correspondente à cooperativa.`,
  },
]

export function explainSicrediError(error) {
  const context = { status: error.status, text: typeof error.body === 'string' ? error.body : '' }
  for (const candidate of EXPLANATIONS) {
    if (candidate.unless?.(context)) continue
    if (candidate.matches(context)) return `${error.message} — ${candidate.explain(context)}`
  }
  return error.message
}
