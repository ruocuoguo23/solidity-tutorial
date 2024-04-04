// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract RaffleScore is Ownable {
    // The number of decimal places the score is stored with.
    uint256 public constant SCORE_DECIMALS = 4;

    // Define the event
    event ScoreStored(uint256 indexed clientId, uint256 indexed dateWithSequence, uint256 score);

    // Nested mapping to optimize the query. The first level mapping is from clientId to another mapping,
    // and the second level mapping is from date string to the score.
    mapping(uint256 => mapping(string => uint256)) private clientDateScores;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Function to store the score, callable only by the contract owner.
    // The score is expected to be the actual value multiplied by 10^SCORE_DECIMALS.
    function storeScore(uint256 clientId, uint32 date, uint32 sequence, uint256 score) external onlyOwner {
        require(score > 0, "Score must be greater than 0");
        require(date > 0, "Date must be greater than 0");
        require(sequence > 0, "Sequence must be greater than 0");

        // Concatenate date and sequence to form the key for the mapping
        string memory dateKey = _concatenateDateAndSequence(date, sequence);

        // Check if the clientId & dateKey combination already exists
        if (clientDateScores[clientId][dateKey] == 0) {
            // Directly store the dateKey and score in the mapping, avoiding the use of arrays.
            clientDateScores[clientId][dateKey] = score;

            // Emit the event with combined date and sequence as indexed
            uint256 dateWithSequence = _combineDateAndSequence(date, sequence);
            emit ScoreStored(clientId, dateWithSequence, score);
        }
        // If the clientId & dateKey combination already exists, do not overwrite and do not emit the event.
    }

    // Function to store scores for multiple client ids, callable only by the contract owner.
    // Each score is expected to be the actual value multiplied by 10^SCORE_DECIMALS.
    function storeMultipleScores(uint32 date, uint32 sequence, uint256[] calldata clientIds, uint256[] calldata scores) external onlyOwner {
        require(clientIds.length == scores.length, "ClientIds and scores length mismatch");
        require(date > 0, "Date must be greater than 0");
        require(sequence > 0, "Sequence must be greater than 0");

        string memory dateKey = _concatenateDateAndSequence(date, sequence);
        uint256 dateWithSequence = _combineDateAndSequence(date, sequence);

        for (uint256 i = 0; i < clientIds.length; i++) {
            require(scores[i] > 0, "Score must be greater than 0");

            // Check if the clientId & dateKey combination already exists
            if (clientDateScores[clientIds[i]][dateKey] == 0) {
                // Directly store the dateKey and score in the mapping, avoiding the use of arrays.
                clientDateScores[clientIds[i]][dateKey] = scores[i];

                // Emit the event for each score stored
                emit ScoreStored(clientIds[i], dateWithSequence, scores[i]);
            }
            // If the clientId & dateKey combination already exists, do not overwrite and do not emit the event.
        }
    }

    // Function to query the score based on client identifier and date.
    // Returns the score as an integer representing the actual value multiplied by 10^SCORE_DECIMALS.
    function getScore(uint256 clientId, string calldata date) external view returns (uint256) {
        uint256 score = clientDateScores[clientId][date];
        require(score != 0, "Score does not exist");

        return score;
    }

    // Formats the score and returns the actual value as a string
    function getFormattedScore(uint256 clientId, string calldata date) external view returns (string memory) {
        uint256 score = clientDateScores[clientId][date];
        require(score != 0, "Score does not exist");

        uint256 integerPart = score / (10**SCORE_DECIMALS);
        uint256 decimalPart = score % (10**SCORE_DECIMALS);

        string memory integerPartAsString = Strings.toString(integerPart);
        string memory decimalPartAsString = _toStringWithLeadingZeros(decimalPart, SCORE_DECIMALS);

        return string(abi.encodePacked(integerPartAsString, ".", decimalPartAsString));
    }

    // Helper function to convert the decimal part into a string with leading zeros
    function _toStringWithLeadingZeros(uint256 value, uint256 decimals) internal pure returns (string memory) {
        bytes memory buffer = new bytes(decimals);
        for (uint256 i = decimals; i > 0; i--) {
            buffer[i - 1] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    // Helper function to concatenate date and sequence to form a string key
    function _concatenateDateAndSequence(uint32 date, uint32 sequence) internal pure returns (string memory) {
        return string(abi.encodePacked(Strings.toString(date), "_", Strings.toString(sequence)));
    }

    // Combines a date and a sequence into a single uint256 value.
    // The date is placed in the high 128 bits and the sequence in the low 128 bits.
    function _combineDateAndSequence(uint32 date, uint32 sequence) internal pure returns (uint256) {
        return (uint256(date) << 128) | uint256(sequence);
    }
}
