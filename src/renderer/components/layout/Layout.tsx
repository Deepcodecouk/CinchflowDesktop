import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  const location = useLocation();
  const isCashflowRoute = location.pathname.startsWith('/cashflow');

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className={isCashflowRoute ? 'flex-1 overflow-hidden' : 'flex-1 overflow-auto p-6'}>
        <Outlet />
      </main>
    </div>
  );
}
