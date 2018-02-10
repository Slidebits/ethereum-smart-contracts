var SlidebitsToken = artifacts.require('./SlidebitsToken');

contract('SlidebitsToken', function(accounts) {
  const tokenCreator = accounts[0];
  const tokenBuyer = accounts[1];
  let token;

  it('should deploy without crashing', async function() {
    token = await SlidebitsToken.deployed();
  });

  it('should be set with correct parameters', async function() {
    const name = await token.name();
    const symbol = await token.symbol();
    assert.equal(name, 'Slidebits', 'The name should be Slidebits');
    assert.equal(symbol, 'SLB', 'Symbol should be SLB');
  });

  it('Should start with an initial supply of 100 million', async function() {
    const totalSupply = await token.totalSupply();
    const initialSupply = web3.toBigNumber(web3.toWei(10 ** 8, 'ether'));

    assert.deepEqual(
      initialSupply,
      totalSupply,
      'Total supply and initial apply should be equal'
    );
  });

  // ERC-20 functions

  it('should have a transfer function', async function() {
    const txResult = await token.transfer(tokenBuyer, 100, {
      from: tokenCreator
    });

    const transferEventLogged = log => {
      const expectedArgs = ({ from, to, value }) =>
        from === tokenCreator &&
        to === tokenBuyer &&
        value.toString() === '100';

      const expectedEvent = 'Transfer';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const didTokenTransfer = txResult.logs.some(transferEventLogged);

    assert.equal(didTokenTransfer, true, 'transfer function unsuccessful');
  });

  it('should have a transferFrom function', async function() {
    await token.approve(tokenCreator, 100, {
      from: tokenBuyer
    });

    await token.transfer(tokenBuyer, 100000, { from: tokenCreator });

    const txResult = await token.transferFrom(tokenBuyer, tokenCreator, 100, {
      from: tokenCreator
    });

    const transferEventLogged = log => {
      const expectedArgs = ({ from, to, value }) =>
        from === tokenBuyer &&
        to === tokenCreator &&
        value.toString() === '100';

      const expectedEvent = 'Transfer';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const didTokenTransfer = txResult.logs.some(transferEventLogged);

    assert.equal(didTokenTransfer, true, 'transferFrom function unsuccessful');
  });

  it('should have an approve function', async function() {
    await token.approve(tokenCreator, 100, {
      from: tokenBuyer
    });

    const allowanceGiven = await token.allowance(tokenBuyer, tokenCreator);

    assert.equal(
      allowanceGiven.toString(),
      '100',
      'approve function unsuccessful'
    );
  });

  xit('should have an approveAndCall function', async function() {
    const extraData = web3.sha3('extra test data');

    await token.approveAndCall(tokenCreator, 100, extraData, {
      from: tokenBuyer
    });

    const allowanceGiven = await token.allowance(tokenBuyer, tokenCreator);

    assert.equal(
      allowanceGiven.toString(),
      '100',
      'approve function unsuccessful'
    );
  });

  it('should have a mint function', async function() {
    const txResult = await token.mintToken(tokenBuyer, 100, {
      from: tokenCreator
    });

    const createTransferLogged = log => {
      const expectedArgs = ({ from, to, value }) =>
        Number(from) === 0 &&
        to === token.address &&
        value.toString() === '100';

      const expectedEvent = 'Transfer';
      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const mintTransferLogged = log => {
      const expectedArgs = ({ from, to, value }) =>
        from === token.address &&
        to === tokenBuyer &&
        value.toString() === '100';

      const expectedEvent = 'Transfer';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const didTokenMint =
      txResult.logs.some(createTransferLogged) &&
      txResult.logs.some(mintTransferLogged);

    const transferEvents = txResult.logs.filter(
      log => log.event === 'Transfer'
    );

    assert.equal(didTokenMint, true, 'mint function unsuccessful');
    assert.equal(transferEvents.length, 2, 'mint function unsuccessful');
  });

  it('should allow minting only for the creator', async function() {
    this.slow(2000);

    try {
      await token.mintToken(tokenBuyer, 100, {
        from: tokenBuyer
      });
    } catch (error) {
      return true;
    }

    throw new Error('Non creator was able to mint');
  });

  it('should have a burn function', async function() {
    const txResult = await token.burn(100, {
      from: tokenCreator
    });

    const burnEventLogged = log => {
      const expectedArgs = ({ from, value }) =>
        from === tokenCreator && value.toString() === '100';

      const expectedEvent = 'Burn';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const didTokenBurn = txResult.logs.some(burnEventLogged);

    assert.equal(didTokenBurn, true, 'burn function unsuccessful');
  });

  it('should have a burnFrom function', async function() {
    await token.approve(tokenCreator, 100, {
      from: tokenBuyer
    });

    await token.transfer(tokenBuyer, 100000, { from: tokenCreator });

    const txResult = await token.burnFrom(tokenBuyer, 100, {
      from: tokenCreator
    });

    const burnEventLogged = log => {
      const expectedArgs = ({ from, value }) =>
        from === tokenBuyer && value.toString() === '100';

      const expectedEvent = 'Burn';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const didTokenBurn = txResult.logs.some(burnEventLogged);

    assert.equal(didTokenBurn, true, 'burnFrom function unsuccessful');
  });

  it('should have a freezeAccount function', async function() {
    const txResult = await token.freezeAccount(tokenBuyer, true, {
      from: tokenCreator
    });

    const frozenEventLogged = log => {
      const expectedArgs = ({ target, frozen }) =>
        target === tokenBuyer && frozen === true;

      const expectedEvent = 'FrozenFunds';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };
    const didFrozenFundsOccur = txResult.logs.some(frozenEventLogged);

    assert.equal(
      didFrozenFundsOccur,
      true,
      'freezeAccount function unsuccessful'
    );
  });

  it('should have a setPrice function', async function() {
    const txResult = await token.setPrices(123, 124, { from: tokenCreator });
    const sellPriceBN = await token.sellPrice();
    const buyPriceBN = await token.buyPrice();

    const sellPrice = Number(sellPriceBN.toString());
    const buyPrice = Number(buyPriceBN.toString());

    const receiptStatus = Number(txResult.receipt.status) === 1 ? true : false;

    assert.equal(receiptStatus, true, 'setPrices function unsuccessful');
    assert.equal(sellPrice, 123, 'Sell Price is incorrect');
    assert.equal(buyPrice, 124, 'Buy Price is incorrect');
  });

  xit('should have a buy function', async function() {
    token.transfer(token.address, 1000000, { from: tokenCreator });
    const txResult = await token.setPrices(1, 2, { from: tokenCreator });

    const buyResult = await token.buy({
      from: tokenCreator,
      value: web3.toWei(1, 'ether')
    });

    const receiptStatus = Number(buyResult.receipt.status) === 1 ? true : false;
    assert.equal(receiptStatus, true, 'buy function unsuccessful');
  });

  xit('should have a sell function', async function() {
    await token.send(web3.toWei(2, 'ether'));
    const txResult = await token.setPrices(1, 1, { from: tokenCreator });
    await token.transfer(tokenBuyer, 100, { from: tokenCreator });

    const sellResult = await token.sell(1, { from: tokenBuyer });

    const receiptStatus =
      Number(sellResult.receipt.status) === 1 ? true : false;
    assert.equal(receiptStatus, true, 'sell function unsuccessful');
  });
});
