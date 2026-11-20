import type { AccountRepository } from '../domain/account-repository.js';
import { ConflictError, NotFoundError } from '../domain/domain-error.js';

export class DeleteAccount {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(code: string): Promise<void> {
    const account = await this.repository.findByCode(code);
    if (!account) {
      throw new NotFoundError(`No existe la cuenta ${code}`);
    }
    if (await this.repository.hasChildren(code)) {
      throw new ConflictError(
        `La cuenta ${code} tiene cuentas hijas y no se puede eliminar`,
      );
    }

    await this.repository.delete(code);
  }
}
