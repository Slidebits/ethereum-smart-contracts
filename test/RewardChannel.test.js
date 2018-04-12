const soliditySha3 = require('solidity-sha3').default;
const ethUtil = require('ethereumjs-util');

const RewardChannel = artifacts.require('./RewardChannel');
const SlidebitsToken = artifacts.require('./SlidebitsToken');

contract('RewardChannel', function(accounts) {
  const contractOwner = accounts[0];
  const faucet = accounts[1];
  const channelFunder = accounts[2];
  const user = accounts[3];
  const oneEth = web3.toWei(1, 'ether');

  let rewardChannel;
  let token;

  it('Deploys all contracts', async () => {
    token = await SlidebitsToken.deployed();

    const addressOfTokenUsedAsReward = token.address;
    const faucetAddress = faucet;

    rewardChannel = await RewardChannel.new(
      addressOfTokenUsedAsReward,
      faucetAddress
    );
  });

  it('should have the correct values in the constructor', async () => {
    token = await SlidebitsToken.deployed();

    const addressOfTokenUsedAsReward = token.address;
    const faucetAddress = faucet;

    rewardChannel = await RewardChannel.new(
      addressOfTokenUsedAsReward,
      faucetAddress
    );
    const owner = await rewardChannel.owner();
    const contractFaucet = await rewardChannel.faucet();
    const tokenReward = await rewardChannel.tokenReward();

    assert.equal(
      owner,
      contractOwner,
      'owner should be creator of the contract'
    );

    assert.equal(
      token.address,
      tokenReward,
      'Token reward has same address as token in the constructor'
    );

    assert.equal(
      faucet,
      contractFaucet,
      'Faucet should have the same address as faucetAddress in the contructor'
    );
  });

  it('should create a channel', async () => {
    const capacity = 10;
    const model = 'food';
    const oneEth = web3.toWei(1, 'ether');
    const channelId = soliditySha3(channelFunder, model, capacity);

    await token.transfer(rewardChannel.address, 1000000, {
      from: contractOwner
    });

    const txResult = await rewardChannel.createChannel(
      channelId,
      channelFunder,
      capacity,
      {
        from: faucet
      }
    );

    const channelEventLogged = log => {
      const expectedArgs = args =>
        args.channelId === channelId &&
        args.channelFunder === channelFunder &&
        args.capacity.toString() === '10';

      const expectedEvent = 'ChannelCreated';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const wasChannelCreated = txResult.logs.some(channelEventLogged);

    assert.equal(
      wasChannelCreated,
      true,
      'createChannel function unsuccessful'
    );
  });

  xit('should reward', async () => {
    const ownerKey =
      'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';

    const amount = 1;

    const capacity = 10;
    const model = 'food';
    const oneEth = web3.toWei(1, 'ether');
    const channelId = soliditySha3(channelFunder, model, capacity);
    const h = soliditySha3(faucet, channelId, amount);
    const proofBuffer = Buffer.from(h.substr(2, 64), 'hex');
    const privateKey = Buffer.from(ownerKey, 'hex');

    const signature = ethUtil.ecsign(proofBuffer, privateKey);
    const { v, r, s } = signature;
    const _r = ethUtil.bufferToHex(r);
    const _s = ethUtil.bufferToHex(s);

    const expectedReward = oneEth * rewardAmount / price;

    token.transfer(rewardChannel.address, 1000000, { from: contractOwner });

    await rewardChannel.createChannel(h, v, _r, _s, channelId, amount, {
      from: faucet,
      value: oneEth
    });

    const txResult = await rewardChannel.reward(user, channelId);

    const rewardEventLogged = log => {
      const expectedArgs = args =>
        args.channelId === channelId &&
        args.user === user &&
        args.tokenRewardAmount.toString() === '1';

      const expectedEvent = 'ParticipantRewarded';

      return expectedArgs(log.args) && log.event === expectedEvent;
    };

    const wasParticipantRewarded = txResult.logs.some(rewardEventLogged);

    assert.equal(wasParticipantRewarded, true, 'reward function unsuccessful');
  });

  // it('should verifyHash', async () => {
  //   const ownerKey =
  //     'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
  //   const capacity = 10;
  //   const model = 'dog';
  //   const oneEth = web3.toWei(1, 'ether');
  //   const channelId = soliditySha3(channelFunder, model, capacity);

  //   const hash = Buffer.from(channelId.substr(2, 64), 'hex');
  //   const privateKey = Buffer.from(ownerKey, 'hex');

  //   const signature = ethUtil.ecsign(hash, privateKey);
  //   const { v, r, s } = signature;
  //   const _r = ethUtil.bufferToHex(r);
  //   const _s = ethUtil.bufferToHex(s);
  //   // const recoverAddress = ethUtil.ecrecover(hash, v, r, s);

  //   const signer = await rewardChannel.verifyHash(channelId, v, _r, _s, {
  //     from: user
  //   });

  //   assert(signer, contractOwner, 'Error with signing');
  // });

  // it('should increaseCapacity', async () => {
  //   const initialCapacity = await rewardChannel.totalCapacity();
  //   const txResult = await rewardChannel.increaseCapacity(100, {
  //     from: contractOwner
  //   });
  //   const increasedCapacity = await rewardChannel.totalCapacity();

  //   assert.equal(
  //     Number(increasedCapacity.toString()),
  //     Number(initialCapacity.toString()) + 100,
  //     'increaseCapacity function unsuccessful'
  //   );
  // });

  it('should withdraw balance for creator', async () => {
    rewardChannel.send(web3.toWei(1, 'ether'));
    const txResult = await rewardChannel.withdraw({ from: contractOwner });
    const receiptStatus = Number(txResult.receipt.status) === 1 ? true : false;

    assert.equal(receiptStatus, true, 'Withdraw Ether unsuccessful');
  });

  it('should destroy contract', async () => {
    const txResult = await rewardChannel.destroy({ from: contractOwner });
    const receiptStatus = Number(txResult.receipt.status) === 1 ? true : false;

    assert.equal(receiptStatus, true, 'destroy function unsuccessful');
  });
});
