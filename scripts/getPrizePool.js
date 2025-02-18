const { utils, ContractFactory, formatEther, Contract } = require("ethers");

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS;

async function main(){

    const USDC20Vault_Contract = await ethers.getContractAt("USDC20Vault",VAULT_ADDRESS);
    const prizePool = await USDC20Vault_Contract.getPrizePool();

    console.log(`PrizePool: ${prizePool}`);
}

// npx hardhat run scripts/getPrizePool.js --network baseSepolia
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});