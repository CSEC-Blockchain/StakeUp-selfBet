---
name: web3-dapp
description: Scaffold and build an Ethereum dApp with Hardhat 3 (Solidity, node:test + viem tests, Ignition deployments, Sepolia) and a Next.js + wagmi v3 + viem v2 frontend. Use when the user wants to start a new dApp, smart-contract project, or Web3 frontend, add wallet connection, read or write a contract from React, or deploy a contract to Sepolia.
---

# Web3 dApp starter (CSEC Blockchain Web3 Guide)

Build a dApp as two sibling projects in one repository:

```
my-dapp/
├── contracts/   Hardhat 3: Solidity, tests, Ignition modules, ABI export script
└── web/         Next.js 16 + wagmi 3 + viem 2
```

Full guide: https://github.com/lijnati/web3-guide (site/content/docs).

## Before writing code

Ask the user, or infer from their request:

1. **What the contract does:** its state, write functions, read functions, events, custom errors, constructor arguments, and who may call each write.
2. **Target network:** default to Sepolia (chain id 11155111) for testnet and a local Hardhat node (31337) for development.
3. **Project folder name:** default `my-dapp`.

Keep anything private, large, or changing many times a second **off-chain**. On-chain data is public, even when a variable is `private`.

## Workflow

Follow these steps in order. Run each verification command, and don't continue past a failure.

1. **Contracts project:** create `contracts/` exactly as in [references/contracts.md](references/contracts.md): `npm init -y`, `npm pkg set type=module`, install `hardhat @nomicfoundation/hardhat-toolbox-viem @nomicfoundation/hardhat-ignition viem typescript @types/node`, write `hardhat.config.ts` and `tsconfig.json`, and add the scripts.
2. **Contract:** write the user's contract in `contracts/contracts/<Name>.sol` with `pragma solidity ^0.8.28;`. Use custom errors (`error X(); revert X();`) and emit an event for every state change. For tokens and NFTs, install `@openzeppelin/contracts` and inherit; never hand-roll ERC-20 or ERC-721.
   Verify: `npm run compile`.
3. **Tests:** write `contracts/test/<Name>.ts` using `node:test` and `network.create()`. Cover the happy path, every revert, access control, events, and ETH balances for payable functions.
   Verify: `npm test` (all passing).
4. **Deploy module:** write `contracts/ignition/modules/<Name>.ts` and `contracts/ignition/parameters.json`.
   Verify locally: run `npm run node` in a separate terminal, then `npm run deploy:local`.
5. **Frontend:** create `web/` exactly as in [references/frontend.md](references/frontend.md): run `create-next-app`, install `wagmi viem@2 @tanstack/react-query`, set the tsconfig `target` to `ES2020`, then write `lib/wagmi.ts`, `lib/contract.ts`, `app/providers.tsx`, `lib/use-mounted.ts`, `lib/errors.ts`, the wallet button, and the read/write components.
6. **ABI export:** from `contracts/`, run `node scripts/export-abi.mjs <Name> ../web/lib` after every contract change.
7. **Environment:** create `web/.env.local` with `NEXT_PUBLIC_CHAIN_ID` and `NEXT_PUBLIC_CONTRACT_ADDRESS`, and a committed `web/.env.example` (add `!.env.example` to `web/.gitignore`).
   Verify: `npm run lint`, `npx tsc --noEmit`, and `npm run build` in `web/`.
8. **Sepolia (the user runs this step):** tell the user to run `npx hardhat keystore set SEPOLIA_RPC_URL`, then `npx hardhat keystore set SEPOLIA_PRIVATE_KEY`, then `npm run deploy:sepolia`. These commands prompt for secrets interactively, so never run them on the user's behalf. Then update `web/.env.local` and re-export the ABI.

## Rules that prevent the common failures

- **Hardhat 3:** plugins load only from `plugins: [...]` in `defineConfig`. A bare `import` does nothing. Config and tests are ES modules (`"type": "module"`). Read secrets with `configVariable("NAME")`; never hardcode an RPC key or private key.
- **Tests:** contract numbers are `bigint`, so use `0n`, not `0`. Use `viem.assertions.emitWithArgs`, `revertWithCustomError` and `revertWithCustomErrorWithArgs`.
- **wagmi v3:** use `useConnection`, not `useAccount` (deprecated). Hooks return mutation objects: `connect.mutate({ connector })`, `write.mutate({...})`, `switchChain.mutate({ chainId })`, `disconnect.mutate()`.
- **Next.js:** set `ssr: true` in `createConfig`. Render wallet state only after mount (`useMounted`) to avoid hydration errors. Keep the providers in a `"use client"` file.
- **Typing:** export the ABI `as const`, and spread a single `{ abi, address, chainId }` object into every hook. Pass `chainId` so reads work while the wallet is on another chain.
- **Writes:** use `useWriteContract` (wallet approval), then `useWaitForTransactionReceipt({ hash })` (mining). Refetch reads after `receipt.isSuccess`, never right after receiving the hash. Disable the button while `write.isPending || receipt.isLoading`.
- **Errors:** map errors with `error.walk()`: `UserRejectedRequestError` means "you rejected", and `ContractFunctionRevertedError.data.errorName` gives a friendly message per custom error. Hide transaction messages while disconnected.
- **Wrong chain:** compare `useConnection().chainId` with the target chain, and show a `switchChain` button before allowing writes.
- **Secrets:** a `NEXT_PUBLIC_*` variable is shipped to the browser. Never put a private key there. Never commit `.env.local`.
- **Every contract change** needs: test → redeploy (new address) → export the ABI → update the env var → restart `npm run dev`.

## Done when

- `npm test` passes in `contracts/`.
- `npm run lint` and `npm run build` pass in `web/`.
- The app handles each of these states: disconnected (reads still load), connecting, wrong chain, waiting for the wallet, mining, confirmed (data refreshed), rejected, reverted with a friendly message.
- The user knows the remaining manual steps: fund a dev wallet with Sepolia ETH, set the keystore secrets, deploy to Sepolia, and deploy `web/` to Vercel with Root Directory `web` and the same `NEXT_PUBLIC_*` variables.
