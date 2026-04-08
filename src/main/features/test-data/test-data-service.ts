import type {
  CreateTestDataResult,
  DbAccount,
  RemoveTestDataResult,
  TestDataStatus,
} from '../../../shared/types';
import { transaction, getDb } from '../../db/connection';
import { accountRepository } from '../../repositories/account-repository';
import { budgetRepository } from '../../repositories/budget-repository';
import { categorisationRuleRepository } from '../../repositories/categorisation-rule-repository';
import { categoryHeaderRepository } from '../../repositories/category-header-repository';
import { categoryLinkRepository } from '../../repositories/category-link-repository';
import { categoryRepository } from '../../repositories/category-repository';
import { settingsRepository } from '../../repositories/settings-repository';
import { transactionRepository } from '../../repositories/transaction-repository';
import { autoCategorisationService } from '../../services/auto-categorisation-service';
import {
  getBudgetMonths,
  getRecentTransactionMonths,
  TEST_DATA_CATEGORY_LINKS,
  TEST_DATA_SCENARIOS,
} from './test-data-scenario';
import type { TestDataManifest } from './test-data-types';

const TEST_DATA_MANIFEST_KEY = 'testData:manifest:v1';

function toUnixTimestamp(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 1000);
}

function getManifest(): TestDataManifest | null {
  const setting = settingsRepository.findByKey(TEST_DATA_MANIFEST_KEY);

  if (!setting) {
    return null;
  }

  try {
    const parsed = JSON.parse(setting.value) as TestDataManifest;

    if (parsed.version !== 1 || !Array.isArray(parsed.accountIds)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveManifest(accountIds: string[]): void {
  settingsRepository.upsert(
    TEST_DATA_MANIFEST_KEY,
    JSON.stringify({
      version: 1,
      accountIds,
      createdAt: Date.now(),
    } satisfies TestDataManifest),
  );
}

function clearManifest(): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(TEST_DATA_MANIFEST_KEY);
}

function getTrackedAccounts() {
  const manifest = getManifest();

  if (!manifest) {
    return [];
  }

  return manifest.accountIds
    .map((accountId) => accountRepository.findById(accountId))
    .filter((account): account is DbAccount => account !== undefined);
}

export const testDataService = {
  getStatus(): TestDataStatus {
    const trackedAccounts = getTrackedAccounts();

    return {
      hasTestData: trackedAccounts.length > 0,
      accountNames: trackedAccounts.map((account) => account.name),
    };
  },

  create(): CreateTestDataResult {
    return transaction(() => {
      if (this.getStatus().hasTestData) {
        throw new Error('Sample test data already exists. Remove it before creating a fresh set.');
      }

      const now = new Date();
      const accountIdMap = new Map<string, string>();
      const categoryIdMap = new Map<string, string>();

      const result: CreateTestDataResult = {
        accountsCreated: 0,
        headersCreated: 0,
        categoriesCreated: 0,
        rulesCreated: 0,
        transactionsCreated: 0,
        budgetsCreated: 0,
        linksCreated: 0,
      };

      for (const scenario of TEST_DATA_SCENARIOS) {
        const account = accountRepository.create(scenario.account);
        accountRepository.setOpeningBalance(account.id, scenario.account.openingBalance);

        accountIdMap.set(scenario.key, account.id);
        result.accountsCreated += 1;

        for (const headerTemplate of scenario.headers) {
          const header = categoryHeaderRepository.create({
            account_id: account.id,
            name: headerTemplate.name,
            type: headerTemplate.type,
            colour: headerTemplate.colour,
          });

          result.headersCreated += 1;

          for (const categoryTemplate of headerTemplate.categories) {
            const category = categoryRepository.create({
              category_header_id: header.id,
              name: categoryTemplate.name,
            });

            categoryIdMap.set(`${scenario.key}:${categoryTemplate.key}`, category.id);
            result.categoriesCreated += 1;
          }
        }

        for (const ruleTemplate of scenario.rules) {
          const categoryId = categoryIdMap.get(`${scenario.key}:${ruleTemplate.categoryKey}`);

          if (!categoryId) {
            throw new Error(`Missing category for rule ${scenario.key}:${ruleTemplate.categoryKey}`);
          }

          categorisationRuleRepository.create(account.id, {
            ...ruleTemplate.data,
            category_id: categoryId,
          });
          result.rulesCreated += 1;
        }
      }

      for (const linkTemplate of TEST_DATA_CATEGORY_LINKS) {
        const sourceAccountId = accountIdMap.get(linkTemplate.sourceAccountKey);
        const sourceCategoryId = categoryIdMap.get(`${linkTemplate.sourceAccountKey}:${linkTemplate.sourceCategoryKey}`);
        const targetAccountId = accountIdMap.get(linkTemplate.targetAccountKey);
        const targetCategoryId = categoryIdMap.get(`${linkTemplate.targetAccountKey}:${linkTemplate.targetCategoryKey}`);

        if (!sourceAccountId || !sourceCategoryId || !targetAccountId || !targetCategoryId) {
          throw new Error('Missing linked category while creating sample data.');
        }

        categoryLinkRepository.create({
          source_account_id: sourceAccountId,
          source_category_id: sourceCategoryId,
          target_account_id: targetAccountId,
          target_category_id: targetCategoryId,
        });
        result.linksCreated += 1;
      }

      const recentMonths = getRecentTransactionMonths(now);

      for (const scenario of TEST_DATA_SCENARIOS) {
        const accountId = accountIdMap.get(scenario.key);

        if (!accountId) {
          throw new Error(`Missing account for scenario ${scenario.key}`);
        }

        for (const monthContext of recentMonths) {
          for (const transactionTemplate of scenario.transactions) {
            const include = transactionTemplate.include ? transactionTemplate.include(monthContext) : true;
            const day = Math.min(transactionTemplate.day, monthContext.dayLimit);
            const amount = transactionTemplate.amount(monthContext);

            if (!include || day < 1 || amount === 0) {
              continue;
            }

            transactionRepository.create({
              account_id: accountId,
              category_id: null,
              date: toUnixTimestamp(monthContext.year, monthContext.month, day),
              description: transactionTemplate.description,
              delta_value: amount,
            });
            result.transactionsCreated += 1;
          }

          const preview = autoCategorisationService.preview(
            accountId,
            monthContext.year,
            monthContext.month,
            'uncategorised',
          );

          autoCategorisationService.apply(accountId, preview.matched, false);
        }

        for (const budgetMonth of getBudgetMonths(now)) {
          for (const budgetTemplate of scenario.budgets) {
            const categoryId = categoryIdMap.get(`${scenario.key}:${budgetTemplate.categoryKey}`);

            if (!categoryId) {
              throw new Error(`Missing category for budget ${scenario.key}:${budgetTemplate.categoryKey}`);
            }

            budgetRepository.upsert(
              accountId,
              categoryId,
              budgetMonth.year,
              budgetMonth.month,
              budgetTemplate.amount(budgetMonth),
            );
            result.budgetsCreated += 1;
          }
        }
      }

      saveManifest(Array.from(accountIdMap.values()));
      return result;
    });
  },

  remove(): RemoveTestDataResult {
    return transaction(() => {
      const trackedAccounts = getTrackedAccounts();

      for (const account of trackedAccounts) {
        accountRepository.delete(account.id);
      }

      clearManifest();

      return {
        accountsRemoved: trackedAccounts.length,
      };
    });
  },
};
