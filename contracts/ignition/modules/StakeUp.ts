import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("StakeUpModule", (m) => {
  const stakeUp = m.contract("StakeUp", []);
  return { stakeUp };
});
