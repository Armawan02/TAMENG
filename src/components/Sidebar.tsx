import React, { useState } from 'react';
import { Shield, BookOpen, Scale, MessageSquare, Anchor, X, LayoutDashboard, Users, LogIn, LogOut, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { user, role, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const menuItems = [
    { id: 'scan', label: 'Validasi Keamanan', icon: Shield, roles: ['user', null] },
    { id: 'report', label: 'Pusat Hukum', icon: Scale, roles: ['user', null] },
    { id: 'community', label: 'Forum Peringatan', icon: MessageSquare, roles: ['user', null] },
    { id: 'recovery', label: 'Zona Pemulihan JUDOL', icon: Anchor, roles: ['user', null] },
    { id: 'dashboard', label: 'Dasbor Satgas', icon: LayoutDashboard, roles: ['polri', 'admin'] },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users, roles: ['admin'] },
  ];

  const visibleItems = React.useMemo(() => menuItems.filter(item => item.roles.includes(role)), [role]);

  React.useEffect(() => {
    if (!visibleItems.some(item => item.id === activeTab) && visibleItems.length > 0) {
      setActiveTab(visibleItems[0].id);
    }
  }, [visibleItems, activeTab, setActiveTab]);

  const handleAuthAction = async () => {
    if (user) {
      await logout();
      if (activeTab === 'dashboard' || activeTab === 'users') {
        setActiveTab('scan');
      }
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 z-50 w-72 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 pb-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex flex-col">
             <span className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-[0.15em]">TAMENG</span>
             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Sistem Intelijen Taktik Anti-Manipulasi & Ekstraksi Narasi Gelap</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left",
                activeTab === item.id 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
           <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
             <p className="text-xs font-bold text-slate-700 dark:text-slate-300 opacity-90 mb-1">Butuh Bantuan Mendesak?</p>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Jika Anda telah mentransfer dana, hubungi bank Anda sekarang.</p>
             <a href="tel:110" className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-colors">
               Polisi: 110
             </a>
           </div>

           <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-white dark:bg-slate-800/20">
             <div className="flex items-center gap-3 overflow-hidden">
               {user ? (
                 <>
                   <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                     <UserCircle className="w-5 h-5" />
                   </div>
                   <div className="flex flex-col truncate">
                     <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.displayName || user.email?.split('@')[0] || 'Pengguna'}</span>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role === 'admin' ? 'Administrator' : role === 'polri' ? 'Satgas Siber' : 'Warga Sipil'}</span>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                     <UserCircle className="w-5 h-5" />
                   </div>
                   <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Belum Masuk</span>
                 </>
               )}
             </div>
             <button 
               onClick={handleAuthAction}
               className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors shrink-0"
               title={user ? "Keluar" : "Masuk"}
             >
               {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
             </button>
           </div>
        </div>
      </aside>
    </>
  );
}
