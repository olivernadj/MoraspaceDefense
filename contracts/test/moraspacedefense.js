const fs = require('fs');
const { assertRevert } = require('./helpers/assertRevert');
const expectEvent = require('./helpers/expectEvent');

const MoraspaceDefense = artifacts.require('MoraspaceDefense');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('MoraspaceDefense', function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.token = await MoraspaceDefense.new();
  });
});
