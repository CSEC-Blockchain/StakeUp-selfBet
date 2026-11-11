import { getAddress, isAddress } from "viem";
import { hardhat, sepolia } from "wagmi/chains";
import { stakeUpAbi } from "./stakeUpAbi";

const envChainId = import.meta.env.VITE_CHAIN_ID ? Number(import.meta.env.VITE_CHAIN_ID) : sepolia.id;
const rawAddress =
  import.meta.env.VITE_STAKEUP_CONTRACT_ADDRESS ||
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0xf3466e10994a6ae63436b9db86e9b9b9de2d8a0f";

export const targetChain = envChainId === hardhat.id ? hardhat : sepolia;
export const contractAddress = isAddress(rawAddress) ? getAddress(rawAddress) : undefined;

export const stakeUpContract = {
  abi: stakeUpAbi,
  address: contractAddress,
  chainId: targetChain.id,
} as const;

export const myContract = stakeUpContract;
export { stakeUpAbi };
