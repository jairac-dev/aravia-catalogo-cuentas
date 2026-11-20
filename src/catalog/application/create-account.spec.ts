import { DomainErrorType } from '../domain/domain-error.js';
import { Level } from '../domain/level.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/persistence/in-memory-account.repository.js';
import { CreateAccount } from './create-account.js';

describe('CreateAccount', () => {
  let repository: InMemoryAccountRepository;
  let createAccount: CreateAccount;

  beforeEach(() => {
    repository = new InMemoryAccountRepository();
    createAccount = new CreateAccount(repository);
  });

  it('crea una clase con su naturaleza', async () => {
    const account = await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });

    expect(account.level).toBe(Level.CLASE);
    expect(account.nature).toBe(Nature.DEBITO);
    expect(account.parentCode).toBeNull();
    expect(await repository.findByCode('1')).toBe(account);
  });

  it('hereda la naturaleza del padre directo en cada nivel', async () => {
    await createAccount.execute({
      code: '2',
      name: 'Pasivo',
      nature: Nature.CREDITO,
    });
    await createAccount.execute({ code: '21', name: 'Obligaciones' });
    await createAccount.execute({ code: '2105', name: 'Bancos nacionales' });
    const subcuenta = await createAccount.execute({
      code: '210505',
      name: 'Sobregiros',
    });

    expect(subcuenta.level).toBe(Level.SUBCUENTA);
    expect(subcuenta.parentCode).toBe('2105');
    expect(subcuenta.nature).toBe(Nature.CREDITO);
  });

  it('rechaza crear una cuenta cuyo padre no existe', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });

    await expect(
      createAccount.execute({ code: '1105', name: 'Caja' }),
    ).rejects.toMatchObject({ type: DomainErrorType.BUSINESS_RULE });
    expect(await repository.findByCode('1105')).toBeNull();
  });

  it('rechaza un código duplicado', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });

    await expect(
      createAccount.execute({ code: '1', name: 'Otro', nature: Nature.DEBITO }),
    ).rejects.toMatchObject({ type: DomainErrorType.CONFLICT });
  });

  it.each(['123', '12345', '1234567', '11a5', '', ' 1'])(
    'rechaza el código inválido "%s"',
    async (code) => {
      await expect(
        createAccount.execute({ code, name: 'X', nature: Nature.DEBITO }),
      ).rejects.toMatchObject({ type: DomainErrorType.VALIDATION });
    },
  );

  it('acepta cualquier clase de un dígito', async () => {
    const account = await createAccount.execute({
      code: '3',
      name: 'Patrimonio',
      nature: Nature.CREDITO,
    });
    expect(account.code).toBe('3');
  });

  it('rechaza una clase sin naturaleza', async () => {
    await expect(
      createAccount.execute({ code: '1', name: 'Activo' }),
    ).rejects.toMatchObject({ type: DomainErrorType.VALIDATION });
  });

  it('rechaza una clase con naturaleza desconocida', async () => {
    await expect(
      createAccount.execute({ code: '1', name: 'Activo', nature: 'MIXTA' }),
    ).rejects.toMatchObject({ type: DomainErrorType.VALIDATION });
  });

  it('rechaza naturaleza en una cuenta que no es clase', async () => {
    await createAccount.execute({
      code: '1',
      name: 'Activo',
      nature: Nature.DEBITO,
    });

    await expect(
      createAccount.execute({
        code: '11',
        name: 'Disponible',
        nature: Nature.DEBITO,
      }),
    ).rejects.toMatchObject({ type: DomainErrorType.VALIDATION });
  });

  it('rechaza un nombre vacío', async () => {
    await expect(
      createAccount.execute({ code: '1', name: '   ', nature: Nature.DEBITO }),
    ).rejects.toMatchObject({ type: DomainErrorType.VALIDATION });
  });
});
