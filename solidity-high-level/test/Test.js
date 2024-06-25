const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Test", function () {

  async function deployVotingTokenAndBallot() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const vt = await ethers.deployContract("VotingToken", ['VotingToken', 'VT'], owner)

    const ballot = await ethers.deployContract("Ballot", [vt.address], owner)

    console.log("ballot.address = "  + ballot.address)

    await vt.setBallot(ballot.address);

    return [owner, vt, ballot.address, user1, user2, user3]
  }

  it("During creation totalSupply = 100.000000 (decimals = 6) tokens are minted to contract owner", async function () {
    const [owner, vt] = await loadFixture(deployVotingTokenAndBallot);
    const balance = await vt.balanceOf(owner.address)
    expect(balance).to.equal(100_000_000)
    const decimals = await vt.decimals()
    expect(decimals).to.equal(6)
  });

  describe("Any owner of voting tokens can create a proposal, time-to-live(TTL) of proposal is 3 days, after that time proposal becomes “discarded” if not enough votes are gathered", function () {

    it("Any owner of voting tokens can create a proposal", async function () {
      const [owner, user2] = await ethers.getSigners();

      const vt = await ethers.deployContract("VotingToken", ['VotingToken', 'VT'], owner)

      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string"))

      const ballotUser2 = await ethers.deployContract("Ballot", [vt.address], user2)

      await expect(ballotUser2.createProposal(hash))
          .to.be.revertedWith('Only owner of voting tokens can create a proposal');

      const ballotOwner = await ethers.deployContract("Ballot", [vt.address], owner)

      await expect(await ballotOwner.createProposal(hash))
          .to.emit(ballotOwner, 'NewProposal')
          .withArgs(hash);
    });

    it("Check that proposal discarded after 3 days", async function () {
      const [owner, vt, ballotAddress] = await loadFixture(deployVotingTokenAndBallot);

      const ballot = await ethers.getContractAt("Ballot", ballotAddress, owner)

      for (let i = 0; i < 3; i++) {
        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string" + i))
        await expect(await ballot.createProposal(hash))
            .to.emit(ballot, 'NewProposal')
            .withArgs(hash);
      }

      // wait 3 day
      await time.increase(3 * 24 * 60 * 60 + 1000);

      for (let i = 0; i < 3; i++) {
        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string" + i))
        await expect(await ballot.createProposal(hash))
            .to.emit(ballot, 'NewProposal')
            .withArgs(hash)
            .to.emit(ballot, 'DiscardedProposal')
            .withArgs(hash);
      }
    });
  });


  describe("Votes can be “for” or ”against” the proposal. Proposal becomes “accepted” or “declined” completed if > 50% of votes for the same decision (“for” or “against”) is gathered", function () {

    it("Proposal becomes “accepted” completed if > 50% of votes", async function () {
      const [owner, vt, ballotAddress, user1, user2, user3] = await loadFixture(deployVotingTokenAndBallot);
      await vt.transfer(user1.address, 20_000_000);
      await vt.transfer(user2.address, 30_000_000);
      await vt.transfer(user3.address, 15_000_000);
      console.log("owner balance of: ", await vt.balanceOf(owner.address));
      console.log("user1 balance of: ", await vt.balanceOf(user1.address));
      console.log("user2 balance of: ", await vt.balanceOf(user2.address));
      console.log("user3 balance of: ", await vt.balanceOf(user3.address));

      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string"))

      const ballotOwner = await ethers.getContractAt("Ballot", ballotAddress, owner)

      await expect(await ballotOwner.createProposal(hash))
          .to.emit(ballotOwner, 'NewProposal')
          .withArgs(hash);

      await ballotOwner.forProposal(hash)

      const ballotUser2 = await ethers.getContractAt("Ballot", ballotAddress, user2)

      await ballotUser2.againstProposal(hash)

      const ballotUser3 = await ethers.getContractAt("Ballot", ballotAddress, user3)

      await ballotUser3.againstProposal(hash)

      const ballotUser1 = await ethers.getContractAt("Ballot", ballotAddress, user1)

      await expect(await ballotUser1.forProposal(hash))
          .to.emit(ballotUser1, 'AcceptedProposal')
          .withArgs(hash);
    });

    it("Proposal becomes “declined” completed if > 50% of votes", async function () {
      const [owner, vt, ballotAddress, user1, user2, user3] = await loadFixture(deployVotingTokenAndBallot);
      await vt.transfer(user1.address, 20_000_000);
      await vt.transfer(user2.address, 30_000_000);
      await vt.transfer(user3.address, 15_000_000);
      console.log("owner balance of: ", await vt.balanceOf(owner.address));
      console.log("user1 balance of: ", await vt.balanceOf(user1.address));
      console.log("user2 balance of: ", await vt.balanceOf(user2.address));
      console.log("user3 balance of: ", await vt.balanceOf(user3.address));

      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string"))

      const ballotOwner = await ethers.getContractAt("Ballot", ballotAddress, owner)

      await expect(await ballotOwner.createProposal(hash))
          .to.emit(ballotOwner, 'NewProposal')
          .withArgs(hash);

      await ballotOwner.forProposal(hash)

      const ballotUser2 = await ethers.getContractAt("Ballot", ballotAddress, user2)

      await ballotUser2.againstProposal(hash)

      const ballotUser3 = await ethers.getContractAt("Ballot", ballotAddress, user3)

      await ballotUser3.againstProposal(hash)

      const ballotUser1 = await ethers.getContractAt("Ballot", ballotAddress, user1)

      await expect(await ballotUser1.againstProposal(hash))
          .to.emit(ballotUser1, 'DeclinedProposal')
          .withArgs(hash);
    });
  });

  describe("voting should not “freeze” tokens \n but, voting should handle a situation, when voter transfers his tokens to another address and votes another time.", function () {

    it("voting should not “freeze” tokens", async function () {
      const [owner, vt, ballotAddress, user1, user2, user3] = await loadFixture(deployVotingTokenAndBallot);
      await vt.transfer(user1.address, 20_000_000);
      await vt.transfer(user2.address, 30_000_000);
      await vt.transfer(user3.address, 15_000_000);
      console.log("owner balance of: ", await vt.balanceOf(owner.address));
      console.log("user1 balance of: ", await vt.balanceOf(user1.address));
      console.log("user2 balance of: ", await vt.balanceOf(user2.address));
      console.log("user3 balance of: ", await vt.balanceOf(user3.address));

      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string"))

      const ballotOwner = await ethers.getContractAt("Ballot", ballotAddress, owner)

      await expect(await ballotOwner.createProposal(hash))
          .to.emit(ballotOwner, 'NewProposal')
          .withArgs(hash);

      await ballotOwner.forProposal(hash)

      const ballotUser2 = await ethers.getContractAt("Ballot", ballotAddress, user2)

      await ballotUser2.againstProposal(hash)

      const ballotUser3 = await ethers.getContractAt("Ballot", ballotAddress, user3)

      await ballotUser3.againstProposal(hash)

      await expect(await vt.balanceOf(user1.address))
          .to.equal(20000000)
      await expect(await vt.balanceOf(user2.address))
          .to.equal(30000000)

      const vtContract = await ethers.getContractAt("VotingToken", vt.address, user1)

      await vtContract.transfer(user2.address, 10000000)

      await expect(await vt.balanceOf(user1.address))
          .to.equal(10000000)
      await expect(await vt.balanceOf(user2.address))
          .to.equal(40000000)
    });

    it("but, voting should handle a situation, when voter transfers his tokens to another address and votes another time.", async function () {
      const [owner, vt, ballotAddress, user1, user2, user3] = await loadFixture(deployVotingTokenAndBallot);
      await vt.transfer(user1.address, 20_000_000);
      await vt.transfer(user2.address, 30_000_000);
      await vt.transfer(user3.address, 15_000_000);
      console.log("owner balance of: ", await vt.balanceOf(owner.address));
      console.log("user1 balance of: ", await vt.balanceOf(user1.address));
      console.log("user2 balance of: ", await vt.balanceOf(user2.address));
      console.log("user3 balance of: ", await vt.balanceOf(user3.address));

      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Some string"))

      const ballotOwner = await ethers.getContractAt("Ballot", ballotAddress, owner)

      await expect(await ballotOwner.createProposal(hash))
          .to.emit(ballotOwner, 'NewProposal')
          .withArgs(hash);

      await ballotOwner.forProposal(hash)

      const ballotUser2 = await ethers.getContractAt("Ballot", ballotAddress, user2)

      await ballotUser2.againstProposal(hash)

      const ballotUser3 = await ethers.getContractAt("Ballot", ballotAddress, user3)

      await ballotUser3.againstProposal(hash)

      await expect(await vt.transfer(user2.address, 20000000))
          .to.emit(ballotOwner, 'DeclinedProposal')
          .withArgs(hash);
    });
  });
});
