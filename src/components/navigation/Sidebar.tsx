import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Upload,
  ChevronRight,
  X,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AppView } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  hasActiveWorkspace?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
  hasActiveWorkspace = false,
}) => {
  const { user, userProfile } = useAuth();

  const navItems = [
    {
      id: 'landing' as AppView,
      label: 'Landing Page',
      icon: FileText,
      description: 'Product overview & features',
    },
    {
      id: 'dashboard' as AppView,
      label: 'Agent Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & quick stats',
    },
    {
      id: 'new_screening' as AppView,
      label: 'New Screening',
      icon: Upload,
      description: 'Upload JD & candidate resumes',
    },
    ...(hasActiveWorkspace
      ? [
          {
            id: 'job_workspace' as AppView,
            label: 'Active Rankings',
            icon: Layers,
            description: 'Current workspace candidates',
          },
        ]
      : []),
    {
      id: 'history' as AppView,
      label: 'Screening History',
      icon: Users,
      description: 'All past JD workspaces',
    },
  ];

  const handleItemClick = (view: AppView) => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Recruiter';
  const email = userProfile?.email || user?.email || '';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-surface border-r border-default flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Block & Nav */}
        <div>
          <div className="p-4 border-b border-default flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  EvidenceFirst
                </div>
                <div className="text-[11px] font-mono text-muted">
                  ATS + Agentic Screener
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded text-secondary hover:text-primary lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-secondary hover:text-primary hover:bg-surface-sunken'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-secondary'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card & Sign Out */}
        <div className="p-3 border-t border-default space-y-2 bg-surface-sunken/40">
          <div className="p-2.5 rounded-[6px] bg-surface border border-default flex items-center gap-2.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-8 h-8 rounded-full border border-strong object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-primary truncate leading-tight">
                {displayName}
              </div>
              <div className="text-[11px] font-mono text-muted truncate leading-tight">
                {email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[6px] border border-strong bg-surface hover:bg-surface-sunken text-secondary hover:text-status-missing text-xs font-medium transition-colors cursor-pointer"
            title="Sign out of EvidenceFirst"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
