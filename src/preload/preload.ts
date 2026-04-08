import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '../shared/channels';
import type {
  AppInfo,
  CreateAccountData,
  CreateTestDataResult,
  UpdateAccountData,
  CreateCategoryHeaderData,
  UpdateCategoryHeaderData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateTransactionData,
  UpdateTransactionData,
  CreateCategorisationRuleData,
  UpdateCategorisationRuleData,
  AccountBalance,
  CashflowActualTransactionsRequest,
  DashboardBudgetProgressAccount,
  IpcResponse,
  RemoveTestDataResult,
  TestDataStatus,
} from '../shared/types';

const api = {
  app: {
    getInfo: () => ipcRenderer.invoke(CHANNELS.APP_GET_INFO) as Promise<IpcResponse<AppInfo>>,
  },

  accounts: {
    findAll: () => ipcRenderer.invoke(CHANNELS.ACCOUNTS_FIND_ALL),
    findById: (id: string) => ipcRenderer.invoke(CHANNELS.ACCOUNTS_FIND_BY_ID, id),
    create: (data: CreateAccountData & { openingBalance: number }) =>
      ipcRenderer.invoke(CHANNELS.ACCOUNTS_CREATE, data),
    update: (id: string, data: UpdateAccountData & { openingBalance?: number }) =>
      ipcRenderer.invoke(CHANNELS.ACCOUNTS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.ACCOUNTS_DELETE, id),
  },

  categoryHeaders: {
    findByAccount: (accountId: string) =>
      ipcRenderer.invoke(CHANNELS.CATEGORY_HEADERS_FIND_BY_ACCOUNT, accountId),
    findHierarchical: (accountId: string) =>
      ipcRenderer.invoke(CHANNELS.CATEGORY_HEADERS_FIND_HIERARCHICAL, accountId),
    create: (data: CreateCategoryHeaderData) =>
      ipcRenderer.invoke(CHANNELS.CATEGORY_HEADERS_CREATE, data),
    update: (id: string, data: UpdateCategoryHeaderData) =>
      ipcRenderer.invoke(CHANNELS.CATEGORY_HEADERS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.CATEGORY_HEADERS_DELETE, id),
  },

  categories: {
    create: (data: CreateCategoryData) => ipcRenderer.invoke(CHANNELS.CATEGORIES_CREATE, data),
    update: (id: string, data: UpdateCategoryData) =>
      ipcRenderer.invoke(CHANNELS.CATEGORIES_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.CATEGORIES_DELETE, id),
    countTransactions: (categoryId: string) =>
      ipcRenderer.invoke(CHANNELS.CATEGORIES_COUNT_TRANSACTIONS, categoryId),
    deleteWithReassignment: (categoryId: string, reassignTo: string | null) =>
      ipcRenderer.invoke(CHANNELS.CATEGORIES_DELETE_WITH_REASSIGNMENT, categoryId, reassignTo),
  },

  transactions: {
    findByMonth: (accountId: string, year: number, month: number) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_FIND_BY_MONTH, accountId, year, month),
    getOpeningBalance: (accountId: string, year: number, month: number) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_GET_OPENING_BALANCE, accountId, year, month),
    create: (accountId: string, data: CreateTransactionData) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_CREATE, accountId, data),
    update: (id: string, data: UpdateTransactionData) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.TRANSACTIONS_DELETE, id),
    toggleFlag: (id: string) => ipcRenderer.invoke(CHANNELS.TRANSACTIONS_TOGGLE_FLAG, id),
    updateNote: (id: string, note: string | null) => ipcRenderer.invoke(CHANNELS.TRANSACTIONS_UPDATE_NOTE, id, note),
    autoCategorisePreview: (accountId: string, year: number, month: number, mode: string) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_AUTO_CATEGORISE_PREVIEW, accountId, year, month, mode),
    autoCategoriseApply: (accountId: string, proposals: unknown[], overwrite: boolean) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_AUTO_CATEGORISE_APPLY, accountId, proposals, overwrite),
    search: (params: { accountId?: string; query?: string; dateFrom?: number; dateTo?: number; minAmount?: number; maxAmount?: number; flagged?: boolean; categoryId?: string | null }) =>
      ipcRenderer.invoke(CHANNELS.TRANSACTIONS_SEARCH, params),
  },

  register: {
    getViewData: (accountId: string, year: number, month: number) =>
      ipcRenderer.invoke(CHANNELS.REGISTER_GET_VIEW_DATA, accountId, year, month),
  },

  rules: {
    findById: (id: string) =>
      ipcRenderer.invoke(CHANNELS.RULES_FIND_BY_ID, id),
    findByAccount: (accountId: string) =>
      ipcRenderer.invoke(CHANNELS.RULES_FIND_BY_ACCOUNT, accountId),
    create: (accountId: string, data: CreateCategorisationRuleData) =>
      ipcRenderer.invoke(CHANNELS.RULES_CREATE, accountId, data),
    update: (id: string, data: UpdateCategorisationRuleData) =>
      ipcRenderer.invoke(CHANNELS.RULES_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.RULES_DELETE, id),
  },

  import: {
    getHandlers: () => ipcRenderer.invoke(CHANNELS.IMPORT_GET_HANDLERS),
    transform: (accountId: string, handlerName: string, fileContent: string, autoCategorise: boolean) =>
      ipcRenderer.invoke(CHANNELS.IMPORT_TRANSFORM, accountId, handlerName, fileContent, autoCategorise),
    process: (accountId: string, transactions: unknown[]) =>
      ipcRenderer.invoke(CHANNELS.IMPORT_PROCESS, accountId, transactions),
    getHistory: (accountId: string) =>
      ipcRenderer.invoke(CHANNELS.IMPORT_GET_HISTORY, accountId),
    rollback: (importId: string) => ipcRenderer.invoke(CHANNELS.IMPORT_ROLLBACK, importId),
  },

  cashflow: {
    getTableData: (accountId: string, year: number) =>
      ipcRenderer.invoke(CHANNELS.CASHFLOW_GET_TABLE_DATA, accountId, year),
    getActualTransactions: (request: CashflowActualTransactionsRequest) =>
      ipcRenderer.invoke(CHANNELS.CASHFLOW_GET_ACTUAL_TRANSACTIONS, request),
  },

  budget: {
    upsert: (accountId: string, categoryId: string | null, year: number, month: number, amount: number) =>
      ipcRenderer.invoke(CHANNELS.BUDGET_UPSERT, accountId, categoryId, year, month, amount),
    fillRight: (accountId: string, categoryId: string | null, year: number, fromMonth: number, amount: number, mode: string) =>
      ipcRenderer.invoke(CHANNELS.BUDGET_FILL_RIGHT, accountId, categoryId, year, fromMonth, amount, mode),
    copyFromPreviousMonth: (accountId: string, year: number, month: number, mode: string) =>
      ipcRenderer.invoke(CHANNELS.BUDGET_COPY_FROM_PREVIOUS_MONTH, accountId, year, month, mode),
    copyFromPreviousYear: (accountId: string, year: number, mode: string) =>
      ipcRenderer.invoke(CHANNELS.BUDGET_COPY_FROM_PREVIOUS_YEAR, accountId, year, mode),
    clearMonth: (accountId: string, year: number, month: number) =>
      ipcRenderer.invoke(CHANNELS.BUDGET_CLEAR_MONTH, accountId, year, month),
  },

  cashflowComments: {
    get: (accountId: string, year: number) =>
      ipcRenderer.invoke(CHANNELS.CASHFLOW_COMMENTS_GET, accountId, year),
    upsert: (accountId: string, categoryId: string | null, year: number, month: number, comment: string) =>
      ipcRenderer.invoke(CHANNELS.CASHFLOW_COMMENTS_UPSERT, accountId, categoryId, year, month, comment),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.CASHFLOW_COMMENTS_DELETE, id),
  },

  dashboard: {
    balances: (year: number, month: number) =>
      ipcRenderer.invoke(CHANNELS.DASHBOARD_BALANCES, year, month) as Promise<IpcResponse<AccountBalance[]>>,
    budgetProgress: (year: number, month: number) =>
      ipcRenderer.invoke(CHANNELS.DASHBOARD_BUDGET_PROGRESS, year, month) as Promise<IpcResponse<DashboardBudgetProgressAccount[]>>,
  },

  settings: {
    getAll: () => ipcRenderer.invoke(CHANNELS.SETTINGS_GET_ALL),
    get: (key: string) => ipcRenderer.invoke(CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: string) => ipcRenderer.invoke(CHANNELS.SETTINGS_SET, key, value),
  },

  pin: {
    isSet: () => ipcRenderer.invoke(CHANNELS.PIN_IS_SET),
    set: (pin: string) => ipcRenderer.invoke(CHANNELS.PIN_SET, pin),
    verify: (pin: string) => ipcRenderer.invoke(CHANNELS.PIN_VERIFY, pin),
    clear: (pin: string) => ipcRenderer.invoke(CHANNELS.PIN_CLEAR, pin),
  },

  db: {
    backup: () => ipcRenderer.invoke(CHANNELS.DB_BACKUP),
    restore: () => ipcRenderer.invoke(CHANNELS.DB_RESTORE),
  },

  dialog: {
    openFile: (filters: Electron.FileFilter[]) =>
      ipcRenderer.invoke(CHANNELS.DIALOG_OPEN_FILE, filters),
  },

  categoryLinks: {
    findAll: () => ipcRenderer.invoke(CHANNELS.CATEGORY_LINKS_FIND_ALL),
    findByCategory: (categoryId: string) =>
      ipcRenderer.invoke(CHANNELS.CATEGORY_LINKS_FIND_BY_CATEGORY, categoryId),
    create: (data: { source_account_id: string; source_category_id: string; target_account_id: string; target_category_id: string }) =>
      ipcRenderer.invoke(CHANNELS.CATEGORY_LINKS_CREATE, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.CATEGORY_LINKS_DELETE, id),
  },

  notes: {
    findAll: () => ipcRenderer.invoke(CHANNELS.NOTES_FIND_ALL),
    create: (data: { title: string; content: string }) =>
      ipcRenderer.invoke(CHANNELS.NOTES_CREATE, data),
    update: (id: string, data: { title?: string; content?: string }) =>
      ipcRenderer.invoke(CHANNELS.NOTES_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.NOTES_DELETE, id),
  },

  onFillRightShortcut: (callback: (shift: boolean) => void) => {

    const handler = (_event: Electron.IpcRendererEvent, shift: boolean) => callback(shift);

    ipcRenderer.on('shortcut:fill-right', handler);
    return () => {

      ipcRenderer.removeListener('shortcut:fill-right', handler);
    
};
  
},

  rapidConfig: {
    parse: (content: string) => ipcRenderer.invoke(CHANNELS.RAPID_CONFIG_PARSE, content),
    execute: (plan: unknown) => ipcRenderer.invoke(CHANNELS.RAPID_CONFIG_EXECUTE, plan),
    export: () => ipcRenderer.invoke(CHANNELS.RAPID_CONFIG_EXPORT),
  },

  testData: {
    getStatus: () => ipcRenderer.invoke(CHANNELS.TEST_DATA_GET_STATUS) as Promise<IpcResponse<TestDataStatus>>,
    create: () => ipcRenderer.invoke(CHANNELS.TEST_DATA_CREATE) as Promise<IpcResponse<CreateTestDataResult>>,
    remove: () => ipcRenderer.invoke(CHANNELS.TEST_DATA_REMOVE) as Promise<IpcResponse<RemoveTestDataResult>>,
  },
};

export type ApiType = typeof api;

contextBridge.exposeInMainWorld('api', api);
