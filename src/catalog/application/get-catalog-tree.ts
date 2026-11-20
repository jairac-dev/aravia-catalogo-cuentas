import type { AccountRepository } from '../domain/account-repository.js';
import type { Level } from '../domain/level.js';
import type { Nature } from '../domain/nature.js';

export interface AccountTreeNode {
  code: string;
  name: string;
  level: Level;
  nature: Nature;
  children: AccountTreeNode[];
}

export class GetCatalogTree {
  private readonly repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async execute(): Promise<AccountTreeNode[]> {
    const accounts = await this.repository.findAll();

    // Orden lexicográfico por código: un prefijo siempre va antes que sus
    // extensiones ('1' < '11' < '1105' < '110505' < '12'), así cada padre se
    // procesa antes que sus hijas y el árbol se arma en una sola pasada.
    accounts.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

    const nodesByCode = new Map<string, AccountTreeNode>();
    const roots: AccountTreeNode[] = [];

    for (const account of accounts) {
      const node: AccountTreeNode = {
        code: account.code,
        name: account.name,
        level: account.level,
        nature: account.nature,
        children: [],
      };
      nodesByCode.set(account.code, node);

      const parent =
        account.parentCode === null
          ? undefined
          : nodesByCode.get(account.parentCode);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
