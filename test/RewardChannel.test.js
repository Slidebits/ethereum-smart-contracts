const soliditySha3 = require('solidity-sha3').default;

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

    const szaboCostPerToken = 1000;
    const capacityMax = 400;
    const addressOfTokenUsedAsReward = token.address;
    const faucetAddress = faucet;

    rewardChannel = await RewardChannel.new(
      szaboCostPerToken,
      capacityMax,
      addressOfTokenUsedAsReward,
      faucetAddress
    );
  });

  it('should have the correct values in the constructor', async () => {
    token = await SlidebitsToken.deployed();

    const szaboCostPerToken = 1000;
    const capacityMax = 400;
    const addressOfTokenUsedAsReward = token.address;
    const faucetAddress = faucet;

    rewardChannel = await RewardChannel.new(
      szaboCostPerToken,
      capacityMax,
      addressOfTokenUsedAsReward,
      faucetAddress
    );
    const owner = await rewardChannel.owner();
    const price = await rewardChannel.price();
    const tokenReward = await rewardChannel.tokenReward();
    const rewardAmount = await rewardChannel.rewardAmount();
    const totalCapacity = await rewardChannel.totalCapacity();

    const expectedReward = oneEth * rewardAmount / price;
    const tokenDecimalPlaces = 10 ** 18;

    assert.equal(
      owner,
      contractOwner,
      'owner should be creator of the contract'
    );

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

    assert.equal(
      Number(rewardAmount.toString()),
      web3.toWei(10, 'szabo'),
      'Reward Amount should equal expected reward'
    );

    assert.equal(
      expectedReward,
      Number(0.01 * tokenDecimalPlaces),
      'Unexpected token reward amount'
    );

    assert.equal(totalCapacity, 400, 'Total capacity should be capacityMax');
  });

  it('should create a channel', async () => {
    const capacity = 10;
    const model = 'food';
    const oneEth = web3.toWei(1, 'ether');
    const channelId = soliditySha3(channelFunder, model, capacity);

    token.transfer(rewardChannel.address, 1000000, { from: contractOwner });
    const data = rewardChannel.contract.createChannel.getData(
      channelId,
      channelFunder,
      capacity
    );
    const gasEstimate = web3.eth.estimateGas({
      to: rewardChannel.address,
      data: data
    });

    console.log('estimate', gasEstimate);
    // rewardChannel.createChannel(
    //     channelId,
    //     channelFunder,
    //     capacity,
    //     {
    //       from: faucet,
    //       value: oneEth
    //     }
    //   );

    // const txResult = await rewardChannel.createChannel(
    //   channelId,
    //   channelFunder,
    //   capacity,
    //   {
    //     from: faucet,
    //     value: oneEth
    //   }
    // );

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
    const rewardAmount = await rewardChannel.rewardAmount();
    const price = await rewardChannel.price();

    const capacity = 10;
    const model = 'food';
    const oneEth = web3.toWei(1, 'ether');
    const channelId = soliditySha3(channelFunder, model, capacity);

    const expectedReward = oneEth * rewardAmount / price;

    token.transfer(rewardChannel.address, 1000000, { from: contractOwner });

    await rewardChannel.createChannel(channelId, channelFunder, capacity, {
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

  it('should increaseCapacity', async () => {
    const initialCapacity = await rewardChannel.totalCapacity();
    const txResult = await rewardChannel.increaseCapacity(100, {
      from: contractOwner
    });
    const increasedCapacity = await rewardChannel.totalCapacity();

    assert.equal(
      Number(increasedCapacity.toString()),
      Number(initialCapacity.toString()) + 100,
      'increaseCapacity function unsuccessful'
    );
  });

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
