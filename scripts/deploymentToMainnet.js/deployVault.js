const { ethers } = require("hardhat");

const artifacts = {
    USDCABI: require("../../artifacts/contracts/USDC20.sol/USDC20.json"),
    USDC20VAULTARTIFACT: require("../../artifacts/contracts/USDC20Vault.sol/USDC20Vault.json"),
};

// USDC Address (Ethereum Mainnet USDC)
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MULTISIG_ADDRESS = ""; // Must be set before deployment

// TEST THIS DEPLOYMENT WITH 1USDC FIRST

async function main() {
    if (!MULTISIG_ADDRESS) {
        throw new Error("MULTISIG_ADDRESS is required. Set it before running the script.");
    }

    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with address: ${deployer.address}`);

    // Deploy the Vault
    console.log("Deploying USDC20Vault...");
    const Vault = await ethers.getContractFactory("USDC20Vault");
    const vault = await Vault.deploy(USDC_ADDRESS, MULTISIG_ADDRESS);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${vaultAddress}`);

    // Instantiate the USDC contract
    const usdc = new ethers.Contract(USDC_ADDRESS, artifacts.USDCABI.abi, deployer);

    // Approve USDC transfer to Vault
    console.log("Approving USDC transfer...");
    const approveTx = await usdc.approve(vaultAddress, ethers.parseUnits("1", 6));
    await approveTx.wait();
    console.log("USDC approved.");

    // Add funds to prize pool
    console.log("Adding to prize pool...");
    const addTx = await vault.addToPrizePool(ethers.parseUnits("1", 6), {
        gasLimit: 2000000, // Set gas limit to 2,000,000
    });
    await addTx.wait();

    const prizePool = await vault.getPrizePool();
    console.log(`Prize pool funded successfully with : ${prizePool}.`);
}

// Run script
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
