import { ethers } from "hardhat";


async function main() {
    const initialSupply = 1000000;
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const Token = await ethers.getContractFactory("Token");

    const token = await Token.deploy(initialSupply);

    console.log("token contract address:", token.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
