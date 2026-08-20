import React from 'react';
import {
  Sun,
  Moon,
  Menu,
  Sparkles,
  LogOut,
  Plus,
} from 'lucide-react';
import { AppView, ThemeMode } from '../../types';
import { logout } from '../../services/authService';

interface TopBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  onOpenMobileSidebar,
}) => {
  const tabs = [
    { id: 'dashboard' as AppView, label: 'Dashboard' },
    { id: 'new_screening' as AppView, label: 'New Screening' },
    { id: 'history' as AppView, label: 'Workspaces' },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-default h-14 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Zone 1: Brand & Mobile Trigger */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-[6px] text-secondary hover:text-primary hover:bg-surface-sunken lg:hidden"
          title="Open navigation menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        <span className="text-base font-bold text-primary tracking-tight select-none">
          EvidenceFirst
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 h-14">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`relative h-14 flex items-center text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive ? 'text-primary font-semibold' : 'text-secondary hover:text-primary'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions, Theme Toggle & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-[6px] text-secondary hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <Sun className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('new_screening')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="whitespace-nowrap">New Screening</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="p-1.5 rounded-[6px] text-secondary hover:text-status-missing hover:bg-surface-sunken transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
