import React from 'react';
import { 
  Database, 
  PlusCircle, 
  DollarSign, 
  Activity, 
  Cloud, 
  LogOut, 
  Layers,
  HardDrive,
  Gauge,
  Bell,
  BookOpen
} from 'lucide-react';
import { KubeDataFlowLogo } from '../common/KubeDataFlowLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'create', label: 'Create Database', icon: PlusCircle, highlight: true },
    { id: 'databases', label: 'Database Management', icon: Database },
    { id: 'store_backups', label: 'Store and Backups', icon: HardDrive },
    { id: 'quotas', label: 'Resource Quotas', icon: Gauge },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'cost', label: 'Cost', icon: DollarSign },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'cloud', label: 'Cloud', icon: Cloud },
    { id: 'docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-accent-darkBorder flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Header / Logo */}
        <div className="p-6 border-b border-accent-darkBorder flex items-center gap-3">
          <KubeDataFlowLogo className="w-10 h-10" />
          <div>
            <h1 className="font-extrabold text-xl text-white tracking-tight leading-none">KubeDataFlow</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
                    : item.highlight
                    ? 'bg-brand-blue/10 text-brand-sky hover:bg-brand-blue/20 border border-brand-blue/30'
                    : 'text-slate-400 hover:bg-accent-darkHover hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-brand-sky' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      {(() => {
        const userEmail = localStorage.getItem('user_email') || 'user@idp.platform';
        const initials = userEmail.substring(0, 2).toUpperCase();
        return (
          <div className="p-4 border-t border-accent-darkBorder bg-bg-main">
            <div className="flex items-center justify-between p-2 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                  {initials}
                </div>
                <div className="text-left overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate" title={userEmail}>
                    {userEmail}
                  </p>
                  <p className="text-[11px] text-slate-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-950/30 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}
    </aside>
  );
};
