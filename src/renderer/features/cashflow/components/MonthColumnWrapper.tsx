import { cn } from '../../../lib/utils';
import type { MonthColumnConfig } from './cashflow-types';

interface MonthColumnWrapperProps {

  config: MonthColumnConfig;
  children: React.ReactNode;

}

export function MonthColumnWrapper({ config, children }: MonthColumnWrapperProps) {

  return (
    <div
      className={cn(
        'px-1 py-1.5 text-[10px]',
        config.flexClass,
        config.minWidthClass,
        config.bgClass,
        config.borderClass,
      )}
    >
      <div className="flex gap-px items-center">
        {children}
      </div>
    </div>
  );

}
