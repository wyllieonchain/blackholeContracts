// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract USDC20Vault is Ownable, ReentrancyGuard {
    IERC20 public usdc20;
    uint256 public constant BASE_INCREMENT = 100 * 1e6; // 100 USDC20 tokens
    uint256 public constant VAULT_FEE_BPS = 100; // 1% = 100 basis points
    uint256 public constant DEPLOYER_FEE_BPS = 100; // 1% = 50 basis points
    uint256 public constant TOTAL_FEE_BPS = VAULT_FEE_BPS + DEPLOYER_FEE_BPS; // 2%
    
    address public highestBidder;
    address public feeDestination;
    uint256 public currentBaseAmount;
    uint256 public highestBid;
    uint256 public prizePool;
    uint256 public lastBidTime;
    uint256 public constant HOUR_IN_SECONDS = 3600;
    uint256 public constant CLAIM_WINDOW_IN_SECONDS = 604800;
    bool public claimed;
    bool public init;

    event BidPlaced(address indexed bidder, uint256 amount, uint256 lastBidTime, uint256 prizePool, uint256 vaultFee, uint256 deployerFee);
    event BidderRefunded(address indexed bidder, uint256 amount);
    event Claimed(address indexed bidder, uint256 lastBid, uint256 prizePool);

    constructor(address _usdc20Address, address _feeDestination) Ownable(msg.sender) {
        usdc20 = IERC20(_usdc20Address);
        feeDestination = _feeDestination;
        claimed = false;
        init =false;
    }
    
    function startGame() public onlyOwner{
        init = true;
    }

    function changeFeeDestination(address _feeDestination) public onlyOwner(){
        feeDestination = _feeDestination;
    }

    function placeBid(uint256 expectedBid) external nonReentrant {
        require(init,"Game has not been started");
        require(!canClaim(), "Game is ready for claiming, no more bids allowed");
        require(claimed == false, "Game has already been claimed");
        uint256 baseAmount = currentBaseAmount == 0 ? BASE_INCREMENT : currentBaseAmount + BASE_INCREMENT;
        uint256 vaultFee = (baseAmount * VAULT_FEE_BPS) / 10000;
        uint256 deployerFee = (baseAmount * DEPLOYER_FEE_BPS) / 10000;
        uint256 totalAmount = baseAmount + vaultFee + deployerFee;
        require(expectedBid >= totalAmount, "Slippage");
        require(usdc20.allowance(msg.sender, address(this)) >= totalAmount, "Insufficient allowance");
        
        address previousBidder = highestBidder;
        uint256 previousBaseAmount = currentBaseAmount;  // Store base amount for refund

        // Update state
        highestBidder = msg.sender;
        currentBaseAmount = baseAmount;
        highestBid = totalAmount;
        prizePool += vaultFee;
        lastBidTime = block.timestamp;

        // First receive new funds
        require(usdc20.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");

        // Then handle outgoing transfers
        require(usdc20.transfer(feeDestination, deployerFee), "Deployer fee transfer failed");
        
        if (previousBidder != address(0)) {
            require(usdc20.transfer(previousBidder, previousBaseAmount), "Refund failed");
            emit BidderRefunded(previousBidder, previousBaseAmount);
        }

        emit BidPlaced(msg.sender, totalAmount, lastBidTime, prizePool, vaultFee, deployerFee);
    }

    function getNextBidAmount() external view returns (uint256) {
        uint256 nextBase = currentBaseAmount == 0 ? BASE_INCREMENT : currentBaseAmount + BASE_INCREMENT;
        uint256 fees = (nextBase * TOTAL_FEE_BPS) / 10000;
        return nextBase + fees;
    }

    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }

    function canClaim() public view returns (bool) {
        require(init, "Game has not been started");
        return !claimed && 
               block.timestamp >= lastBidTime + HOUR_IN_SECONDS && 
               highestBidder != address(0);
    }

    function addToPrizePool(uint256 amount) external onlyOwner {
        require(usdc20.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        prizePool += amount;
    }

    function claim() external nonReentrant {
        require(canClaim(), "Cannot claim yet or already claimed");
        require(msg.sender == highestBidder, "Only highest bidder can claim");

        uint256 tempPool = prizePool;
        prizePool = 0;
        claimed = true;

        require(usdc20.transfer(feeDestination, currentBaseAmount), "Final bid transfer failed");
        require(usdc20.transfer(highestBidder, tempPool), "Prize transfer failed");
        

        emit Claimed(msg.sender, highestBid, tempPool);
        
    }

    function claimWindowEnded() external nonReentrant onlyOwner{
        require(canClaim(),"Cannot claim yet or already claimed" );
        require(block.timestamp>=lastBidTime + HOUR_IN_SECONDS + CLAIM_WINDOW_IN_SECONDS, "Player claim window has not ended");

        uint256 tempPool = prizePool;
        prizePool = 0;
        claimed = true;

        require(usdc20.transfer(feeDestination, currentBaseAmount), "Final bid transfer failed");
        require(usdc20.transfer(feeDestination, tempPool), "Prize transfer failed");
        

        emit Claimed(feeDestination, highestBid, tempPool);

    }
} 