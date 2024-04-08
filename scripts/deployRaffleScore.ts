import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 部署合约
    const raffleScoreFactory = await ethers.getContractFactory("RaffleScore");
    const raffleScore = await raffleScoreFactory.deploy(deployer.address);

    const address = await raffleScore.getAddress()
    console.log("RaffleScore deployed to:", address);
}

// 我们推荐这种异步模式，可以更好地处理错误。
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
