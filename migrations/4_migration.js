// var Migrations = artifacts.require("./Migrations.sol");
const SlidebitsToken = artifacts.require('./SlidebitsToken.sol');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SlidebitsToken, 'Slidebits', 'SLB', { from: accounts[0] });
};
