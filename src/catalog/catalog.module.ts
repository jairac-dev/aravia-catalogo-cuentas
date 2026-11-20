import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CreateAccount } from './application/create-account.js';
import { DeleteAccount } from './application/delete-account.js';
import { GetCatalogTree } from './application/get-catalog-tree.js';
import { RenameAccount } from './application/rename-account.js';
import { ACCOUNT_REPOSITORY } from './domain/account-repository.js';
import type { AccountRepository } from './domain/account-repository.js';
import { AccountsController } from './infrastructure/http/accounts.controller.js';
import { DomainExceptionFilter } from './infrastructure/http/domain-exception.filter.js';
import { InMemoryAccountRepository } from './infrastructure/persistence/in-memory-account.repository.js';

@Module({
  controllers: [AccountsController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: InMemoryAccountRepository },
    {
      provide: CreateAccount,
      useFactory: (repository: AccountRepository) =>
        new CreateAccount(repository),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: GetCatalogTree,
      useFactory: (repository: AccountRepository) =>
        new GetCatalogTree(repository),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: RenameAccount,
      useFactory: (repository: AccountRepository) =>
        new RenameAccount(repository),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: DeleteAccount,
      useFactory: (repository: AccountRepository) =>
        new DeleteAccount(repository),
      inject: [ACCOUNT_REPOSITORY],
    },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class CatalogModule {}
