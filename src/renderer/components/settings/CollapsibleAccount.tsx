import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { ConfigAccountPlan } from './RapidConfigDialog';

interface CollapsibleAccountProps {

  account: ConfigAccountPlan;

}

export function CollapsibleAccount({ account }: CollapsibleAccountProps) {

  const [expanded, setExpanded] = useState(true);
  const totalHeaders = account.categoryTypes.reduce((sum, ct) => sum + ct.headers.length, 0);
  const totalCategories = account.categoryTypes.reduce(
    (sum, ct) => sum + ct.headers.reduce((s, h) => s + h.categories.length, 0),
    0,
  );
  const totalRules = account.categoryTypes.reduce(
    (sum, ct) =>
      sum + ct.headers.reduce((s, h) => s + h.categories.reduce((r, c) => r + c.rules.length, 0), 0),
    0,
  );

  function handleToggle() {

    setExpanded(!expanded);

  }

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-left"
        onClick={handleToggle}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        )}
        <span className="text-sm font-medium text-zinc-100">{account.name}</span>
        <span className="text-xs text-zinc-500 ml-auto">
          {account.type} &middot; OB: {account.openingBalance} &middot; {totalHeaders} headers &middot;{' '}
          {totalCategories} categories &middot; {totalRules} rules
        </span>
      </button>
      {expanded && (
        <div className="px-3 py-2 space-y-1 text-xs">
          {account.categoryTypes.map((ct, ctIdx) => (
            <div key={ctIdx}>
              <div className="text-zinc-400 font-medium mt-1">{ct.typeName}</div>
              {ct.headers.map((header, hIdx) => (
                <div key={hIdx} className="ml-3">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: header.colour }}
                    />
                    {header.name}
                  </div>
                  {header.categories.map((cat, cIdx) => (
                    <div key={cIdx} className="ml-4">
                      <div className="text-zinc-400">{cat.name}</div>
                      {cat.rules.map((rule, rIdx) => (
                        <div key={rIdx} className="ml-4 text-zinc-500">
                          &rarr; {rule.matchText}{' '}
                          <span className="text-zinc-600">
                            ({rule.matchType}, {rule.minAmount} to {rule.maxAmount})
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

}
