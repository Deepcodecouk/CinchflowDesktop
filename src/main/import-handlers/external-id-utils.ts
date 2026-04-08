import { createHash } from 'node:crypto';

export function generateExternalId(date: number, description: string, amount: number): string {
  const input = `${date}|${description.trim().toLowerCase()}|${amount}`;
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
}
