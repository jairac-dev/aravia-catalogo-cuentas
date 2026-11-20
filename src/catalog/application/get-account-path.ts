import type { Account } from '../domain/account.js';
import type { AccountRepository } from '../domain/account-repository.js';
import { NotFoundError } from '../domain/domain-error.js';

export class GetAccountPath {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  /** Devuelve la cuenta y sus ancestros, desde ella hasta su clase. */
  async execute(code: string): Promise<Account[]> {
    const account = await this.repository.findByCode(code);
    if (!account) {
      throw new NotFoundError(`No existe la cuenta ${code}`);
    }

    const path: Account[] = [account];
    let current: Account | null = account;
    while (current.parentCode !== null) {
      // Un padre siempre existe: no se crea una cuenta sin padre ni se
      // elimina una cuenta con hijas.
      current = await this.repository.findByCode(current.parentCode);
      if (!current) break;
      path.push(current);
    }
    return path;
  }
}
