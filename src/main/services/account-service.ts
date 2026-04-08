import { accountRepository } from '../repositories/account-repository';
import { transaction } from '../db/connection';
import { NotFoundError } from '../errors';
import type { AccountWithBalance, CreateAccountData, UpdateAccountData } from '../../shared/types';

export const accountService = {
  getAllAccountsWithBalance(): AccountWithBalance[] {
    const accounts = accountRepository.findAll();
    return accounts.map((account) => ({
      ...account,
      opening_balance: accountRepository.getOpeningBalanceAmount(account.id),
    }));
  },

  getAccountWithBalance(id: string): AccountWithBalance {
    const account = accountRepository.findById(id);
    if (!account) throw new NotFoundError(`Account not found: ${id}`);
    return {
      ...account,
      opening_balance: accountRepository.getOpeningBalanceAmount(id),
    };
  },

  createAccountWithBalance(data: CreateAccountData & { openingBalance: number }): AccountWithBalance {
    return transaction((db) => {
      const account = accountRepository.create(data);
      accountRepository.setOpeningBalance(account.id, data.openingBalance);
      return {
        ...account,
        opening_balance: data.openingBalance,
      };
    });
  },

  updateAccountWithBalance(id: string, data: UpdateAccountData & { openingBalance?: number }): AccountWithBalance {
    return transaction((db) => {
      const { openingBalance, ...accountData } = data;
      const account = accountRepository.update(id, accountData);
      if (openingBalance !== undefined) {
        accountRepository.setOpeningBalance(id, openingBalance);
      }
      return {
        ...account,
        opening_balance: openingBalance ?? accountRepository.getOpeningBalanceAmount(id),
      };
    });
  },

  deleteAccount(id: string): boolean {
    const account = accountRepository.findById(id);
    if (!account) throw new NotFoundError(`Account not found: ${id}`);
    return accountRepository.delete(id);
  },
};
