import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateAccount } from '../../application/create-account.js';
import { DeleteAccount } from '../../application/delete-account.js';
import { GetAccountPath } from '../../application/get-account-path.js';
import { GetCatalogTree } from '../../application/get-catalog-tree.js';
import type { AccountTreeNode } from '../../application/get-catalog-tree.js';
import { RenameAccount } from '../../application/rename-account.js';
import type { Account } from '../../domain/account.js';

// El cuerpo llega como JSON sin tipar: el dominio valida tipos y valores,
// así no se duplican reglas ni se agregan dependencias de validación.
interface CreateAccountBody {
  code: string;
  name: string;
  nature?: string;
}

interface RenameAccountBody {
  name: string;
}

interface AccountResponse {
  code: string;
  name: string;
  level: string;
  nature: string;
  parentCode: string | null;
}

function toResponse(account: Account): AccountResponse {
  return {
    code: account.code,
    name: account.name,
    level: account.level,
    nature: account.nature,
    parentCode: account.parentCode,
  };
}

@Controller('accounts')
export class AccountsController {
  private readonly createAccount: CreateAccount;
  private readonly getCatalogTree: GetCatalogTree;
  private readonly renameAccount: RenameAccount;
  private readonly deleteAccount: DeleteAccount;
  private readonly getAccountPath: GetAccountPath;

  constructor(
    createAccount: CreateAccount,
    getCatalogTree: GetCatalogTree,
    renameAccount: RenameAccount,
    deleteAccount: DeleteAccount,
    getAccountPath: GetAccountPath,
  ) {
    this.createAccount = createAccount;
    this.getCatalogTree = getCatalogTree;
    this.renameAccount = renameAccount;
    this.deleteAccount = deleteAccount;
    this.getAccountPath = getAccountPath;
  }

  @Post()
  async create(@Body() body: CreateAccountBody): Promise<AccountResponse> {
    const account = await this.createAccount.execute({
      code: body?.code,
      name: body?.name,
      nature: body?.nature,
    });
    return toResponse(account);
  }

  @Get('tree')
  tree(): Promise<AccountTreeNode[]> {
    return this.getCatalogTree.execute();
  }

  @Get(':code/path')
  async path(@Param('code') code: string): Promise<AccountResponse[]> {
    const path = await this.getAccountPath.execute(code);
    return path.map(toResponse);
  }

  @Patch(':code')
  async rename(
    @Param('code') code: string,
    @Body() body: RenameAccountBody,
  ): Promise<AccountResponse> {
    const account = await this.renameAccount.execute({
      code,
      name: body?.name,
    });
    return toResponse(account);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('code') code: string): Promise<void> {
    return this.deleteAccount.execute(code);
  }
}
