import type { IImportHandler } from './types';
import type { TransactionWithCategory } from '../../shared/types';
import { parseOfx } from './ofx-parser';

export const ofxHandler: IImportHandler = {
  systemName: 'ofx',
  title: 'OFX/QFX',

  processFile(content: string): TransactionWithCategory[] {
    try {
      const ofxTransactions = parseOfx(content);

      return ofxTransactions.map((tx) => ({
        id: '',
        account_id: '',
        category_id: null,
        date: tx.date,
        description: tx.description,
        user_note: null,
        delta_value: tx.amount,
        is_opening_balance: 0,
        is_flagged: 0,
        import_id: null,
        categorised_by_rule_id: null,
        external_id: tx.fitId,
        created_at: 0,
        updated_at: 0,
        category_name: null,
        category_type: null,
        category_colour: null,
      }));
    } catch {
      return [];
    }
  },
};
