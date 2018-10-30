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
    // pot
    it('pot must match with initial transfer', async function () {
      (await this.game.pot()).should.be.bignumber.equal(100);
    });
    it('pot overwithdraws must not allowed', async function () {
      await assertRevert(this.game.potWithdrawTo(124, owner, {from: owner}));
    });
    it('pot withdraws must not allowed from non owner address', async function () {
      await assertRevert(this.game.potWithdrawTo(100, owner, {from: stranger}));
    });
    it('pot must be withdrawable by owner', async function () {
      const {logs} = await this.game.potWithdrawTo(100, stranger, {from: owner});
      //console.log(logs);
      expectEvent.inLogs(logs, 'potWithdraw', {
        _eth: 100,
        _to: stranger,
        _by: owner,
      });
      await web3.eth.sendTransaction({from: owner, to: this.game.address, value: 123 });
      (await this.game.pot()).should.be.bignumber.equal(123);
    });
    // round
    it('rounds must stay put', async function () {
      (await this.game.rounds()).should.be.bignumber.equal(0);
      let round = await this.game.round(0);
      assert(round[0]);
    });
    // launchpad
    it('there must be 4 launchpad with 100 batch size capacity', async function () {
      (await this.game.launchpads()).should.be.bignumber.equal(4);
      (await this.game.launchpad(0)).should.be.bignumber.equal(0);
      (await this.game.launchpad(1)).should.be.bignumber.equal(100);
      (await this.game.launchpad(2)).should.be.bignumber.equal(100);
      (await this.game.launchpad(3)).should.be.bignumber.equal(100);
      (await this.game.launchpad(4)).should.be.bignumber.equal(100);
      (await this.game.launchpad(5)).should.be.bignumber.equal(0);
    });
    it('forbid launchpad preparation for stranger', async function () {
      await assertRevert(this.game.prepareLaunchpad(4, 0, {from: stranger}), "remove last launchpad");
      await assertRevert(this.game.prepareLaunchpad(5, 100, {from: stranger}), "add new launchpad");
    });
    it('forbid wrong launchpad preparation', async function () {
      await assertRevert(this.game.prepareLaunchpad(1, 0, {from: owner}), "remove none last launchpad");
      await assertRevert(this.game.prepareLaunchpad(2, 0, {from: owner}), "remove none last launchpad");
      await assertRevert(this.game.prepareLaunchpad(3, 0, {from: owner}), "remove none last launchpad");
      await assertRevert(this.game.prepareLaunchpad(6, 100, {from: owner}), "add new launchpad with high index");
    });
    // rocket
    it('there must be 3 rocket with different features', async function () {
      let rocket0 = await this.game.rocketClass(0);
      rocket0[0].should.be.bignumber.equal(0, "rocket 0 must has 0 accuracy");
      let rocket1 = await this.game.rocketClass(1);
      rocket1[0].should.be.bignumber.equal(100, "rocket 1 must has 100 accuracy");
      rocket1[1].should.be.bignumber.equal(1, "rocket 1 must has 1 merit");
      rocket1[2].should.be.bignumber.equal(30, "rocket 1 must has 30 knockback");
      rocket1[3].should.be.bignumber.equal(1e+15, "rocket 1 must has 1e+15 cost");
      rocket1[5].should.be.bignumber.equal(1, "rocket 1 must linket to discount #1");
      let rocket2 = await this.game.rocketClass(2);
      rocket2[0].should.be.bignumber.equal(75, "rocket 2 must has 75 accuracy");
      let rocket3 = await this.game.rocketClass(3);
      rocket3[0].should.be.bignumber.equal(50, "rocket 3 must has 50 accuracy");
      let rocket4 = await this.game.rocketClass(4);
      rocket4[0].should.be.bignumber.equal(0, "rocket 4 must has 0 accuracy");
    });
    it('forbid rocket adjustment for stranger', async function () {
      await assertRevert(this.game.adjustRocket(3, 0, 0, 0, 0, 0, {from: stranger}), "remove last rocket");
      await assertRevert(this.game.adjustRocket(4, 100, 5, 60, 1000, 0, {from: stranger}), "add new rocket");
    });
    it('forbid wrong rocket adjustment', async function () {
      await assertRevert(this.game.adjustRocket(0, 0, 0, 0, 0, 0, {from: owner}), "remove none last rocket");
      await assertRevert(this.game.adjustRocket(1, 0, 0, 0, 0, 0, {from: owner}), "remove none last rocket");
      await assertRevert(this.game.adjustRocket(2, 0, 0, 0, 0, 0, {from: owner}), "remove none last rocket");
      await assertRevert(this.game.adjustRocket(5 , 100, 5, 60, 1000, 0, {from: owner}), "add new rocket with high index");
    });
  });

  // it('Save address to ../web/MoraspaceDefense.address', async function () {
  //   fs.writeFile("../web/MoraspaceDefense.address", this.game.address, function(err) {
  //     assert.equal(err, null, 'The file was not saved.');
  //   });
  // });
});
