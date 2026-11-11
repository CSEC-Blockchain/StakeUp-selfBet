import React, { useState } from 'react';
import {
  Compass,
  Target,
  Scale,
  PlusCircle,
  FileCode,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useStakeUp } from '../lib/stakeupContext';
import { contractAddress } from '../lib/stakeupContract';

export function Sidebar({ currentTab, setCurrentTab, isCollapsed, onOpenCreateModal }) {
  const {
    goals,
    activeAddress,
    isLiveWallet,
    displayName,
    customName,
    setCustomName
  } = useStakeUp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Counts
  const myGoalsCount = goals.filter(g => g.owner.toLowerCase() === activeAddress.toLowerCase()).length;
  const judgingGoals = goals.filter(g => g.referee.toLowerCase() === activeAddress.toLowerCase());
  const pendingReviewsCount = judgingGoals.reduce((acc, g) => {
    return acc + g.items.filter(i => i.status === 'PENDING_REVIEW').length;
  }, 0);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview & Pitch',
      icon: Compass,
      badge: null
    },
    {
      id: 'my-goals',
      label: 'My Goals',
      icon: Target,
      badge: myGoalsCount > 0 ? myGoalsCount : null
    },
    {
      id: 'judging',
      label: "Goals I'm Judging",
      icon: Scale,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} Need Review` : (judgingGoals.length || null),
      badgeAlert: pendingReviewsCount > 0
    },
    {
      id: 'contract',
      label: 'Contract & ABI',
      icon: FileCode,
      badge: contractAddress ? 'Live' : 'Testnet'
    }
  ];

  const handleStartEdit = () => {
    setNameInput(customName || '');
    setIsEditingName(true);
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    setCustomName(nameInput);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-emerald-950/80 bg-[#020b08]/90 transition-all duration-300 z-20 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Action: Create Goal Quick Trigger */}
      <div className="p-4 border-b border-emerald-950/60">
        <button
          onClick={onOpenCreateModal}
          className={`w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Create New Goal"
        >
          <PlusCircle className="w-5 h-5 shrink-0 stroke-[2.5]" />
          {!isCollapsed && <span>Stake on a Goal</span>}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center rounded-xl p-3 text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-inner shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-emerald-200 hover:bg-emerald-950/30'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'text-emerald-400 scale-105' : 'text-slate-500 group-hover:text-emerald-400'
                }`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeAlert
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator Strip */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile Card */}
      <div className="p-3 border-t border-emerald-950/60 bg-emerald-950/20">
        {!isCollapsed ? (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 space-y-2">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="space-y-1.5">
                <label className="text-[10px] text-emerald-400 font-semibold block">
                  Set Your Display Name
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="flex-1 bg-black/70 border border-emerald-700/80 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span className="truncate">{displayName}</span>
                  </span>
                  
                  {isLiveWallet && (
                    <button
                      onClick={handleStartEdit}
                      className="text-slate-400 hover:text-emerald-300 p-1 rounded-md hover:bg-emerald-900/40 transition-colors"
                      title="Edit your display name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{isLiveWallet ? 'Connected Wallet' : 'Demo Account'}</span>
                  <span>{activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}</span>
                </div>
              </div>
            )}
            
            <div className="text-[10px] text-slate-400/80 leading-snug pt-1 border-t border-emerald-950/60">
              Smart contract locks & releases funds via verified milestones.
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`Connected: ${displayName}`}>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
        )}
      </div>
    </aside>
  );
}
