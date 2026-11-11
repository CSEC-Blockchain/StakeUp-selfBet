import React from 'react';
import { FileCode, Database, Copy } from 'lucide-react';
import { contractAddress, targetChain, stakeUpAbi } from '../lib/stakeupContract';
import { ValuePanel } from './ValuePanel';
import { useStakeUp } from '../lib/stakeupContext';

export function ContractInspector() {
  const { addToast } = useStakeUp();

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    addToast('Copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode className="w-6 h-6 text-emerald-400" />
            <span>Smart Contract & ABI Integration</span>
          </h1>
          <p className="text-xs text-emerald-400/80">Direct blockchain connection & on-chain inspection</p>
        </div>
      </div>

      {/* Contract Status Card */}
      <div className="p-6 rounded-3xl bg-[#03150f]/80 border border-emerald-900/70 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Target Network</div>
            <div className="mt-1 text-sm font-bold font-mono text-emerald-400">
              {targetChain.name} (Chain ID: {targetChain.id})
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Contract File</div>
            <div className="mt-1 text-sm font-bold font-mono text-white">
              contracts/StakeUp.sol
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Integration Mode</div>
            <div className="mt-1 text-sm font-bold font-mono text-teal-300">
              {contractAddress ? 'Live On-Chain' : 'Interactive Hybrid'}
            </div>
          </div>
        </div>

        {/* Deployed Address */}
        <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400">Deployed Contract Address: </span>
            {contractAddress ? (
              <span className="font-mono text-emerald-300 font-bold ml-1">{contractAddress}</span>
            ) : (
              <span className="text-amber-400 font-mono">Pending deployment (Using mock adapter)</span>
            )}
          </div>

          {contractAddress && (
            <button
              onClick={() => handleCopy(contractAddress)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Address</span>
            </button>
          )}
        </div>
      </div>

      {/* Baseline Test ValuePanel */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Baseline Contract Read / Write Tester</span>
        </h2>
        <ValuePanel />
      </div>

      {/* ABI Functions Summary */}
      <div className="p-6 rounded-3xl bg-[#03150f]/80 border border-emerald-900/70 shadow-xl space-y-4 text-xs">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Exported StakeUp Functions & Signatures ({stakeUpAbi.length} items)</span>
        </h2>

        <div className="space-y-2 font-mono text-[11px]">
          {stakeUpAbi.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#020b08] border border-emerald-950 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.type === 'function' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400'
                }`}>
                  {item.type}
                </span>
                <span className="text-white font-semibold">{item.name || 'constructor'}</span>
              </div>
              <span className="text-slate-500">{item.stateMutability || 'nonpayable'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
