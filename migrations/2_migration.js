// var Migrations = artifacts.require("./Migrations.sol");
const SlidebitsToken = artifacts.require('./SlidebitsToken.sol');

module.exports = function(deployer) {
  deployer.deploy(SlidebitsToken, 'Slidebits', 'SLB');
};
