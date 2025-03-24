import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";
import "hardhat-deploy";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20", // Force compilation with 0.8.28
        settings: {
            optimizer: {
                enabled: true, // Ensure optimization matches deployment
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            // Local Hardhat network
        },
        baseSepolia: {
            url: process.env.RPC_URL,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 84532,
        },
        base: {
            url: process.env.RPC_URL,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 8453,
        },
        sepolia: {
            url: process.env.RPC_URL,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 11155111,
        },
        mainnet: {
            url: process.env.RPC_URL,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 1,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY, // Ensure this is set in your .env file
    },
};

export default config;
