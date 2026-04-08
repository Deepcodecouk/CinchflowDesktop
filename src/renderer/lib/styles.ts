export const accountTypeBadgeClasses: Record<string, string> = {
  current: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  savings: 'bg-green-500/20 text-green-400 border border-green-500/30',
  credit: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
};

export function getAccountTypeBadgeClass(type: string): string {
  return accountTypeBadgeClasses[type] ?? 'bg-zinc-500/20 text-zinc-400';
}
