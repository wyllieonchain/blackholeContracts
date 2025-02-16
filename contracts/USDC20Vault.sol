// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract USDC20Vault is Ownable, ReentrancyGuard {
    IERC20 public usdc20;
    uint256 public constant BASE_INCREMENT = 100 * 1e6; // 100 USDC20 tokens
    uint256 public constant VAULT_FEE_BPS = 100; // 1% = 100 basis points
    uint256 public constant DEPLOYER_FEE_BPS = 50; // 0.5% = 50 basis points
    uint256 public constant TOTAL_FEE_BPS = VAULT_FEE_BPS + DEPLOYER_FEE_BPS; // 1.5%
    
    address public highestBidder;
    uint256 public currentBaseAmount;
    uint256 public highestBid;
    uint256 public prizePool;
    uint256 public lastBidTime;
    uint256 public constant HOUR_IN_SECONDS = 60; // Changed from 3600 to 60 for testing
    bool public claimed;
    bool public init;

    event BidPlaced(address indexed bidder, uint256 amount, uint256 vaultFee, uint256 deployerFee);
    event BidderRefunded(address indexed bidder, uint256 amount);

    constructor(address _usdc20Address) Ownable(msg.sender) {
        usdc20 = IERC20(_usdc20Address);
        claimed = false;
        init =false;
    }
    
    function startGame() public onlyOwner{
        init = true;
    }

    function placeBid() external nonReentrant {
        require(init,"Game has not been started");
        require(!canClaim(), "Game is ready for claiming, no more bids allowed");
        uint256 baseAmount = currentBaseAmount == 0 ? BASE_INCREMENT : currentBaseAmount + BASE_INCREMENT;
        uint256 vaultFee = (baseAmount * VAULT_FEE_BPS) / 10000;
        uint256 deployerFee = (baseAmount * DEPLOYER_FEE_BPS) / 10000;
        uint256 totalAmount = baseAmount + vaultFee + deployerFee;
        
        require(usdc20.allowance(msg.sender, address(this)) >= totalAmount, "Insufficient allowance");
        
        address previousBidder = highestBidder;
        uint256 previousBaseAmount = currentBaseAmount;  // Store base amount for refund

        // First receive new funds
        require(usdc20.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");

        // Update state
        highestBidder = msg.sender;
        currentBaseAmount = baseAmount;
        highestBid = totalAmount;
        prizePool += vaultFee;
        lastBidTime = block.timestamp;

        // Then handle outgoing transfers
        require(usdc20.transfer(owner(), deployerFee), "Deployer fee transfer failed");
        
        if (previousBidder != address(0)) {
            require(usdc20.transfer(previousBidder, previousBaseAmount), "Refund failed");
            emit BidderRefunded(previousBidder, previousBaseAmount);
        }

        emit BidPlaced(msg.sender, totalAmount, vaultFee, deployerFee);
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
        require(init, "Game has not bee started");
        return !claimed && 
               block.timestamp >= lastBidTime + HOUR_IN_SECONDS && 
               highestBidder != address(0);
    }

    function addToPrizePool(uint256 amount) external onlyOwner {
        require(usdc20.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        prizePool += amount;
    }

    function claim() public {
        require(canClaim(), "Cannot claim yet or already claimed");
        require(msg.sender == highestBidder, "Only highest bidder can claim");
        
        claimed = true;
        prizePool = 0;
        require(usdc20.transfer(highestBidder, prizePool), "Prize transfer failed");
        require(usdc20.transfer(owner(), currentBaseAmount), "Final bid transfer failed");
    }
} 