const {ethers} = require("hardhat");

async function deployBallot(vtAddress) {

    const [owner] = await ethers.getSigners();

    console.log("VotingToken address:", vtAddress);

    const token = await ethers.deployContract("Ballot", [vtAddress], owner)

    console.log("Ballot deploy:");
    console.log("Ballot address:", token.address);
    return token.address
}


async function deployVotingToken(owner) {

    console.log("Deploying contracts with the account:", owner.address);

    console.log("Account balance:", (await owner.getBalance()).toString());

    const token = await ethers.deployContract("VotingToken", ['VotingToken', 'VT'], owner)

    console.log("VotingToken address:", token.address);
    return token.address
}

module.exports = { deployBallot, deployVotingToken }