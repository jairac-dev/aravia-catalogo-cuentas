import { DomainErrorType } from '../domain/domain-error.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/persistence/in-memory-account.repository.js';
import { CreateAccount } from './create-account.js';
import { DeleteAccount } from './delete-account.js';

describe('DeleteAccount', () => {
  let repository: InMemoryAccountRepository;
  let deleteAccount: DeleteAccount;

  beforeEach(async () => {
    repository = new InMemoryAccountRepository();
    deleteAccount = new DeleteAccount(repository);
    const createAccount = new CreateAccount(repository);
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });
    await createAccount.execute({ code: '11', name: 'Disponible' });
  });

  it('elimina una cuenta sin hijas', async () => {
    await deleteAccount.execute('11');

    expect(await repository.findByCode('11')).toBeNull();
  });

  it('rechaza eliminar una cuenta con hijas', async () => {
    await expect(deleteAccount.execute('1')).rejects.toMatchObject({
      type: DomainErrorType.CONFLICT,
    });
    expect(await repository.findByCode('1')).not.toBeNull();
  });

  it('permite eliminar el padre una vez eliminadas sus hijas', async () => {
    await deleteAccount.execute('11');
    await deleteAccount.execute('1');

    expect(await repository.findAll()).toEqual([]);
  });

  it('falla con NOT_FOUND si la cuenta no existe', async () => {
    await expect(deleteAccount.execute('9')).rejects.toMatchObject({
      type: DomainErrorType.NOT_FOUND,
    });
  });
});
