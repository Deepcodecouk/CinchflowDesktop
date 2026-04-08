import { ChevronDown, ChevronRight } from 'lucide-react';

interface CashflowSectionBannerRowProps {
  label: string;
  variant?: 'section' | 'summary';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function CashflowSectionBannerRow({
  label,
  variant = 'section',
  isCollapsed = false,
  onToggleCollapse,
}: CashflowSectionBannerRowProps) {
  const isSummary = variant === 'summary';
  const isSection = variant === 'section';
  const rowClassName = isSummary
    ? 'bg-zinc-800/60'
    : 'bg-[linear-gradient(90deg,rgba(15,23,42,0.96),rgba(22,34,57,0.9))]';
  const sectionButtonClassName =
    'sticky left-0 z-10 flex w-52 flex-shrink-0 items-center justify-between border-r border-slate-400/20 bg-transparent px-3 pt-3 pb-1 text-left hover:bg-[rgba(148,163,184,0.06)]';
  const sectionLabelClassName = 'text-[10px] font-bold uppercase tracking-[0.18em] text-slate-100';
  const sectionChevronClassName = 'text-slate-300';

  return (
    <div className={`flex items-stretch border-b border-zinc-700 ${rowClassName}`}>
      {isSection ? (
        <button
          type="button"
          className={sectionButtonClassName}
          onClick={onToggleCollapse}
        >
          <span className={sectionLabelClassName}>{label}</span>
          {isCollapsed ? (
            <ChevronRight className={`h-3.5 w-3.5 ${sectionChevronClassName}`} />
          ) : (
            <ChevronDown className={`h-3.5 w-3.5 ${sectionChevronClassName}`} />
          )}
        </button>
      ) : (
        <div className="w-52 flex-shrink-0 sticky left-0 z-10 border-r border-zinc-700 bg-[#212124] px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
        </div>
      )}
      <div className="flex-1" />
    </div>
  );
}
