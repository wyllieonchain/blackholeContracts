const { ethers } = require("hardhat");

const main = async () => {
    // Contract addresses
    const USDC20_ADDRESS = "0x81b33EdFdA34D59Af7b8806712a6eB2EFeE508f4";
    const VAULT_ADDRESS = "0x2937CaC77030abF478bc991c942bb57bC8E6780D";  // Your newly deployed vault address
    
    // Get contract instances
    const usdc20 = await ethers.getContractAt("USDC20", USDC20_ADDRESS);
    const vault = await ethers.getContractAt("USDC20Vault", VAULT_ADDRESS);
    
    // Mint tokens first
    console.log("Minting USDC20...");
    await usdc20.mint(await (await ethers.getSigners())[0].getAddress(), ethers.parseEther("20000"));
    
    // Fund vault
    console.log("Approving USDC20...");
    await usdc20.approve(VAULT_ADDRESS, ethers.parseEther("10000"));
    
    console.log("Adding to prize pool...");
    await vault.addToPrizePool(ethers.parseEther("10000"));
    
    // Log results
    const [deployer] = await ethers.getSigners();
    console.log("Setup complete!");
    console.log("USDC20 Balance:", ethers.formatEther(await usdc20.balanceOf(deployer.address)));
    console.log("Vault Prize Pool:", ethers.formatEther(await vault.getPrizePool()));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 