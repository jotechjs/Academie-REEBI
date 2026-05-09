'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface MobileNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const MobileNav = ({ isOpen: externalIsOpen, onClose: externalOnClose }: MobileNavProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Controlled by external prop or internal state
  const open = externalIsOpen !== undefined ? externalIsOpen : isOpen;
  const setOpen = externalOnClose ? (val: boolean) => {
    setIsOpen(val);
    if (!val) externalOnClose();
  } : setIsOpen;

  const navItems = [
    { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Apprenants', href: '/admin/learners', icon: Users },
    { name: 'Sessions', href: '/admin/sessions', icon: BookOpen },
    { name: 'Expériences', href: '/admin/experiences', icon: MessageSquare },
  ];

  const handleLogout = () => {
    localStorage.removeItem('reebi_token');
    localStorage.removeItem('reebi_user');
    window.location.href = '/admin/login';
    setOpen(false);
  };

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Visible only on mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all"
        aria-label="Toggle menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar - Full Screen on Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-slate-950 text-white p-6 flex flex-col border-r border-slate-800 shadow-2xl z-40 transform transition-transform duration-300 ease-out md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <Link href="/admin/dashboard" onClick={handleNavClick} className="flex items-center gap-3">
            <Image
              src="/logo-REEBI.png"
              alt="REEBI Logo"
              width={96}
              height={96}
              className="h-24 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Menu Label */}
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
          Menu Principal
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-blue-400 transition-colors'
                  }
                />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Actions */}
        <div className="mt-auto space-y-4 pt-4 border-t border-slate-800">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-white">Administrateur</p>
                <p className="text-[10px] text-slate-500">admin@reebi.com</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold border border-slate-800">
              <Settings size={16} />
              <span className="hidden sm:inline">Réglages</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 sm:w-12 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop - Close mobile menu on click */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default MobileNav;
