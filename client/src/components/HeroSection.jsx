import React from 'react';
import {
  Lock,
  UserCheck,
  Coins,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export function HeroSection({ onOpenCreateModal, onExploreGoals }) {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Headline */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-[#03150f]/80 to-[#020b08] border border-emerald-800/40 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-600/50 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Behavioral Economics Meets Immutable Smart Contracts</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Put your money where <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              your goal is.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/70 leading-relaxed max-w-2xl">
            StakeUp turns good intentions into commitments you can’t ignore. Lock money on your goal, pick a trusted friend as referee, and let the blockchain enforce the outcome.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onOpenCreateModal}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <span>Stake on a Goal Now</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={onExploreGoals}
              className="px-6 py-3.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>View Active Goals</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#03150f]/60 border border-emerald-900/50 backdrop-blur-md">
          <div className="text-xs uppercase font-semibold text-emerald-400/80 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Non-Custodial Escrow</span>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">100% Code-Ruled</div>
          <p className="mt-1 text-xs text-slate-400">Zero admin withdrawal keys or company custody.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#03150f]/60 border border-emerald-900/50 backdrop-blur-md">
          <div className="text-xs uppercase font-semibold text-emerald-400/80 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Success Rate</span>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-400">92.4%</div>
          <p className="mt-1 text-xs text-slate-400">Loss aversion increases completion by 3.8x.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#03150f]/60 border border-emerald-900/50 backdrop-blur-md">
          <div className="text-xs uppercase font-semibold text-emerald-400/80 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Referee Verified</span>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">Peer Judged</div>
          <p className="mt-1 text-xs text-slate-400">Milestone proofs approved by chosen friend.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#03150f]/60 border border-emerald-900/50 backdrop-blur-md">
          <div className="text-xs uppercase font-semibold text-emerald-400/80 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Proportional Payout</span>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">Fair Math</div>
          <p className="mt-1 text-xs text-slate-400">2 of 3 milestones done = 67% refunded.</p>
        </div>
      </div>

      {/* 3-Step Protocol Explainer */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">How StakeUp Works</h2>
          <p className="text-xs text-emerald-400/80">Three simple rules enforced by the Ethereum smart contract</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#03150f]/70 border border-emerald-900/60 relative group hover:border-emerald-600/70 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-white">Set Goal & Lock Stake</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Define your milestones, set a firm deadline, lock your ETH stake in the smart contract, and select your referee friend.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#03150f]/70 border border-emerald-900/60 relative group hover:border-emerald-600/70 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black text-lg mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-white">Work & Submit Proof</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              As you complete milestones, attach proof links (GitHub PR, Strava GPS, certificate, or notes). Proof changes to Pending Review.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#03150f]/70 border border-emerald-900/60 relative group hover:border-emerald-600/70 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-white">Referee Verifies & Settles</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Your referee approves or rejects. At the deadline, contract automatically disburses funds proportionally based on verified milestones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
