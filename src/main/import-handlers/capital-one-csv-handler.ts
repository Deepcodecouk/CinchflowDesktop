import type { IImportHandler } from './types';
import type { TransactionWithCategory } from '../../shared/types';
import { parseCsv } from './csv-parser';
import { generateExternalId } from './external-id-utils';

export const capitalOneCsvHandler: IImportHandler = {
  systemName: 'capital-one-csv',
  title: 'Capital One CSV',

  processFile(content: string): TransactionWithCategory[] {
    try {
      const rows = parseCsv(content);
      const transactions: TransactionWithCategory[] = [];

      for (const row of rows) {
        if (row.fields.length < 14) continue;

        const date = Math.floor(new Date(row.get(0)).getTime() / 1000);
        if (isNaN(date)) continue;

        const amount = parseFloat(row.get(2));
        if (isNaN(amount)) continue;

        const isCredit = row.get(9) === 'Credit';
        const deltaValue = isCredit ? amount : amount * -1;
        const description = row.get(3);

        transactions.push({
          id: '',
          account_id: '',
          category_id: null,
          date,
          description,
          user_note: null,
          delta_value: deltaValue,
          is_opening_balance: 0,
          is_flagged: 0,
          import_id: null,
          categorised_by_rule_id: null,
          external_id: generateExternalId(date, description, deltaValue),
          created_at: 0,
          updated_at: 0,
          category_name: null,
          category_type: null,
          category_colour: null,
        });
      }

      return transactions;
    } catch {
      return [];
    }
  },
};
