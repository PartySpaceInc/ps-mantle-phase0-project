pragma solidity ^0.8.17;
import "hardhat/console.sol";

contract VerifySignature {
    function getMessageHash(
        uint _airdropId,
        address _userAddress,
        uint _tokenAmount
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_airdropId, _userAddress, _tokenAmount));
    }

    function getEthSignedMessageHash(bytes32 _messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function verify(
        address _signer,
        uint _airdropId,
        address _userAddress,
        uint _tokenAmount,
        bytes memory _signature
    ) public view returns (bool) {
        bytes32 messageHash = getMessageHash(_airdropId, _userAddress, _tokenAmount);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, _signature) == _signer;
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory _signature) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "invalid signature length");

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
    }
}