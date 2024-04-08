import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const OPTIMISM_SEPOLIA_RPC_URL = "https://sepolia.optimism.io"

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    optimism_sepolia: {
      url: OPTIMISM_SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`] // 使用你的私钥
    }
  },
};

export default config;
