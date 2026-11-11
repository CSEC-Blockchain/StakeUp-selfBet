import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Coins,
  Zap,
  Check,
  X,
  Share2
} from 'lucide-react';
import { useStakeUp } from '../lib/stakeupContext';

export function GoalDetailView({ goalId, onBack }) {
  const {
    goals,
    getRoleForGoal,
    submitProof,
    reviewItem,
    settleGoal,
    claimIfRefereeSilent,
    addToast,
    isLiveWallet,
    displayName
  } = useStakeUp();

  const goal = goals.find(g => g.id === Number(goalId));

  // Modal for submitting proof
  const [proofModalItem, setProofModalItem] = useState(null);
  const [proofInput, setProofInput] = useState('');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, isGracePeriodExpired: false });

  useEffect(() => {
    if (!goal) return;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = goal.deadline - now;
      const graceDiff = (goal.deadline + (1000 * 60 * 60 * 24 * 7)) - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isGracePeriodExpired: graceDiff <= 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, isExpired: false, isGracePeriodExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [goal]);

  if (!goal) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">Goal not found.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const role = getRoleForGoal(goal);
  const approvedCount = goal.items.filter(i => i.status === 'APPROVED').length;
  const totalCount = goal.items.length;
  const progressPercent = Math.round((approvedCount / totalCount) * 100);

  const totalStakeNum = parseFloat(goal.stakeAmount);
  const ownerShare = (totalStakeNum * (approvedCount / totalCount)).toFixed(4);
  const failShare = (totalStakeNum - parseFloat(ownerShare)).toFixed(4);

  const canSettle = goal.status === 'ACTIVE' && (timeLeft.isExpired || approvedCount === totalCount);
  const isGracePeriodExpired = goal.status === 'ACTIVE' && timeLeft.isGracePeriodExpired;

  const handleOpenProofModal = (item) => {
    setProofModalItem(item);
    setProofInput(item.proof || '');
  };

  const handleSaveProof = (e) => {
    e.preventDefault();
    if (!proofInput.trim()) return;
    submitProof(goal.id, proofModalItem.id, proofInput.trim());
    setProofModalItem(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Shareable referee link copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Top Navigation & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Goals</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs hover:bg-emerald-900/60 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Copy Referee Link</span>
        </button>
      </div>

      {/* Role-Adaptive Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
        role === 'owner'
          ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
          : role === 'referee'
          ? 'bg-teal-950/50 border-teal-500/60 text-teal-200'
          : 'bg-slate-900/60 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center font-bold text-base">
            {role === 'owner' ? '👩‍💻' : role === 'referee' ? '👨‍⚖️' : '👀'}
          </div>
          <div>
            <div className="font-bold">
              {role === 'owner' && 'You are viewing as the GOAL OWNER'}
              {role === 'referee' && 'You are viewing as the REFEREE JUDGE'}
              {role === 'viewer' && 'Public Accountability View'}
            </div>
            <div className="text-[11px] text-slate-400">
              {role === 'owner' && 'Complete your milestones and submit proof links before the deadline.'}
              {role === 'referee' && 'Your friend staked funds on this goal. Review their milestone proofs below.'}
              {role === 'viewer' && 'Smart contract locks funds in trustless escrow until referee verification.'}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Stake Locked</div>
          <div className="font-mono text-sm font-bold text-emerald-400">{goal.stakeAmount} ETH</div>
        </div>
      </div>

      {/* Goal Header Card */}
      <div className="rounded-3xl bg-[#03150f]/80 border border-emerald-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                goal.status === 'SETTLED'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-teal-950 text-teal-300 border-teal-800'
              }`}>
                {goal.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Goal #{goal.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{goal.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{goal.description}</p>
          </div>

          {/* Countdown Clock Box */}
          <div className="p-4 rounded-2xl bg-[#020b08]/90 border border-emerald-900/80 text-center shrink-0">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400/80 flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{timeLeft.isExpired ? 'Deadline Passed' : 'Time Remaining'}</span>
            </div>
            {!timeLeft.isExpired ? (
              <div className="font-mono text-lg font-black text-white flex items-center gap-1 justify-center">
                <span>{String(timeLeft.days).padStart(2, '0')}d</span>:
                <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
                <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
                <span className="text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            ) : (
              <div className="text-sm font-bold text-amber-400 font-mono">Ready for Settlement</div>
            )}
          </div>
        </div>

        {/* Progress Bar & Stakes */}
        <div className="space-y-2 pt-2 border-t border-emerald-950/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Milestone Progress: <strong className="text-emerald-400">{approvedCount} of {totalCount} Approved</strong>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-[#020b08] rounded-full overflow-hidden border border-emerald-900/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Accountability Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-[#020b08]/60 border border-emerald-950">
            <div className="text-slate-400 text-[10px] uppercase font-medium">Goal Creator (Owner)</div>
            <div className="mt-1 font-mono text-slate-200 truncate">{goal.owner}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#020b08]/60 border border-emerald-950">
            <div className="text-slate-400 text-[10px] uppercase font-medium">Referee Friend</div>
            <div className="mt-1 font-mono text-slate-200 truncate">{goal.referee}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#020b08]/60 border border-emerald-950">
            <div className="text-slate-400 text-[10px] uppercase font-medium">Fail Recipient</div>
            <div className="mt-1 font-mono text-slate-200 truncate">{goal.failRecipientName || goal.failRecipient}</div>
          </div>
        </div>
      </div>

      {/* Milestones Checklist Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Milestone Verification Checklist</span>
          </h2>
          <span className="text-xs text-slate-400">Owner submits proof ➔ Referee approves</span>
        </div>

        <div className="space-y-3">
          {goal.items.map((item, idx) => {
            const isOwner = role === 'owner';
            const isReferee = role === 'referee';

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#03150f]/70 border border-emerald-950 hover:border-emerald-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-500 font-bold">#{idx + 1}</span>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  </div>

                  {item.proof ? (
                    <div className="text-xs text-slate-300 bg-[#020b08] p-2.5 rounded-xl border border-emerald-950 flex items-start gap-2">
                      <span className="text-slate-500 shrink-0 font-medium">Proof:</span>
                      <span className="font-mono text-emerald-300 break-all">{item.proof}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">No proof submitted yet</div>
                  )}
                </div>

                {/* Right Status & Action Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Status Badge */}
                  {item.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/60">
                      <XCircle className="w-3.5 h-3.5" />
                      Rejected
                    </span>
                  )}
                  {item.status === 'PENDING_REVIEW' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Review
                    </span>
                  )}
                  {item.status === 'UNCOMPLETED' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
                      Uncompleted
                    </span>
                  )}

                  {/* Owner Action: Submit/Resubmit Proof */}
                  {isOwner && goal.status === 'ACTIVE' && (item.status === 'UNCOMPLETED' || item.status === 'REJECTED') && (
                    <button
                      onClick={() => handleOpenProofModal(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      {item.status === 'REJECTED' ? 'Resubmit Proof' : 'Submit Proof'}
                    </button>
                  )}

                  {/* Referee Action: Approve or Reject */}
                  {isReferee && goal.status === 'ACTIVE' && item.status === 'PENDING_REVIEW' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => reviewItem(goal.id, item.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                        title="Approve milestone"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => reviewItem(goal.id, item.id, false)}
                        className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                        title="Reject milestone"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement & Safety Resolution Box */}
      <div className="p-6 rounded-3xl bg-[#03150f]/80 border border-emerald-900/70 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>Automatic Settlement Calculator</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Immutable Smart Contract Rule</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Verified Milestones:</span>
            <span className="font-mono text-white font-bold">{approvedCount} of {totalCount} ({progressPercent}%)</span>
          </div>
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>Refund to Owner ({isLiveWallet && role === 'owner' ? displayName : 'Sara'}):</span>
            <span className="font-mono font-bold">{ownerShare} ETH ({progressPercent}%)</span>
          </div>
          <div className="flex justify-between text-amber-400 font-medium">
            <span>Forfeited to Fail Recipient ({goal.failRecipientName}):</span>
            <span className="font-mono font-bold">{failShare} ETH ({100 - progressPercent}%)</span>
          </div>
        </div>

        {goal.status === 'SETTLED' ? (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>This goal has been officially settled and funds disbursed on-chain!</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => settleGoal(goal.id)}
              disabled={!canSettle}
              className={`flex-1 w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                canSettle
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/30 active:scale-95'
                  : 'bg-emerald-950/40 text-slate-500 border border-emerald-950 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {canSettle
                  ? 'Trigger Settle() On-Chain'
                  : 'Settlement Locked (Active until deadline or 100% completion)'}
              </span>
            </button>

            {/* Silent referee protection button */}
            {isGracePeriodExpired && (
              <button
                onClick={() => claimIfRefereeSilent(goal.id)}
                className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-amber-950 border border-amber-700 text-amber-300 font-bold text-xs hover:bg-amber-900 transition-colors"
                title="Referee was inactive past grace period"
              >
                Claim Silent Referee Refund
              </button>
            )}
          </div>
        )}
      </div>

      {/* Proof Submission Modal */}
      {proofModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#03150f] border border-emerald-700/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
              <h3 className="font-bold text-base text-white">Attach Milestone Proof</h3>
              <button onClick={() => setProofModalItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs text-slate-300">
              <p className="font-semibold text-emerald-400 mb-1">{proofModalItem.title}</p>
              <p>Provide a verifiable link (GitHub PR, Strava URL, certificate, or detailed notes) for your referee friend to inspect.</p>
            </div>

            <form onSubmit={handleSaveProof} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Proof URL or Verification Note
                </label>
                <textarea
                  rows={3}
                  value={proofInput}
                  onChange={(e) => setProofInput(e.target.value)}
                  placeholder="https://github.com/my-repo/pull/1 or completed task summary"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#020b08] border border-emerald-900/80 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
