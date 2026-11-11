import React, { useState } from 'react';
import {
  Target,
  Scale,
  Clock,
  Coins,
  ArrowRight,
  Plus,
  RefreshCw,
  Database,
  Sparkles
} from 'lucide-react';
import { useStakeUp } from '../lib/stakeupContext';

export function DashboardView({ onSelectGoal, onOpenCreateModal, defaultTab = 'my-goals' }) {
  const {
    goals,
    activeAddress,
    dataMode,
    setDataMode,
    showOnChain,
    isLoadingOnChain,
    fetchOnChainGoals,
    isLiveWallet
  } = useStakeUp();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const myGoals = goals.filter(g => g.owner.toLowerCase() === activeAddress.toLowerCase());
  const judgingGoals = goals.filter(g => g.referee.toLowerCase() === activeAddress.toLowerCase());

  const currentList = activeTab === 'my-goals' ? myGoals : judgingGoals;

  return (
    <div className="space-y-6 py-2">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Commitment Dashboard</span>
            </h1>
            {showOnChain ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/80 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Live On-Chain
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Demo Simulator
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-400/80">Track your staked habits and referee assignments</p>
        </div>

        {/* Tab Switcher & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#03150f] border border-emerald-950 text-[11px]">
            <button
              onClick={() => setDataMode('demo')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                !showOnChain
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Goals
            </button>
            <button
              onClick={() => {
                setDataMode('onchain');
                fetchOnChainGoals();
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                showOnChain
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>On-Chain</span>
              <RefreshCw className={`w-3 h-3 ${isLoadingOnChain ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center p-1 rounded-2xl bg-[#03150f] border border-emerald-950/80">
            <button
              onClick={() => setActiveTab('my-goals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my-goals'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>My Goals ({myGoals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('judging')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'judging'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Judging ({judgingGoals.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      {currentList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#03150f]/80 border border-emerald-900/60 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
            {activeTab === 'my-goals' ? <Target className="w-6 h-6" /> : <Scale className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {activeTab === 'my-goals'
                ? (showOnChain ? "No on-chain goals for this wallet yet" : "No goals found")
                : "No referee assignments"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'my-goals'
                ? "Lock a real ETH stake on your first personal milestone or switch to Demo Goals to test."
                : "When friends set you as referee, their commitments appear here for review."}
            </p>
          </div>
          {activeTab === 'my-goals' && (
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Stake on a Goal Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentList.map((goal) => {
            const approvedCount = goal.items.filter(i => i.status === 'APPROVED').length;
            const pendingCount = goal.items.filter(i => i.status === 'PENDING_REVIEW').length;
            const totalCount = goal.items.length;
            const percent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
            const isExpired = goal.deadline <= Date.now();

            return (
              <div
                key={goal.id}
                onClick={() => onSelectGoal(goal.id)}
                className="group p-5 rounded-3xl bg-[#03150f]/90 hover:bg-[#042016] border border-emerald-950 hover:border-emerald-700/80 transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                      goal.status === 'SETTLED'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : goal.status === 'REFUNDED_SILENT'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : isExpired
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {goal.status === 'ACTIVE' && (isExpired ? 'Ready to Settle' : 'Active')}
                      {goal.status === 'SETTLED' && 'Settled'}
                      {goal.status === 'REFUNDED_SILENT' && 'Refunded (Silent)'}
                    </span>

                    <div className="flex items-center gap-1 font-mono font-bold text-white text-xs bg-black/40 px-2 py-0.5 rounded-lg border border-emerald-950">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{goal.stakeAmount} ETH</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {goal.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-emerald-950">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">
                      Milestones: <strong className="text-slate-200">{approvedCount}/{totalCount}</strong>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#020b08] rounded-full overflow-hidden border border-emerald-950">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer Tag & CTA */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  {pendingCount > 0 ? (
                    <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>{pendingCount} Pending Proof</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Referee: {goal.referee.slice(0, 6)}…
                    </span>
                  )}

                  <span className="font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
