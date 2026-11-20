import { Level } from '../domain/level.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/persistence/in-memory-account.repository.js';
import { CreateAccount } from './create-account.js';
import { GetCatalogTree } from './get-catalog-tree.js';

describe('GetCatalogTree', () => {
  let repository: InMemoryAccountRepository;
  let createAccount: CreateAccount;
  let getCatalogTree: GetCatalogTree;

  beforeEach(() => {
    repository = new InMemoryAccountRepository();
    createAccount = new CreateAccount(repository);
    getCatalogTree = new GetCatalogTree(repository);
  });

  it('devuelve una lista vacía si no hay cuentas', async () => {
    expect(await getCatalogTree.execute()).toEqual([]);
  });

  it('arma el árbol anidado ordenado por código', async () => {
    // Se insertan desordenadas a propósito para comprobar el orden de salida.
    await createAccount.execute({
      code: '2',
      name: 'Pasivo',
      nature: Nature.CREDITO,
    });
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });
    await createAccount.execute({ code: '11', name: 'Disponible' });
    await createAccount.execute({ code: '1110', name: 'Bancos' });
    await createAccount.execute({ code: '1105', name: 'Caja' });
    await createAccount.execute({ code: '110505', name: 'Caja general' });
    await createAccount.execute({ code: '21', name: 'Obligaciones' });

    const tree = await getCatalogTree.execute();

    expect(tree).toEqual([
      {
        code: '1',
        name: 'Activo',
        level: Level.CLASE,
        nature: Nature.DEBITO,
        children: [
          {
            code: '11',
            name: 'Disponible',
            level: Level.GRUPO,
            nature: Nature.DEBITO,
            children: [
              {
                code: '1105',
                name: 'Caja',
                level: Level.CUENTA,
                nature: Nature.DEBITO,
                children: [
                  {
                    code: '110505',
                    name: 'Caja general',
                    level: Level.SUBCUENTA,
                    nature: Nature.DEBITO,
                    children: [],
                  },
                ],
              },
              {
                code: '1110',
                name: 'Bancos',
                level: Level.CUENTA,
                nature: Nature.DEBITO,
                children: [],
              },
            ],
          },
        ],
      },
      {
        code: '2',
        name: 'Pasivo',
        level: Level.CLASE,
        nature: Nature.CREDITO,
        children: [
          {
            code: '21',
            name: 'Obligaciones',
            level: Level.GRUPO,
            nature: Nature.CREDITO,
            children: [],
          },
        ],
      },
    ]);
  });
});
