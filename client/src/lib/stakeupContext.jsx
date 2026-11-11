import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConnection, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { DEFAULT_CHARITY, DEMO_IDENTITIES } from './stakeupConstants';
import { contractAddress, stakeUpContract } from './contract';
import { explainError } from './errors';

const StakeUpContext = createContext(null);

const INITIAL_GOALS = [
  {
    id: 1,
    title: 'Finish Python for Web3 & Data Science Course',
    description: 'Complete 3 rigorous modules of the Advanced Python Bootcamp before the hackathon demo day.',
    owner: DEMO_IDENTITIES.SARA.address,
    referee: DEMO_IDENTITIES.DANIEL.address,
    failRecipient: '0x000000000000000000000000000000000000dEaD',
    failRecipientName: 'Gitcoin Public Goods Pool',
    stakeAmount: '0.05', // ETH
    deadline: Date.now() + 1000 * 60 * 60 * 48, // 48 hours in future
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    status: 'ACTIVE',
    items: [
      {
        id: 0,
        title: 'Module 1: Object-Oriented Architecture & Unit Testing',
        status: 'APPROVED',
        proof: 'https://github.com/sara/python-web3-course/tree/mod1-submission',
        reviewedAt: Date.now() - 1000 * 60 * 60 * 20
      },
      {
        id: 1,
        title: 'Module 2: Async Networking & Blockchain RPC Clients',
        status: 'APPROVED',
        proof: 'https://github.com/sara/python-web3-course/pull/2 (Passed all 14 tests)',
        reviewedAt: Date.now() - 1000 * 60 * 60 * 4
      },
      {
        id: 2,
        title: 'Module 3: Capstone Decentralized Oracle Integration',
        status: 'PENDING_REVIEW',
        proof: 'Finished the oracle feeder script and deployed test listener: https://sepolia.etherscan.io/tx/0x918f...21e0',
        reviewedAt: null
      }
    ]
  },
  {
    id: 2,
    title: 'Run 10km Every Sunday for 4 Weeks',
    description: 'Fitness commitment. Sunday morning 10k run recorded on Strava GPS.',
    owner: DEMO_IDENTITIES.SARA.address,
    referee: DEMO_IDENTITIES.DANIEL.address,
    failRecipient: DEMO_IDENTITIES.DANIEL.address,
    failRecipientName: 'Daniel (Friend)',
    stakeAmount: '0.02',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 12,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    status: 'ACTIVE',
    items: [
      {
        id: 0,
        title: 'Week 1: 10.2 km in 58 mins',
        status: 'APPROVED',
        proof: 'https://strava.com/activities/week1-run-gps-track',
        reviewedAt: Date.now() - 1000 * 60 * 60 * 24
      },
      {
        id: 1,
        title: 'Week 2: 10.0 km Sunday morning run',
        status: 'UNCOMPLETED',
        proof: '',
        reviewedAt: null
      },
      {
        id: 2,
        title: 'Week 3: 10.5 km park trail run',
        status: 'UNCOMPLETED',
        proof: '',
        reviewedAt: null
      },
      {
        id: 3,
        title: 'Week 4: Final 10.0 km run to seal goal',
        status: 'UNCOMPLETED',
        proof: '',
        reviewedAt: null
      }
    ]
  },
  {
    id: 3,
    title: 'Ship Solidity Smart Contract Security Audit Checklist',
    description: 'Audit 5 core DeFi protocols and publish public analysis papers on slither, echidna, and reentrancy vectors.',
    owner: '0x49c12A7C7338a90192bC78E0109403819840882c',
    referee: DEMO_IDENTITIES.DANIEL.address,
    failRecipient: '0x000000000000000000000000000000000000dEaD',
    failRecipientName: 'GiveDirectly Charity',
    stakeAmount: '0.10',
    deadline: Date.now() - 1000 * 60 * 60 * 2, // Passed deadline
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    status: 'ACTIVE', // Ready to settle
    items: [
      {
        id: 0,
        title: 'Audit 1: Reentrancy & Cross-Function State Analysis',
        status: 'APPROVED',
        proof: 'https://mirror.xyz/audit-report-1',
        reviewedAt: Date.now() - 1000 * 60 * 60 * 24 * 10
      },
      {
        id: 1,
        title: 'Audit 2: Access Control & Frontrunning Invariants',
        status: 'REJECTED',
        proof: 'Incomplete notes draft',
        reviewedAt: Date.now() - 1000 * 60 * 60 * 24 * 5
      }
    ]
  }
];

