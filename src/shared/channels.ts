// IPC channel name constants

export const CHANNELS = {
  APP_GET_INFO: 'app:getInfo',

  // Accounts
  ACCOUNTS_FIND_ALL: 'accounts:findAll',
  ACCOUNTS_FIND_BY_ID: 'accounts:findById',
  ACCOUNTS_CREATE: 'accounts:create',
  ACCOUNTS_UPDATE: 'accounts:update',
  ACCOUNTS_DELETE: 'accounts:delete',

  // Category Headers
  CATEGORY_HEADERS_FIND_BY_ACCOUNT: 'categoryHeaders:findByAccount',
  CATEGORY_HEADERS_FIND_HIERARCHICAL: 'categoryHeaders:findHierarchical',
  CATEGORY_HEADERS_CREATE: 'categoryHeaders:create',
  CATEGORY_HEADERS_UPDATE: 'categoryHeaders:update',
  CATEGORY_HEADERS_DELETE: 'categoryHeaders:delete',

  // Categories
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  CATEGORIES_COUNT_TRANSACTIONS: 'categories:countTransactions',
  CATEGORIES_DELETE_WITH_REASSIGNMENT: 'categories:deleteWithReassignment',

  // Transactions
  REGISTER_GET_VIEW_DATA: 'register:getViewData',
  TRANSACTIONS_FIND_BY_MONTH: 'transactions:findByMonth',
  TRANSACTIONS_GET_OPENING_BALANCE: 'transactions:getOpeningBalance',
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_UPDATE: 'transactions:update',
  TRANSACTIONS_DELETE: 'transactions:delete',
  TRANSACTIONS_TOGGLE_FLAG: 'transactions:toggleFlag',
  TRANSACTIONS_UPDATE_NOTE: 'transactions:updateNote',
  TRANSACTIONS_AUTO_CATEGORISE_PREVIEW: 'transactions:autoCategorise:preview',
  TRANSACTIONS_AUTO_CATEGORISE_APPLY: 'transactions:autoCategorise:apply',
  TRANSACTIONS_SEARCH: 'transactions:search',

  // Categorisation Rules
  RULES_FIND_BY_ID: 'rules:findById',
  RULES_FIND_BY_ACCOUNT: 'rules:findByAccount',
  RULES_CREATE: 'rules:create',
  RULES_UPDATE: 'rules:update',
  RULES_DELETE: 'rules:delete',

  // Import
  IMPORT_GET_HANDLERS: 'import:getHandlers',
  IMPORT_TRANSFORM: 'import:transform',
  IMPORT_PROCESS: 'import:process',
  IMPORT_GET_HISTORY: 'import:getHistory',
  IMPORT_ROLLBACK: 'import:rollback',

  // Cashflow
  CASHFLOW_GET_TABLE_DATA: 'cashflow:getTableData',
  CASHFLOW_GET_ACTUAL_TRANSACTIONS: 'cashflow:getActualTransactions',


  // Budget
  BUDGET_UPSERT: 'budget:upsert',
  BUDGET_FILL_RIGHT: 'budget:fillRight',
  BUDGET_COPY_FROM_PREVIOUS_MONTH: 'budget:copyFromPreviousMonth',
  BUDGET_COPY_FROM_PREVIOUS_YEAR: 'budget:copyFromPreviousYear',
  BUDGET_CLEAR_MONTH: 'budget:clearMonth',

  // Cashflow Comments
  CASHFLOW_COMMENTS_GET: 'cashflowComments:get',
  CASHFLOW_COMMENTS_UPSERT: 'cashflowComments:upsert',
  CASHFLOW_COMMENTS_DELETE: 'cashflowComments:delete',

  // Dashboard
  DASHBOARD_BALANCES: 'dashboard:balances',
  DASHBOARD_BUDGET_PROGRESS: 'dashboard:budgetProgress',

  // Settings
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // PIN
  PIN_IS_SET: 'pin:isSet',
  PIN_SET: 'pin:set',
  PIN_VERIFY: 'pin:verify',
  PIN_CLEAR: 'pin:clear',

  // Database
  DB_BACKUP: 'db:backup',
  DB_RESTORE: 'db:restore',

  // Dialog
  DIALOG_OPEN_FILE: 'dialog:openFile',

  // Category Links
  CATEGORY_LINKS_FIND_ALL: 'categoryLinks:findAll',
  CATEGORY_LINKS_FIND_BY_CATEGORY: 'categoryLinks:findByCategory',
  CATEGORY_LINKS_CREATE: 'categoryLinks:create',
  CATEGORY_LINKS_DELETE: 'categoryLinks:delete',

  // Notes
  NOTES_FIND_ALL: 'notes:findAll',
  NOTES_CREATE: 'notes:create',
  NOTES_UPDATE: 'notes:update',
  NOTES_DELETE: 'notes:delete',

  // Rapid Config
  RAPID_CONFIG_PARSE: 'rapidConfig:parse',
  RAPID_CONFIG_EXECUTE: 'rapidConfig:execute',
  RAPID_CONFIG_EXPORT: 'rapidConfig:export',

  // Test Data
  TEST_DATA_GET_STATUS: 'testData:getStatus',
  TEST_DATA_CREATE: 'testData:create',
  TEST_DATA_REMOVE: 'testData:remove',
} as const;
