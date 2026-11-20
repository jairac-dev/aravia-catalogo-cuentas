import { Account } from '../domain/account.js';
import type { CreateAccountProps } from '../domain/account.js';
import type { AccountRepository } from '../domain/account-repository.js';
import { ConflictError } from '../domain/domain-error.js';

export class CreateAccount {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(input: CreateAccountProps): Promise<Account> {
    // Valida el formato del código antes de consultar el repositorio.
    const parentCode = Account.parentCodeOf(input.code);

    if (await this.repository.findByCode(input.code)) {
      throw new ConflictError(`Ya existe una cuenta con código ${input.code}`);
    }

    const parent =
      parentCode === null ? null : await this.repository.findByCode(parentCode);

    const account = Account.create(input, parent);
    await this.repository.save(account);
    return account;
  }
}
