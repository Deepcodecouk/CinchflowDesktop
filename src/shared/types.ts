export type CategoryHeaderType = 'income_start' | 'income_end' | 'fixed_expense' | 'variable_expense';

// Database entities
export interface DbAccount {
  id: string;
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
  created_at: number;
  updated_at: number;
}

export interface DbCategoryHeader {
  id: string;
  account_id: string;
  name: string;
  type: CategoryHeaderType;
  colour: string;
  created_at: number;
  updated_at: number;
}

export interface DbCategory {
  id: string;
  category_header_id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface DbTransaction {
  id: string;
  account_id: string;
  category_id: string | null;
  date: number;
  description: string;
  user_note: string | null;
  delta_value: number;
  is_opening_balance: number;
  is_flagged: number;
  import_id: string | null;
  categorised_by_rule_id: string | null;
  external_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface DbCategorisationRule {
  id: string;
  account_id: string;
  category_id: string | null;
  match_text: string;
  match_type: 'contains' | 'exact' | 'starts_with' | 'regex';
  min_amount: number | null;
  max_amount: number | null;
  created_at: number;
  updated_at: number;
}

export interface DbBudgetAmount {
  id: string;
  account_id: string;
  category_id: string | null;
  year: number;
  month: number;
  amount: number;
  created_at: number;
  updated_at: number;
}

export interface DbImport {
  id: string;
  account_id: string;
  created_at: number;
}

export interface DbSetting {
  key: string;
  value: string;
  created_at: number;
  updated_at: number;
}

export interface DbCashflowComment {
  id: string;
  account_id: string;
  category_id: string | null;
  year: number;
  month: number;
  comment: string;
  created_at: number;
  updated_at: number;
}

export interface DbCategoryLink {
  id: string;
  source_account_id: string;
  source_category_id: string;
  target_account_id: string;
  target_category_id: string;
  created_at: number;
  updated_at: number;
}

export interface CategoryLinkWithNames extends DbCategoryLink {
  source_account_name: string;
  source_category_name: string;
  target_account_name: string;
  target_category_name: string;
}

export interface DbNote {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

// Composite and view types
export interface CategoryHierarchy {
  header: DbCategoryHeader;
  categories: DbCategory[];
}

export interface TransactionWithCategory extends DbTransaction {
  category_name: string | null;
  category_type: CategoryHeaderType | null;
  category_colour: string | null;
}

export interface AccountWithBalance extends DbAccount {
  opening_balance: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
  balance: number;
}

export type DashboardMonthType = 'past' | 'current' | 'future';

export interface DashboardAccountBalanceSummary {
  monthType: DashboardMonthType;
  openingBalance: number;
  closingBudget: number;
  closingActual: number;
  closingHybrid: number;
}

export interface DashboardBudgetProgressItem {
  category_id: string;
  category_name: string;
  category_header_id: string;
  category_header_name: string;
  category_colour: string;
  category_type: CategoryHeaderType;
  budget: number;
  actual: number;
  comment: string | null;
}

export interface DashboardBudgetProgressAccount {
  account_id: string;
  account_name: string;
  account_icon: string;
  balanceSummary: DashboardAccountBalanceSummary;
  items: DashboardBudgetProgressItem[];
}

export interface CashflowCategoryDrilldownFilter {
  kind: 'category';
  categoryId: string | null;
  categoryName: string;
}

export interface CashflowHeaderDrilldownFilter {
  kind: 'header';
  headerId: string;
  headerName: string;
}

export type CashflowActualTransactionsFilter =
  | CashflowCategoryDrilldownFilter
  | CashflowHeaderDrilldownFilter;

export interface CashflowActualTransactionsRequest {
  accountId: string;
  year: number;
  month: number;
  filter: CashflowActualTransactionsFilter;
}

export interface CategoryActual {
  category_id: string;
  total: number;
}

export interface AccountCategoryTotal {
  account_id: string;
  category_id: string;
  total: number;
}

export type CarryForwardMode = 'budget' | 'actual' | 'hybrid';

export interface CashflowCoreData {
  account: DbAccount;
  hierarchies: CategoryHierarchy[];
  budgetLookup: Record<string, Record<number, number>>;
  actualsLookup: Record<string, Record<number, number>>;
  openingBalance: number;
  projectedOpeningBalances?: Record<CarryForwardMode, number>;
}

export interface CashflowTableData extends CashflowCoreData {
  comments: DbCashflowComment[];
  categoryLinks: CategoryLinkWithNames[];
}

export type CashflowAccountData = CashflowCoreData;

export interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ImportHandlerInfo {
  systemName: string;
  title: string;
}

export interface ImportPreviewTransaction extends TransactionWithCategory {
  external_id: string | null;
}

export interface ImportTransformResult {
  toImport: ImportPreviewTransaction[];
  skipped: ImportPreviewTransaction[];
}

export interface AccountFormData {
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
  opening_balance: string;
}

export interface AutoCategoriseProposal {
  transaction_id: string;
  rule_id: string;
  category_id: string;
  rule_match_text: string;
  category_name: string;
  category_colour: string | null;
  transaction_description: string;
  transaction_date: number;
  transaction_amount: number;
}

export interface AutoCategorisePreview {
  matched: AutoCategoriseProposal[];
  unmatched: TransactionWithCategory[];
}

export interface RegisterViewData {
  account: DbAccount;
  year: number;
  month: number;
  openingBalance: number;
  transactions: TransactionWithCategory[];
  categories: CategoryHierarchy[];
}

export interface AppInfo {
  version: string;
  displayVersion: string;
}

export interface TestDataStatus {
  hasTestData: boolean;
  accountNames: string[];
}

export interface CreateTestDataResult {
  accountsCreated: number;
  headersCreated: number;
  categoriesCreated: number;
  rulesCreated: number;
  transactionsCreated: number;
  budgetsCreated: number;
  linksCreated: number;
}

export interface RemoveTestDataResult {
  accountsRemoved: number;
}

// DTOs
export interface CreateAccountData {
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
}

export interface UpdateAccountData {
  name?: string;
  icon?: string;
  type?: 'current' | 'savings' | 'credit';
}

export interface CreateCategoryHeaderData {
  name: string;
  type: CategoryHeaderType;
  colour: string;
  account_id: string;
}

export interface UpdateCategoryHeaderData {
  name?: string;
  type?: CategoryHeaderType;
  colour?: string;
}

export interface CreateCategoryData {
  name: string;
  category_header_id: string;
}

export interface UpdateCategoryData {
  name?: string;
  category_header_id?: string;
}

export interface CreateTransactionData {
  date: number;
  description: string;
  category_id: string | null;
  delta_value: number;
}

export interface UpdateTransactionData {
  date: number;
  description: string;
  category_id: string | null;
  delta_value: number;
}

export interface TransactionSearchParams {
  accountId?: string;
  query?: string;
  dateFrom?: number;
  dateTo?: number;
  minAmount?: number;
  maxAmount?: number;
  flagged?: boolean;
  categoryId?: string | null;
}

export interface CreateCategorisationRuleData {
  category_id: string;
  match_text: string;
  match_type: 'contains' | 'exact' | 'starts_with' | 'regex';
  min_amount: number | null;
  max_amount: number | null;
}

export interface UpdateCategorisationRuleData {
  category_id?: string;
  match_text?: string;
  match_type?: 'contains' | 'exact' | 'starts_with' | 'regex';
  min_amount?: number | null;
  max_amount?: number | null;
}
