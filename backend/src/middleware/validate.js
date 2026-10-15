import { HttpError } from '../errors/HttpError.js'

export function validate(schemas) {
  return (request, response, next) => {
    const validated = {}
    for (const [property, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(request[property])
      if (!result.success) return next(new HttpError(400, 'Dados inválidos', result.error.flatten()))
      validated[property] = result.data
    }
    request.validated = validated
    return next()
  }
}
