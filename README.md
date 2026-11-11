# StakeUp (SelfBet)

> **Decentralized Goal Accountability & Peer-Judged Escrow Protocol**  
> *"Put your money where your goal is."*

StakeUp turns good intentions into commitments you can't ignore. Users lock funds on a personal goal with a milestone checklist, designate a trusted friend as referee to verify proofs, and a smart contract automatically returns the money on success or distributes it to a friend/charity on failure.

---

## 🌟 Why StakeUp?

- **Loss Aversion**: Behavioral research shows people work harder to avoid losing something than to gain something. Quitting normally costs nothing; StakeUp changes that.
- **Trustless & Non-Custodial**: Funds are locked strictly inside immutable Solidity smart contracts. No company, admin, or third party has custody of your funds.
- **Fair Proportional Payouts**: Verified milestones earn proportional refunds (e.g., 2 of 3 milestones approved = 67% refunded to creator, 33% sent to fail recipient).
- **Silent Referee Protection**: If a referee becomes inactive past a grace period, creators can claim a 100% refund without being penalized.

---

## 🏗️ Architecture

```
StakeUp-selfBet/
├── contracts/                     # Hardhat 3 Smart Contracts Project
│   ├── contracts/
│   │   └── StakeUp.sol            # Core escrow, milestone verification & settlement contract
│   ├── test/
│   │   └── StakeUp.ts             # 20/20 unit test coverage with node:test + viem
│   ├── ignition/modules/
│   │   └── StakeUp.ts             # Hardhat Ignition deployment module
│   ├── scripts/
│   │   └── export-abi.mjs         # Automatic ABI exporter to the frontend
│   ├── hardhat.config.ts          # Hardhat configuration (Solidity 0.8.28, Sepolia & Localhost)
│   └── .env.example
│
├── client/                        # Modern Web3 Frontend (React 19 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/            # Sidebar, Navbar, Goal Detail, Create Goal Wizard, Dashboard
│   │   ├── lib/                   # Wagmi v3 configuration, ABI bindings, custom errors & state
│   │   └── App.jsx
│   ├── .env.example
│   └── vite.config.js
```

---

## 🚀 Quick Start

### 1. Smart Contracts

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run full test suite (20 unit tests)
npm test

# Export ABI to client
npm run export:abi
```

### 2. Frontend Application

```bash
cd client

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

The app will start at `http://localhost:5174/`.

---

## ⛓️ Deploying the Smart Contract

### Deploy to Local Hardhat Node (Development)
```bash
# Terminal 1: Start local node
cd contracts
npx hardhat node

# Terminal 2: Deploy contract
cd contracts
npm run deploy:local
```

Update `client/.env.local`:
```env
VITE_CHAIN_ID=31337
VITE_CONTRACT_ADDRESS=<DEPLOYED_LOCAL_ADDRESS>
```

### Deploy to Sepolia Testnet
Set your Sepolia credentials in `contracts/.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

Then deploy:
```bash
cd contracts
npm run deploy:sepolia
```

Update `client/.env.local`:
```env
VITE_CHAIN_ID=11155111
VITE_CONTRACT_ADDRESS=<DEPLOYED_SEPOLIA_ADDRESS>
```

---

## 🔒 Security & Safe Practice
- All contract withdrawals use strict Checks-Effects-Interactions (CEI) and reentrancy guards.
- No admin withdrawal functions or owner backdoors.
- Environment secret files (`.env`, `.env.local`) are strictly excluded via `.gitignore`.

---

## 📜 License
MIT License.
