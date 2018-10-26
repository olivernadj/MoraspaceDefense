var SafeMath = artifacts.require("./SafeMath.sol");
var NameFilter = artifacts.require("./NameFilter.sol");
var DataSets = artifacts.require("./DataSets.sol");
var MoraspaceDefense = artifacts.require("./MoraspaceDefense.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SafeMath);
  deployer.deploy(NameFilter);
  deployer.deploy(DataSets);
  deployer.link(SafeMath, NameFilter, MoraspaceDefense);
  deployer.deploy(MoraspaceDefense, { from: accounts[0] });
};
