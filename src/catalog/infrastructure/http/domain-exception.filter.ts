import { Catch, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/domain-error.js';
import type { DomainErrorType } from '../../domain/domain-error.js';

const STATUS_BY_TYPE: Record<DomainErrorType, HttpStatus> = {
  VALIDATION: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  BUSINESS_RULE: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const status = STATUS_BY_TYPE[error.type];
    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      error: error.type,
      message: error.message,
    });
  }
}