export function StakeUpProvider({ children }) {
  const { address: liveWalletAddress, isConnected } = useConnection();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  
  const [activePersonaKey, setActivePersonaKey] = useState('SARA');
  const [dataMode, setDataMode] = useState('auto'); // 'auto', 'onchain', 'demo'
  const [onChainGoals, setOnChainGoals] = useState([]);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);

  const [demoGoals, setDemoGoals] = useState(() => {
    const saved = localStorage.getItem('stakeup_goals');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_GOALS;
  });

  const [toasts, setToasts] = useState([]);
  const [isTxBusy, setIsTxBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem('stakeup_goals', JSON.stringify(demoGoals));
  }, [demoGoals]);

  const [customName, setCustomNameState] = useState(() => {
    return localStorage.getItem('stakeup_custom_username') || '';
  });

  const setCustomName = (name) => {
    const trimmed = name.trim();
    setCustomNameState(trimmed);
    if (trimmed) {
      localStorage.setItem('stakeup_custom_username', trimmed);
      addToast(`Display name set to "${trimmed}"!`, 'success');
    } else {
      localStorage.removeItem('stakeup_custom_username');
      addToast('Reset to wallet address label', 'info');
    }
  };

  const isLiveWallet = Boolean(isConnected && liveWalletAddress);

  // Active address: either live connected wallet or selected simulated persona
  const activeAddress = isLiveWallet
    ? liveWalletAddress.toLowerCase()
    : DEMO_IDENTITIES[activePersonaKey].address.toLowerCase();

  const displayName = isLiveWallet
    ? (customName || `${liveWalletAddress?.slice(0, 6)}…${liveWalletAddress?.slice(-4)}`)
    : (DEMO_IDENTITIES[activePersonaKey]?.name.split(' ')[0] || 'Active Wallet');

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Fetch real on-chain goals from smart contract
  const fetchOnChainGoals = useCallback(async () => {
    if (!publicClient || !contractAddress) return;
    setIsLoadingOnChain(true);
    try {
      const count = await publicClient.readContract({
        ...stakeUpContract,
        functionName: 'goalCount'
      });

      const totalCount = Number(count);
      if (totalCount === 0) {
        setOnChainGoals([]);
        return;
      }

      const statusMap = ['ACTIVE', 'SETTLED', 'REFUNDED_SILENT'];
      const itemStatusMap = ['UNCOMPLETED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];

      const fetched = [];
      for (let i = 1n; i <= count; i++) {
        const goalData = await publicClient.readContract({
          ...stakeUpContract,
          functionName: 'getGoal',
          args: [i]
        });

        const itemsData = await publicClient.readContract({
          ...stakeUpContract,
          functionName: 'getChecklist',
          args: [i]
        });

        fetched.push({
          id: Number(goalData.id),
          title: goalData.title,
          description: goalData.description,
          owner: goalData.owner.toLowerCase(),
          referee: goalData.referee.toLowerCase(),
          failRecipient: goalData.failRecipient.toLowerCase(),
          failRecipientName: 'Fail Recipient',
          stakeAmount: formatEther(goalData.stakeAmount),
          deadline: Number(goalData.deadline) * 1000,
          createdAt: Number(goalData.createdAt) * 1000,
          settledAt: goalData.settledAt > 0 ? Number(goalData.settledAt) * 1000 : null,
          status: statusMap[goalData.status] || 'ACTIVE',
          isOnChain: true,
          items: itemsData.map((it, idx) => ({
            id: idx,
            title: it.title,
            proof: it.proof,
            status: itemStatusMap[it.status] || 'UNCOMPLETED',
            submittedAt: it.submittedAt > 0 ? Number(it.submittedAt) * 1000 : null,
            reviewedAt: it.reviewedAt > 0 ? Number(it.reviewedAt) * 1000 : null,
          }))
        });
      }
      setOnChainGoals(fetched);
    } catch (err) {
      console.warn("Could not load on-chain goals:", err);
    } finally {
      setIsLoadingOnChain(false);
    }
  }, [publicClient]);

  useEffect(() => {
    if (contractAddress && publicClient) {
      fetchOnChainGoals();
    }
  }, [contractAddress, publicClient, fetchOnChainGoals]);

  // Determine which goals to show:
  // If user explicitly chose demo -> demoGoals
  // If user is connected and we have on-chain goals -> onChainGoals
  // Else fallback to demoGoals
  const showOnChain = dataMode === 'onchain' || (dataMode === 'auto' && isLiveWallet && onChainGoals.length > 0);
  const goals = showOnChain ? onChainGoals : demoGoals;

  const createGoal = async ({
    title,
    description,
    itemTitles,
    deadline,
    referee,
    failRecipient,
    failRecipientName,
    stakeAmount
  }) => {
    setIsTxBusy(true);
    let txHash = null;

    try {
      if (isLiveWallet && contractAddress) {
        const deadlineSec = BigInt(Math.floor(new Date(deadline).getTime() / 1000));
        const gracePeriodSec = 86400n * 3n; // 3 days default
        const stakeWei = parseEther(stakeAmount || '0.01');

        addToast('Please confirm the goal creation transaction in your wallet...', 'info');

        txHash = await writeContractAsync({
          ...stakeUpContract,
          functionName: 'createGoal',
          args: [
            title,
            description,
            itemTitles,
            referee,
            failRecipient,
            deadlineSec,
            gracePeriodSec,
          ],
          value: stakeWei,
        });

        addToast(`Goal created on blockchain! Tx: ${txHash.slice(0, 10)}...`, 'success');
        // Refresh on-chain goals
        setTimeout(fetchOnChainGoals, 2000);
      } else {
        addToast(`[Demo Mode] Goal "${title}" created and locked ${stakeAmount} ETH into smart contract!`, 'success');
      }

      const newGoal = {
        id: goals.length + 1,
        title,
        description,
        owner: activeAddress,
        referee: referee.toLowerCase(),
        failRecipient: failRecipient.toLowerCase() || DEFAULT_CHARITY,
        failRecipientName: failRecipientName || 'Referee / Charity',
        stakeAmount: stakeAmount || '0.01',
        deadline: new Date(deadline).getTime(),
        createdAt: Date.now(),
        status: 'ACTIVE',
        txHash,
        items: itemTitles.map((itemTitle, idx) => ({
          id: idx,
          title: itemTitle,
          status: 'UNCOMPLETED',
          proof: '',
          reviewedAt: null
        }))
      };

      setDemoGoals(prev => [newGoal, ...prev]);
      return newGoal.id;
    } catch (err) {
      addToast(explainError(err), 'error');
      throw err;
    } finally {
      setIsTxBusy(false);
    }
  };

  const submitProof = async (goalId, itemIndex, proofUrlOrNote) => {
    setIsTxBusy(true);
    try {
      if (isLiveWallet && contractAddress) {
        addToast('Confirm proof submission transaction...', 'info');
        const hash = await writeContractAsync({
          ...stakeUpContract,
          functionName: 'submitProof',
          args: [BigInt(goalId), itemIndex, proofUrlOrNote],
        });
        addToast(`Proof submitted on-chain! Tx: ${hash.slice(0, 10)}...`, 'success');
        setTimeout(fetchOnChainGoals, 2000);
      } else {
        addToast('Proof submitted! Sent to referee for verification.', 'success');
      }

      const updateItems = (list) =>
        list.map(goal => {
          if (goal.id !== goalId) return goal;
          const updatedItems = goal.items.map((item, idx) => {
            if (idx !== itemIndex) return item;
            return {
              ...item,
              status: 'PENDING_REVIEW',
              proof: proofUrlOrNote
            };
          });
          return { ...goal, items: updatedItems };
        });

      setDemoGoals(updateItems);
      setOnChainGoals(updateItems);
    } catch (err) {
      addToast(explainError(err), 'error');
    } finally {
      setIsTxBusy(false);
    }
  };

  const reviewItem = async (goalId, itemIndex, approve) => {
    setIsTxBusy(true);
    try {
      if (isLiveWallet && contractAddress) {
        addToast(`Confirming ${approve ? 'approval' : 'rejection'} transaction...`, 'info');
        const hash = await writeContractAsync({
          ...stakeUpContract,
          functionName: 'reviewItem',
          args: [BigInt(goalId), itemIndex, Boolean(approve)],
        });
        addToast(`Review recorded on-chain! Tx: ${hash.slice(0, 10)}...`, 'success');
        setTimeout(fetchOnChainGoals, 2000);
      } else {
        addToast(approve ? 'Milestone approved! ✓' : 'Milestone marked as rejected.', approve ? 'success' : 'warning');
      }

      const updateItems = (list) =>
        list.map(goal => {
          if (goal.id !== goalId) return goal;
          const updatedItems = goal.items.map((item, idx) => {
            if (idx !== itemIndex) return item;
            return {
              ...item,
              status: approve ? 'APPROVED' : 'REJECTED',
              reviewedAt: Date.now()
            };
          });
          return { ...goal, items: updatedItems };
        });

      setDemoGoals(updateItems);
      setOnChainGoals(updateItems);
    } catch (err) {
      addToast(explainError(err), 'error');
    } finally {
      setIsTxBusy(false);
    }
  };

  const settleGoal = async (goalId) => {
    setIsTxBusy(true);
    try {
      if (isLiveWallet && contractAddress) {
        addToast('Confirming settlement transaction on blockchain...', 'info');
        const hash = await writeContractAsync({
          ...stakeUpContract,
          functionName: 'settle',
          args: [BigInt(goalId)],
        });
        addToast(`Settlement broadcast! Tx: ${hash.slice(0, 10)}...`, 'success');
        setTimeout(fetchOnChainGoals, 2000);
      }

      let payoutSummary = '';
      const updateGoal = (list) =>
        list.map(goal => {
          if (goal.id !== goalId) return goal;
          const approvedCount = goal.items.filter(i => i.status === 'APPROVED').length;
          const totalCount = goal.items.length;
          const totalStake = parseFloat(goal.stakeAmount);
          const ownerShare = (totalStake * (approvedCount / totalCount)).toFixed(4);
          const failShare = (totalStake - parseFloat(ownerShare)).toFixed(4);

          payoutSummary = `${approvedCount}/${totalCount} approved: ${ownerShare} ETH refunded to Owner, ${failShare} ETH sent to Fail Recipient!`;

          return {
            ...goal,
            status: 'SETTLED',
            settledAt: Date.now(),
            settlementResult: {
              approvedCount,
              totalCount,
              ownerPayout: ownerShare,
              failPayout: failShare
            }
          };
        });

      setDemoGoals(updateGoal);
      setOnChainGoals(updateGoal);
      addToast(`Goal settled! ${payoutSummary}`, 'success');
    } catch (err) {
      addToast(explainError(err), 'error');
    } finally {
      setIsTxBusy(false);
    }
  };

  const claimIfRefereeSilent = async (goalId) => {
    setIsTxBusy(true);
    try {
      if (isLiveWallet && contractAddress) {
        addToast('Confirming silent referee claim transaction...', 'info');
        const hash = await writeContractAsync({
          ...stakeUpContract,
          functionName: 'claimIfRefereeSilent',
          args: [BigInt(goalId)],
        });
        addToast(`Silent referee claim broadcast! Tx: ${hash.slice(0, 10)}...`, 'success');
        setTimeout(fetchOnChainGoals, 2000);
      }

      const updateGoal = (list) =>
        list.map(goal => {
          if (goal.id !== goalId) return goal;
          return {
            ...goal,
            status: 'REFUNDED_SILENT',
            settledAt: Date.now()
          };
        });

      setDemoGoals(updateGoal);
      setOnChainGoals(updateGoal);
      addToast('Silent Referee Protection invoked: 100% of stake refunded to Owner!', 'success');
    } catch (err) {
      addToast(explainError(err), 'error');
    } finally {
      setIsTxBusy(false);
    }
  };

  // Helper to determine the user's role on any goal
  const getRoleForGoal = (goal) => {
    if (!goal) return 'viewer';
    const current = activeAddress.toLowerCase();
    if (current === goal.owner.toLowerCase()) return 'owner';
    if (current === goal.referee.toLowerCase()) return 'referee';
    return 'viewer';
  };

  return (
    <StakeUpContext.Provider value={{
      goals,
      activeAddress,
      activePersonaKey,
      setActivePersonaKey,
      dataMode,
      setDataMode,
      showOnChain,
      isLoadingOnChain,
      fetchOnChainGoals,
      isLiveWallet,
      isTxBusy,
      customName,
      setCustomName,
      displayName,
      createGoal,
      submitProof,
      reviewItem,
      settleGoal,
      claimIfRefereeSilent,
      getRoleForGoal,
      toasts,
      addToast
    }}>
      {children}
    </StakeUpContext.Provider>
  );
}

export const useStakeUp = () => useContext(StakeUpContext);
