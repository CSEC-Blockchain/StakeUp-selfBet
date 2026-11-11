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

