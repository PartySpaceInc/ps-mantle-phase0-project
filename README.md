# **Mantle blockchain T**reasure Hunt **Airdrops**  ::  smart contracts

This repository contains the source code for a **smart contract** designed for the **Mantle blockchain**. This smart contract facilitates the **creation of airdrops in the form of a treasure hunt** activity within a metaverse platform called Party Space.

## **Description**

The smart contract allows any airdrop organizer to create an engaging **play-to-get** airdrop of ERC-20 tokens, using a dedicated web page: https://enter.party.space/mantle-treasure-hunt/airdrop

During the creation process, the organizer can specify the token that will be distributed to users, the total quantity of tokens, and the maximum limit of tokens per user, etc.
The organizer can also set the timeframe for when the airdrop will begin and end.

<img width="871" alt="Screenshot 2023-05-25 at 16 28 58" src="https://github.com/PartySpaceInc/mantlesc/assets/4603588/2ffb8db4-8e06-4d15-96f3-572090fa3970">

When the designated time arrives, the airdrop begins in a specific virtual space in the form of a treasure hunt activity. This is open to all guests who are present in the virtual space at that time. 

A device is activated for these guests enabling them to see hidden coins that may appear at any point in this space. A timer begins to count down the remaining time until the end of the treasure hunt activity. The more coins a guest finds and collects, the more tokens they can receive after the treasure hunt concludes.

https://github.com/PartySpaceInc/mantlesc/assets/4603588/ed880032-d256-49eb-adca-7580893a53d9

Once the timer runs out, all remaining coins disappear and a window with **Claim tokens** button appears. To receive the tokens, guests must click this button and submit a transaction to the smart contract. Please note, that guest need to have some BIT tokens on his wallet to pay for gas. 


## **Usage**

This repository is designed for developers who wish to explore or expand upon this smart contract for airdrops on the Mantle blockchain. Developers should be familiar with smart contract development and the specific characteristics of the Mantle blockchain.


Run test for aidrop contract:

```shell
npm run test
```

Deploy contract to mantle network:

```shell
npm run deploy:mantle
```

## Contracts

### Airdrop Contract

Contract for creating and managing airdrops
```solidity
// Set the validator(signer) public address
function setValidator(address _validatorAddress) onlyOwner;

// Sets the duration of the airdrop and the duration for claiming rewards
function setAirdropSettings(uint _maxAirdropDuration, uint _claimDuration) onlyOwner;

// Creates an airdrop with the specified details
// startTime - timestamp at which the airdrop will begin
// finishTime - timestamp at which the airdrop will be completed
// tokenAddress - address of the ERC20 token being airdropped
// tokenAmount - number of tokens being airdropped
// maxTokenPerUser - max number of tokens per user
function createAirdrop(
    uint _id,
    uint256 _startTime,
    uint256 _finishTime,
    address payable _tokenAddress,
    uint256 _tokenAmount,
    uint256 _maxTokensPerUser
);

// Close the specified airdrop
function closeAirdrop(uint _id);

// Requests the specified amount of tokens and adds them to the specified airdrop
function addAirdropToken(uint _id, uint256 _tokenAmount);

// Update specified airdrop begin and complete time
// startTime - timestamp at which the airdrop will begin
// finishTime - timestamp at which the airdrop will be completed
function updateAirdropTime(uint _id, uint256 _startTime, uint256 _finishTime);


// Update specified airdrop maxTokenPerUser value
function updateAirdropRewardSettings(uint _id, uint256 _maxTokenPerUser);


// Claim tokens from specified airdrop to caller using VerifySignature contract
function claimToken(uint _id, uint256 _tokenAmount, bytes memory _signature);

// Get caller data from specified airdrop
function getAirdropUser(uint _id);
```

### VerifySignature Contract

Contract which implements crypto signature verification

```solidity
// Create hash using keccak encryption
function getMessageHash(
    uint _airdropId,
    address _userAddress,
    uint _tokenAmount
);

// Add to hash eth prefix;
function getEthSignedMessageHash(bytes32 _messageHash);

// Split signature to data which need to recover signer
function splitSignature(bytes memory _signature);

// Recover signer using ecrecover and splitSignature method data;
function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature);

// Verify signature using methods above
function verify(
    address _signer,
    uint _airdropId,
    address _userAddress,
    uint _tokenAmount,
    bytes memory _signature
);
```



## **License**

This project is licensed under the MIT License.

**Disclaimer:** This smart contract is provided as is, without warranty of any kind. Use at your own risk.
