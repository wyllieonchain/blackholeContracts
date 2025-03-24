const { utils, ContractFactory, formatEther } = require("ethers");

const artifacts = {
    USDC20ARTIFACT: require("../artifacts/contracts/USDC20.sol/USDC20.json"),
    USDC20VAULTARTIFACT: require("../artifacts/contracts/USDC20Vault.sol/USDC20Vault.json")
}

async function main() {

    const [deployer] = await ethers.getSigners();

    const USDC20 = new ContractFactory(artifacts.USDC20ARTIFACT.abi, artifacts.USDC20ARTIFACT.bytecode, deployer);
    const usdc20 = await USDC20.deploy();
    await usdc20.waitForDeployment();
    console.log(`NEXT_PUBLIC_USDC_ADDRESS=${await usdc20.getAddress()}`);
    
    // Deploy only the Vault
    const Vault = await ethers.getContractFactory("USDC20Vault");
    const vault = await Vault.deploy(usdc20.getAddress(), deployer.getAddress());
    await vault.waitForDeployment();
    console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${await vault.getAddress()}`);

    // Mint usdc to wallet
    await usdc20.connect(deployer).mint(process.env.PUBLIC_KEY, ethers.parseUnits("20000", 6));
    await usdc20.connect(deployer).mint("0x5082032D270FfCF27A9F12f4875d3dd1b639AFAE", ethers.parseUnits("20000", 6));
    // Fund vault
    console.log("Approving USDC20...");
    await usdc20.connect(deployer).approve(await vault.getAddress(), ethers.parseUnits("10000", 6));
    
    console.log("Adding to prize pool...");
    await vault.connect(deployer).addToPrizePool(ethers.parseUnits("10000", 6), {
        gasLimit: ethers.parseUnits("2000000", 0) // Set gas limit to 2,000,000
    });
    
}

// npx hardhat run scripts/deploy.js --network baseSepolia
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 