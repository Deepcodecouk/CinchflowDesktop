import { registerAppHandlers } from './app-handlers';
import { registerAccountHandlers } from './account-handlers';
import { registerCategoryHandlers } from './category-handlers';
import { registerCategoryLinkHandlers } from './category-link-handlers';
import { registerTransactionHandlers } from './transaction-handlers';
import { registerImportHandlers } from './import-handlers';
import { registerCategorisationHandlers } from './categorisation-handlers';
import { registerCashflowHandlers } from './cashflow-handlers';
import { registerDashboardHandlers } from './dashboard-handlers';
import { registerNotesHandlers } from './notes-handlers';
import { registerSettingsHandlers } from './settings-handlers';
import { registerPinHandlers } from './pin-handlers';
import { registerRapidConfigHandlers } from './rapid-config-handlers';
import { registerTestDataHandlers } from './test-data-handlers';

export function registerAllHandlers(): void {
  registerAppHandlers();
  registerAccountHandlers();
  registerCategoryHandlers();
  registerCategoryLinkHandlers();
  registerTransactionHandlers();
  registerImportHandlers();
  registerCategorisationHandlers();
  registerCashflowHandlers();
  registerDashboardHandlers();
  registerNotesHandlers();
  registerSettingsHandlers();
  registerPinHandlers();
  registerRapidConfigHandlers();
  registerTestDataHandlers();
}
