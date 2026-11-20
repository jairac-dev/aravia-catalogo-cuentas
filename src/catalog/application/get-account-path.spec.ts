import { DomainErrorType } from '../domain/domain-error.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/persistence/in-memory-account.repository.js';
import { CreateAccount } from './create-account.js';
import { GetAccountPath } from './get-account-path.js';

describe('GetAccountPath', () => {
  let repository: InMemoryAccountRepository;
  let getAccountPath: GetAccountPath;

  beforeEach(async () => {
    repository = new InMemoryAccountRepository();
    getAccountPath = new GetAccountPath(repository);
    const createAccount = new CreateAccount(repository);
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });
    await createAccount.execute({ code: '11', name: 'Disponible' });
    await createAccount.execute({ code: '1105', name: 'Caja' });
    await createAccount.execute({ code: '110505', name: 'Caja general' });
  });

  it('devuelve el camino completo de una subcuenta hasta su clase', async () => {
    const path = await getAccountPath.execute('110505');

    expect(path.map((account) => account.code)).toEqual([
      '110505',
      '1105',
      '11',
      '1',
    ]);
  });

  it('una clase devuelve solo a sí misma', async () => {
    const path = await getAccountPath.execute('1');

    expect(path.map((account) => account.code)).toEqual(['1']);
  });

  it('falla con NOT_FOUND si la cuenta no existe', async () => {
    await expect(getAccountPath.execute('110510')).rejects.toMatchObject({
      type: DomainErrorType.NOT_FOUND,
    });
  });
});
