import { BusinessRuleError, ValidationError } from './domain-error.js';
import {
  CODE_LENGTH_BY_LEVEL,
  Level,
  levelForCodeLength,
  parentLevelOf,
} from './level.js';
import { isNature } from './nature.js';
import type { Nature } from './nature.js';

export interface CreateAccountProps {
  code: string;
  name: string;
  nature?: string;
}

const DIGITS_ONLY = /^\d+$/;

export class Account {
  readonly code: string;
  readonly level: Level;
  readonly nature: Nature;
  readonly parentCode: string | null;
  private currentName: string;

  private constructor(
    code: string,
    name: string,
    level: Level,
    nature: Nature,
    parentCode: string | null,
  ) {
    this.code = code;
    this.currentName = name;
    this.level = level;
    this.nature = nature;
    this.parentCode = parentCode;
  }

  get name(): string {
    return this.currentName;
  }

  /**
   * Crea una cuenta validando todas las reglas que no requieren consultar
   * el repositorio. El padre lo busca el caso de uso y se recibe aquí ya
   * resuelto (o null si no existe).
   */
  static create(props: CreateAccountProps, parent: Account | null): Account {
    const level = Account.levelOf(props.code);
    const name = Account.validateName(props.name);
    const parentCode = Account.parentCodeOf(props.code);

    if (level === Level.CLASE) {
      if (!isNature(props.nature)) {
        throw new ValidationError(
          'Una clase debe tener naturaleza DEBITO o CREDITO',
        );
      }
      return new Account(props.code, name, level, props.nature, null);
    }

    if (props.nature !== undefined) {
      throw new ValidationError(
        'Solo las clases definen naturaleza; las demás cuentas la heredan del padre',
      );
    }
    if (parent === null || parent.code !== parentCode) {
      throw new BusinessRuleError(`La cuenta padre ${parentCode} no existe`);
    }

    return new Account(props.code, name, level, parent.nature, parentCode);
  }

  /** Nivel según la longitud del código; lanza ValidationError si es inválido. */
  static levelOf(code: unknown): Level {
    if (typeof code !== 'string' || !DIGITS_ONLY.test(code)) {
      throw new ValidationError('El código debe ser numérico');
    }
    const level = levelForCodeLength(code.length);
    if (level === undefined) {
      throw new ValidationError('El código debe tener 1, 2, 4 o 6 dígitos');
    }
    return level;
  }

  /** Código del padre directo (prefijo del nivel anterior); null para clases. */
  static parentCodeOf(code: string): string | null {
    const parentLevel = parentLevelOf(Account.levelOf(code));
    return parentLevel === undefined
      ? null
      : code.slice(0, CODE_LENGTH_BY_LEVEL[parentLevel]);
  }

  rename(name: string): void {
    this.currentName = Account.validateName(name);
  }

  private static validateName(name: unknown): string {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new ValidationError('El nombre es obligatorio');
    }
    return name.trim();
  }
}
