
pragma solidity ^0.4.19;

// TO-DO use token as reward

// interface token {
//     function transfer(address receiver, uint amount) public;
//     function balanceOf(address _owner) public constant returns (uint balance);
// }

// A contract made at the ETHDenver hackathon

// https://en.wikipedia.org/wiki/Unique_bid_auction

contract LUBAuction {
    struct Bid {
        // keccak256(selectedNumber, secret)
        bytes32 blindedBid; 
        uint deposit;
    }

    struct User {
      address bidAddress;
    }

    struct NumbersPlayed {
      uint numberSelected;
      uint amountPlayed;
      address[] players;
    }

    mapping(address => Bid[]) public bids;
    mapping(uint => address) public bidFrequency;

    address public beneficiary = msg.sender;
    uint public winningBidValue;

    uint[] public numbersPicked;
    NumbersPlayed[] public numbersPlayed;

    uint public biddingEnd;
    uint public revealEnd;
    uint public lowestUniqueBidCount = 0;
    // token public tokenReward;
    uint oneGwei = 10 ** 9;
    bool public ended;
    bool public winnerSearchStarted;
    mapping(address => uint) pendingReturns;

    event WinningNumberFound(uint winningNumber);
    event WinningValueChanged(uint _bidValue);

    modifier onlyBefore(uint _time) { require(now < _time); _; }
    modifier onlyAfter(uint _time) { require(now > _time); _; }

    function LUBAuction(uint _biddingTimeInMinutes, uint _revealTimeInMinutes) public 
    {
        biddingEnd = now + _biddingTimeInMinutes * 1 minutes;
        revealEnd = biddingEnd + _revealTimeInMinutes * 1 minutes;
    }

    /**
     * Fallback function
     *
     * The function without name is the default function that is called whenever anyone sends funds to a contract
     */
    function () payable public
    {

    }

      function placeBid(bytes32 _blindedBid)
        public
        payable
        onlyBefore(biddingEnd)
    {
        bids[msg.sender].push(Bid({
            blindedBid: _blindedBid,
            deposit: msg.value
        }));
    }

      function reveal(
        uint[] _selectedNumbers,
        bytes32[] _secret
    )
        public
        onlyAfter(biddingEnd)
        onlyBefore(revealEnd)
    {
        uint length = bids[msg.sender].length;
        require(_selectedNumbers.length == length);
        require(_secret.length == length);

        for (uint i = 0; i < length; i++) {
            var bid = bids[msg.sender][i];
            var (selectedNumber, secret) =
                    (_selectedNumbers[i], _secret[i]);
            if (bid.blindedBid != keccak256(selectedNumber, secret)) {
                // Bid was not actually revealed.
                // Do not refund deposit.
                continue;
            }

            uint value = selectedNumber * oneGwei; 

            require(bid.deposit >= value);
            require(selectedNumber > 0 && selectedNumber < 25000);

            numbersPlayed[selectedNumber].amountPlayed += 1;
            numbersPlayed[selectedNumber].players.push(msg.sender);


            // Make it impossible for the sender to re-claim
            // the same deposit.
            bid.blindedBid = bytes32(0);
        }
    }

    function addRefunds(uint bidValue) internal 
    {
        for (uint i = 0; i < numbersPlayed[bidValue].players.length; i++) {
            address bidder = numbersPlayed[bidValue].players[i];
            // to-do subtract bidding fee
            uint refund = bidValue * oneGwei;
            pendingReturns[bidder] += refund;
        }

    }

     function findWinners()
        public
        onlyAfter(revealEnd)
    {
        require(!winnerSearchStarted);
        winnerSearchStarted = true;

        for (uint selectedNumber = 1;  selectedNumber < 25000; selectedNumber++) {

            if (numbersPlayed[selectedNumber].amountPlayed < 1) { continue; }

            uint bidsOnCurrentValue = numbersPlayed[selectedNumber].amountPlayed;

            bool bidFound = lowestUniqueBidCount > 0;
            bool higherBidFrequency = lowestUniqueBidCount > bidsOnCurrentValue;

            if (bidFound && higherBidFrequency) {
                uint oldWinningValue = winningBidValue;
                addRefunds(oldWinningValue);
                winningBidValue = selectedNumber;
                lowestUniqueBidCount = bidsOnCurrentValue;
            }

            if ((bidFound && !higherBidFrequency) && selectedNumber != winningBidValue) {
              addRefunds(selectedNumber);
            }

           if (lowestUniqueBidCount == 0) {
                winningBidValue = selectedNumber;
                lowestUniqueBidCount = bidsOnCurrentValue;
            }
        }
        address[] storage winners = numbersPlayed[winningBidValue].players;

        for (uint i = 0; i < winners.length; i++) {
            address winner = winners[i];
             
            uint reward = 2 * oneGwei;
            pendingReturns[winner] += reward;
        }
        ended = true;
    }
}
