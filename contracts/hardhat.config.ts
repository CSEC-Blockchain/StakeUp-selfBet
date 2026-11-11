import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

const sepoliaRpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/Vr_4YBp79gf6y3pVCq9o2";
const sepoliaPrivateKey =
  process.env.SEPOLIA_PRIVATE_KEY ||
  "0xd0dc30c2a07e251dd3feda20186ee73b7b47b009da53c260b74c1815cb320b9b";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: sepoliaRpcUrl,
      accounts: [sepoliaPrivateKey],
    },
  },
});
