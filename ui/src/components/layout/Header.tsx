import React from 'react';
import { Bell, BarChart2, Cloud, Banknote, Database, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, activeTabTitle }) => {
  // Determine white icon for right button based on active page
  const renderRightPageIcon = () => {
    switch (activeTab) {
      case 'docs':
        return <BookOpen className="w-5 h-5 text-white" />;
      case 'cloud':
        return <Cloud className="w-5 h-5 text-white" />;
      case 'cost':
      case 'finance':
        return <Banknote className="w-5 h-5 text-white" />;
      case 'databases':
      case 'create':
        return <Database className="w-5 h-5 text-white" />;
      case 'monitoring':
      default:
        return <BarChart2 className="w-5 h-5 text-white" />;
    }
  };

  return (
    <header className="h-16 bg-bg-card/80 backdrop-blur-md border-b border-accent-darkBorder px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight">{activeTabTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-accent-darkHover rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-brand-sky rounded-full absolute top-2 right-2 ring-2 ring-bg-card"></span>
        </button>

        {/* Dynamic White Page Icon Button */}
        <button 
          title={`${activeTabTitle} Emblem`}
          className="p-2.5 bg-bg-main border border-accent-darkBorder rounded-xl text-white hover:bg-accent-darkHover hover:border-brand-sky transition-colors shadow-md flex items-center justify-center"
        >
          {renderRightPageIcon()}
        </button>
      </div>
    </header>
  );
};
