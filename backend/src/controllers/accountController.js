import { createAccount, listAccounts } from '../services/accountService.js'

export async function list(request, response) {
  response.json(await listAccounts())
}

export async function create(request, response) {
  response.status(201).json(await createAccount(request.validated.body))
}
