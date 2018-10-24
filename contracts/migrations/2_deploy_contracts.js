var SafeMath = artifacts.require("./SafeMath.sol");
var MoraspaceDefense = artifacts.require("./MoraspaceDefense.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, MoraspaceDefense);
  deployer.deploy(MoraspaceDefense, { from: accounts[0] });
};
