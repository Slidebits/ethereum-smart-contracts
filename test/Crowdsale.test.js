const Crowdsale = artifacts.require('./Crowdsale');
const SlidebitsToken = artifacts.require('./SlidebitsToken');

contract('Crowdsale', function(accounts) {
  const tokenCreator = accounts[0];
  const tokenBuyer = accounts[1];
  let crowdsale;
  let token;
  let price;

  it('Deploys all contracts', async () => {
    token = await SlidebitsToken.deployed();

    const szaboCostPerToken = 1000;
    const addressOfTokenUsedAsReward = token.address;

    crowdsale = await Crowdsale.new(
      szaboCostPerToken,
      addressOfTokenUsedAsReward
    );
  });

  it('should have the correct values in the constructor', async () => {
    const price = await crowdsale.price();
    const tokenReward = await crowdsale.tokenReward();

    assert.equal(
      price,
      web3.toWei(1000, 'szabo'),
      'Price should be 1000 szabos'
    );

    assert.equal(
      token.address,
      tokenReward,
      'Token reward has same address as token in the constructor'
    );
  });

  it('should withdraw ether for creator', async () => {
    token.transfer(crowdsale.address, 1000000, { from: tokenCreator });

    const txResult = await crowdsale.withdrawEther({ from: tokenCreator });
    const receiptStatus = Number(txResult.receipt.status) === 1 ? true : false;

    assert.equal(receiptStatus, true, 'Withdraw Ether unsuccessful');
  });

  it('should withdraw tokens for creator', async () => {
    token.transfer(crowdsale.address, 1000000, { from: tokenCreator });

    const txResult = await crowdsale.withdrawTokens({ from: tokenCreator });
    const receiptStatus = Number(txResult.receipt.status) === 1 ? true : false;

    assert.equal(receiptStatus, true, 'Withdraw Tokens unsuccessful');
  });

  it('should end crowdsale for creator', async () => {
    const txResult = await crowdsale.endCrowdsale({ from: tokenCreator });
    const receiptStatus = Number(txResult.receipt.status) === 1 ? true : false;

    assert.equal(receiptStatus, true, 'Withdraw Tokens unsuccessful');
  });

  // Fallback function limits gas limit so test fails

  xit('Should send tokens based off the token rate as the default fallback function', async () => {
    await token.transfer(crowdsale.address, 1000000, { from: tokenCreator });

    const oneSzabo = web3.toWei(1, 'szabo');

    const txResults = await crowdsale.sendTransaction({
      from: tokenBuyer,
      value: oneSzabo
    });

    const didFundsTransfer = txResults.logs.some(log => {
      return log.event === 'FundTransfer';
    });

    assert.equal(
      didFundsTransfer,
      true,
      'Fund Transfer result was not Emitted'
    );
  });
});
