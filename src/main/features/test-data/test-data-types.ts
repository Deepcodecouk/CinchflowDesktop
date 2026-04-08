import type {
  CategoryHeaderType,
  CreateAccountData,
  CreateCategorisationRuleData,
} from '../../../shared/types';

export interface TestDataManifest {
  version: 1;
  accountIds: string[];
  createdAt: number;
}

export interface ScenarioMonthContext {
  year: number;
  month: number;
  offsetFromCurrent: number;
  dayLimit: number;
}

export interface ScenarioBudgetMonthContext {
  year: number;
  month: number;
  offsetFromCurrent: number;
}

export interface CategoryTemplate {
  key: string;
  name: string;
}

export interface HeaderTemplate {
  name: string;
  type: CategoryHeaderType;
  colour: string;
  categories: CategoryTemplate[];
}

export interface RuleTemplate {
  categoryKey: string;
  data: CreateCategorisationRuleData;
}

export interface TransactionTemplate {
  day: number;
  description: string;
  amount: (context: ScenarioMonthContext) => number;
  include?: (context: ScenarioMonthContext) => boolean;
}

export interface BudgetTemplate {
  categoryKey: string;
  amount: (context: ScenarioBudgetMonthContext) => number;
}

export interface AccountScenario {
  key: string;
  account: CreateAccountData & { openingBalance: number };
  headers: HeaderTemplate[];
  rules: RuleTemplate[];
  transactions: TransactionTemplate[];
  budgets: BudgetTemplate[];
}

export interface CategoryLinkTemplate {
  sourceAccountKey: string;
  sourceCategoryKey: string;
  targetAccountKey: string;
  targetCategoryKey: string;
}
