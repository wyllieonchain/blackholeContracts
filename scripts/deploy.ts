const { ethers } = require("hardhat");
const { utils, ContractFactory, formatEther } = require("ethers");

const artifacts = {
    USDC20ARTIFACT: require("../artifacts/contracts/USDC20.sol/USDC20.json"),
    USDC20VAULTARTIFACT: require("../artifacts/contracts/USDC20Vault.sol/USDC20Vault.json")
}

/* async function main() {
    const [deployer, player1, player2] = await ethers.getSigners()

    // Deploy USDC20 first
    const USDC20 = new ContractFactory(artifacts.USDC20ARTIFACT.abi, artifacts.USDC20ARTIFACT.bytecode, deployer);
    const usdc20 = await USDC20.deploy();
    await usdc20.waitForDeployment();
    console.log("USDC20 deployed to:", await usdc20.getAddress());

    // Deploy Vault with USDC20 address
    const Vault = new ContractFactory(artifacts.USDC20VAULTARTIFACT.abi, artifacts.USDC20VAULTARTIFACT.bytecode, deployer);
    const vault = await Vault.deploy(await usdc20.getAddress());
    await vault.waitForDeployment();
    console.log("Vault deployed to:", await vault.getAddress());


    // 3. Mint initial USDC20 tokens for deployer (enough for prize pool and players)
    await usdc20.mint(deployer.address, ethers.parseEther("12000")) // 10000 for prize + 2000 for players

    // Verify deployer balance
    console.log("Deployer USDC20 balance:", (formatEther(await usdc20.balanceOf(deployer.address))).toString())

    // 4. Send USDC20 to players
    await usdc20.transfer(player1.address, ethers.parseEther("1000"))
    await usdc20.transfer(player2.address, ethers.parseEther("1000"))

    // Check player balances
    console.log("Player 1 balance:", (formatEther(await usdc20.balanceOf(player1.address))).toString());
    console.log("Player 2 balance:", (formatEther(await usdc20.balanceOf(player2.address))).toString());

    // 5. Add initial prize pool (10000 USDC20)
    await usdc20.approve(await vault.getAddress(), ethers.parseEther("10000"))
    await vault.addToPrizePool(ethers.parseEther("10000"))
    console.log("Initial Prize Pool:", (formatEther(await vault.getPrizePool())).toString())

    // 6. First Bid (Player 1)x
    const nextBid = await vault.getNextBidAmount()
    console.log("Required first bid amount:", formatEther(nextBid))

    await usdc20.connect(player1).approve(await vault.getAddress(), nextBid)
    await vault.connect(player1).placeBid()

    console.log("Highest Bidder:", await vault.highestBidder())
    console.log("Current Base Amount:", (formatEther(await vault.currentBaseAmount())).toString())
    console.log("Prize Pool after first bid:", (formatEther(await vault.getPrizePool())).toString())

    // 7. Second Bid (Player 2)
    const nextBid2 = await vault.getNextBidAmount()
    console.log("Required second bid amount:", formatEther(nextBid2))

    await usdc20.connect(player2).approve(await vault.getAddress(), nextBid2)
    await vault.connect(player2).placeBid()

    console.log("New Highest Bidder:", await vault.highestBidder())
    console.log("New Prize Pool:", (formatEther(await vault.getPrizePool())).toString())

    // 7. Third Bid (Player 1)
    const nextBid3 = await vault.getNextBidAmount()
    console.log("Required third bid amount:", formatEther(nextBid3))

    await usdc20.connect(player1).approve(await vault.getAddress(), nextBid3)
    await vault.connect(player1).placeBid()

    console.log("New Highest Bidder:", await vault.highestBidder())
    console.log("New Prize Pool:", (formatEther(await vault.getPrizePool())).toString())

    // 8. Test Winning
    console.log("Can claim before time:", await vault.canClaim())

    // Advance time by 61 seconds
    await ethers.provider.send("evm_increaseTime", [61])
    await ethers.provider.send("evm_mine")

    console.log("Can claim after time:", await vault.canClaim())

    // Claim prize as winner (player2)
    await vault.connect(player1).claim()

    // Check final balances
    console.log("Loser (Player 1) final balance:", (formatEther(await usdc20.balanceOf(player1.address))).toString())
    console.log("Winner (Player 2) final balance:", (formatEther(await usdc20.balanceOf(player2.address))).toString())
    console.log("Owner final balance:", (formatEther(await usdc20.balanceOf(deployer.address))).toString())
} */
const main = async () => {
    // Use existing USDC20 address
    const USDC20_ADDRESS = "0x81b33EdFdA34D59Af7b8806712a6eB2EFeE508f4";
    
    // Deploy only the Vault
    const Vault = await ethers.getContractFactory("USDC20Vault");
    const vault = await Vault.deploy(USDC20_ADDRESS);
    await vault.waitForDeployment();
    console.log("New Vault deployed to:", await vault.getAddress());
}

// npx hardhat run scripts/deploy.ts
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 