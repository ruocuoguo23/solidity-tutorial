import { ethers } from 'hardhat';
import { expect } from 'chai';
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import { Ballot } from "../typechain-types";

describe('Ballot Contract', function () {
    let ballot: Ballot;
    let chairperson: SignerWithAddress;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;
    let proposalNames: string[];

    beforeEach(async function () {
        // 获取账户
        [chairperson, voter1, voter2] = await ethers.getSigners();

        // 部署 Ballot 合约
        const Ballot = await ethers.getContractFactory('Ballot', chairperson);
        proposalNames = ['Proposal1', 'Proposal2', 'Proposal3'];
        // @ts-ignore
        ballot = await Ballot.deploy(proposalNames);
    });

    describe('Deployment', function () {
        it('Should set the right chairperson', async function () {
            expect(await ballot.chairperson()).to.equal(chairperson.address);
        });

        it('Should create proposals with correct names and initial vote counts', async function () {
            for (let i = 0; i < proposalNames.length; i++) {
                const proposal = await ballot.proposals(i);
                expect(proposal.name).to.equal(proposalNames[i]);
                expect(proposal.voteCount).to.equal(0);
            }
        });
    });

    describe('giveRightToVote', function () {
        it('Should give right to vote', async function () {
            await ballot.giveRightToVote(voter1.address);
            const voter = await ballot.voters(voter1.address);
            expect(voter.weight).to.equal(1);
        });

        it('Should fail if non-chairperson tries to give right to vote', async function () {
            await expect(ballot.connect(voter1).giveRightToVote(voter2.address)).to.be.revertedWith('Only chairperson can give right to vote.');
        });
    });

    // ... 更多的测试用例 ...

    describe('delegate', function () {
        // 测试委托功能的测试用例
    });

    describe('vote', function () {
        // 测试投票功能的测试用例
    });

    describe('winningProposal', function () {
        // 测试计算获胜提案的测试用例
    });

    describe('winnerName', function () {
        // 测试获取获胜提案名称的测试用例
    });

    // ... 可以添加更多的测试用例来覆盖不同的逻辑分支和边界条件 ...
});

