import React from "react";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { explainError } from "../lib/errors";
import { useMounted } from "../lib/use-mounted";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const mounted = useMounted();
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();

  if (!mounted) return <span className="text-xs text-slate-500">…</span>;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-cyan-500/40 shadow-inner shadow-cyan-500/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-mono text-xs text-cyan-300">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect.mutate()}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={connect.isPending}
        onClick={() => connect.mutate({ connector: connectors[0] })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {connect.isPending ? "Check wallet…" : "Connect Wallet"}
      </button>
      {connect.error && (
        <p className="text-[11px] text-red-400 max-w-xs text-right" role="alert">
          {/no provider|not found/i.test(connect.error.message)
            ? "No browser wallet found. Install MetaMask or Brave Wallet."
            : explainError(connect.error)}
        </p>
      )}
    </div>
  );
}

