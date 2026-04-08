import { transaction, getDb } from '../db/connection';
import { generateId } from '../db/utils';
import { importRepository } from '../repositories/import-repository';
import { categorisationRuleRepository } from '../repositories/categorisation-rule-repository';
import { matchesRule } from './auto-categorisation-service';
import { buildCategoryLookup } from '../utils/category-lookup';
import type { TransactionWithCategory, ImportPreviewTransaction, ImportTransformResult } from '../../shared/types';

export const importService = {
  prepareImport(
    accountId: string,
    transactions: TransactionWithCategory[],
    autoCategorise: boolean,
  ): ImportTransformResult {
    const db = getDb();

    // Collect external_ids and check for existing ones in this account
    const externalIds = transactions
      .map((tx) => tx.external_id)
      .filter((id): id is string => id != null);

    const existingIds = new Set<string>();
    if (externalIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < externalIds.length; i += chunkSize) {
        const chunk = externalIds.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        const rows = db.prepare(
          `SELECT external_id FROM transactions WHERE account_id = ? AND external_id IN (${placeholders})`,
        ).all(accountId, ...chunk) as Array<{ external_id: string }>;
        for (const row of rows) {
          existingIds.add(row.external_id);
        }
      }
    }

    // Split into toImport and skipped
    const toImport: ImportPreviewTransaction[] = [];
    const skipped: ImportPreviewTransaction[] = [];

    for (const tx of transactions) {
      if (tx.external_id && existingIds.has(tx.external_id)) {
        skipped.push({ ...tx });
      } else {
        toImport.push({ ...tx });
      }
    }

    // Auto-categorise using existing rules
    if (autoCategorise && toImport.length > 0) {
      const rules = categorisationRuleRepository.findByAccount(accountId);
      const categoryLookup = buildCategoryLookup(accountId);

      for (const tx of toImport) {
        const absAmount = Math.abs(tx.delta_value);
        for (const rule of rules) {
          if (rule.category_id && matchesRule(rule, tx.description, absAmount)) {
            const catInfo = categoryLookup.get(rule.category_id);
            if (catInfo) {
              tx.category_id = rule.category_id;
              tx.category_name = catInfo.name;
              tx.category_type = catInfo.type as TransactionWithCategory['category_type'];
              tx.category_colour = catInfo.colour;
              tx.categorised_by_rule_id = rule.id;
            }
            break;
          }
        }
      }
    }

    return { toImport, skipped };
  },

  processImport(
    accountId: string,
    transactions: ImportPreviewTransaction[],
  ): { importId: string; count: number } {
    return transaction(() => {
      const importRecord = importRepository.createImport(accountId);
      const db = getDb();
      const now = Date.now();

      const stmt = db.prepare(`
        INSERT INTO transactions (id, account_id, category_id, date, description, delta_value,
          is_opening_balance, is_flagged, import_id, categorised_by_rule_id, external_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
      `);

      for (const tx of transactions) {
        const id = generateId();
        stmt.run(
          id, accountId, tx.category_id, tx.date, tx.description, tx.delta_value,
          importRecord.id, tx.categorised_by_rule_id, tx.external_id, now, now,
        );
      }

      return { importId: importRecord.id, count: transactions.length };
    });
  },
};
