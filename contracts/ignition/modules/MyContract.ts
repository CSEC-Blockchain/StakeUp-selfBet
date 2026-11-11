import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyContractModule", (m) => {
  const initialValue = m.getParameter("initialValue", 1n);
  const myContract = m.contract("MyContract", [initialValue]);
  return { myContract };
});

