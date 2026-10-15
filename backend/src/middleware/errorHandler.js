const INTERNAL_ERROR_STATUS = 500

export function errorHandler(error, request, response, next) {
  const status = error.status ?? INTERNAL_ERROR_STATUS
  if (status >= INTERNAL_ERROR_STATUS) console.error(error)
  response.status(status).json({
    message: status >= INTERNAL_ERROR_STATUS ? 'Erro interno' : error.message,
    details: error.details,
  })
}
