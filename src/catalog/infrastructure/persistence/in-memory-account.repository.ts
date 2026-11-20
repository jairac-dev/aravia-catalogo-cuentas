import type { Account } from '../../domain/account.js';
import type { AccountRepository } from '../../domain/account-repository.js';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts: Map<string, Account> = new Map();

  async findByCode(code: string): Promise<Account | null> {
    return this.accounts.get(code) ?? null;
  }

  async findAll(): Promise<Account[]> {
    return [...this.accounts.values()];
  }

  async hasChildren(code: string): Promise<boolean> {
    for (const account of this.accounts.values()) {
      if (account.parentCode === code) return true;
    }
    return false;
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.code, account);
  }

  async delete(code: string): Promise<void> {
    this.accounts.delete(code);
  }
}
