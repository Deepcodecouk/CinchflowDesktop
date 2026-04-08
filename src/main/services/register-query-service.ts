import type { RegisterViewData } from '../../shared/types';
import { NotFoundError } from '../errors';
import { accountRepository } from '../repositories/account-repository';
import { categoryHeaderRepository } from '../repositories/category-header-repository';
import { transactionRepository } from '../repositories/transaction-repository';

export const registerQueryService = {
  getViewData(accountId: string, year: number, month: number): RegisterViewData {
    const account = accountRepository.findById(accountId);

    if (!account) {
      throw new NotFoundError(`Account not found: ${accountId}`);
    }

    return {
      account,
      year,
      month,
      openingBalance: transactionRepository.getOpeningBalanceForMonth(accountId, year, month),
      transactions: transactionRepository.findByMonth(accountId, year, month),
      categories: categoryHeaderRepository.findHierarchical(accountId),
    };
  },
};
