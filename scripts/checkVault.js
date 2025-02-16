const { utils, ContractFactory, formatEther, Contract } = require("ethers");

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
const USDC_ADDRESS =process.env.NEXT_PUBLIC_USDC_ADDRESS;

async function main(){

    const USDC_Contract = await ethers.getContractAt("USDC20",USDC_ADDRESS);
    const balance = await USDC_Contract.balanceOf(VAULT_ADDRESS);

    console.log(`Vault Balance: ${balance}`);
}

// npx hardhat run scripts/checkVault.js --network baseSepolia
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});