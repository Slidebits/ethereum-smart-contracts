pragma solidity ^0.4.21;

interface token {
    function transfer(address _to, uint256 _value) external;
    function balanceOf(address _owner) external constant returns (uint balance);
    function approve(address _spender, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
}

contract PromoChannel {
    address public faucet = msg.sender;
    address tokenAddress = 0xebc5b45f1c763560bff823c2aba85e1935a352d4;
    token public tokenReward = token(tokenAddress);

    struct Channel {
      bool approved;
      string link;
      uint tokenAmount;
      uint startTime;
    }

    event ChannelCreated(bytes32 indexed channelHash, address creator, string link, uint tokenAmount, uint startTime);

    // keeps track of rewards given
    mapping (bytes32 => bool) public airdrops;
    mapping(bytes32 => Channel) public channels;


    modifier onlyBy(address _account) {require(msg.sender == _account); _;}

    function() payable public {}


    function airdropTokens(bytes32 _channelId, address[] _recipients, uint tokenAmount, uint weiAmount) public onlyBy(faucet) {
        for(uint i = 0; i < _recipients.length; i++)
        {
            bytes32 channelHash = keccak256(
                abi.encodePacked(_channelId, _recipients[i])
            );
            
            if (!airdrops[channelHash]) {
                airdrops[channelHash] = true;
                tokenReward.transfer(_recipients[i], tokenAmount);
                _recipients[i].transfer(weiAmount);
            }
        }
    }

    function addPromoLink(string link, uint tokenAmount) public{
        Channel memory channel;
        tokenReward.approve(this, tokenAmount);
        tokenReward.transferFrom(msg.sender, this, tokenAmount);

        uint currentTime = now;

        bytes32 channelHash = keccak256(
          abi.encodePacked(msg.sender, link, currentTime)
        );

        channel.startTime = currentTime;
        channel.link = link;
        channel.tokenAmount = tokenAmount;

        channels[channelHash] = channel;
        emit ChannelCreated(channelHash, msg.sender, link, tokenAmount, currentTime);
    }


    function withdraw()
      onlyBy(faucet)
      public
    {
        address contractAddress = this;
        faucet.transfer(contractAddress.balance);
    }

    function withdrawTokens() onlyBy(faucet) public {
        uint tokenBalance = tokenReward.balanceOf(this);

        tokenReward.transfer(faucet, tokenBalance);
    }

    function destroy() onlyBy(faucet) public {
        selfdestruct(this);
    }
}