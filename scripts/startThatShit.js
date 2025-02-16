const { utils, ContractFactory, formatEther, Contract } = require("ethers");

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS;

async function main(){

    const USDC20Vault_Contract = await ethers.getContractAt("USDC20Vault",VAULT_ADDRESS);
    const beforeStart = await USDC20Vault_Contract.init();
    await USDC20Vault_Contract.startGame();
    const postStart = await USDC20Vault_Contract.init();

    console.log(`BeforeStart: ${beforeStart} || AfterStart: ${postStart}`);
}

// npx hardhat run scripts/checkVault.js --network baseSepolia
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});