import type { IImportHandler } from './types';
import type { TransactionWithCategory } from '../../shared/types';
import { parseCsv } from './csv-parser';
import { generateExternalId } from './external-id-utils';

export const basicCsvHandler: IImportHandler = {
  systemName: 'basic-csv',
  title: 'Basic CSV',

  processFile(content: string): TransactionWithCategory[] {
    try {
      const rows = parseCsv(content);
      const transactions: TransactionWithCategory[] = [];

      for (const row of rows) {
        const dateStr = row.get(0);
        const description = row.get(1);
        const amountStr = row.get(2);

        if (!dateStr || !description || !amountStr) continue;

        const date = parseDate(dateStr);
        const amount = parseFloat(amountStr);
        if (isNaN(date) || isNaN(amount) || amount === 0) continue;

        transactions.push({
          id: '',
          account_id: '',
          category_id: null,
          date,
          description,
          user_note: null,
          delta_value: amount,
          is_opening_balance: 0,
          is_flagged: 0,
          import_id: null,
          categorised_by_rule_id: null,
          external_id: generateExternalId(date, description, amount),
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

function parseDate(dateStr: string): number {
  // Try various date formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime() / 1000;
  }

  // Try DD/MM/YYYY
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const date = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
    if (!isNaN(date.getTime())) {
      return date.getTime() / 1000;
    }
  }

  return NaN;
}
