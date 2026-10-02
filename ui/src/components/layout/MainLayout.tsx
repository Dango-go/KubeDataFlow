import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customTitle?: string | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  customTitle,
  onLogout,
  children
}) => {
  const titles: Record<string, string> = {
    create: 'Create Database',
    databases: 'Databases Catalog & Installed List',
    store_backups: 'Store and Backups Management',
    quotas: 'Resource Quotas & Governance',
    notifications: 'Notification Channels & Alert Rules',
    cost: 'Cost Management & Spend Allocation',
    finance: 'Cost Management & Spend Allocation',
    monitoring: 'Monitoring & Performance Metrics',
    cloud: 'Cloud Credentials & K8s Clusters',
    docs: 'Platform Documentation & Guides'
  };

  const currentTitle = customTitle || titles[activeTab] || 'KubeDataFlow Console';

  return (
    <div className="flex min-h-screen bg-bg-main text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); }} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} activeTabTitle={currentTitle} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
