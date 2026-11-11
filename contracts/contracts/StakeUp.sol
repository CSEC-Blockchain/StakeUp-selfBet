// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title StakeUp
 * @notice Decentralized commitment and accountability platform.
 * Users lock ETH on personal goals with milestone checklists, designate a referee
 * to review proof, and funds are automatically returned proportionally on success
 * or sent to a designated fail recipient on failure.
 */
contract StakeUp {
    enum GoalStatus {
        Active,
        Settled,
        RefundedSilentReferee
    }

    enum ItemStatus {
        Uncompleted,
        PendingReview,
        Approved,
        Rejected
    }

    struct ChecklistItem {
        string title;
        string proof;
        ItemStatus status;
        uint64 submittedAt;
        uint64 reviewedAt;
    }

    struct Goal {
        uint256 id;
        address owner;
        address referee;
        address payable failRecipient;
        uint256 stakeAmount;
        uint64 deadline;
        uint64 gracePeriod;
        uint64 createdAt;
        uint64 settledAt;
        GoalStatus status;
        string title;
        string description;
        uint16 itemCount;
        uint16 approvedCount;
        uint16 reviewedCount;
    }

    // --- State Variables ---
    uint256 public goalCount;
    mapping(uint256 => Goal) internal _goals;
    mapping(uint256 => ChecklistItem[]) internal _goalItems;
    mapping(address => uint256[]) internal _ownerGoals;
    mapping(address => uint256[]) internal _refereeGoals;

    uint256 private _status = 1;

    // --- Events ---
    event GoalCreated(
        uint256 indexed goalId,
        address indexed owner,
        address indexed referee,
        address failRecipient,
        uint256 stakeAmount,
        uint64 deadline,
        uint16 itemCount
    );

    event ProofSubmitted(
        uint256 indexed goalId,
        uint16 indexed itemIndex,
        address indexed owner,
        string proof,
        uint64 submittedAt
    );

    event ItemReviewed(
        uint256 indexed goalId,
        uint16 indexed itemIndex,
        address indexed referee,
        bool approved,
        uint64 reviewedAt
    );

    event GoalSettled(
        uint256 indexed goalId,
        address indexed caller,
        uint256 ownerPayout,
        uint256 failPayout,
        uint16 approvedCount,
        uint16 itemCount
    );

    event SilentRefereeRefundClaimed(
        uint256 indexed goalId,
        address indexed owner,
        uint256 refundAmount
    );

    // --- Custom Errors ---
    error ZeroStake();
    error InvalidDeadline();
    error InvalidReferee();
    error InvalidFailRecipient();
    error EmptyChecklist();
    error TooManyChecklistItems();
    error GoalNotFound();
    error GoalNotActive();
    error NotGoalOwner();
    error NotGoalReferee();
    error DeadlinePassed();
    error DeadlineNotReached();
    error ItemNotFound();
    error ItemAlreadyApproved();
    error ItemNotPending();
    error GracePeriodNotPassed();
    error RefereeNotSilent();
    error TransferFailed();
    error ReentrancyGuard();

    // --- Modifiers ---
    modifier nonReentrant() {
        if (_status == 2) revert ReentrancyGuard();
        _status = 2;
        _;
        _status = 1;
    }

    // --- Core Functions ---

    /**
     * @notice Creates a new goal, locks the attached ETH stake, and saves checklist items.
     * @param title Title of the goal
     * @param description Short description or details
     * @param itemTitles List of milestone checklist item titles
     * @param referee Wallet address of the friend reviewing proofs
     * @param failRecipient Address receiving forfeited stake on failure
     * @param deadline Unix timestamp for the goal deadline
     * @param gracePeriod Optional duration in seconds past deadline for silent referee protection (defaults to 3 days if 0)
     */
    function createGoal(
        string calldata title,
        string calldata description,
        string[] calldata itemTitles,
        address referee,
        address payable failRecipient,
        uint64 deadline,
        uint64 gracePeriod
    ) external payable returns (uint256) {
        if (msg.value == 0) revert ZeroStake();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (referee == address(0) || referee == msg.sender) revert InvalidReferee();
        if (failRecipient == address(0)) revert InvalidFailRecipient();
        if (itemTitles.length == 0) revert EmptyChecklist();
        if (itemTitles.length > 50) revert TooManyChecklistItems();

        if (gracePeriod == 0) {
            gracePeriod = 3 days;
        }

        uint256 goalId = ++goalCount;
        uint16 count = uint16(itemTitles.length);

        _goals[goalId] = Goal({
            id: goalId,
            owner: msg.sender,
            referee: referee,
            failRecipient: failRecipient,
            stakeAmount: msg.value,
            deadline: deadline,
            gracePeriod: gracePeriod,
            createdAt: uint64(block.timestamp),
            settledAt: 0,
            status: GoalStatus.Active,
            title: title,
            description: description,
            itemCount: count,
            approvedCount: 0,
            reviewedCount: 0
        });

        for (uint16 i = 0; i < count; i++) {
            _goalItems[goalId].push(
                ChecklistItem({
                    title: itemTitles[i],
                    proof: "",
                    status: ItemStatus.Uncompleted,
                    submittedAt: 0,
                    reviewedAt: 0
                })
            );
        }

        _ownerGoals[msg.sender].push(goalId);
        _refereeGoals[referee].push(goalId);

        emit GoalCreated(
            goalId,
            msg.sender,
            referee,
            failRecipient,
            msg.value,
            deadline,
            count
        );

        return goalId;
    }

    /**
     * @notice Allows the goal owner to submit proof for a milestone checklist item.
     * @param goalId ID of the goal
     * @param itemIndex 0-based index of the checklist item
     * @param proof Link, note, or IPFS hash proving completion
     */
    function submitProof(
        uint256 goalId,
        uint16 itemIndex,
        string calldata proof
    ) external {
        Goal storage goal = _goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.status != GoalStatus.Active) revert GoalNotActive();
        if (msg.sender != goal.owner) revert NotGoalOwner();
        if (block.timestamp > goal.deadline) revert DeadlinePassed();
        if (itemIndex >= goal.itemCount) revert ItemNotFound();

        ChecklistItem storage item = _goalItems[goalId][itemIndex];
        if (item.status == ItemStatus.Approved) revert ItemAlreadyApproved();

        item.proof = proof;
        item.status = ItemStatus.PendingReview;
        item.submittedAt = uint64(block.timestamp);

        emit ProofSubmitted(goalId, itemIndex, msg.sender, proof, item.submittedAt);
    }

    /**
     * @notice Allows the designated referee to approve or reject a pending checklist item.
     * @param goalId ID of the goal
     * @param itemIndex 0-based index of the checklist item
     * @param approve True to approve, false to reject
     */
    function reviewItem(
        uint256 goalId,
        uint16 itemIndex,
        bool approve
    ) external {
        Goal storage goal = _goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.status != GoalStatus.Active) revert GoalNotActive();
        if (msg.sender != goal.referee) revert NotGoalReferee();
        if (block.timestamp > goal.deadline) revert DeadlinePassed();
        if (itemIndex >= goal.itemCount) revert ItemNotFound();

        ChecklistItem storage item = _goalItems[goalId][itemIndex];
        if (item.status != ItemStatus.PendingReview) revert ItemNotPending();

        if (approve) {
            item.status = ItemStatus.Approved;
            goal.approvedCount += 1;
        } else {
            item.status = ItemStatus.Rejected;
        }

        goal.reviewedCount += 1;
        item.reviewedAt = uint64(block.timestamp);

        emit ItemReviewed(goalId, itemIndex, msg.sender, approve, item.reviewedAt);
    }

    /**
     * @notice Settles an active goal and distributes the locked stake.
     * Callable by anyone after the deadline OR when all items are approved.
     * @param goalId ID of the goal
     */
    function settle(uint256 goalId) external nonReentrant {
        Goal storage goal = _goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.status != GoalStatus.Active) revert GoalNotActive();

        bool allApproved = (goal.approvedCount == goal.itemCount);
        bool deadlinePassed = (block.timestamp >= goal.deadline);

        if (!allApproved && !deadlinePassed) {
            revert DeadlineNotReached();
        }

        goal.status = GoalStatus.Settled;
        goal.settledAt = uint64(block.timestamp);

        uint256 totalStake = goal.stakeAmount;
        uint256 ownerPayout = (totalStake * goal.approvedCount) / goal.itemCount;
        uint256 failPayout = totalStake - ownerPayout;

        emit GoalSettled(
            goalId,
            msg.sender,
            ownerPayout,
            failPayout,
            goal.approvedCount,
            goal.itemCount
        );

        if (ownerPayout > 0) {
            (bool successOwner, ) = payable(goal.owner).call{value: ownerPayout}("");
            if (!successOwner) revert TransferFailed();
        }

        if (failPayout > 0) {
            (bool successFail, ) = goal.failRecipient.call{value: failPayout}("");
            if (!successFail) revert TransferFailed();
        }
    }

    /**
     * @notice Silent referee protection. If the deadline and grace period have passed
     * and the referee never reviewed any items, the owner can reclaim 100% of the stake.
     * @param goalId ID of the goal
     */
    function claimIfRefereeSilent(uint256 goalId) external nonReentrant {
        Goal storage goal = _goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.status != GoalStatus.Active) revert GoalNotActive();
        if (msg.sender != goal.owner) revert NotGoalOwner();

        if (block.timestamp <= goal.deadline + goal.gracePeriod) {
            revert GracePeriodNotPassed();
        }

        if (goal.reviewedCount > 0) {
            revert RefereeNotSilent();
        }

        goal.status = GoalStatus.RefundedSilentReferee;
        goal.settledAt = uint64(block.timestamp);

        uint256 refund = goal.stakeAmount;

        emit SilentRefereeRefundClaimed(goalId, goal.owner, refund);

        (bool success, ) = payable(goal.owner).call{value: refund}("");
        if (!success) revert TransferFailed();
    }

    // --- Read Functions ---

    /**
     * @notice Retrieves goal details by ID.
     */
    function getGoal(uint256 goalId) external view returns (Goal memory) {
        Goal memory goal = _goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        return goal;
    }

    /**
     * @notice Retrieves all checklist items for a specific goal.
     */
    function getChecklist(uint256 goalId) external view returns (ChecklistItem[] memory) {
        if (_goals[goalId].id == 0) revert GoalNotFound();
        return _goalItems[goalId];
    }

    /**
     * @notice Returns array of goal IDs created by an address.
     */
    function getGoalsByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerGoals[owner];
    }

    /**
     * @notice Returns array of goal IDs where address is the designated referee.
     */
    function getGoalsByReferee(address referee) external view returns (uint256[] memory) {
        return _refereeGoals[referee];
    }
}
