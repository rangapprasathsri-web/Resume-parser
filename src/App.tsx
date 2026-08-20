import React, { useState, useEffect } from 'react';
import {
  JobScreeningSession,
  FinalCandidateAnalysis,
  AppView,
  ThemeMode,
} from './types';
import { TopBar } from './components/navigation/TopBar';
import { Sidebar } from './components/navigation/Sidebar';
import { AgentDashboard } from './components/dashboard/AgentDashboard';
import { NewBatchScreeningScreen } from './components/entry/NewBatchScreeningScreen';
import { BatchProcessingScreen } from './components/processing/BatchProcessingScreen';
import { JobWorkspaceView } from './components/workspace/JobWorkspaceView';
import { CandidateDetailView } from './components/candidate/CandidateDetailView';
import { BatchReportModal, IndividualReportModal } from './components/reports/ReportModals';
import { executeBatchScreening } from './services/apiService';
import {
  fetchUserJobSessions,
  persistJobSession,
  removeJobSession,
} from './services/jobStorageService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { SignupScreen } from './components/auth/SignupScreen';
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './components/landing/LandingPage';

type AuthView = 'landing' | 'login' | 'signup' | 'forgot_password';

function MainApp() {
  const { user } = useAuth();

  // Auth screen sub-view navigation (defaults to landing page)
  const [authView, setAuthView] = useState<AuthView>('landing');

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ef_theme') as ThemeMode;
    return saved || 'light';
  });

  // Sessions state backed by Firestore & Local Cache
  const [sessions, setSessions] = useState<JobScreeningSession[]>([]);
  const [activeSession, setActiveSession] = useState<JobScreeningSession | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<FinalCandidateAnalysis | null>(null);

  // App Navigation View
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Processing state
  const [processingState, setProcessingState] = useState<{
    jobTitle: string;
    total: number;
    completed: number;
    currentName: string;
  } | null>(null);

  // Report modal states
  const [isBatchReportOpen, setIsBatchReportOpen] = useState(false);
  const [isIndividualReportOpen, setIsIndividualReportOpen] = useState(false);

  // Sync theme with HTML document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('ef_theme', theme);
  }, [theme]);

  // Load sessions from Firestore when user authenticates
  useEffect(() => {
    async function loadSessions() {
      if (user?.uid) {
        const loaded = await fetchUserJobSessions(user.uid);
        setSessions(loaded);
        if (loaded.length > 0 && !activeSession) {
          setActiveSession(loaded[0]);
        }
      }
    }
    loadSessions();
  }, [user?.uid]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Start Batch Screening Execution
  const handleStartScreening = async (payload: {
    jobTitle: string;
    jobDescription: string;
    resumes: Array<{ fileName: string; rawText: string }>;
    analysisMode: 'ai_ats' | 'ats_only';
  }) => {
    setProcessingState({
      jobTitle: payload.jobTitle,
      total: payload.resumes.length,
      completed: 0,
      currentName: payload.resumes[0]?.fileName || 'Initializing...',
    });
    setCurrentView('dashboard'); // temporarily behind processing screen

    try {
      const completedSession = await executeBatchScreening(
        {
          jobTitle: payload.jobTitle,
          jobDescription: payload.jobDescription,
          resumes: payload.resumes,
          analysisMode: payload.analysisMode,
          userId: user?.uid,
        },
        (current, total, name) => {
          setProcessingState({
            jobTitle: payload.jobTitle,
            total,
            completed: current,
            currentName: name,
          });
        }
      );

      // Persist to Firestore and state
      await persistJobSession(completedSession, user?.uid);

      setSessions((prev) => {
        const filtered = prev.filter((s) => s.jobId !== completedSession.jobId);
        return [completedSession, ...filtered];
      });

      setActiveSession(completedSession);
      setProcessingState(null);
      setCurrentView('job_workspace');
    } catch (err: any) {
      console.error('Batch screening encountered error:', err);
      setProcessingState(null);
      alert(`Screening error: ${err.message || 'Failed to complete batch.'}`);
      setCurrentView('new_screening');
    }
  };

  const handleSelectSession = (jobId: string) => {
    const session = sessions.find((s) => s.jobId === jobId);
    if (session) {
      setActiveSession(session);
      setCurrentView('job_workspace');
    }
  };

  const handleDeleteSession = async (jobId: string) => {
    await removeJobSession(jobId);
    setSessions((prev) => prev.filter((s) => s.jobId !== jobId));
    if (activeSession?.jobId === jobId) {
      const remaining = sessions.filter((s) => s.jobId !== jobId);
      setActiveSession(remaining.length > 0 ? remaining[0] : null);
      if (remaining.length === 0) {
        setCurrentView('dashboard');
      }
    }
  };

  const handleSelectCandidate = (candidate: FinalCandidateAnalysis) => {
    setSelectedCandidate(candidate);
    setCurrentView('candidate_detail');
  };

  const renderAuthFallback = () => {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthView('signup')}
          onSignIn={() => setAuthView('login')}
          onOpenDemoWorkspace={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'signup') {
      return (
        <SignupScreen
          onNavigateToLogin={() => setAuthView('login')}
          onBackToLanding={() => setAuthView('landing')}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      );
    }
    if (authView === 'forgot_password') {
      return (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setAuthView('login')}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      );
    }
    return (
      <LoginScreen
        onNavigateToSignup={() => setAuthView('signup')}
        onNavigateToForgotPassword={() => setAuthView('forgot_password')}
        onBackToLanding={() => setAuthView('landing')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  };

  return (
    <ProtectedRoute fallback={renderAuthFallback()}>
      <div className="min-h-screen bg-base text-primary flex transition-colors duration-150">
        {/* Persistent Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          hasActiveWorkspace={!!activeSession}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Persistent Top Bar */}
          <TopBar
            currentView={currentView}
            onNavigate={setCurrentView}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

          {/* Dynamic Page Views */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6">
            {/* View 0: Landing Page for Authenticated users if selected */}
            {currentView === 'landing' && (
              <div className="-mx-4 sm:-mx-6 md:-mx-8 -my-6">
                <LandingPage
                  onGetStarted={() => setCurrentView('new_screening')}
                  onSignIn={() => setCurrentView('dashboard')}
                  onOpenDemoWorkspace={() => setCurrentView('dashboard')}
                />
              </div>
            )}

            {/* Processing Overlay View */}
            {processingState && currentView !== 'landing' && (
              <BatchProcessingScreen
                jobTitle={processingState.jobTitle}
                total={processingState.total}
                completedCount={processingState.completed}
                currentCandidateName={processingState.currentName}
              />
            )}

            {/* View 1: Agent Dashboard */}
            {!processingState && (currentView === 'dashboard' || currentView === 'history') && (
              <AgentDashboard
                sessions={sessions}
                onNewScreening={() => setCurrentView('new_screening')}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
              />
            )}

            {/* View 2: Create Screening Workspace */}
            {!processingState && currentView === 'new_screening' && (
              <NewBatchScreeningScreen
                onStartScreening={handleStartScreening}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}

            {/* View 3: Active Job Workspace & Rankings */}
            {!processingState && currentView === 'job_workspace' && activeSession && (
              <JobWorkspaceView
                session={activeSession}
                onSelectCandidate={handleSelectCandidate}
                onAddResumes={() => setCurrentView('new_screening')}
                onBack={() => setCurrentView('dashboard')}
                onExportReport={() => setIsBatchReportOpen(true)}
              />
            )}

            {/* View 4: Candidate Detail & Grounded Evidence */}
            {!processingState && currentView === 'candidate_detail' && selectedCandidate && (
              <CandidateDetailView
                candidate={selectedCandidate}
                onBack={() => setCurrentView('job_workspace')}
                onExportReport={() => setIsIndividualReportOpen(true)}
              />
            )}
          </main>
        </div>

        {/* Batch Report Modal */}
        {isBatchReportOpen && activeSession && (
          <BatchReportModal
            session={activeSession}
            onClose={() => setIsBatchReportOpen(false)}
          />
        )}

        {/* Individual Candidate Report Modal */}
        {isIndividualReportOpen && selectedCandidate && (
          <IndividualReportModal
            candidate={selectedCandidate}
            onClose={() => setIsIndividualReportOpen(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
