const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe("Airdrop contract", function () {
    const tokenFixture = async () => {
        const initialSupply = 1000000;
        const Token = await ethers.getContractFactory("Token");
        const token = await Token.deploy(initialSupply);

        await token.deployed();

        return { token }
    }
    const deployFixture = async () => {
        const { token } = await loadFixture(tokenFixture);

        const VerifySignature = await ethers.getContractFactory("VerifySignature");

        const AirdropManager = await ethers.getContractFactory("AirdropManager");
        const signers = await ethers.getSigners();

        const verifySignature = await VerifySignature.deploy();
        const airdropManager =  await AirdropManager.deploy(verifySignature.address);

        await setDefaultSettings(airdropManager);

        await airdropManager.deployed();

        const signMessage = async (airdropId: number, userAddress: string, tokenAmount: number) => {
            const [signer] = signers;

            const hash = await verifySignature.getMessageHash(airdropId, userAddress, tokenAmount);
            return await signer.signMessage(ethers.utils.arrayify(hash));
        }

        return { airdropManager, signMessage, signers, token };
    }

    const setDefaultSettings = async (airdropManager: any) => {
        await airdropManager.setAirdropSettings(60, 10);
    }

    const createDefaultAirdrop = async (airdropManager: any, token: any) => {
        const id = 1;
        const startTime = Date.now()
        const finishTime = Date.now() + 1000 * 60 * 60;
        // AZM token address
        const tokenAddress = token.address;
        const tokenAmount = 10;
        const maxTokensPerUser = 2;

        await token.approve(airdropManager.address, tokenAmount);
        await airdropManager.createAirdrop(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser);

        return await airdropManager.airdrops(id);
    }


    it("Deployment should assign validator address", async function () {
        const { airdropManager } = await loadFixture(deployFixture)

        const validatorAddress = await airdropManager.validatorAddress();

        expect(validatorAddress).to.exist;
    });

    it("Should create Airdrop", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        expect((await airdropManager.airdrops(airdrop.id)).flag).to.equal(true);
    });


    it("Should emit AirdropCreated event", async function () {
        const { airdropManager, token, signers } = await loadFixture(deployFixture)

        await airdropManager
        const id = 1;
        const startTime = Date.now()
        const finishTime = Date.now() + 1000 * 60 * 60;
        // AZM token address
        const tokenAddress = token.address;
        const tokenAmount = 10;
        const maxTokensPerUser = 2;

        await token.approve(airdropManager.address, tokenAmount);
        const tx = await airdropManager.createAirdrop(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser);

        expect(tx).to.emit('AirdropCreated').withArgs(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser, signers[0]);
    });

    it("Should change airdrops settings", async function () {
        const { airdropManager } = await loadFixture(deployFixture)

        const maxDuration = 30;
        const claimDuration = 5;

        await airdropManager.setAirdropSettings(maxDuration, claimDuration);

        expect((await airdropManager.maxAirdropDuration()).toNumber()).to.equal(maxDuration);
        expect((await airdropManager.claimDuration()).toNumber()).to.equal(claimDuration);
    });

    it("Should throw 'Only owner can call this method' error", async function () {
        const { airdropManager, signers } = await loadFixture(deployFixture)

        const maxDuration = 30;
        const claimDuration = 5;

        const result = airdropManager.connect(signers[1]).setAirdropSettings(maxDuration, claimDuration);

        expect(result).to.revertedWith('Only owner can call this method')
    });

    it("Should add tokens to Airdrop", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const tokenAmount = 100;
        await token.approve(airdropManager.address, tokenAmount);
        await airdropManager.addAirdropToken(airdrop.id, tokenAmount);

        expect((await airdropManager.airdrops(airdrop.id)).tokenAmount.toNumber())
            .to.equal(airdrop.tokenAmount.toNumber() + tokenAmount);
    });

    it("Should throw 'Only creator can add tokens to airdrop' error", async function () {
        const { airdropManager, token, signers } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const tokenAmount = 100;

        const result = airdropManager.connect(signers[1]).addAirdropToken(airdrop.id, tokenAmount);

        expect(result).to.revertedWith('Only creator can add tokens to airdrop')
        expect((await airdropManager.airdrops(airdrop.id)).tokenAmount.toNumber())
            .to.equal(airdrop.tokenAmount.toNumber());
    });

    it("Should change airdrop reward settings", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const maxTokensPerUser = 5;

        await airdropManager.updateAirdropRewardSettings(airdrop.id, maxTokensPerUser);

        const updatedAirdrop = await airdropManager.airdrops(airdrop.id);
        expect(updatedAirdrop.maxTokensPerUser.toNumber()).to.equal(maxTokensPerUser);
    });

    it("Should throw 'Only creator can change airdrop rewards' error", async function () {
        const { airdropManager, signers, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const maxTokensPerUser = 5;

        const result = airdropManager.connect(signers[1]).updateAirdropRewardSettings(airdrop.id, maxTokensPerUser);
        const updatedAirdrop = await airdropManager.airdrops(airdrop.id);

        expect(result).to.revertedWith('Only creator can change airdrop rewards')
        expect(updatedAirdrop.maxTokensPerUser.toNumber()).to.equal(airdrop.maxTokensPerUser.toNumber());
    });

    it("Should update airdrop time", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const startTime = Date.now() + 1000 * 60 * 30;
        const finishTime = Date.now() + 1000 * 60 * 30 * 2;

        await airdropManager.updateAirdropTime(airdrop.id, startTime, finishTime);

        const updatedAirdrop = await airdropManager.airdrops(airdrop.id);

        expect(updatedAirdrop.startTime.toNumber()).to.equal(startTime);
        expect(updatedAirdrop.finishTime.toNumber()).to.equal(finishTime);
    });


    it("Should throw 'Only creator can change airdrop time' error", async function () {
        const { airdropManager, signers, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const startTime = Date.now() + 1000 * 60 * 30;
        const finishTime = Date.now() + 1000 * 60 * 30 * 2;

        const updatedAirdrop = await airdropManager.airdrops(airdrop.id);
        const result = airdropManager.connect(signers[1]).updateAirdropTime(airdrop.id, startTime, finishTime);

        expect(result).to.revertedWith('Only creator can change airdrop time');
        expect(updatedAirdrop.startTime.toNumber()).to.equal(airdrop.startTime.toNumber());
        expect(updatedAirdrop.finishTime.toNumber()).to.equal(airdrop.finishTime.toNumber());
    });

    it("Should throw 'exceeded maximum airdrop duration' error while calling updateAirdropTime method", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const startTime = Date.now() + 1000 * 60 * 30;
        const finishTime = Date.now() + 1000 * 60 * 30 * 5;

        const updatedAirdrop = await airdropManager.airdrops(airdrop.id);
        const result = airdropManager.updateAirdropTime(airdrop.id, startTime, finishTime);

        expect(result).to.revertedWith('exceeded maximum airdrop duration')
        expect(updatedAirdrop.startTime.toNumber()).to.equal(airdrop.startTime.toNumber());
        expect(updatedAirdrop.finishTime.toNumber()).to.equal(airdrop.finishTime.toNumber());
    });

    it("Should throw 'another airdrop already assigned on this period' error while calling updateAirdropTime method", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const id = 2;
        const startTime = Date.now() + 1000 * 60 * 60 * 2;
        const finishTime = Date.now() + 1000 * 60 * 60 * 3;
        const tokenAddress = token.address;
        const tokenAmount = 10;
        const maxTokensPerUser = 2;

        await token.approve(airdropManager.address, tokenAmount);
        await airdropManager.createAirdrop(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser);

        const updatedAirdrop = await airdropManager.airdrops(airdrop.id);
        const result = airdropManager.updateAirdropTime(airdrop.id, startTime, finishTime);

        expect(result).to.revertedWith('another airdrop already assigned on this period')
        expect(updatedAirdrop.startTime.toNumber()).to.equal(airdrop.startTime.toNumber());
        expect(updatedAirdrop.finishTime.toNumber()).to.equal(airdrop.finishTime.toNumber());
    });

    it("Should throw 'exceeded maximum airdrop duration' while creating airdrop", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const id = 1;
        const startTime = Date.now()
        const finishTime = Date.now() + 1000 * 60 * 60 * 2;
        // AZM token address
        const tokenAddress = token.address;
        const tokenAmount = 10;
        const maxTokensPerUser = 2;

        const result = airdropManager.createAirdrop(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser);

        expect(result).to.revertedWith('exceeded maximum airdrop duration')
        expect((await airdropManager.airdrops(id)).flag).to.equal(false);
    });

    it("Should throw 'another airdrop already assigned on this period' while creating airdrop", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        await createDefaultAirdrop(airdropManager, token);

        const id = 2;
        const startTime = Date.now() + 1000 * 60 * 30;
        const finishTime = Date.now() + 1000 * 60 * 30 * 2;
        // AZM token address
        const tokenAddress = token.address;
        const tokenAmount = 10;
        const maxTokensPerUser = 2;

        await token.approve(airdropManager.address, tokenAmount);

        const result = airdropManager.createAirdrop(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser);

        expect(result).to.revertedWith('another airdrop already assigned on this period')
        expect((await airdropManager.airdrops(id)).flag).to.equal(false);
    });

    it("Should close Airdrop", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const id = 1;
        const startTime = Date.now() + 1000 * 60 * 30;
        const finishTime = Date.now() + 1000 * 60 * 60;
        // AZM token address
        const tokenAddress = token.address;
        const tokenAmount = 10;
        const maxTokensPerUser = 2;

        await token.approve(airdropManager.address, tokenAmount);
        await airdropManager.createAirdrop(id, startTime, finishTime, tokenAddress, tokenAmount, maxTokensPerUser);

        const airdrop =  await airdropManager.airdrops(id);

        await airdropManager.closeAirdrop(airdrop.id)

        expect((await airdropManager.airdrops(airdrop.id)).flag).to.equal(false);
    });

    it("Should throw 'Cant close while during airdrop' error", async function () {
        const { airdropManager, token } = await loadFixture(deployFixture)

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const result = airdropManager.closeAirdrop(airdrop.id);

        expect(result).to.revertedWith('Cant close while during airdrop')
        expect((await airdropManager.airdrops(airdrop.id)).flag).to.equal(true);
    });

    it("Should claim tokens", async function () {
        const { airdropManager, signMessage, signers, token } = await loadFixture(deployFixture)

        const tokenAmount = 1;
        const [owner, adr1] = signers

        await setDefaultSettings(airdropManager);

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const adr1Connection = await airdropManager.connect(adr1);

        const signature = signMessage(airdrop.id, adr1.address, tokenAmount);

        await adr1Connection.claimToken(airdrop.id, tokenAmount, signature);

        expect(await token.balanceOf(adr1.address)).to.equal(tokenAmount);
    });

    it("Should throw 'Sender already claim tokens for this airdrop", async function () {
        const { airdropManager, signMessage, signers, token } = await loadFixture(deployFixture)

        const tokenAmount = 1;
        const [owner, adr1] = signers

        await setDefaultSettings(airdropManager);

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const adr1Connection = await airdropManager.connect(adr1);

        const signature = signMessage(airdrop.id, adr1.address, tokenAmount);

        await adr1Connection.claimToken(airdrop.id, tokenAmount, signature);

        const result = adr1Connection.claimToken(airdrop.id, tokenAmount, signature);

        expect(result).to.revertedWith('Sender already claim tokens for this airdrop');
        expect(await token.balanceOf(adr1.address)).to.equal(tokenAmount);
    });

    it("Should throw 'Signature unverified' error", async function () {
        const { airdropManager, signMessage, signers, token } = await loadFixture(deployFixture)

        const tokenAmount = 1;
        const [owner, adr1] = signers

        await setDefaultSettings(airdropManager);

        const airdrop = await createDefaultAirdrop(airdropManager, token);

        const adr1Connection = await airdropManager.connect(adr1);

        const signature = signMessage(airdrop.id, adr1.address, tokenAmount + 1);

        const result = adr1Connection.claimToken(airdrop.id, tokenAmount, signature);

        expect(result).to.revertedWith('Signature unverified')
        expect(await token.balanceOf(adr1.address)).to.equal(0);
    });
});