const Crowdsale = artifacts.require("./Crowdsale.sol");

module.exports = function(deployer) {
  deployer.deploy(
    Crowdsale,
    1000,
    "0x345ca3e014aaf5dca488057592ee47305d9b3e10"
  );
};
