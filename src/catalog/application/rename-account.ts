import type { Account } from '../domain/account.js';
import type { AccountRepository } from '../domain/account-repository.js';
import { NotFoundError } from '../domain/domain-error.js';

export interface RenameAccountInput {
  code: string;
  name: string;
}

export class RenameAccount {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(input: RenameAccountInput): Promise<Account> {
    const account = await this.repository.findByCode(input.code);
    if (!account) {
      throw new NotFoundError(`No existe la cuenta ${input.code}`);
    }

    account.rename(input.name);
    await this.repository.save(account);
    return account;
  }
}
