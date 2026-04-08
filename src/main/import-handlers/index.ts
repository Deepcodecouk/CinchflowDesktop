import type { IImportHandler } from './types';
import { basicCsvHandler } from './basic-csv-handler';
import { ofxHandler } from './ofx-handler';
import { capitalOneCsvHandler } from './capital-one-csv-handler';

const handlers: IImportHandler[] = [
  basicCsvHandler,
  ofxHandler,
  capitalOneCsvHandler,
];

export function getImportHandlers() {
  return handlers.map((h) => ({ systemName: h.systemName, title: h.title }));
}

export function getImportHandler(systemName: string): IImportHandler | undefined {
  return handlers.find((h) => h.systemName === systemName);
}
