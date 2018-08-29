pragma solidity ^0.4.21;

// Airdrop Wallet and gas management service
// sends tokens/ether on behalf of users

interface token {
    function transfer(address _to, uint256 _value) external;
    function balanceOf(address _owner) external constant returns (uint balance);
}

contract AirdropWallet {
    address public owner = msg.sender;
    address public faucet;

    mapping (address => uint256) public balanceOf;

    token public tokenReward;
    uint256 public valueInWei;
    
    // keeps track of rewards given
    mapping (bytes32 => bool) public airdrops;

    modifier onlyBy(address _account) {require(msg.sender == _account); _;}

    function HotAirdropWallet( address addressOfTokenUsedAsReward, address faucetAddress, uint256 amountInWei) public {
        faucet = faucetAddress;
        tokenReward = token(addressOfTokenUsedAsReward);
        // valueInEth = amountInSzabos * 1 szabo;
        valueInWei = amountInWei;
    }

    function() payable public {}

   
    function sendEther(address _from, address _to, uint tokenAmount)
      onlyBy(faucet)
      public
    {
        require(balanceOf[_from] >= tokenAmount); 

        uint amount = tokenAmount / 1 ether;
        balanceOf[_from] -= tokenAmount;
        _to.transfer(amount * valueInWei);
    }

    function sendToken(address _from, address _to, uint amount)
      onlyBy(faucet)
      public
    {
        require(balanceOf[_from] >= amount);
        balanceOf[_from] -= amount;
        tokenReward.transfer(_to, amount);
    }

    function setValueInWei(uint256 weiValue)
      onlyBy(faucet)
      public
    {
        // valueInEth = amountInSzabos * 1 szabo;
        valueInWei = weiValue;

    }

    function reward(address _user, uint tokenAmount)
      onlyBy(faucet)
      public
    {
        balanceOf[_user] += tokenAmount;
    }

    function airdropTokens(address[] _recipient, bytes32 _channelId, uint tokenAmount) public onlyBy(faucet) {
        for(uint i = 0; i < _recipient.length; i++)
        {
            bytes32 channelHash = keccak256(
                abi.encodePacked(_channelId, _recipient[i])
            );
            
            if (!airdrops[channelHash]) {
                airdrops[channelHash] = true;
                balanceOf[_recipient[i]] += tokenAmount;
            }
        }
    }


    function withdraw()
      onlyBy(owner)
      public
    {
        address contractAddress = this;
        owner.transfer(contractAddress.balance);
    }

    function destroy() onlyBy(owner) public {
        selfdestruct(this);
    }
}