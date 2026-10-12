import React, { Component } from 'react';
import { LabProvider, useLab } from './context/LabContext';
import { Navbar } from './components/Navbar';
import { GlobalSearch } from './components/Search/GlobalSearch';
import { LabAnalytics } from './components/Dashboard/LabAnalytics';
import { PatientRegistration } from './components/Registration/PatientRegistration';
import { PhlebotomyStation } from './components/Phlebotomy/PhlebotomyStation';
import { TestResultSearch } from './components/Worklist/TestResultSearch';
import { DoctorQueue } from './components/DoctorReview/DoctorQueue';
import { ReportViewer } from './components/Reports/ReportViewer';
import { ReportDesigner } from './components/Reports/ReportDesigner';
import { MachineInterface } from './components/Administration/MachineInterface';
import { TestManagement } from './components/Administration/TestManagement';
import { B2BPortal } from './components/B2B/B2BPortal';
import { QualityControl } from './components/QC/QualityControl';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { LabSettings } from './components/Settings/LabSettings';
import { LoginScreen } from './components/Auth/LoginScreen';
import { LabOnboardingWizard } from './components/Auth/LabOnboardingWizard';
import { SessionKickoutModal } from './components/Auth/SessionKickoutModal';
import { LicenseActivationScreen } from './components/Auth/LicenseActivationScreen';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-xl mx-auto my-12 space-y-3">
          <h2 className="text-base font-bold text-rose-800">Module Notice</h2>
          <p className="text-xs text-rose-600 font-mono">{this.state.error?.message || 'Unexpected issue'}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-rose-700 text-white font-bold rounded-lg text-xs hover:bg-rose-800"
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { activeTab } = useLab();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 w-full">
        {/* Main Content Area - 100% Full Width */}
        <main className="p-3 sm:p-5 max-w-[1700px] mx-auto w-full overflow-x-hidden">
          <ErrorBoundary>
            {activeTab === 'global_search' && <GlobalSearch />}
            {activeTab === 'registration' && <PatientRegistration />}
            {activeTab === 'worklist' && <TestResultSearch />}
            {activeTab === 'phlebotomy' && <PhlebotomyStation />}
            {activeTab === 'doctor' && <DoctorQueue />}
            {activeTab === 'reports' && <ReportViewer />}
            {activeTab === 'report_designer' && <ReportDesigner />}
            {activeTab === 'test_management' && <TestManagement />}
            {activeTab === 'machine_interface' && <MachineInterface />}
            {activeTab === 'dashboard' && <LabAnalytics />}
            {activeTab === 'b2b' && <B2BPortal />}
            {activeTab === 'qc' && <QualityControl />}
            {activeTab === 'inventory' && <InventoryManager />}
            {activeTab === 'settings' && <LabSettings />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  const {
    isAuthenticated,
    login,
    labProfile,
    licenseInfo,
    saveLabProfile,
    showOnboarding,
    setShowOnboarding,
    sessionKickoutInfo,
    handleAcknowledgeKickout
  } = useLab();

  const [hasDismissedWelcome, setHasDismissedWelcome] = React.useState(false);

  // 1. Concurrent Device Login Kickout Modal
  if (sessionKickoutInfo) {
    return (
      <SessionKickoutModal
        sessionInfo={sessionKickoutInfo}
        onAcknowledge={handleAcknowledgeKickout}
      />
    );
  }

  // 2. Primary Entry Point: Unified Welcome & Direct Login Screen for all unauthenticated users
  if (!isAuthenticated) {
    return (
      <WelcomeScreen
        labProfile={labProfile}
        licenseInfo={licenseInfo}
        onLogin={login}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />
    );
  }

  // 3. Laboratory Onboarding / Setup Wizard (After successful login)
  if (showOnboarding) {
    return (
      <LabOnboardingWizard
        initialData={labProfile}
        onComplete={(newProfile) => {
          saveLabProfile(newProfile);
          setShowOnboarding(false);
        }}
      />
    );
  }

  // 4. Main LIMS Application Dashboard
  return <MainLayout />;
};

export function App() {
  return (
    <ErrorBoundary>
      <LabProvider>
        <AppContent />
      </LabProvider>
    </ErrorBoundary>
  );
}

export default App;
