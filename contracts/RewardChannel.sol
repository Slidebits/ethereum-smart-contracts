pragma solidity ^0.4.18;

// Reward Channel contract

interface token {
    function transfer(address receiver, uint amount) public;
    function balanceOf(address _owner) public constant returns (uint balance);
}

// TO-DO: 
// - create signature flow and have users send transaction
// - refunds
// - add ability to increase reward

contract RewardChannel {
    address public owner = msg.sender;
    address public faucet;

     struct Recipient {
        bool rewarded;
    }

    struct Channel {
      address channelFunder;
      bool started;
      uint deposit;
      uint capacity;
      uint headcount;
      mapping (address => Recipient) recipients;
    }

    mapping(bytes32 => Channel) public channels;

    // Helpful links to think about rates
    // http://ether.price.exchange/
    // https://etherconverter.online/

    uint public rewardAmount;
    uint public numberOfParticipants;
    uint public totalChannelSpots;
    uint public totalCapacity;
    uint public price;
    token public tokenReward;

    event ChannelCreated(bytes32 indexed channelId, address indexed channelFunder, uint256 capacity);
    event ParticipantRewarded(bytes32 indexed channelId, address indexed user, uint256 value);

    modifier onlyIfSpace(uint _capacity) {
      uint newCapacity = totalChannelSpots + _capacity;
      require(newCapacity <= totalCapacity);
      _;
    }

    modifier onlyBy(address _account) { require(msg.sender == _account); _; }
    modifier onlyIfSolvent() {
        uint openSlots = totalChannelSpots - numberOfParticipants;
        uint amountDue = openSlots * rewardAmount;
        uint tokensDue = 1 ether * amountDue / price;
        uint tokenBalance = tokenReward.balanceOf(this);
        require(tokenBalance >= tokensDue);
        _;
    }
    modifier onlyIfCovered(uint _value, uint _desiredCapacity) {
        uint costs = _desiredCapacity * rewardAmount;
        require(_value >= costs);
        _;
    }

    function RewardChannel(uint szaboCostPerToken, uint capacityMax, address addressOfTokenUsedAsReward, address faucetAddress) public {
        price =  szaboCostPerToken * 1 szabo;
        rewardAmount = price / 100;
        totalCapacity = capacityMax;
        faucet = faucetAddress;
        tokenReward = token(addressOfTokenUsedAsReward);
    }

    function() payable public {}

    // channel id 
    // sha3((address channelFunder, string model, uint capacity))

    function createChannel(bytes32 _channelId, address _channelFunder, uint _capacity) payable
      onlyBy(faucet)
      onlyIfSpace(_capacity)
      onlyIfCovered(msg.value, _capacity)
      public
    {
      Channel storage channel = channels[_channelId];
      require(!channel.started);
      channel.started = true;
      channel.deposit = msg.value;
      channel.channelFunder = _channelFunder;
      channel.capacity = _capacity;
      totalChannelSpots += _capacity;
      channels[_channelId] = channel;
      //event new channel created
      ChannelCreated(_channelId, _channelFunder, _capacity);
    }

    function reward(address _user, bytes32 _channelId)
      onlyBy(faucet)
      onlyIfSolvent()
      public
    {
        Channel storage _channel = channels[_channelId];
        Recipient storage _recipient = _channel.recipients[_user];
        require(!_recipient.rewarded && _channel.headcount < _channel.capacity);
        _channel.headcount += 1;
        numberOfParticipants +=1;
        _recipient.rewarded = true;
        _channel.deposit -= rewardAmount;
        uint tokenRewardAmount = 1 ether * rewardAmount/price;
        tokenReward.transfer(_user, tokenRewardAmount);
        ParticipantRewarded(_channelId, _user, tokenRewardAmount);
    }

    function increaseCapacity(uint _increaseAmount)
      onlyBy(owner)
      public
    {
        totalCapacity += _increaseAmount;
    }

    function withdraw()
      onlyBy(owner)
      public
    {
        owner.transfer(this.balance);
    }

    function destroy() onlyBy(owner) public{
      selfdestruct(this);
    }
}
