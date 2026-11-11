import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

export function explainError(error: unknown): string {
  if (!(error instanceof BaseError)) return "Something went wrong. Check the console.";

  if (error.walk((e) => e instanceof UserRejectedRequestError)) {
    return "You rejected the transaction in your wallet.";
  }

  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (revert instanceof ContractFunctionRevertedError) {
    const messages: Record<string, string> = {
      ZeroStake: "You must stake a non-zero amount of ETH.",
      InvalidDeadline: "The deadline must be in the future.",
      InvalidReferee: "Referee cannot be your own address or the zero address.",
      InvalidFailRecipient: "Fail recipient address cannot be the zero address.",
      EmptyChecklist: "You must specify at least one milestone item.",
      TooManyChecklistItems: "Checklists cannot exceed 50 items.",
      GoalNotFound: "Goal was not found on the blockchain.",
      GoalNotActive: "This goal is no longer active.",
      NotGoalOwner: "Only the goal creator/owner can perform this action.",
      NotGoalReferee: "Only the designated referee can review items.",
      DeadlinePassed: "The deadline for this goal has passed.",
      DeadlineNotReached: "The deadline has not arrived yet, and not all milestones are approved.",
      ItemNotFound: "Milestone item not found.",
      ItemAlreadyApproved: "This item is already approved.",
      ItemNotPending: "This item is not in pending review state.",
      GracePeriodNotPassed: "The referee grace period has not expired yet.",
      RefereeNotSilent: "The referee has already reviewed items; silent referee refund unavailable.",
      TransferFailed: "ETH transfer failed.",
      ReentrancyGuard: "Reentrant call detected.",
    };
    const name = revert.data?.errorName;
    return (name && messages[name]) ?? `Contract reverted: ${name ?? revert.reason ?? revert.shortMessage}`;
  }

  if (/insufficient funds/i.test(error.message)) {
    return "Insufficient ETH in wallet to complete transaction and pay gas.";
  }
  return error.shortMessage || "Transaction failed.";
}
