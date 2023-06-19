pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./VerifySignature.sol";

contract AirdropManager {
    VerifySignature public verifySignatureRef;
    address public owner;
    address public validatorAddress;
    uint public maxAirdropDuration;
    uint public claimDuration;
    uint[] public airdropsIds;

    mapping(uint => Airdrop) public airdrops;

    event AirdropCreated(
        uint _id,
        uint256 _startTime,
        uint256 _finishTime,
        address payable _tokenAddress,
        uint256 _tokenAmount,
        uint256 _maxTokensPerUser,
        address creator
    );

    event AirdropClosed (uint _id);

    event AirdropTokensAdded (uint _id, uint256 _tokenAmount);

    event AirdropPeriodChanged(
        uint _id,
        uint256 _startTime,
        uint256 _finishTime
    );

    event AirdropRewardsChanged(
        uint _id,
        uint256 _maxTokenPerUser
    );

    event AirdropTokensClaimed(
        uint _id,
        address _userAddress
    );

    constructor(VerifySignature _verifySignatureAddress) payable {
        verifySignatureRef = _verifySignatureAddress;
        owner = msg.sender;
        validatorAddress = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this method");
        _;
    }

    struct User {
        uint256 claimedAmount;
    }

    struct Airdrop {
        uint id;
        uint256 startTime;
        uint256 finishTime;
        IERC20 tokenAddress;
        uint256 tokenAmount;
        uint256 maxTokensPerUser;
        address creator;
        bool flag;
        mapping(address => User) users;
    }

    function setValidator(address _validatorAddress) public onlyOwner {
        validatorAddress = _validatorAddress;
    }

    function setAirdropSettings(uint _maxAirdropDuration, uint _claimDuration) public onlyOwner {
        maxAirdropDuration = _maxAirdropDuration;
        claimDuration = _claimDuration;
    }

    function createAirdrop(
        uint _id,
        uint256 _startTime,
        uint256 _finishTime,
        address payable _tokenAddress,
        uint256 _tokenAmount,
        uint256 _maxTokensPerUser
    ) public {
        require(!airdrops[_id].flag, "Airdrop with such id already exist");

        require(checkExceededDuration(_startTime, _finishTime), "exceeded maximum airdrop duration");

        IERC20 tokenAddress = IERC20(_tokenAddress);

        require(canCreateAirdropInPeriod(_startTime, _finishTime), "another airdrop already assigned on this period");

        require(_tokenAmount != 0, "token amount must be non 0 value");

        require(_maxTokensPerUser != 0, "max tokens per users must be non 0 value");

        require(tokenAddress.transferFrom(msg.sender, address(this), _tokenAmount), 'Can not transfer tokens');

        Airdrop storage airdrop = airdrops[_id];
        airdrop.id = _id;
        airdrop.startTime = _startTime;
        airdrop.finishTime = _finishTime;
        airdrop.tokenAddress = tokenAddress;
        airdrop.tokenAmount = _tokenAmount;
        airdrop.maxTokensPerUser = _maxTokensPerUser;
        airdrop.creator = msg.sender;
        airdrop.flag = true;
        airdropsIds.push(_id);

        emit AirdropCreated(_id, _startTime, _finishTime, _tokenAddress, _tokenAmount, _maxTokensPerUser, msg.sender);
    }

    function canCreateAirdropInPeriod (uint256 _startTime, uint256 _finishTime, uint ignoreId) public view returns (bool) {
        for (uint i = 0; i < airdropsIds.length; i++) {
            uint airdropId = airdropsIds[uint(i)];

            if (airdropId == ignoreId) {
                continue;
            }

            Airdrop storage airdrop = airdrops[airdropId];
            if (airdrop.flag) {
                if (
                    isDateBetween(_startTime, airdrop.startTime, airdrop.finishTime) ||
                    isDateBetween(_finishTime, airdrop.startTime, airdrop.finishTime)
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    function canCreateAirdropInPeriod (uint256 _startTime, uint256 _finishTime) public view returns (bool) {
        for (uint i = 0; i < airdropsIds.length; i++) {
            uint airdropId = airdropsIds[uint(i)];

            Airdrop storage airdrop = airdrops[airdropId];
            if (airdrop.flag) {
                if (
                    isDateBetween(_startTime, airdrop.startTime, airdrop.finishTime) ||
                    isDateBetween(_finishTime, airdrop.startTime, airdrop.finishTime)
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    function isDateBetween (uint256 checkDate, uint256 startDate, uint256 endDate) internal pure returns (bool) {
        return checkDate <= endDate && checkDate >= startDate;
    }

    function closeAirdrop(uint _id) public returns (bool) {
        Airdrop storage airdrop = airdrops[_id];

        require(airdrop.flag, "Airdrop doesn't found");

        require(!isDateBetween(block.timestamp * 1000, airdrop.startTime, airdrop.finishTime + claimDuration), "Cant close while during airdrop");

        require(airdrop.creator == msg.sender, "Only creator can close airdrop");

        require(airdrop.tokenAddress.transfer(msg.sender, airdrop.tokenAmount));

        delete airdrops[_id];

        emit AirdropClosed(_id);

        return true;
    }

    function getAirdropUser(uint _id) public view returns (User memory) {
        Airdrop storage airdrop = airdrops[_id];

        require(airdrop.flag, "Airdrop doesn't found");

        return airdrop.users[msg.sender];
    }

    function addAirdropToken(uint _id, uint256 _tokenAmount) public {
        Airdrop storage airdrop = airdrops[_id];

        require(airdrop.flag, "Airdrop doesn't found");

        require(airdrop.creator == msg.sender, "Only creator can add tokens to airdrop");

        require(_tokenAmount != 0, "token amount must be non 0 value");

        require(airdrop.tokenAddress.transferFrom(msg.sender, address(this), _tokenAmount));

        airdrops[_id].tokenAmount += _tokenAmount;

        emit AirdropTokensAdded(_id, _tokenAmount);
    }

    function updateAirdropTime(uint _id, uint256 _startTime, uint256 _finishTime) public {
        Airdrop storage airdrop = airdrops[_id];

        require(airdrop.flag, "Airdrop doesn't found");

        require(airdrop.creator == msg.sender, "Only creator can change airdrop time");

        require(checkExceededDuration(_startTime, _finishTime), "exceeded maximum airdrop duration");

        require(canCreateAirdropInPeriod(_startTime, _finishTime, _id), "another airdrop already assigned on this period");

        airdrops[_id].startTime = _startTime;
        airdrops[_id].finishTime = _finishTime;

        emit AirdropPeriodChanged(_id, _startTime, _finishTime);
    }

    function updateAirdropRewardSettings(uint _id, uint256 _maxTokenPerUser) public {
        Airdrop storage airdrop = airdrops[_id];

        require(airdrop.flag, "Airdrop doesn't found");

        require(airdrop.creator == msg.sender, "Only creator can change airdrop rewards");

        airdrops[_id].maxTokensPerUser = _maxTokenPerUser;

        emit AirdropRewardsChanged(_id, _maxTokenPerUser);
    }

    function claimToken(uint _id, uint256 _tokenAmount, bytes memory _signature) public {
        Airdrop storage airdrop = airdrops[_id];

        require(airdrop.flag, "Airdrop doesn't found");
        require(verifySignatureRef.verify(validatorAddress, _id, msg.sender, _tokenAmount, _signature), "Signature unverified");

        User storage user = airdrop.users[msg.sender];

        if (airdrop.users[msg.sender].claimedAmount != 0) {
            revert("Sender already claim tokens for this airdrop");
        } else {
            require(_tokenAmount <= airdrop.maxTokensPerUser, "Exceeded maximum token amount");
            airdrop.users[msg.sender] = User(_tokenAmount);
        }

        require(airdrop.tokenAddress.transfer(msg.sender, _tokenAmount));
        airdrops[_id].tokenAmount -= _tokenAmount;

        emit AirdropTokensClaimed(_id, msg.sender);
    }

    function checkExceededDuration(uint256 _startTime, uint256 _finishTime) internal returns (bool) {
        return (_finishTime - _startTime) / 1000 / 60 <= maxAirdropDuration;
    }
}