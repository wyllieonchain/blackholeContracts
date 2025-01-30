import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-deploy";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    },
                },
            },
            {
                version: "0.8.28",
            }
        ],
    },
    networks: {
        hardhat: {
            // your hardhat network config
        },
        baseSepolia: {
            url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 84532
        },
        base: {
            url: "https://mainnet.base.org",
            accounts: [process.env.PRIVATE_KEY ?? ""],
        }
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};

export default config;