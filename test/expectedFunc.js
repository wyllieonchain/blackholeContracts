const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("USDC20Vault", function () {
  let deployer, feeDestination, player1, player2;
  let usdc20, vault;

  beforeEach(async () => {
    [deployer, feeDestination, player1, player2] = await ethers.getSigners();

    // Deploy USDC20 mock token
    const USDC20 = await ethers.getContractFactory("USDC20");
    usdc20 = await USDC20.deploy();
    await usdc20.waitForDeployment();

    // Deploy Vault
    const USDC20Vault = await ethers.getContractFactory("USDC20Vault");
    vault = await USDC20Vault.deploy(
      await usdc20.getAddress(),
      await feeDestination.getAddress()
    );
    await vault.waitForDeployment();

    // Mint tokens to all players
    const mintAmount = ethers.parseUnits("10000", 6);
    await usdc20.mint(await deployer.getAddress(), mintAmount);
    await usdc20.mint(await player1.getAddress(), mintAmount);
    await usdc20.mint(await player2.getAddress(), mintAmount);

    // Approve and fund vault prize pool
    await usdc20.connect(deployer).approve(await vault.getAddress(), mintAmount);
    await vault.connect(deployer).addToPrizePool(mintAmount);

    // Start game
    await vault.connect(deployer).startGame();
  });

  it("Player1 places bid, then Player2 outbids", async () => {
    // Get and approve first bid
    let bid1 = await vault.getNextBidAmount();
    const feeDestStart = await usdc20.balanceOf(feeDestination.address);
    await usdc20.connect(player1).approve(await vault.getAddress(), bid1);
    const player1StartBalance = await usdc20.balanceOf(player1.address);

    await vault.connect(player1).placeBid(bid1);

    const player1AfterBid = await usdc20.balanceOf(player1.address);
    expect(player1AfterBid).to.be.lt(player1StartBalance);

    // Player2 outbids
    let bid2 = await vault.getNextBidAmount();
    await usdc20.connect(player2).approve(await vault.getAddress(), bid2);

    const player2StartBalance = await usdc20.balanceOf(player2.address);

    await vault.connect(player2).placeBid(bid2);

    const player2AfterBid = await usdc20.balanceOf(player2.address);
    const player1Refunded = await usdc20.balanceOf(player1.address);
    const feeDestAfter = await usdc20.balanceOf(feeDestination.address);

    expect(player2AfterBid).to.be.lt(player2StartBalance);
    expect(player1Refunded).to.be.closeTo(player1StartBalance, ethers.parseUnits("2", 6)); // Refund
    expect(feeDestAfter).to.be.gt(feeDestStart); // Fee collected
  });

  it("Player1 bids and claims prize after 1 hour", async () => {

    const player1Before = await usdc20.balanceOf(player1.getAddress());
    const bid1 = await vault.getNextBidAmount();
    await usdc20.connect(player1).approve(await vault.getAddress(), bid1);
    await vault.connect(player1).placeBid(bid1);
    const player1PostBid = await usdc20.balanceOf(player1.getAddress());

    const vaultPrize = await vault.getPrizePool();

    // Fast-forward time
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    // Claim prize
    await vault.connect(player1).claim();
    const player1After = await usdc20.balanceOf(player1.getAddress());
    // console.log(`Before: ${player1Before}|| Post Bid: ${player1PostBid} || After: ${player1After} || `);

    expect(player1After).to.be.gt(player1Before);
    expect(player1After).to.be.equal(19899000000); //10K -102 + 10001
    expect(await vault.getPrizePool()).to.equal(0n);

  });

  it("Should not allow bid after claim is ready", async () => {
    const bid1 = await vault.getNextBidAmount();
    await usdc20.connect(player1).approve(await vault.getAddress(), bid1);
    await vault.connect(player1).placeBid(bid1);

    // Advance time past 1 hour
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    // Bid should revert now
    const bid2 = await vault.getNextBidAmount();
    await usdc20.connect(player2).approve(await vault.getAddress(), bid2);
    await expect(vault.connect(player2).placeBid(bid2)).to.be.revertedWith("Game is ready for claiming, no more bids allowed");
  });

  it("Should not allow anyone but highestBidder to claim", async () => {
    const bid1 = await vault.getNextBidAmount();
    await usdc20.connect(player1).approve(await vault.getAddress(), bid1);
    await vault.connect(player1).placeBid(bid1);

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    await expect(vault.connect(player2).claim()).to.be.revertedWith("Only highest bidder can claim");
  });

  it("Should not allow bid after claim", async () => {
    const player1Before = await usdc20.balanceOf(player1.getAddress())
      ;
    const bid1 = await vault.getNextBidAmount();
    await usdc20.connect(player1).approve(await vault.getAddress(),
      bid1);
    await vault.connect(player1).placeBid(bid1);

    // Fast-forward time
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    // Claim prize
    await vault.connect(player1).claim();
    const player1After = await usdc20.balanceOf(player1.getAddress());

    expect(player1After).to.be.gt(player1Before);
    expect(player1After).to.be.equal(19899000000);
    expect(await vault.getPrizePool()).to.equal(0n);


    // Bid should revert now
    const bid2 = await vault.getNextBidAmount();
    await usdc20.connect(player2).approve(await vault.getAddress(),
      bid2);
    await expect(vault.connect(player2).placeBid(bid2)).to.be.reverted
      ;
  });

});
