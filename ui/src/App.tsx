import React, { useState } from 'react';
import { LoginPage } from './components/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { DatabasesCatalogPage } from './components/pages/DatabasesCatalogPage';
import { CreateDatabaseWizardPage } from './components/pages/CreateDatabaseWizardPage';
import { StoreAndBackupsPage } from './components/pages/StoreAndBackupsPage';
import { CostPage } from './components/pages/CostPage';
import { MonitoringPage } from './components/pages/MonitoringPage';
import { CloudPage } from './components/pages/CloudPage';
import { DocsPage } from './components/pages/DocsPage';
import { QuotasPage } from './components/pages/QuotasPage';
import { NotificationsPage } from './components/pages/NotificationsPage';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (!localStorage.getItem('access_token')) {
      localStorage.setItem('access_token', 'mock-admin-token');
      localStorage.setItem('user_email', 'admin@idp.local');
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<string>('databases');
  const [preselectedEngine, setPreselectedEngine] = useState<string>('postgresql');
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCustomHeaderTitle(null);
  };

  const handleNavigateCreate = (engineType?: string) => {
    if (engineType) {
      setPreselectedEngine(engineType);
    }
    handleTabChange('create');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      customTitle={customHeaderTitle}
      onLogout={handleLogout}
    >
      {activeTab === 'create' && (
        <CreateDatabaseWizardPage
          initialEngineType={preselectedEngine}
          onSuccess={() => handleTabChange('databases')}
        />
      )}

      {activeTab === 'databases' && (
        <DatabasesCatalogPage
          onNavigateCreate={handleNavigateCreate}
          onNavigateTab={handleTabChange}
          onTitleChange={(title) => setCustomHeaderTitle(title)}
        />
      )}

      {activeTab === 'store_backups' && <StoreAndBackupsPage />}

      {activeTab === 'quotas' && <QuotasPage />}

      {activeTab === 'notifications' && <NotificationsPage />}

      {(activeTab === 'cost' || activeTab === 'finance') && <CostPage />}

      {activeTab === 'monitoring' && <MonitoringPage />}

      {activeTab === 'cloud' && <CloudPage />}

      {activeTab === 'docs' && <DocsPage />}
    </MainLayout>
  );
};
