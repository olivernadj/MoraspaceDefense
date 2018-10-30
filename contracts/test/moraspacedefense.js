const fs = require('fs');
//const util = require('util');
const { assertRevert } = require('./helpers/assertRevert');
const expectEvent = require('./helpers/expectEvent');

const MoraspaceDefense = artifacts.require('MoraspaceDefense');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('MoraspaceDefense', function ([_, owner, newOwner, player1, player2, hiro, stranger]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  // fs.writeFile("./web3.log", util.inspect(web3), function(err) {
  //   assert.equal(err, null, 'Web3 file was not saved.');
  // });

  beforeEach(async function () {
    this.game = await MoraspaceDefense.new({from: owner});
    var result = await web3.eth.sendTransaction({from: owner, to: this.game.address, value: 100 });
    //console.log(result);
    //var number = web3.eth.blockNumber;
    //console.log(number);
  });

  describe('before the round start', function () {
    it('pot must match with initial transfer', async function () {
      (await this.game.pot()).should.be.bignumber.equal(100);
    });
    it('pot over withdraws must not allowed', async function () {
      await assertRevert(this.game.potWithdrawTo(124, owner, {from: owner}));
    });
    it('pot withdraws must not allowed from non owner address', async function () {
      await assertRevert(this.game.potWithdrawTo(100, owner, {from: stranger}));
    });
    it('pot must be withdrawable by owner', async function () {
      const {logs} = await this.game.potWithdrawTo(100, newOwner, {from: owner});
      //console.log(logs);
      expectEvent.inLogs(logs, 'potWithdraw', {
        _eth: 100,
        _to: newOwner,
        _by: owner,
      });
      await web3.eth.sendTransaction({from: owner, to: this.game.address, value: 123 });
      (await this.game.pot()).should.be.bignumber.equal(123);
    });
  });

  // it('Save address to ../web/MoraspaceDefense.address', async function () {
  //   fs.writeFile("../web/MoraspaceDefense.address", this.game.address, function(err) {
  //     assert.equal(err, null, 'The file was not saved.');
  //   });
  // });
});
