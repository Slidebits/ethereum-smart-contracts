const SlidebitsToken = artifacts.require('./SlidebitsToken.sol');
const RewardChannel = artifacts.require('./RewardChannel.sol');

module.exports = async (deployer, network, accounts) => {
  token = await deployer.deploy(SlidebitsToken, 'Slidebits', 'SLB');
  deployer.deploy(
    RewardChannel,
    1000,
    400,
    SlidebitsToken.address,
    accounts[2]
  );
};
