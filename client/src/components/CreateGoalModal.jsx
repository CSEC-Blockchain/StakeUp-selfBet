import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Lock,
  UserCheck,
  HeartHandshake,
  RefreshCw,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useConnection, useSwitchChain } from 'wagmi';
import { useStakeUp } from '../lib/stakeupContext';
import { DEMO_IDENTITIES } from '../lib/stakeupConstants';
import { explainError } from '../lib/errors';
import { targetChain, contractAddress } from '../lib/contract';

export function CreateGoalModal({ isOpen, onClose, onGoalCreated }) {
  const { activeAddress, createGoal, addToast } = useStakeUp();
  const { chainId, isConnected } = useConnection();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemTitles, setItemTitles] = useState(['Module 1: Foundations', 'Module 2: Project Work', 'Final Review & Ship']);
  const [deadlineDays, setDeadlineDays] = useState('7');
  const [stakeAmount, setStakeAmount] = useState('0.05');
  const [referee, setReferee] = useState(DEMO_IDENTITIES.DANIEL.address);
  const [failOption, setFailOption] = useState('charity'); // 'referee' or 'charity'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const isWrongChain = Boolean(isConnected && contractAddress && chainId && chainId !== targetChain.id);

  const handleAddItem = () => {
    setItemTitles([...itemTitles, `Milestone ${itemTitles.length + 1}`]);
  };

  const handleRemoveItem = (index) => {
    if (itemTitles.length <= 1) return;
    setItemTitles(itemTitles.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, value) => {
    const updated = [...itemTitles];
    updated[index] = value;
    setItemTitles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isWrongChain) {
      setErrorMessage(`Please switch your wallet to ${targetChain.name} (Chain ID: ${targetChain.id}) first.`);
      try {
        switchChain({ chainId: targetChain.id });
      } catch (err) {
        console.error("Switch chain error:", err);
      }
      return;
    }

    if (!title.trim()) {
      addToast('Please enter a goal title', 'error');
      setErrorMessage('Please enter a goal title');
      return;
    }

    if (referee.toLowerCase() === activeAddress.toLowerCase()) {
      const msg = 'Referee cannot be your own wallet address! Choose a friend to verify your goal.';
      addToast(msg, 'error');
      setErrorMessage(msg);
      return;
    }

    const validItems = itemTitles.filter(t => t.trim().length > 0);
    if (validItems.length === 0) {
      const msg = 'Please specify at least one milestone for your checklist.';
      addToast(msg, 'error');
      setErrorMessage(msg);
      return;
    }

    const deadlineMs = Date.now() + (parseInt(deadlineDays, 10) * 24 * 60 * 60 * 1000);
    const failRecipientAddress = failOption === 'referee' ? referee : '0x000000000000000000000000000000000000dEaD';
    const failRecipientName = failOption === 'referee' ? 'Friend (Referee)' : 'Gitcoin Grants Public Goods';

    setIsSubmitting(true);
    try {
      const newGoalId = await createGoal({
        title: title.trim(),
        description: description.trim(),
        itemTitles: validItems,
        deadline: deadlineMs,
        referee: referee.trim(),
        failRecipient: failRecipientAddress,
        failRecipientName,
        stakeAmount: stakeAmount || '0.01'
      });

      // Reset form ONLY upon successful creation
      setTitle('');
      setDescription('');
      setItemTitles(['Module 1: Foundations', 'Module 2: Project Work', 'Final Review & Ship']);
      setStakeAmount('0.05');
      setDeadlineDays('7');
      setErrorMessage(null);

      // Close modal and navigate
      onClose();
      if (onGoalCreated) {
        onGoalCreated(newGoalId);
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
      const friendlyErr = explainError(err);
      setErrorMessage(friendlyErr);
      // Notice: Modal remains open, all fields stay populated!
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-3xl bg-[#03150f] border border-emerald-800/80 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create a Staked Goal</h2>
              <p className="text-xs text-emerald-400/80">Funds will be locked in the smart contract escrow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Mismatch Warning Banner */}
        {isWrongChain && (
          <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold">Wrong Network Connected</div>
                <div className="text-[11px] text-amber-300">
                  Your wallet is on Chain {chainId} (Ethereum Mainnet). StakeUp runs on {targetChain.name} (Chain {targetChain.id}).
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => switchChain({ chainId: targetChain.id })}
              disabled={isSwitchingChain}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow-md"
            >
              {isSwitchingChain ? 'Switching...' : `Switch to ${targetChain.name}`}
            </button>
          </div>
        )}

        {/* Form Error Banner if previous submit failed */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Transaction could not be completed</div>
              <div className="text-[11px] text-red-300 leading-relaxed">{errorMessage}</div>
              <div className="text-[10px] text-emerald-400 font-medium pt-1">
                ✓ Your goal details and milestones have been preserved. You can edit and retry below.
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Goal Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. Finish Smart Contract Security Certification"
                className="w-full px-4 py-2.5 rounded-xl bg-[#020b08] border border-emerald-950 focus:border-emerald-500 text-white font-medium text-xs focus:outline-none disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Context
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Why this matters, proof guidelines, or course link..."
                className="w-full px-4 py-2 rounded-xl bg-[#020b08] border border-emerald-950 focus:border-emerald-500 text-white text-xs focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Dynamic Milestones Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Milestone Checklist ({itemTitles.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isSubmitting}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {itemTitles.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-emerald-500 font-bold w-4 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    disabled={isSubmitting}
                    placeholder={`Milestone #${idx + 1} requirement`}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#020b08] border border-emerald-950 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    required
                  />
                  {itemTitles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={isSubmitting}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30"
                      title="Remove milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stake & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stake Amount (ETH) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-14 py-2.5 rounded-xl bg-[#020b08] border border-emerald-950 focus:border-emerald-500 text-white font-mono font-bold text-xs focus:outline-none disabled:opacity-50"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-400">
                  ETH
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                ≈ ${(parseFloat(stakeAmount || 0) * 3250).toFixed(2)} USD
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duration (Days) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-14 py-2.5 rounded-xl bg-[#020b08] border border-emerald-950 focus:border-emerald-500 text-white font-mono font-bold text-xs focus:outline-none disabled:opacity-50"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                  Days
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Deadline: in {deadlineDays} days
              </p>
            </div>
          </div>

          {/* Referee Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Referee Friend's Wallet Address <span className="text-emerald-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setReferee(DEMO_IDENTITIES.DANIEL.address)}
                disabled={isSubmitting}
                className="text-[10px] text-emerald-400 hover:underline font-medium disabled:opacity-50"
              >
                Use Daniel (Demo Referee)
              </button>
            </div>
            <input
              type="text"
              value={referee}
              onChange={(e) => setReferee(e.target.value)}
              disabled={isSubmitting}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#020b08] border border-emerald-950 focus:border-emerald-500 text-white font-mono text-xs focus:outline-none disabled:opacity-50"
              required
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Only this wallet can review and approve your milestone proofs.
            </p>
          </div>

          {/* Fail Recipient Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              If you fail, where does the lost money go?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => !isSubmitting && setFailOption('charity')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                  failOption === 'charity'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : 'bg-[#020b08] border-emerald-950 text-slate-400'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-white">Public Goods / Charity</div>
                  <div className="text-[10px] text-slate-400">Gitcoin Grants Community Pool</div>
                </div>
              </label>

              <label
                onClick={() => !isSubmitting && setFailOption('referee')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                  failOption === 'referee'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : 'bg-[#020b08] border-emerald-950 text-slate-400'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <UserCheck className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-white">Send to Referee Friend</div>
                  <div className="text-[10px] text-slate-400">Friend receives the lost stake</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {isWrongChain ? (
              <button
                type="button"
                onClick={() => switchChain.mutate({ chainId: targetChain.id })}
                disabled={switchChain.isPending}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {switchChain.isPending ? 'Switching Network in Wallet…' : `Switch to ${targetChain.name} (${targetChain.id}) to Continue`}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Deploying on-chain (confirm in wallet)...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 stroke-[3]" />
                    <span>Lock {stakeAmount} ETH & Deploy Goal</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
