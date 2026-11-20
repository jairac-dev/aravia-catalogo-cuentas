export const DomainErrorType = {
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BUSINESS_RULE: 'BUSINESS_RULE',
} as const;

export type DomainErrorType =
  (typeof DomainErrorType)[keyof typeof DomainErrorType];

/**
 * Error base del dominio. El `type` describe la categoría del fallo sin
 * acoplarse a HTTP; es la capa de infraestructura la que lo traduce.
 */
export class DomainError extends Error {
  readonly type: DomainErrorType;

  constructor(type: DomainErrorType, message: string) {
    super(message);
    this.name = new.target.name;
    this.type = type;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(DomainErrorType.VALIDATION, message);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(DomainErrorType.NOT_FOUND, message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(DomainErrorType.CONFLICT, message);
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(DomainErrorType.BUSINESS_RULE, message);
  }
}
