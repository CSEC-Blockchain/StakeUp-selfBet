import React from 'react';
import { ShieldCheck, ChevronLeft, ChevronRight, UserCheck, AlertTriangle } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { useStakeUp } from '../lib/stakeupContext';
import { DEMO_IDENTITIES } from '../lib/stakeupConstants';
import { useConnection, useSwitchChain } from 'wagmi';
import { targetChain } from '../lib/contract';

export function Navbar({ isSidebarCollapsed, setIsSidebarCollapsed }) {
  const { activePersonaKey, setActivePersonaKey, isLiveWallet, displayName } = useStakeUp();
  const { isConnected, chainId } = useConnection();
  const switchChain = useSwitchChain();
  const isWrongChain = isConnected && chainId !== targetChain.id;

  return (
    <header className="h-16 border-b border-emerald-950/80 bg-[#020b08]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Sidebar toggle & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-colors"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                StakeUp
              </span>
              {isWrongChain ? (
                <button
                  onClick={() => switchChain.mutate({ chainId: targetChain.id })}
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/80 shadow-sm flex items-center gap-1 hover:bg-amber-900 transition-colors"
                  title="Click to switch wallet network"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Switch to {targetChain.name}</span>
                </button>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 shadow-sm">
                  {targetChain.name}
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-500/80 hidden sm:block font-medium">Decentralized Goal Accountability</p>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Simulator & Wallet Connect */}
      <div className="flex items-center gap-3">
        {/* Testing Persona Switcher */}
        {!isLiveWallet && (
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-xs">
            <span className="text-[11px] text-emerald-400/80 font-semibold pl-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Test Role:
            </span>
            <select
              value={activePersonaKey}
              onChange={(e) => setActivePersonaKey(e.target.value)}
              className="bg-emerald-900/80 text-emerald-100 font-medium rounded-lg px-2.5 py-1 text-xs border border-emerald-700/60 focus:outline-none cursor-pointer"
            >
              <option value="SARA">{DEMO_IDENTITIES.SARA.avatar} Sara (Owner)</option>
              <option value="DANIEL">{DEMO_IDENTITIES.DANIEL.avatar} Daniel (Referee)</option>
              <option value="VIEWER">{DEMO_IDENTITIES.VIEWER.avatar} Public Viewer</option>
            </select>
          </div>
        )}

        {/* Live Wallet User Badge */}
        {isLiveWallet && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-xs text-emerald-300 font-semibold shadow-inner shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{displayName}</span>
          </div>
        )}

        {/* Real Wagmi Injected Wallet Connect */}
        <WalletButton />
      </div>
    </header>
  );
}
