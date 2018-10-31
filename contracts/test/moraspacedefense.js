const fs = require('fs');

//https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/test/helpers
const { assertRevert } = require('./helpers/assertRevert');
const expectEvent = require('./helpers/expectEvent');

const MoraspaceDefense = artifacts.require('MoraspaceDefense');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('MoraspaceDefense', function ([_, owner, newOwner, player1, player2, hero, stranger]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  let game;
  describe('pot, pot withdrawal and round functions by owner', function () {
    it('instantiate a new contract', async function () {
      game = await MoraspaceDefense.new({from: owner});
      await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
    });
    it('pot must match with initial transfer', async function () {
      (await game.pot()).should.be.bignumber.equal(100);
    });
    it('pot overwithdraws must not allowed', async function () {
      await assertRevert(game.potWithdrawTo(124, owner, {from: owner}));
    });
    it('pot withdraws must not allowed from non owner address', async function () {
      await assertRevert(game.potWithdrawTo(100, owner, {from: stranger}));
    });
    it('pot must be withdrawable by owner', async function () {
      const {logs} = await game.potWithdrawTo(100, stranger, {from: owner});
      expectEvent.inLogs(logs, 'potWithdraw', {
        _eth: 100,
        _to: stranger
      });
      await web3.eth.sendTransaction({from: owner, to: game.address, value: 123 });
      (await game.pot()).should.be.bignumber.equal(123);
    });
    it('rounds must wait for start', async function () {
      (await game.rounds()).should.be.bignumber.equal(0);
      let round = await game.round(0);
      assert(round[0]);
    });
    it('start the round', async function () {
      await assertRevert(game.start(60, {from: stranger}), "only by owner");
      const {logs} = await game.start(60, {from: owner});
      const blockTime = web3.eth.getBlock(logs[0].blockNumber).timestamp;
      expectEvent.inLogs(logs, 'roundStart', {
        _rounds: 1,
        _started: blockTime,
        _mayFinish: blockTime + 60,
      });
      (await game.rounds()).should.be.bignumber.equal(1);
      let round = await game.round(1);
      assert(!round[0]);
    });
    it('pot withdraws must not allowed during the game', async function () {
      await assertRevert(game.potWithdrawTo(1, owner, {from: owner}));
    });
  });

  describe('launchpad functions by owner', function () {
    it('instantiate a new contract', async function () {
      game = await MoraspaceDefense.new({from: owner});
      await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
    });
    it('there must be 4 launchpad with 100 batch size capacity', async function () {
      (await game.launchpads()).should.be.bignumber.equal(4);
      (await game.launchpad(0)).should.be.bignumber.equal(0);
      (await game.launchpad(1)).should.be.bignumber.equal(100);
      (await game.launchpad(2)).should.be.bignumber.equal(100);
      (await game.launchpad(3)).should.be.bignumber.equal(100);
      (await game.launchpad(4)).should.be.bignumber.equal(100);
      (await game.launchpad(5)).should.be.bignumber.equal(0);
    });
    it('forbid launchpad preparation for stranger', async function () {
      await assertRevert(game.prepareLaunchpad(4, 0, {from: stranger}), "remove last launchpad");
      await assertRevert(game.prepareLaunchpad(5, 100, {from: stranger}), "add new launchpad");
    });
    it('forbid wrong launchpad preparation', async function () {
      await assertRevert(game.prepareLaunchpad(1, 0, {from: owner}), "remove none last launchpad");
      await assertRevert(game.prepareLaunchpad(2, 0, {from: owner}), "remove none last launchpad");
      await assertRevert(game.prepareLaunchpad(3, 0, {from: owner}), "remove none last launchpad");
      await assertRevert(game.prepareLaunchpad(6, 100, {from: owner}), "add new launchpad with high index");
    });
    it('allow new, modify and delete launchpads', async function () {
      game.prepareLaunchpad(5, 100, {from: owner}); //add new launchpad with proper index
      (await game.launchpad(5)).should.be.bignumber.equal(100);
      game.prepareLaunchpad(4, 55, {from: owner}); // modify a launchpad
      (await game.launchpad(4)).should.be.bignumber.equal(55);

      game.prepareLaunchpad(5, 0, {from: owner}); //remove newly added launchpad
      await assertRevert(game.prepareLaunchpad(5, 0, {from: owner}), "launchpad can not be removed twice");
      game.prepareLaunchpad(4, 0, {from: owner}); //remove launchpad
      game.prepareLaunchpad(3, 0, {from: owner}); //remove launchpad
      game.prepareLaunchpad(2, 0, {from: owner}); //remove launchpad
      game.prepareLaunchpad(1, 0, {from: owner}); //remove launchpad
      await assertRevert(game.prepareLaunchpad(0, 0, {from: owner}), "0 index is not allowed");
      await assertRevert(game.prepareLaunchpad(2, 100, {from: owner}), "must start with 1");
      game.prepareLaunchpad(1, 100, {from: owner}); //recreate launchpad
      (await game.launchpad(1)).should.be.bignumber.equal(100);
      game.prepareLaunchpad(2, 100, {from: owner}); //recreate launchpad
      (await game.launchpad(2)).should.be.bignumber.equal(100);
      game.prepareLaunchpad(3, 100, {from: owner}); //recreate launchpad
      (await game.launchpad(3)).should.be.bignumber.equal(100);
      game.prepareLaunchpad(4, 100, {from: owner}); //recreate launchpad
      (await game.launchpad(4)).should.be.bignumber.equal(100);
    });
    it('start the round', async function () {
      await assertRevert(game.start(60, {from: stranger}), "only by owner");
      const {logs} = await game.start(60, {from: owner});
      const blockTime = web3.eth.getBlock(logs[0].blockNumber).timestamp;
      expectEvent.inLogs(logs, 'roundStart', {
        _rounds: 1,
        _started: blockTime,
        _mayFinish: blockTime + 60,
      });
      (await game.rounds()).should.be.bignumber.equal(1);
      let round = await game.round(1);
      assert(!round[0]);
    });
    it('forbid any launchpad adjustments, after the round started', async function () {
      await assertRevert(game.prepareLaunchpad(4, 0, {from: owner}), "forbid to remove");
      await assertRevert(game.prepareLaunchpad(4, 100, {from: owner}), "forbid to modify");
      await assertRevert(game.prepareLaunchpad(5, 100, {from: owner}), "forbid to add");
    });
  });

  describe('rocket functions by owner', function () {
    it('instantiate a new contract', async function () {
      game = await MoraspaceDefense.new({from: owner});
      await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
    });
    it('there must be 3 rocket with different features', async function () {
      let rocket0 = await game.rocketClass(0);
      rocket0[0].should.be.bignumber.equal(0, "rocket 0 must has 0 accuracy");
      let rocket1 = await game.rocketClass(1);
      rocket1[0].should.be.bignumber.equal(100, "rocket 1 must has 100 accuracy");
      rocket1[1].should.be.bignumber.equal(1, "rocket 1 must has 1 merit");
      rocket1[2].should.be.bignumber.equal(30, "rocket 1 must has 30 knockback");
      rocket1[3].should.be.bignumber.equal(1e+15, "rocket 1 must has 1e+15 cost");
      rocket1[5].should.be.bignumber.equal(1, "rocket 1 must linket to discount #1");
      let rocket2 = await game.rocketClass(2);
      rocket2[0].should.be.bignumber.equal(75, "rocket 2 must has 75 accuracy");
      let rocket3 = await game.rocketClass(3);
      rocket3[0].should.be.bignumber.equal(50, "rocket 3 must has 50 accuracy");
      let rocket4 = await game.rocketClass(4);
      rocket4[0].should.be.bignumber.equal(0, "rocket 4 must has 0 accuracy");
    });
    it('forbid rocket adjustment for stranger', async function () {
      await assertRevert(game.adjustRocket(3, 0, 0, 0, 0, 0, {from: stranger}), "remove last rocket");
      await assertRevert(game.adjustRocket(4, 100, 5, 60, 1000, 0, {from: stranger}), "add new rocket");
    });
    it('forbid wrong rocket adjustment', async function () {
      await assertRevert(game.adjustRocket(0, 0, 0, 0, 0, 0, {from: owner}), "remove none last rocket");
      await assertRevert(game.adjustRocket(1, 0, 0, 0, 0, 0, {from: owner}), "remove none last rocket");
      await assertRevert(game.adjustRocket(1, 100, 1, 30, 1e+15, 2, {from: owner}), "discount must exists");
      await assertRevert(game.adjustRocket(2, 0, 0, 0, 0, 0, {from: owner}), "remove none last rocket");
      await assertRevert(game.adjustRocket(5 , 100, 5, 60, 1000, 0, {from: owner}), "add new rocket with high index");
    });
    it('allow new, modify and delete rockets', async function () {
      game.adjustRocket(4, 100, 5, 60, 1e+14, 0, {from: owner}); //add new rocket with proper index
      game.adjustRocket(1, 90, 2, 35, 1e+15, 0, {from: owner}); //"modify a rocket
      let rocket1 = await game.rocketClass(1);
      rocket1[0].should.be.bignumber.equal(90, "rocket 1 must has 90 accuracy");
      rocket1[1].should.be.bignumber.equal(2, "rocket 1 must has 2 merit");
      rocket1[2].should.be.bignumber.equal(35, "rocket 1 must has 35 knockback");
      rocket1[3].should.be.bignumber.equal(1e+15, "rocket 1 must has 1e+15 cost");
      rocket1[5].should.be.bignumber.equal(0, "rocket 1 must not linked to discounts");
      game.adjustRocket(4, 0, 0, 0, 0, 0, {from: owner}); //remove newly added rocket
      await assertRevert(game.adjustRocket(4, 0, 0, 0, 0, 0, {from: owner}), "rocket can not be removed twice");
      game.adjustRocket(3, 0, 0, 0, 0, 0, {from: owner}); //remove rocket
      game.adjustRocket(2, 0, 0, 0, 0, 0, {from: owner}); //remove rocket
      game.adjustRocket(1, 0, 0, 0, 0, 0, {from: owner}); //remove rocket
      await assertRevert(game.adjustRocket(0, 0, 0, 0, 0, 0, {from: owner}), "0 index is not allowed");
      game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner}); //recreate rockets
      game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner}); //recreate rockets
      game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner}); //recreate rockets
    });
    it('start the round', async function () {
      await assertRevert(game.start(60, {from: stranger}), "only by owner");
      const {logs} = await game.start(60, {from: owner});
      const blockTime = web3.eth.getBlock(logs[0].blockNumber).timestamp;
      expectEvent.inLogs(logs, 'roundStart', {
        _rounds: 1,
        _started: blockTime,
        _mayFinish: blockTime + 60,
      });
      (await game.rounds()).should.be.bignumber.equal(1);
      let round = await game.round(1);
      assert(!round[0]);
    });
    it('forbid any rocket adjustments, after the round started', async function () {
      await assertRevert(game.adjustRocket(3, 0, 0, 0, 0, 0, {from: owner}), "forbid to remove");
      await assertRevert(game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner}), "forbid to modify");
      await assertRevert(game.adjustRocket(4, 100, 1, 30, 1e+15, 1, {from: owner}), "forbid to add");
    });
  });

  describe('save address to ../web/MoraspaceDefense.address', function () {
    it('instantiate a new contract and save the address', async function () {
      game = await MoraspaceDefense.new({from: owner});
      await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      fs.writeFile("../web/MoraspaceDefense.address", game.address, function(err) {
        assert.equal(err, null, 'The file was not saved.');
      });
    });
  });
});
