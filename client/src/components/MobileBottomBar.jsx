import React from 'react';
import { Compass, Target, Plus, Scale, FileCode } from 'lucide-react';
import { useStakeUp } from '../lib/stakeupContext';

export function MobileBottomBar({ currentTab, setCurrentTab, onOpenCreateModal }) {
  const { goals, activeAddress } = useStakeUp();

  const judgingGoals = goals.filter(g => g.referee.toLowerCase() === activeAddress.toLowerCase());
  const pendingReviewsCount = judgingGoals.reduce((acc, g) => {
    return acc + g.items.filter(i => i.status === 'PENDING_REVIEW').length;
  }, 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020b08]/95 backdrop-blur-xl border-t border-emerald-950/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => setCurrentTab('overview')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
          currentTab === 'overview' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px]">Overview</span>
      </button>

      <button
        onClick={() => setCurrentTab('my-goals')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
          currentTab === 'my-goals' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Target className="w-5 h-5" />
        <span className="text-[10px]">My Goals</span>
      </button>

      {/* Center Create Button */}
      <button
        onClick={onOpenCreateModal}
        className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/40 active:scale-95 transition-all"
        title="Create Goal"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <button
        onClick={() => setCurrentTab('judging')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl relative transition-colors ${
          currentTab === 'judging' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span className="text-[10px]">Judging</span>
        {pendingReviewsCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        )}
      </button>

      <button
        onClick={() => setCurrentTab('contract')}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
          currentTab === 'contract' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <FileCode className="w-5 h-5" />
        <span className="text-[10px]">Contract</span>
      </button>
    </div>
  );
}

