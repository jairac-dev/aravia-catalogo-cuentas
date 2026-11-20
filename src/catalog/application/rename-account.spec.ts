import { DomainErrorType } from '../domain/domain-error.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/persistence/in-memory-account.repository.js';
import { CreateAccount } from './create-account.js';
import { RenameAccount } from './rename-account.js';

describe('RenameAccount', () => {
  let repository: InMemoryAccountRepository;
  let renameAccount: RenameAccount;

  beforeEach(async () => {
    repository = new InMemoryAccountRepository();
    renameAccount = new RenameAccount(repository);
    await new CreateAccount(repository).execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });
  });

  it('renombra una cuenta existente', async () => {
    const account = await renameAccount.execute({
      code: '1',
      name: 'Activos',
    });

    expect(account.name).toBe('Activos');
    expect((await repository.findByCode('1'))?.name).toBe('Activos');
  });

  it('falla con NOT_FOUND si la cuenta no existe', async () => {
    await expect(
      renameAccount.execute({ code: '9', name: 'Nada' }),
    ).rejects.toMatchObject({ type: DomainErrorType.NOT_FOUND });
  });

  it.each(['', '   '])(
    'rechaza el nombre vacío "%s" sin modificar la cuenta',
    async (name) => {
      await expect(
        renameAccount.execute({ code: '1', name }),
      ).rejects.toMatchObject({ type: DomainErrorType.VALIDATION });
      expect((await repository.findByCode('1'))?.name).toBe('Activo');
    },
  );
});
