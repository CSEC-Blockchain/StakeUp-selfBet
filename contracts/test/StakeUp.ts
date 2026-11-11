import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

const { viem } = await network.create();

describe("StakeUp Smart Contract", async function () {
  async function deployFixture() {
    const [deployer, owner, referee, failRecipient, outsider] =
      await viem.getWalletClients();
    const stakeUp = await viem.deployContract("StakeUp", []);
    const publicClient = await viem.getPublicClient();
    const testClient = await viem.getTestClient();

    const currentBlock = await publicClient.getBlock();
    const now = Number(currentBlock.timestamp);
    const deadline = BigInt(now + 3600); // 1 hour from now
    const gracePeriod = 86400n; // 1 day

    return {
      deployer,
      owner,
      referee,
      failRecipient,
      outsider,
      stakeUp,
      publicClient,
      testClient,
      deadline,
      gracePeriod,
      now,
    };
  }

  describe("Goal Creation & Validation", function () {
    it("successfully creates a goal with locked stake and items", async function () {
      const { owner, referee, failRecipient, stakeUp, deadline, gracePeriod } =
        await deployFixture();

      const items = ["Finish Chapter 1", "Finish Chapter 2", "Final Project"];
      const stakeAmount = parseEther("0.03");

      await stakeUp.write.createGoal(
        [
          "Learn Solidity",
          "Complete the course",
          items,
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: stakeAmount }
      );

      assert.equal(await stakeUp.read.goalCount(), 1n);

      const goal = await stakeUp.read.getGoal([1n]);
      assert.equal(goal.owner.toLowerCase(), owner.account.address.toLowerCase());
      assert.equal(goal.referee.toLowerCase(), referee.account.address.toLowerCase());
      assert.equal(
        goal.failRecipient.toLowerCase(),
        failRecipient.account.address.toLowerCase()
      );
      assert.equal(goal.stakeAmount, stakeAmount);
      assert.equal(goal.itemCount, 3);
      assert.equal(goal.approvedCount, 0);
      assert.equal(goal.status, 0); // Active

      const checklist = await stakeUp.read.getChecklist([1n]);
      assert.equal(checklist.length, 3);
      assert.equal(checklist[0].title, "Finish Chapter 1");
      assert.equal(checklist[0].status, 0); // Uncompleted
    });

    it("reverts if stake is zero", async function () {
      const { owner, referee, failRecipient, stakeUp, deadline, gracePeriod } =
        await deployFixture();

      await viem.assertions.revertWithCustomError(
        stakeUp.write.createGoal(
          [
            "Zero Stake",
            "Desc",
            ["Item 1"],
            referee.account.address,
            failRecipient.account.address,
            deadline,
            gracePeriod,
          ],
          { account: owner.account, value: 0n }
        ),
        stakeUp,
        "ZeroStake"
      );
    });

    it("reverts if deadline is in the past", async function () {
      const { owner, referee, failRecipient, stakeUp, gracePeriod, now } =
        await deployFixture();

      await viem.assertions.revertWithCustomError(
        stakeUp.write.createGoal(
          [
            "Past Goal",
            "Desc",
            ["Item 1"],
            referee.account.address,
            failRecipient.account.address,
            BigInt(now - 100),
            gracePeriod,
          ],
          { account: owner.account, value: parseEther("0.01") }
        ),
        stakeUp,
        "InvalidDeadline"
      );
    });

    it("reverts if referee is self or zero address", async function () {
      const { owner, failRecipient, stakeUp, deadline, gracePeriod } =
        await deployFixture();

      // Owner as referee
      await viem.assertions.revertWithCustomError(
        stakeUp.write.createGoal(
          [
            "Self referee",
            "Desc",
            ["Item 1"],
            owner.account.address,
            failRecipient.account.address,
            deadline,
            gracePeriod,
          ],
          { account: owner.account, value: parseEther("0.01") }
        ),
        stakeUp,
        "InvalidReferee"
      );

      // Zero address referee
      await viem.assertions.revertWithCustomError(
        stakeUp.write.createGoal(
          [
            "Zero referee",
            "Desc",
            ["Item 1"],
            "0x0000000000000000000000000000000000000000",
            failRecipient.account.address,
            deadline,
            gracePeriod,
          ],
          { account: owner.account, value: parseEther("0.01") }
        ),
        stakeUp,
        "InvalidReferee"
      );
    });

    it("reverts if checklist is empty", async function () {
      const { owner, referee, failRecipient, stakeUp, deadline, gracePeriod } =
        await deployFixture();

      await viem.assertions.revertWithCustomError(
        stakeUp.write.createGoal(
          [
            "Empty Items",
            "Desc",
            [],
            referee.account.address,
            failRecipient.account.address,
            deadline,
            gracePeriod,
          ],
          { account: owner.account, value: parseEther("0.01") }
        ),
        stakeUp,
        "EmptyChecklist"
      );
    });
  });

  describe("Submitting Proof & Review Workflow", function () {
    async function createdGoalFixture() {
      const fixture = await deployFixture();
      const { owner, referee, failRecipient, stakeUp, deadline, gracePeriod } =
        fixture;

      await stakeUp.write.createGoal(
        [
          "Finish React Project",
          "Build full app",
          ["Milestone 1", "Milestone 2", "Milestone 3"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: parseEther("0.03") }
      );

      return { ...fixture, goalId: 1n };
    }

    it("allows owner to submit proof and updates item to PendingReview", async function () {
      const { owner, stakeUp, goalId } = await createdGoalFixture();

      await stakeUp.write.submitProof([goalId, 0, "https://github.com/my-repo"], {
        account: owner.account,
      });

      const checklist = await stakeUp.read.getChecklist([goalId]);
      assert.equal(checklist[0].status, 1); // PendingReview
      assert.equal(checklist[0].proof, "https://github.com/my-repo");
    });

    it("reverts if non-owner tries to submit proof", async function () {
      const { outsider, stakeUp, goalId } = await createdGoalFixture();

      await viem.assertions.revertWithCustomError(
        stakeUp.write.submitProof([goalId, 0, "fake proof"], {
          account: outsider.account,
        }),
        stakeUp,
        "NotGoalOwner"
      );
    });

    it("allows referee to approve a pending item and increments approvedCount", async function () {
      const { owner, referee, stakeUp, goalId } = await createdGoalFixture();

      await stakeUp.write.submitProof([goalId, 0, "https://github.com/pr/1"], {
        account: owner.account,
      });

      await stakeUp.write.reviewItem([goalId, 0, true], {
        account: referee.account,
      });

      const checklist = await stakeUp.read.getChecklist([goalId]);
      assert.equal(checklist[0].status, 2); // Approved

      const goal = await stakeUp.read.getGoal([goalId]);
      assert.equal(goal.approvedCount, 1);
      assert.equal(goal.reviewedCount, 1);
    });

    it("allows referee to reject a pending item and owner can resubmit", async function () {
      const { owner, referee, stakeUp, goalId } = await createdGoalFixture();

      await stakeUp.write.submitProof([goalId, 0, "broken link"], {
        account: owner.account,
      });

      // Referee rejects
      await stakeUp.write.reviewItem([goalId, 0, false], {
        account: referee.account,
      });

      let checklist = await stakeUp.read.getChecklist([goalId]);
      assert.equal(checklist[0].status, 3); // Rejected

      // Owner resubmits updated proof
      await stakeUp.write.submitProof([goalId, 0, "https://fixed-link.com"], {
        account: owner.account,
      });

      checklist = await stakeUp.read.getChecklist([goalId]);
      assert.equal(checklist[0].status, 1); // Back to PendingReview
      assert.equal(checklist[0].proof, "https://fixed-link.com");
    });

    it("reverts if non-referee tries to review", async function () {
      const { owner, outsider, stakeUp, goalId } = await createdGoalFixture();

      await stakeUp.write.submitProof([goalId, 0, "proof"], {
        account: owner.account,
      });

      await viem.assertions.revertWithCustomError(
        stakeUp.write.reviewItem([goalId, 0, true], {
          account: outsider.account,
        }),
        stakeUp,
        "NotGoalReferee"
      );
    });
  });

  describe("Settlement Scenarios", function () {
    it("100% Success: settles early when all items are approved and returns 100% stake to owner", async function () {
      const {
        owner,
        referee,
        failRecipient,
        stakeUp,
        deadline,
        gracePeriod,
        publicClient,
      } = await deployFixture();

      const stakeAmount = parseEther("0.02");

      await stakeUp.write.createGoal(
        [
          "Full Success Goal",
          "Two tasks",
          ["Task 1", "Task 2"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: stakeAmount }
      );

      const goalId = 1n;

      // Submit and approve task 1
      await stakeUp.write.submitProof([goalId, 0, "Proof 1"], { account: owner.account });
      await stakeUp.write.reviewItem([goalId, 0, true], { account: referee.account });

      // Submit and approve task 2
      await stakeUp.write.submitProof([goalId, 1, "Proof 2"], { account: owner.account });
      await stakeUp.write.reviewItem([goalId, 1, true], { account: referee.account });

      const ownerBalanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      // Settle early (since 2 of 2 are approved)
      await stakeUp.write.settle([goalId], { account: referee.account });

      const goal = await stakeUp.read.getGoal([goalId]);
      assert.equal(goal.status, 1); // Settled

      const ownerBalanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });

      // Owner should have received the full 0.02 ETH
      assert.equal(ownerBalanceAfter - ownerBalanceBefore, stakeAmount);
    });

    it("Partial Success: 2 of 3 approved returns 2/3 to owner and 1/3 to failRecipient", async function () {
      const {
        owner,
        referee,
        failRecipient,
        stakeUp,
        deadline,
        gracePeriod,
        publicClient,
        testClient,
      } = await deployFixture();

      const stakeAmount = parseEther("0.03");

      await stakeUp.write.createGoal(
        [
          "Partial Goal",
          "Three tasks",
          ["Task 1", "Task 2", "Task 3"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: stakeAmount }
      );

      const goalId = 1n;

      // Approve task 1
      await stakeUp.write.submitProof([goalId, 0, "Proof 1"], { account: owner.account });
      await stakeUp.write.reviewItem([goalId, 0, true], { account: referee.account });

      // Approve task 2
      await stakeUp.write.submitProof([goalId, 1, "Proof 2"], { account: owner.account });
      await stakeUp.write.reviewItem([goalId, 1, true], { account: referee.account });

      // Task 3 left incomplete

      // Cannot settle before deadline since not 100% complete
      await viem.assertions.revertWithCustomError(
        stakeUp.write.settle([goalId], { account: owner.account }),
        stakeUp,
        "DeadlineNotReached"
      );

      // Fast forward past deadline
      await testClient.increaseTime({ seconds: 3700 });
      await testClient.mine({ blocks: 1 });

      const ownerBalBefore = await publicClient.getBalance({
        address: owner.account.address,
      });
      const failBalBefore = await publicClient.getBalance({
        address: failRecipient.account.address,
      });

      // Anyone (outsider) settles
      const [deployer] = await viem.getWalletClients();
      await stakeUp.write.settle([goalId], { account: deployer.account });

      const ownerBalAfter = await publicClient.getBalance({
        address: owner.account.address,
      });
      const failBalAfter = await publicClient.getBalance({
        address: failRecipient.account.address,
      });

      // 2/3 of 0.03 ETH = 0.02 ETH
      assert.equal(ownerBalAfter - ownerBalBefore, parseEther("0.02"));
      // 1/3 of 0.03 ETH = 0.01 ETH
      assert.equal(failBalAfter - failBalBefore, parseEther("0.01"));

      const goal = await stakeUp.read.getGoal([goalId]);
      assert.equal(goal.status, 1); // Settled
    });

    it("0% Success: 0 items approved sends 100% of stake to failRecipient", async function () {
      const {
        owner,
        referee,
        failRecipient,
        stakeUp,
        deadline,
        gracePeriod,
        publicClient,
        testClient,
      } = await deployFixture();

      const stakeAmount = parseEther("0.05");

      await stakeUp.write.createGoal(
        [
          "Total Failure Goal",
          "Two tasks",
          ["Task 1", "Task 2"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: stakeAmount }
      );

      const goalId = 1n;

      // Fast forward past deadline
      await testClient.increaseTime({ seconds: 3700 });
      await testClient.mine({ blocks: 1 });

      const failBalBefore = await publicClient.getBalance({
        address: failRecipient.account.address,
      });

      await stakeUp.write.settle([goalId], { account: referee.account });

      const failBalAfter = await publicClient.getBalance({
        address: failRecipient.account.address,
      });

      assert.equal(failBalAfter - failBalBefore, stakeAmount);
    });
  });

  describe("Silent Referee Protection", function () {
    it("owner can reclaim 100% stake if referee was completely silent past grace period", async function () {
      const {
        owner,
        referee,
        failRecipient,
        stakeUp,
        deadline,
        gracePeriod,
        publicClient,
        testClient,
      } = await deployFixture();

      const stakeAmount = parseEther("0.04");

      await stakeUp.write.createGoal(
        [
          "Ghost Referee Goal",
          "Desc",
          ["Task 1"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: stakeAmount }
      );

      const goalId = 1n;

      // Submit proof
      await stakeUp.write.submitProof([goalId, 0, "Proof submitted"], {
        account: owner.account,
      });

      // Referee ignores everything!

      // Before deadline + gracePeriod: revert
      await testClient.increaseTime({ seconds: 3650 }); // past deadline but NOT grace period
      await testClient.mine({ blocks: 1 });

      await viem.assertions.revertWithCustomError(
        stakeUp.write.claimIfRefereeSilent([goalId], { account: owner.account }),
        stakeUp,
        "GracePeriodNotPassed"
      );

      // Now pass grace period (1 day = 86400 seconds)
      await testClient.increaseTime({ seconds: 86500 });
      await testClient.mine({ blocks: 1 });

      const ownerBalBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      const hash = await stakeUp.write.claimIfRefereeSilent([goalId], {
        account: owner.account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gasPaid = receipt.gasUsed * receipt.effectiveGasPrice;

      const ownerBalAfter = await publicClient.getBalance({
        address: owner.account.address,
      });

      assert.equal(ownerBalAfter - ownerBalBefore + gasPaid, stakeAmount);

      const goal = await stakeUp.read.getGoal([goalId]);
      assert.equal(goal.status, 2); // RefundedSilentReferee
    });

    it("reverts silent referee claim if referee did review at least one item", async function () {
      const {
        owner,
        referee,
        failRecipient,
        stakeUp,
        deadline,
        gracePeriod,
        testClient,
      } = await deployFixture();

      await stakeUp.write.createGoal(
        [
          "Active Referee Goal",
          "Desc",
          ["Task 1"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: parseEther("0.01") }
      );

      const goalId = 1n;

      await stakeUp.write.submitProof([goalId, 0, "Proof"], { account: owner.account });
      // Referee reviews and rejects
      await stakeUp.write.reviewItem([goalId, 0, false], { account: referee.account });

      // Fast forward past deadline + grace period
      await testClient.increaseTime({ seconds: 100000 });
      await testClient.mine({ blocks: 1 });

      // Cannot claim silent referee refund because referee DID review!
      await viem.assertions.revertWithCustomError(
        stakeUp.write.claimIfRefereeSilent([goalId], { account: owner.account }),
        stakeUp,
        "RefereeNotSilent"
      );
    });
  });

  describe("Access Queries & Goal Lists", function () {
    it("returns goals indexed by owner and referee", async function () {
      const { owner, referee, failRecipient, stakeUp, deadline, gracePeriod } =
        await deployFixture();

      await stakeUp.write.createGoal(
        [
          "Owner Goal 1",
          "Desc",
          ["T1"],
          referee.account.address,
          failRecipient.account.address,
          deadline,
          gracePeriod,
        ],
        { account: owner.account, value: parseEther("0.01") }
      );

      const ownerGoals = await stakeUp.read.getGoalsByOwner([owner.account.address]);
      assert.equal(ownerGoals.length, 1);
      assert.equal(ownerGoals[0], 1n);

      const refereeGoals = await stakeUp.read.getGoalsByReferee([referee.account.address]);
      assert.equal(refereeGoals.length, 1);
      assert.equal(refereeGoals[0], 1n);
    });
  });
});
