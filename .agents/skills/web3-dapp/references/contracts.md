# Contracts project templates (Hardhat 3)

Replace `MyContract`, `value`, `setValue`, `ValueChanged` and `ZeroValue` with the user's design.

## Setup

```bash
mkdir contracts && cd contracts
npm init -y
npm pkg set type=module
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox-viem
npm install --save-dev @nomicfoundation/hardhat-ignition viem typescript @types/node
```

`package.json` scripts:

```json
"scripts": {
  "compile": "hardhat build",
  "test": "hardhat test",
  "node": "hardhat node",
  "deploy:local": "hardhat ignition deploy ignition/modules/MyContract.ts --network localhost --parameters ignition/parameters.json",
  "deploy:sepolia": "hardhat ignition deploy ignition/modules/MyContract.ts --network sepolia --parameters ignition/parameters.json"
}
```

`.gitignore`: `node_modules`, `artifacts`, `cache`, `coverage`, `types`, `.env`. Commit `ignition/deployments/chain-11155111/`.

## hardhat.config.ts

```ts
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.28",
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
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["es2023"],
    "module": "node16",
    "target": "es2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node16",
    "noEmit": true
  }
}
```

## contracts/MyContract.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyContract {
    address public immutable owner;
    uint256 public value;

    event ValueChanged(address indexed by, uint256 newValue);

    error ZeroValue();

    constructor(uint256 initialValue) {
        owner = msg.sender;
        value = initialValue;
    }

    function setValue(uint256 newValue) external {
        if (newValue == 0) revert ZeroValue();
        value = newValue;
        emit ValueChanged(msg.sender, newValue);
    }
}
```

Owner-only modifier:

```solidity
error NotOwner();

modifier onlyOwner() {
    if (msg.sender != owner) revert NotOwner();
    _;
}
```

## test/MyContract.ts

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

const { viem } = await network.create();

describe("MyContract", async function () {
  it("stores the initial value and the owner", async function () {
    const [deployer] = await viem.getWalletClients();
    const myContract = await viem.deployContract("MyContract", [42n]);

    assert.equal(await myContract.read.value(), 42n);
    assert.equal(
      (await myContract.read.owner()).toLowerCase(),
      deployer.account.address.toLowerCase(),
    );
  });

  it("updates the value and emits ValueChanged", async function () {
    const [deployer] = await viem.getWalletClients();
    const myContract = await viem.deployContract("MyContract", [1n]);

    await viem.assertions.emitWithArgs(
      myContract.write.setValue([7n]),
      myContract,
      "ValueChanged",
      [deployer.account.address, 7n],
    );
    assert.equal(await myContract.read.value(), 7n);
  });

  it("reverts with ZeroValue for 0", async function () {
    const myContract = await viem.deployContract("MyContract", [1n]);
    await viem.assertions.revertWithCustomError(
      myContract.write.setValue([0n]),
      myContract,
      "ZeroValue",
    );
  });

  it("lets any account call setValue", async function () {
    const [, other] = await viem.getWalletClients();
    const myContract = await viem.deployContract("MyContract", [1n]);

    await myContract.write.setValue([5n], { account: other.account });
    assert.equal(await myContract.read.value(), 5n);
  });
});
```

## ignition/modules/MyContract.ts

```ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyContractModule", (m) => {
  const initialValue = m.getParameter("initialValue", 1n);
  const myContract = m.contract("MyContract", [initialValue]);
  return { myContract };
});
```

## ignition/parameters.json

bigint values are strings ending in `n`:

```json
{ "MyContractModule": { "initialValue": "42n" } }
```

## scripts/export-abi.mjs

Usage: `node scripts/export-abi.mjs MyContract ../web/lib`, which writes `../web/lib/myContractAbi.ts`.

```js
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [name = "MyContract", outDir = "../web/lib"] = process.argv.slice(2);

const artifact = JSON.parse(
  readFileSync(`artifacts/contracts/${name}.sol/${name}.json`, "utf8"),
);
const exportName = name[0].toLowerCase() + name.slice(1) + "Abi";
const outFile = join(outDir, `${exportName}.ts`);

mkdirSync(outDir, { recursive: true });
writeFileSync(
  outFile,
  `// Generated by scripts/export-abi.mjs. Do not edit by hand.\n` +
    `export const ${exportName} = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);
console.log(`Wrote ${artifact.abi.length} ABI items to ${outFile}`);
```

## Expected output

- compile: `Compiled 1 Solidity file with solc 0.8.28`
- test: `N passing`
- deploy:local (with `npm run node` running): `[ MyContractModule ] successfully deployed 🚀`; the first local address is `0x5FbDB2315678afecb367f032d93F642f64180aa3`
