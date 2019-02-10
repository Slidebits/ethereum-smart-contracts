// Check if the balanceOf Airdrop Wallet works as an interface

pragma solidity ^0.4.21;

// Airdrop Wallet and gas management service
// sends tokens/ether on behalf of users

interface wallet {
    function transfer(address _to, uint256 _value) external;
    function balanceOf(address _owner) external constant returns (uint balance);
}

contract AirdropWallet {
    address public owner = msg.sender;
    address public faucet;

    mapping (address => uint256) public balanceOf;

    wallet public airdropWallet;
    uint256 public valueInWei;
    
    // keeps track of rewards given
    mapping (bytes32 => bool) public airdrops;

    modifier onlyBy(address _account) {require(msg.sender == _account); _;}

    function HotAirdropWallet( address addressOfAirdropWallet, address faucetAddress, uint256 amountInWei) public {
        faucet = faucetAddress;
        airdropWallet = wallet(addressOfAirdropWallet);
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

    function checkBalance(uint256 weiValue)
      public returns (uint balance)
            onlyBy(faucet)

    {
        // valueInEth = amountInSzabos * 1 szabo;
        
        balance = airdropWallet.balanceOf(msg.sender);

        return balance;

    }

    function reward(address _user, uint tokenAmount)
      onlyBy(faucet)
      public
    {
        balanceOf[_user] += tokenAmount;
    }

    function airdropTokens(bytes32 _channelId, address[] _recipients, uint tokenAmount) public onlyBy(faucet) {
        for(uint i = 0; i < _recipients.length; i++)
        {
            bytes32 channelHash = keccak256(
                abi.encodePacked(_channelId, _recipients[i])
            );
            
            if (!airdrops[channelHash]) {
                airdrops[channelHash] = true;
                balanceOf[_recipients[i]] += tokenAmount;
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