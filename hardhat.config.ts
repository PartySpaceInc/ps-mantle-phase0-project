import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv'

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    "mantle-testnet": {
      url: "https://rpc.testnet.mantle.xyz/",
      accounts: [`${process.env.PRIV_KEY}`] // Uses the private key from the .env file
    }
  }
};
export default config;
