import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, Wand2, History, MoreVertical, X } from 'lucide-react';
import { MONTH_NAMES_SHORT } from '../../../../shared/constants';
import { Button } from '../../../components/ui/button';
import { MonthYearPicker } from '../../../components/ui/month-year-picker';

interface RegisterToolbarProps {

  accountName: string;
  accountIcon: string;
  year: number;
  month: number;
  hasFilters: boolean;
  onNavigateMonth: (delta: number) => void;
  onNavigateTo: (year: number, month: number) => void;
  onClearFilters: () => void;
  onOpenAutoCategorise: () => void;
  onOpenImport: () => void;
  onOpenImportHistory: () => void;

}

export function RegisterToolbar({
  accountName,
  accountIcon,
  year,
  month,
  hasFilters,
  onNavigateMonth,
  onNavigateTo,
  onClearFilters,
  onOpenAutoCategorise,
  onOpenImport,
  onOpenImportHistory,
}: RegisterToolbarProps) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const handlePrevMonth = () => {

    onNavigateMonth(-1);

  };

  const handleNextMonth = () => {

    onNavigateMonth(1);

  };

  const handleToggleMonthPicker = () => {

    setMonthPickerOpen((v) => !v);

  };

  const handleMonthSelect = (y: number, m: number) => {

    onNavigateTo(y, m);
    setMonthPickerOpen(false);

  };

  const handleCloseMonthPicker = () => {

    setMonthPickerOpen(false);

  };

  const handleToggleMenu = () => {

    setMenuOpen((v) => !v);

  };

  const handleCloseMenu = () => {

    setMenuOpen(false);

  };

  const handleImportClick = () => {

    onOpenImport();
    setMenuOpen(false);

  };

  const handleImportHistoryClick = () => {

    onOpenImportHistory();
    setMenuOpen(false);

  };

  return (
    <div className="grid grid-cols-3 items-center">
      {/* Left: Account title */}
      <h1 className="text-2xl font-semibold">
        {accountIcon} {accountName}
      </h1>

      {/* Centre: Month navigator */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="relative">
          <button
            onClick={handleToggleMonthPicker}
            className="text-lg font-medium w-32 text-center hover:text-blue-400 transition-colors cursor-pointer"
          >
            {MONTH_NAMES_SHORT[month - 1]} {year}
          </button>
          {monthPickerOpen && (
            <MonthYearPicker
              year={year}
              month={month}
              onSelect={handleMonthSelect}
              onClose={handleCloseMonthPicker}
            />
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: Clear filters + Auto-categorise + menu */}
      <div className="flex items-center justify-end gap-2">
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-blue-400 hover:text-blue-300">
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onOpenAutoCategorise}>
          <Wand2 className="w-4 h-4" />
          Auto-categorise
        </Button>
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={handleToggleMenu}>
            <MoreVertical className="w-4 h-4" />
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={handleCloseMenu} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={handleImportClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button
                  onClick={handleImportHistoryClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  <History className="w-4 h-4" />
                  Import History
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

}
