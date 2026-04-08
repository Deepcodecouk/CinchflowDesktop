import type { TransactionWithCategory } from '../../shared/types';

export interface IImportHandler {
  systemName: string;
  title: string;
  processFile(content: string): TransactionWithCategory[];
}
