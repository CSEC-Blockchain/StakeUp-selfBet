import React, { useState } from "react";
import {
  useConnection,
  useReadContract,
} from "wagmi";
import { contractAddress, stakeUpContract, targetChain } from "../lib/contract";
import { useMounted } from "../lib/use-mounted";
import { RefreshCw, Database, CheckCircle2 } from "lucide-react";
import { formatEther } from "viem";

export function ValuePanel() {
  const mounted = useMounted();
  const { isConnected, chainId } = useConnection();
  const [queryGoalId, setQueryGoalId] = useState("1");

  // Read total goal count
  const goalCount = useReadContract({
    ...stakeUpContract,
    functionName: "goalCount",
    query: { enabled: Boolean(contractAddress) },
  });

  // Read goal by ID
  const goalQuery = useReadContract({
    ...stakeUpContract,
    functionName: "getGoal",
    args: [BigInt(queryGoalId || "1")],
    query: {
      enabled: Boolean(contractAddress && queryGoalId && Number(queryGoalId) > 0),
      retry: false,
    },
  });

  if (!mounted) return null;

  const isWrongChain = isConnected && chainId !== targetChain.id;

  return (
    <div className="p-6 rounded-3xl bg-[#03150f]/80 border border-emerald-900/70 shadow-xl space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Live On-Chain State Reader</h2>
        </div>
        <button
          onClick={() => {
            goalCount.refetch();
            goalQuery.refetch();
          }}
          className="text-slate-400 hover:text-emerald-400 transition-colors p-1"
          title="Refresh Contract State"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${goalCount.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isWrongChain && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300">
          Connected to the wrong chain. Please switch to {targetChain.name}.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Goals Count */}
        <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950 space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Total Goals Created</span>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {goalCount.isLoading ? (
              <span className="text-slate-500 text-sm">Querying RPC...</span>
            ) : goalCount.data !== undefined ? (
              `${goalCount.data.toString()} Goals`
            ) : (
              <span className="text-slate-500 text-xs">0 (or uninitialized)</span>
            )}
          </div>
        </div>

        {/* Goal Query Tester */}
        <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-950 space-y-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Query Goal by ID</span>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={queryGoalId}
              onChange={(e) => setQueryGoalId(e.target.value)}
              placeholder="Goal ID"
              className="w-24 px-2.5 py-1.5 rounded-lg bg-black/60 border border-emerald-950 font-mono text-xs text-white focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={() => goalQuery.refetch()}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-800 text-xs font-semibold"
            >
              Fetch
            </button>
          </div>
        </div>
      </div>

      {/* Query Result Card */}
      {goalQuery.data && (
        <div className="p-4 rounded-2xl bg-[#020b08] border border-emerald-900 space-y-2 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Goal #{goalQuery.data.id.toString()}: {goalQuery.data.title}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
            <div><span className="text-slate-500">Stake:</span> {formatEther(goalQuery.data.stakeAmount)} ETH</div>
            <div><span className="text-slate-500">Milestones:</span> {goalQuery.data.approvedCount.toString()} / {goalQuery.data.itemCount.toString()} Approved</div>
            <div className="truncate"><span className="text-slate-500">Owner:</span> {goalQuery.data.owner}</div>
            <div className="truncate"><span className="text-slate-500">Referee:</span> {goalQuery.data.referee}</div>
            <div><span className="text-slate-500">Status:</span> {['Active', 'Settled', 'RefundedSilentReferee'][goalQuery.data.status] || goalQuery.data.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}
