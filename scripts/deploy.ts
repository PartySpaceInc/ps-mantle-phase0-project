import { ethers } from "hardhat";


async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Airdrop = await ethers.getContractFactory("AirdropManager");
  const VerifySignature = await ethers.getContractFactory("VerifySignature");

  const verifySignature = await VerifySignature.deploy();
  await verifySignature.deployed();

  const airdrop = await Airdrop.deploy(verifySignature.address);

  await airdrop.setAirdropSettings(60, 10);

  console.log("verifySignature contract address:", verifySignature.address);
  console.log("airdrop contract address:", airdrop.address);
  console.log("airdrop contract block number:", airdrop.deployTransaction.blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
