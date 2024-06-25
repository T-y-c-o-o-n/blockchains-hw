pragma solidity ^0.8.0;

import "./VotingToken.sol";

import "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

contract Ballot {

    /**
     * max count of proposals
     */
    uint private constant CNT_PROPOSALS = 3;

    /**
     * @dev Emitted when an offer expires
     *
     * Note: event emitted lazy
     */
    event DiscardedProposal(bytes32 hash);

    /**
     * @dev Emitted when declined proposal
     *
     * Note: event emitted lazy
     */
    event DeclinedProposal(bytes32 hash);

    /**
     * @dev Emitted when accepted proposal
     */
    event AcceptedProposal(bytes32 hash);

    /**
     * @dev Emitted when new proposal has appeared
     */
    event NewProposal(bytes32 hash);

    enum Vote { Nothing, Accepted, Declined }

    struct Proposal {
        bytes32 hash;
        address owner;
        uint expiration;
        uint accept;
        uint reject;
    }

    mapping(address => Vote[CNT_PROPOSALS]) private votes;

    address[][3] private voters;

    Proposal[CNT_PROPOSALS] proposals;

    address private immutable _votingToken;

    constructor (address votingToken_) {
        _votingToken = votingToken_;
    }

    /**
     * @dev Check that only owner of voting tokens can create a proposal
     */
    modifier onlyOwnerVotingToken() {
        require(VotingToken(_votingToken).balanceOf(msg.sender) > 0, "Only owner of voting tokens can create a proposal");
        _;
    }

    /**
     * @dev Create new proposal, no more than 3 active proposals
     * Note: Only owner of voting tokens can create a proposal
     */
    function createProposal(bytes32 hash) public onlyOwnerVotingToken returns (bool) {
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].expiration < block.timestamp) {
                // default uint value is 0. So initial value is valid value.
                _discardedProposal(i);

                proposals[i] = Proposal({
                    hash: hash,
                    owner: msg.sender,
                    expiration: block.timestamp + (3 days),
                    accept: 0,
                    reject: 0
                });

                emit NewProposal(hash);
                return true;
            }
        }
        return false;
    }

    /**
     * Votes “for” proposal.
     * Note: Only owner of voting tokens can create a proposal
     */
    function forProposal(bytes32 hash) public onlyOwnerVotingToken {
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].hash == hash) {

                if (proposals[i].expiration < block.timestamp) {
                    // duplicate check from _recalculate function.
                    // need for optimization
                    _discardedProposal(i);
                    return;
                }

                Vote vote = votes[msg.sender][i];

                if (vote != Vote.Accepted) {
                    if (vote == Vote.Declined) {
                        proposals[i].reject -= VotingToken(_votingToken).balanceOf(msg.sender);
                    } else {
                        _addVoter(i, msg.sender);
                    }
                    proposals[i].accept += VotingToken(_votingToken).balanceOf(msg.sender);
                    votes[msg.sender][i] = Vote.Accepted;
                }

                _recalculate(i);

                return;
            }
        }
        revert("Proposal with this hash wasn't exists");
    }


    /**
     * Votes against proposal.
     * Note: Only owner of voting tokens can create a proposal
     */
    function againstProposal(bytes32 hash) public onlyOwnerVotingToken {
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].hash == hash) {

                if (proposals[i].expiration < block.timestamp) {
                    // duplicate check from _recalculate function.
                    // need for optimization
                    _discardedProposal(i);
                    return;
                }

                Vote vote = votes[msg.sender][i];

                if (vote != Vote.Declined) {
                    if (vote == Vote.Accepted) {
                        proposals[i].accept -= VotingToken(_votingToken).balanceOf(msg.sender);
                    } else {
                        _addVoter(i, msg.sender);
                    }
                    proposals[i].reject += VotingToken(_votingToken).balanceOf(msg.sender);
                    votes[msg.sender][i] = Vote.Declined;
                }

                _recalculate(i);

                return;
            }
        }
        revert("Proposal with this hash wasn't exists");
    }

    /**
     * @dev Update accept and reject sum, based on transfer from VotingToken
     * Note: Only votingToken can call transferFrom method
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external {
        require(msg.sender == _votingToken, "Only votingToken can call transferFrom method");

        _withdraw(from, amount);
        _deposit(to, amount);

        for (uint i = 0; i < proposals.length; i++) {
            _recalculate(i);
        }
    }

    /**
     * @dev discarded proposal
     */
    function _discardedProposal(uint i) internal {
        if (proposals[i].expiration != 0) {
            // if it is not initial value
            bytes32 hash = proposals[i].hash;
            _deleteProposal(i);
            emit DiscardedProposal(hash);
        }
    }

    /**
     * @dev Delete all info about proposal
     */
    function _deleteProposal(uint ind) internal {
        for (uint i = 0; i < voters[ind].length; i++) {
            votes[voters[ind][i]][ind] = Vote.Nothing;
        }
        delete voters[ind];
        delete proposals[ind];
    }

    /**
     * Add new voter to voters list
     */
    function _addVoter(uint i, address voter) public {
        voters[i].push(voter);
    }

    /**
     * Recalculate proposal state and emit events if necessary:
     * AcceptedProposal: if proposal was accepted
     * DeclinedProposal: if proposal was declined
     * DiscardedProposal: if proposal was expire
     */
    function _recalculate(uint ind) public {
        Proposal storage proposal = proposals[ind];

        if (proposal.expiration < block.timestamp) {
            _discardedProposal(ind);
            return;
        }

        uint totalSupply = VotingToken(_votingToken).totalSupply();

        console.log(
            "accept: %s; reject: %s; totalSupply %s",
                proposal.accept,
                proposal.reject,
                totalSupply
        );

        if (2 * proposal.accept > totalSupply) {
            bytes32 hash = proposals[ind].hash;
            _deleteProposal(ind);
            emit AcceptedProposal(hash);
        }
        if (2 * proposal.reject > totalSupply) {
            bytes32 hash = proposals[ind].hash;
            _deleteProposal(ind);
            emit DeclinedProposal(hash);
        }
    }

    /**
     * @dev Update accept and reject fields based on the information that {amount} was withdraw on {from} address
     */
    function _withdraw(address from, uint256 amount) internal {
        for (uint i = 0; i < votes[from].length; i++) {
            if (votes[from][i] == Vote.Nothing) {
                // Nothing is default value for Vote type
                return;
            }
            if (votes[from][i] == Vote.Accepted) {
                proposals[i].accept -= amount;
            } else {
                proposals[i].reject -= amount;
            }
        }
    }

    /**
     * @dev Update accept and reject fields based on the information that {amount} was deposit on {from} address
     */
    function _deposit(address from, uint256 amount) internal {
        for (uint i = 0; i < votes[from].length; i++) {
            if (votes[from][i] == Vote.Nothing) {
                // Nothing is default value for Vote type
                return;
            }
            if (votes[from][i] == Vote.Accepted) {
                proposals[i].accept += amount;
            } else {
                proposals[i].reject += amount;
            }
        }
    }
}
