import { BankAccount } from '../models/index.js'

export function listAccounts() {
  return BankAccount.findAll({ order: [['name', 'ASC']] })
}

export function createAccount(data) {
  return BankAccount.create(data)
}
