import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import { describe, it, beforeEach } from 'mocha';
import { RaffleScore } from "../typechain-types";

describe("RaffleScore", function () {
    let raffleScore: RaffleScore;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addrs: SignerWithAddress[];

    async function deployPhemexRaffleScoreFixture() {
        [owner, addr1, ...addrs] = await ethers.getSigners();
        const raffleScoreFactory = await ethers.getContractFactory("RaffleScore");
        raffleScore = await raffleScoreFactory.deploy(owner.address);

        console.log("Contract owner address:", owner.address);
    }

    beforeEach(async function () {
        await loadFixture(deployPhemexRaffleScoreFixture);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await raffleScore.owner()).to.equal(owner.address);
        });
    });

    describe("Storing and Retrieving Scores", function () {
        it("Should allow the owner to store a score", async function () {
            await raffleScore.connect(owner).storeScore(1, 20240327, 1, 123450000);
            expect(await raffleScore.getScore(1, "20240327_1")).to.equal(123450000);
        });

        it("Should emit ScoreStored event when storeScore is called", async function () {
            const clientId = 1;
            const date = 20240327;
            const sequence = 3;
            // Combine date and sequence into a single uint256 with date in the high 128 bits and sequence in the low 128 bits
            const dateWithSequence = (BigInt(date) << 128n) | BigInt(sequence);
            const score = 10000; // Example score with SCORE_DECIMALS = 4

            console.log(`Storing score for client ${clientId} on ${dateWithSequence} with score ${score}`);

            await expect(raffleScore.storeScore(clientId, date, sequence, score))
                .to.emit(raffleScore, "ScoreStored")
                .withArgs(clientId, dateWithSequence, score);
        });

        it("Should not overwrite an existing score", async function () {
            const clientId = 1;
            const date = 20240328;
            const sequence = 1;
            const score = 10000; // Score with decimal places
            const score2 = 20000;

            await raffleScore.storeScore(clientId, date, sequence, score);

            await expect(raffleScore.storeScore(clientId, date, sequence, score2)).to.not.emit(raffleScore, "ScoreStored");

            const storedScore = await raffleScore.getScore(clientId, `${date}_${sequence}`);
            expect(storedScore).to.equal(score);
        });

        it("Should allow the owner to store multiple scores", async function () {
            const clientIds = [1, 2, 3];
            const scores = [123450000, 234560000, 345670000];

            await raffleScore.connect(owner).storeMultipleScores(20240327, 1, clientIds, scores);
            for (let i = 0; i < clientIds.length; i++) {
                const score = await raffleScore.getScore(clientIds[i], "20240327_1");
                console.log(`Client ${clientIds[i]} has a score of ${score}`);
                expect(score).to.equal(scores[i]);
            }
        });

        it("Should emit multiple ScoreStored events when storeMultipleScores is called", async function () {
            const date = 20240327;
            const sequence = 2;
            // Combine date and sequence into a single uint256 with date in the high 128 bits and sequence in the low 128 bits
            const dateWithSequence = (BigInt(date) << 128n) | BigInt(sequence);
            const clientIds = [1, 2];
            const scores = [10000, 20000]; // Example scores with SCORE_DECIMALS = 4

            const tx = await raffleScore.storeMultipleScores(date, sequence, clientIds, scores);
            const receipt = await tx.wait();

            // Check that all ScoreStored events have been emitted
            // @ts-ignore
            const events = receipt.logs;
            expect(events.length).to.equal(clientIds.length);

            for (let i = 0; i < clientIds.length; i++) {
                // @ts-ignore
                expect(events[i].args.clientId).to.equal(clientIds[i]);
                // @ts-ignore
                expect(events[i].args.dateWithSequence).to.equal(dateWithSequence);
                // @ts-ignore
                expect(events[i].args.score).to.equal(scores[i]);
            }
        });

        it("Should not overwrite existing scores and not emit events for them", async function () {
            const date = 20240328;
            const sequence = 1;
            const clientIds = [1, 2];
            const scores1 = 5000;
            const scores = [10000, 20000]; // Scores with decimal places

            // Store the first score
            await raffleScore.storeScore(clientIds[0], date, sequence, scores1);

            const tx = await raffleScore.storeMultipleScores(date, sequence, clientIds, scores);
            const receipt = await tx.wait();

            // Check that all ScoreStored events have been emitted
            // @ts-ignore
            const events = receipt?.logs;

            // @ts-ignore
            expect(events.length).to.equal(1);

            // @ts-ignore
            expect(events[0].args.clientId).to.equal(clientIds[1]);
            // @ts-ignore
            expect(events[0].args.dateWithSequence).to.equal((BigInt(date) << 128n) | BigInt(sequence));
            // @ts-ignore
            expect(events[0].args.score).to.equal(scores[1]);

            const storedScore1 = await raffleScore.getScore(clientIds[0], `${date}_${sequence}`);
            const storedScore2 = await raffleScore.getScore(clientIds[1], `${date}_${sequence}`);
            expect(storedScore1).to.equal(scores1);
            expect(storedScore2).to.equal(scores[1]);
        });

        it("Should not allow non-owner to store a score", async function () {
            // await expect(raffleScore.connect(addr1).storeScore(1, 20240327, 1, 123450000)).to.be.revertedWith("Ownable: caller is not the owner");
            try {
                // 尝试执行一个只有所有者才能执行的操作
                await raffleScore.connect(addr1).storeScore(1, 20240327, 1, 123450000);
                // 如果没有错误抛出，强制测试失败
                expect.fail("Expected an error but did not get one");
            } catch (error) {
                // 捕获错误并打印错误信息
                console.error(error);
                // @ts-ignore
                expect(error.message).to.include("OwnableUnauthorizedAccount");
            }
        });

        it("Should not store a score of zero", async function () {
            await expect(raffleScore.connect(owner).storeScore(1, 20240327, 1, 0)).to.be.revertedWith("Score must be greater than 0");
        });

        it("Should return the correct score decimals", async function () {
            expect(await raffleScore.SCORE_DECIMALS()).to.equal(4);
        });

        it("should return the correct formatted score", async function () {
            // Store a score for a client on a specific date
            const clientId = 1;
            const date = 20240327;
            const sequence = 1;
            const score = 12345678; // Represents 1234.5678
            await raffleScore.connect(owner).storeScore(clientId, date, sequence, score);

            // Get the formatted score
            const formattedScore = await raffleScore.getFormattedScore(clientId, "20240327_1");
            console.log(`Origin score is ${score}, Formatted score is ${formattedScore}`);

            // Check if the formatted score is as expected
            expect(formattedScore).to.equal("1234.5678");

            const date2 = 20240328;
            const sequence2 = 2;
            const score2 = 123456780; // Represents 12345.6780
            await raffleScore.connect(owner).storeScore(clientId, date2, sequence2, score2);
            const formattedScore2 = await raffleScore.getFormattedScore(clientId, "20240328_2");
            console.log(`Origin score is ${score2}, Formatted score is ${formattedScore2}`);

            // Check if the formatted score is as expected
            expect(formattedScore2).to.equal("12345.6780");
        });
    });

    describe("Ownership", function () {
        it("Should transfer ownership successfully", async function () {
            // Arrange
            const newOwner = addr1;

            // Act
            await raffleScore.connect(owner).transferOwnership(newOwner.address);

            // Assert
            expect(await raffleScore.owner()).to.equal(newOwner.address);
            console.log(`Ownership transfer from ${owner.address} to ${newOwner.address} successful`);
        });

        it("Should prevent non-owners from transferring ownership", async function () {
            try {
                // Arrange
                const nonOwner = addr1;
                const newOwner = addrs[0];

                await raffleScore.connect(nonOwner).transferOwnership(newOwner.address);
            } catch (error) {
                // @ts-ignore
                expect(error.message).to.include("OwnableUnauthorizedAccount");
            }
        });
    });
});
