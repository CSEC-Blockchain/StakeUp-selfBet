# Frontend templates (Next.js 16 + wagmi 3 + viem 2)

## Setup

From the repository root, next to `contracts/`:

```bash
npx create-next-app@latest web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
cd web
npm install wagmi viem@2 @tanstack/react-query
```

In `tsconfig.json`, change `"target": "ES2017"` to `"target": "ES2020"`. BigInt literals need ES2020.

## web/lib/wagmi.ts

```ts
import { createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia, hardhat],
  connectors: [injected()],
  ssr: true,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
```

## web/lib/contract.ts

```ts
import { getAddress, isAddress } from "viem";
import { hardhat, sepolia } from "wagmi/chains";
import { myContractAbi } from "./myContractAbi";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? sepolia.id);
const rawAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

export const targetChain = chainId === hardhat.id ? hardhat : sepolia;
export const contractAddress = isAddress(rawAddress) ? getAddress(rawAddress) : undefined;

export const myContract = {
  abi: myContractAbi,
  address: contractAddress,
  chainId: targetChain.id,
} as const;
```

## web/app/providers.tsx

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

Wrap `{children}` in `app/layout.tsx` with `<Providers>`.

## web/lib/use-mounted.ts

```ts
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
```

## web/lib/errors.ts

```ts
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

export function explainError(error: unknown): string {
  if (!(error instanceof BaseError)) return "Something went wrong. Check the console.";

  if (error.walk((e) => e instanceof UserRejectedRequestError)) {
    return "You rejected the request in your wallet.";
  }

  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (revert instanceof ContractFunctionRevertedError) {
    // One entry per custom error in the contract.
    const messages: Record<string, string> = {
      ZeroValue: "The value must be greater than zero.",
    };
    const name = revert.data?.errorName;
    return (name && messages[name]) ?? `The contract reverted: ${name ?? revert.reason ?? revert.shortMessage}`;
  }

  if (/insufficient funds/i.test(error.message)) {
    return "Not enough ETH to pay for gas. Get Sepolia ETH from a faucet.";
  }
  return error.shortMessage;
}
```

## web/components/wallet-button.tsx

```tsx
"use client";

import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { explainError } from "@/lib/errors";
import { useMounted } from "@/lib/use-mounted";

export function WalletButton() {
  const mounted = useMounted();
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();

  if (!mounted) return <span>…</span>;

  if (isConnected && address) {
    return (
      <button onClick={() => disconnect.mutate()}>
        {address.slice(0, 6)}…{address.slice(-4)} · Disconnect
      </button>
    );
  }

  return (
    <div>
      <button disabled={connect.isPending} onClick={() => connect.mutate({ connector: connectors[0] })}>
        {connect.isPending ? "Check your wallet…" : "Connect wallet"}
      </button>
      {connect.error && (
        <p role="alert">
          {/no provider|not found/i.test(connect.error.message)
            ? "No browser wallet found. Install MetaMask."
            : explainError(connect.error)}
        </p>
      )}
    </div>
  );
}
```

## Read + write component

```tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { contractAddress, myContract, targetChain } from "@/lib/contract";
import { explainError } from "@/lib/errors";
import { useMounted } from "@/lib/use-mounted";

export function ValuePanel() {
  const mounted = useMounted();
  const { isConnected, chainId } = useConnection();
  const switchChain = useSwitchChain();
  const [input, setInput] = useState("");

  const value = useReadContract({
    ...myContract,
    functionName: "value",
    query: { enabled: Boolean(contractAddress) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: targetChain.id });

  const { refetch } = value;
  useEffect(() => {
    if (receipt.isSuccess) refetch();
  }, [receipt.isSuccess, refetch]);

  if (!contractAddress) return <p>Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.</p>;

  const wrongChain = mounted && isConnected && chainId !== targetChain.id;
  const busy = write.isPending || receipt.isLoading;
  const error = write.error ?? receipt.error ?? switchChain.error;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    write.reset();
    write.mutate(
      { ...myContract, address: contractAddress!, functionName: "setValue", args: [BigInt(input)] },
      { onSuccess: () => setInput("") },
    );
  }

  return (
    <section>
      <p>Current value: {value.data?.toString() ?? "…"}</p>
      <form onSubmit={onSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} inputMode="numeric" />
        {!mounted || !isConnected ? (
          <span>Connect your wallet first.</span>
        ) : wrongChain ? (
          <button type="button" onClick={() => switchChain.mutate({ chainId: targetChain.id })}>
            Switch to {targetChain.name}
          </button>
        ) : (
          <button type="submit" disabled={busy || !/^\d+$/.test(input)}>
            {write.isPending ? "Confirm in wallet…" : receipt.isLoading ? "Waiting for block…" : "Set value"}
          </button>
        )}
      </form>
      {mounted && isConnected && error && <p role="alert">{explainError(error)}</p>}
      {mounted && isConnected && receipt.isSuccess && <p role="status">Confirmed.</p>}
    </section>
  );
}
```

For payable writes, add `value: parseEther("0.01")` (from `viem`) to the `mutate` arguments. For an explorer link, use `` `${targetChain.blockExplorers?.default.url}/tx/${write.data}` ``.

## Environment variables

`web/.env.local` (not committed) and `web/.env.example` (committed, empty values):

```bash
NEXT_PUBLIC_CHAIN_ID=31337            # 11155111 for Sepolia
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_SEPOLIA_RPC_URL=          # optional
```

Restart `npm run dev` after any change. On Vercel, set Root Directory to `web`, add the same variables, and redeploy after editing them.
