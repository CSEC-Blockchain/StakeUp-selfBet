import React, { useState } from 'react';
import { StakeUpProvider } from './lib/stakeupContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomBar } from './components/MobileBottomBar';
import { HeroSection } from './components/HeroSection';
import { DashboardView } from './components/DashboardView';
import { GoalDetailView } from './components/GoalDetailView';
import { CreateGoalModal } from './components/CreateGoalModal';
import { ContractInspector } from './components/ContractInspector';
import { ToastContainer } from './components/ToastContainer';

function StakeUpApp() {
  const [currentTab, setCurrentTab] = useState('overview'); // 'overview', 'my-goals', 'judging', 'contract', 'detail'
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSelectGoal = (id) => {
    setSelectedGoalId(id);
    setCurrentTab('detail');
  };

  const handleGoalCreated = (newId) => {
    setSelectedGoalId(newId);
    setCurrentTab('detail');
  };

  return (
    <div className="min-h-screen bg-[#020b08] text-[#f0fdf4] flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <ToastContainer />

      {/* Top Navbar */}
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab === 'detail' ? 'my-goals' : currentTab}
          setCurrentTab={(tab) => {
            setSelectedGoalId(null);
            setCurrentTab(tab);
          }}
          isCollapsed={isSidebarCollapsed}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          {currentTab === 'overview' && (
            <HeroSection
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onExploreGoals={() => setCurrentTab('my-goals')}
            />
          )}

          {currentTab === 'my-goals' && (
            <DashboardView
              defaultTab="my-goals"
              onSelectGoal={handleSelectGoal}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentTab === 'judging' && (
            <DashboardView
              defaultTab="judging"
              onSelectGoal={handleSelectGoal}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentTab === 'detail' && selectedGoalId && (
            <GoalDetailView
              goalId={selectedGoalId}
              onBack={() => setCurrentTab('my-goals')}
            />
          )}

          {currentTab === 'contract' && (
            <ContractInspector />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedGoalId(null);
          setCurrentTab(tab);
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Create Goal Wizard Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
}

export default function App() {
  return (
    <StakeUpProvider>
      <StakeUpApp />
    </StakeUpProvider>
  );
}
