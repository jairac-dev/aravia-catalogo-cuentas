import type { Account } from './account.js';

export const ACCOUNT_REPOSITORY = Symbol('AccountRepository');

/**
 * Puerto de persistencia. Es asíncrono aunque la implementación actual sea
 * en memoria, para que cambiar a una base de datos no toque los casos de uso.
 */
export interface AccountRepository {
  findByCode(code: string): Promise<Account | null>;
  findAll(): Promise<Account[]>;
  hasChildren(code: string): Promise<boolean>;
  save(account: Account): Promise<void>;
  delete(code: string): Promise<void>;
}
