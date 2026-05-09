'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, MessageSquare, Settings, LogOut, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Apprenants', href: '/admin/learners', icon: Users },
    { name: 'Sessions', href: '/admin/sessions', icon: BookOpen },
    { name: 'Expériences', href: '/admin/experiences', icon: MessageSquare },
  ];

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen p-6 flex flex-col border-r border-slate-800 shadow-2xl z-20 fixed left-0 top-0 h-screen hidden md:flex">
      <div className="flex items-center gap-3 mb-12 px-2">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <Image 
            src="/logo-REEBI.png" 
            alt="REEBI Logo" 
            width={120}
            height={120}
            className="h-28 w-auto object-contain" 
            priority
          />
        </Link>
      </div>

      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Menu Principal</div>
      
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
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
          <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold border border-slate-800">
            <Settings size={16} />
            <span>Réglages</span>
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('reebi_token');
              localStorage.removeItem('reebi_user');
              window.location.href = '/admin/login';
            }}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
