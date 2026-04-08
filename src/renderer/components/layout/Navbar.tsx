import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Settings, StickyNote, TrendingUp, ChevronDown, Wallet } from 'lucide-react';
import type { AppInfo } from '../../../shared/types';
import { useAccountsStore } from '../../stores/accounts-store';
import { callIpc } from '../../lib/ipc-client';
import { cn } from '../../lib/utils';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accounts } = useAccountsStore();
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAppInfo() {
      try {
        const nextAppInfo = await callIpc<AppInfo>(window.api.app.getInfo(), 'Failed to load app information');

        if (!cancelled) {
          setAppInfo(nextAppInfo);
        }
      } catch {
        if (!cancelled) {
          setAppInfo(null);
        }
      }
    }

    void loadAppInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAccountsActive = location.pathname.startsWith('/accounts');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  function handleToggleAccounts() {

    setAccountsOpen(!accountsOpen);

  }

  function handleAccountClick(e: React.MouseEvent<HTMLButtonElement>) {

    const accountId = e.currentTarget.dataset.accountId;
    navigate(`/accounts/${accountId}/${currentYear}/${currentMonth}`);
    setAccountsOpen(false);

  }

  return (
    <header className="relative z-40 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            CinchFlow
          </Link>
          <nav className="flex items-center gap-1">
            {/* Home */}
            <Link
              to="/"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                location.pathname === '/'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
              )}
            >
              <Home className="w-4 h-4 text-zinc-500" />
              Home
            </Link>

            {/* Accounts dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleToggleAccounts}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isAccountsActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                )}
              >
                <Wallet className="w-4 h-4 text-zinc-500" />
                Accounts
                <ChevronDown className={cn('w-3 h-3 transition-transform', accountsOpen && 'rotate-180')} />
              </button>
              {accountsOpen && (
                <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                  {accounts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-zinc-500">No accounts yet</div>
                  ) : (
                    accounts.map((account) => (
                      <button
                        key={account.id}
                        data-account-id={account.id}
                        onClick={handleAccountClick}
                        className="w-full text-left px-3 py-2 text-sm text-nowrap text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 flex items-center gap-2"
                      >
                        <span>{account.icon}</span>
                        <span>{account.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cashflow */}
            <Link
              to={accounts.length > 0 ? `/cashflow/${currentYear}` : '/cashflow'}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                location.pathname.startsWith('/cashflow')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
              )}
            >
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              Cashflow
            </Link>

            {/* Notes */}
            <Link
              to="/notes"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                location.pathname.startsWith('/notes')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
              )}
            >
              <StickyNote className="w-4 h-4 text-zinc-500" />
              Notes
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                location.pathname.startsWith('/settings')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
              )}
            >
              <Settings className="w-4 h-4 text-zinc-500" />
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {appInfo && (
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium tracking-wide text-zinc-400">
              v{appInfo.displayVersion}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
