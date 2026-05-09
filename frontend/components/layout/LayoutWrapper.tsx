'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Auth pages and Root redirect
  const isAuthPage = pathname === '/login' || pathname === '/admin/login' || pathname === '/' || pathname === '/admin';
  
  // Learner specific dashboards (they have their own navigation/header)
  const isLearnerPage = pathname === '/dashboard' || pathname === '/learner/dashboard';
  
  if (isAuthPage || isLearnerPage) {
    return <>{children}</>;
  }

  // Sidebar is shown for all /admin/* pages (except login/redirect)
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
