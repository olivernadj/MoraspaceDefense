const fs = require('fs');

//https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/test/helpers
const { assertRevert } = require('./helpers/assertRevert');
const expectEvent = require('./helpers/expectEvent');

const MoraspaceDefense = artifacts.require('MoraspaceDefense');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('MoraspaceDefense', function (
    [_, owner, newOwner, player1, player2, player3, player4, player5, hero, stranger]
  ) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it("get the size of the contract", function() {
    return MoraspaceDefense.deployed().then(function(instance) {
      var bytecode = instance.constructor._json.bytecode;
      var deployed = instance.constructor._json.deployedBytecode;
      var sizeOfB  = bytecode.length / 2;
      var sizeOfD  = deployed.length / 2;
      console.log("size of bytecode in bytes = ", sizeOfB);
      console.log("size of deployed in bytes = ", sizeOfD);
      console.log("initialisation and constructor code in bytes = ", sizeOfB - sizeOfD);
    });
  });

  let game;
  describe('pot, pot withdrawal and round functions by owner', function () {
    describe('instantiate a new contract, with settings', function () {
      it('instantiate a new contract', async function () {
        game = await MoraspaceDefense.new({from: owner});
        await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      });
      it('apply settings for model testing', async function() {
        game.prepareLaunchpad(1, 100, {from: owner});
        game.prepareLaunchpad(2, 100, {from: owner});
        game.prepareLaunchpad(3, 100, {from: owner});
        game.prepareLaunchpad(4, 100, {from: owner});
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
        game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
        game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
        game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      });
    });
    describe('model test scenarios', function () {
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
          _mayImpactAt: blockTime + 60,
        });
        (await game.rounds()).should.be.bignumber.equal(1);
        let round = await game.round(1);
        assert(!round[0]);
      });
      it('pot withdraws must not allowed during the game', async function () {
        await assertRevert(game.potWithdrawTo(1, owner, {from: owner}));
      });
    });
  });

  describe('launchpad functions by owner', function () {
    describe('instantiate a new contract, with settings', function () {
      it('instantiate a new contract', async function () {
        game = await MoraspaceDefense.new({from: owner});
        await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      });
      it('apply settings for model testing', async function() {
        game.prepareLaunchpad(1, 100, {from: owner});
        game.prepareLaunchpad(2, 100, {from: owner});
        game.prepareLaunchpad(3, 100, {from: owner});
        game.prepareLaunchpad(4, 100, {from: owner});
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
        game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
        game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
        game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      });
    });
    describe('model test scenarios', function () {
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
          _mayImpactAt: blockTime + 60,
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
  });

  describe('rocket functions by owner', function () {
    describe('instantiate a new contract, with settings', function () {
      it('instantiate a new contract', async function () {
        game = await MoraspaceDefense.new({from: owner});
        await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      });
      it('apply settings for model testing', async function() {
        game.prepareLaunchpad(1, 100, {from: owner});
        game.prepareLaunchpad(2, 100, {from: owner});
        game.prepareLaunchpad(3, 100, {from: owner});
        game.prepareLaunchpad(4, 100, {from: owner});
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
        game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
        game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
        game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      });
    });
    describe('model test scenarios', function () {
      it('there must be 3 rocket with different features', async function () {
        let rocket0 = await game.rocketClass(0);
        rocket0[0].should.be.bignumber.equal(0, "rocket 0 must has 0 accuracy");
        let rocket1 = await game.rocketClass(1);
        rocket1[0].should.be.bignumber.equal(100, "rocket 1 must has 100 accuracy");
        rocket1[1].should.be.bignumber.equal(1, "rocket 1 must has 1 merit");
        rocket1[2].should.be.bignumber.equal(30, "rocket 1 must has 30 knockback");
        rocket1[3].should.be.bignumber.equal(1e+15, "rocket 1 must has 1e+15 cost");
        rocket1[5].should.be.bignumber.equal(1, "rocket 1 must linked to discount #1");
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
          _mayImpactAt: blockTime + 60,
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
  });

  describe('discount functions by owner', function () {
    describe('instantiate a new contract, with settings', function () {
      it('instantiate a new contract', async function () {
        game = await MoraspaceDefense.new({from: owner});
        await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      });
      it('apply settings for model testing', async function() {
        game.prepareLaunchpad(1, 100, {from: owner});
        game.prepareLaunchpad(2, 100, {from: owner});
        game.prepareLaunchpad(3, 100, {from: owner});
        game.prepareLaunchpad(4, 100, {from: owner});
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
        game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
        game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
        game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      });
    });
    describe('model test scenarios', function () {
      it('there must be 1 discount', async function () {
        let discount0 = await game.discount(0);
        assert(!discount0[0], "discount 0 must be disabled");
        let discount1 = await game.discount(1);
        assert(discount1[0], "discount 1 must be enabled");
        discount1[1].should.be.bignumber.equal(604800, "discount 1 must has 7 days expiracy");
        discount1[2].should.be.bignumber.equal(0, "discount 1 must has not quanity");
        discount1[3].should.be.bignumber.equal(8e+14, "discount 1 must has 8e+14 price");
        discount1[4].should.be.bignumber.equal(0, "discount 1 must linked to discount #0");
        let discount2 = await game.discount(2);
        assert(!discount2[0], "discount 2 must be disabled");
      });
      it('forbid discount adjustment for stranger', async function () {
        await assertRevert(game.prepareDiscount(1, false, 0, 0, 0, 0, {from: stranger}), "remove last discount");
        await assertRevert(game.prepareDiscount(2, true, 604800, 0, 8e+14, 0, {from: stranger}), "add new discount");
      });
      it('forbid wrong discount adjustment', async function () {
        await assertRevert(game.prepareDiscount(0, false, 0, 0, 0, 0, {from: owner}), "remove none last discount");
        await assertRevert(game.prepareDiscount(2, false, 0, 0, 0, 0, {from: owner}), "remove unexist last discount");
        await assertRevert(game.prepareDiscount(2, true, 604800, 0, 8e+14, 2, {from: owner}), "discount must exists");
        await assertRevert(game.prepareDiscount(3, true, 604800, 0, 8e+14, 2, {from: owner}), "add new discount with high index");
      });
      it('allow new, modify and delete discounts', async function () {
        game.prepareDiscount(2, true, 604800, 0, 8e+14, 0, {from: owner}); //add new discount with proper index
        game.prepareDiscount(1, true, 3600, 1111, 5e+14, 2, {from: owner}); //"modify a discount
        let discount1 = await game.discount(1);
        assert(discount1[0], "discount 1 must be enabled");
        discount1[1].should.be.bignumber.equal(3600, "discount 1 must has 7 days expiracy");
        discount1[2].should.be.bignumber.equal(1111, "discount 1 must has 1111 quanity");
        discount1[3].should.be.bignumber.equal(5e+14, "discount 1 must has 5e+14 price");
        discount1[4].should.be.bignumber.equal(2, "discount 1 must linked to discount #2");
        game.prepareDiscount(2, false, 0, 0, 0, 0, {from: owner}); //remove newly added discount
        await assertRevert(game.prepareDiscount(2, false, 0, 0, 0, 0, {from: owner}), "discount can not be removed twice");
        game.prepareDiscount(1, false, 0, 0, 0, 0, {from: owner}); //remove discount
        await assertRevert(game.prepareDiscount(0, false, 0, 0, 0, 0, {from: owner}), "0 index is not allowed");
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner}); //recreate discount
      });
      it('start the round', async function () {
        await assertRevert(game.start(60, {from: stranger}), "only by owner");
        const {logs} = await game.start(60, {from: owner});
        const blockTime = web3.eth.getBlock(logs[0].blockNumber).timestamp;
        expectEvent.inLogs(logs, 'roundStart', {
          _rounds: 1,
          _started: blockTime,
          _mayImpactAt: blockTime + 60,
        });
        (await game.rounds()).should.be.bignumber.equal(1);
        let round = await game.round(1);
        assert(!round[0]);
      });
      it('forbid any discount adjustments, after the round started', async function () {
        await assertRevert(game.prepareDiscount(1, false, 0, 0, 0, 0, {from: owner}), "forbid to remove");
        await assertRevert(game.prepareDiscount(1, true, 3600, 1111, 5e+14, 2, {from: owner}), "forbid to modify");
        await assertRevert(game.prepareDiscount(2, true, 604800, 0, 8e+14, 0, {from: owner}), "forbid to add");
      });
    });
  });

  describe('prize distribution functions by owner', function () {
    describe('instantiate a new contract, with settings', function () {
      it('instantiate a new contract', async function () {
        game = await MoraspaceDefense.new({from: owner});
        await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      });
      it('apply settings for model testing', async function() {
        game.prepareLaunchpad(1, 100, {from: owner});
        game.prepareLaunchpad(2, 100, {from: owner});
        game.prepareLaunchpad(3, 100, {from: owner});
        game.prepareLaunchpad(4, 100, {from: owner});
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
        game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
        game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
        game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      });
    });
    describe('model test scenarios', function () {
      it('pie char must match', async function () {
        let prizeDist = await game.prizeDist();
        prizeDist[0].should.be.bignumber.equal(50, "hero share must be 50% !");
        prizeDist[1].should.be.bignumber.equal(24, "bounty puul must be 24% !");
        prizeDist[2].should.be.bignumber.equal(11, "next round funding must be 11% !");
        prizeDist[3].should.be.bignumber.equal(10, "affiliate fee to partner must be 10% !");
        prizeDist[4].should.be.bignumber.equal(5, "owner share must be 5% !");
      });
      it('forbid prize distribution adjustment for stranger', async function () {
        await assertRevert(game.updatePrizeDist(50, 24, 22, 10, 5, {from: stranger}));
      });
      it('forbid wrong discount adjustment', async function () {
        await assertRevert(game.updatePrizeDist(1, 2, 3, 4, 5, {from: owner}), "remove none last discount");
        await assertRevert(game.updatePrizeDist(20, 20, 20, 20, 21, {from: owner}), "remove unexist last discount");
      });
      it('modify prize distribution', async function () {
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
        game.updatePrizeDist(20, 20, 20, 20, 20, {from: owner});
        game.updatePrizeDist(90, 4, 3, 2, 1, {from: owner});
        let prizeDist = await game.prizeDist();
        prizeDist[0].should.be.bignumber.equal(90, "hero share must be 50% !");
        prizeDist[1].should.be.bignumber.equal(4, "bounty puul must be 24% !");
        prizeDist[2].should.be.bignumber.equal(3, "next round funding must be 11% !");
        prizeDist[3].should.be.bignumber.equal(2, "affiliate fee to partner must be 10% !");
        prizeDist[4].should.be.bignumber.equal(1, "owner share must be 5% !");
      });
      it('start the round', async function () {
        await assertRevert(game.start(60, {from: stranger}), "only by owner");
        const {logs} = await game.start(60, {from: owner});
        const blockTime = web3.eth.getBlock(logs[0].blockNumber).timestamp;
        expectEvent.inLogs(logs, 'roundStart', {
          _rounds: 1,
          _started: blockTime,
          _mayImpactAt: blockTime + 60,
        });
        (await game.rounds()).should.be.bignumber.equal(1);
        let round = await game.round(1);
        assert(!round[0]);
      });
      it('forbid any discount adjustments, after the round started', async function () {
        await assertRevert(game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner}));
        await assertRevert(game.updatePrizeDist(20, 20, 20, 20, 20, {from: owner}));
        await assertRevert(game.updatePrizeDist(90, 4, 3, 2, 1, {from: owner}));
      });
    });
  });

  describe('let the game begin: test round 1', function () {
    describe('instantiate a new contract, with settings', function () {
      it('instantiate a new contract', async function () {
        game = await MoraspaceDefense.new({from: owner});
        await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      });
      it('apply settings for model testing', async function() {
        game.prepareLaunchpad(1, 100, {from: owner});
        game.prepareLaunchpad(2, 100, {from: owner});
        game.prepareLaunchpad(3, 100, {from: owner});
        game.prepareLaunchpad(4, 100, {from: owner});
        game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
        game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
        game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
        game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
        game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      });
    });
    describe('model test scenarios', function () {
      it('customize the game for all features testing', async function () {
        game.prepareDiscount(2, true, 0, 15, 3e+14, 0, {from: owner});
        game.prepareDiscount(3, true, 45, 0, 2e+14, 2, {from: owner});
        game.prepareDiscount(1, true, 30, 10, 1e+14, 3, {from: owner});
        game.prepareLaunchpad(4, 5, {from: owner});
      });
      it('start the round', async function () {
        await assertRevert(game.start(60, {from: stranger}), "only by owner");
        const {logs} = await game.start(60, {from: owner});
        const blockTime = web3.eth.getBlock(logs[0].blockNumber).timestamp;
        //console.log(blockTime);
        expectEvent.inLogs(logs, 'roundStart', {
          _rounds: 1,
          _started: blockTime,
          _mayImpactAt: blockTime + 60,
        });
        (await game.rounds()).should.be.bignumber.equal(1);
        let round = await game.round(1);
        assert(!round[0]);
      });
      it('forbids inappropriate rocket launches', async function () {
        await assertRevert(game.launchRocket(2, 1, 1, 0, {from: player1, value: 29e+14})); //underpaid
        await assertRevert(game.launchRocket(2, 10, 5, 0, {from: player1, value: 3e+15})); //launchpad overload
        await assertRevert(game.launchRocket(1, 1, 1, 1, {from: player2, value: 1e+15})); //invalid user id
      });
      it('rocket 1 launches', async function () {
        const round1 = await game.round(1, {from: stranger});
        //console.log(round1[3].toNumber());
        await game.launchRocket(1, 1, 1, 0, {from: player2, value: 1e+15});
        let result = await game.launchRocket(1, 1, 1, 1, {from: player2, value: 1e+15});
        expectEvent.inLogs(result.logs, 'rocketLaunch', {
          _hits: 1,
          _mayImpactAt: round1[3].toNumber() + 60,
        });
        result = await game.launchRocket(1, 10, 2, 0, {from: player4, value: 2e+15});
        expectEvent.inLogs(result.logs, 'rocketLaunch', {
          _hits: 10,
          _mayImpactAt: round1[3].toNumber() + 360,
        });
      });
      it('check merits (affected by rocket 1 launches)', async function () {
        let mertis2 = await game.getPlayerMerits(player2, 0, {from: stranger});
        mertis2[0].should.be.bignumber.equal(2);
        let mertis4 = await game.getPlayerMerits(player4, 2, {from: stranger});
        mertis4[1].should.be.bignumber.equal(10);
        // let merit0 = await game.merit(0, {from: stranger});
        // console.log(merit0);
      });
      it('rocket 2 launches', async function () {
        result = await game.launchRocket(3, 100, 2, 0, {from: player3, value: 5e+17});
        var hits = result.logs[0].args._hits.toNumber();
        assert(hits > 40 && hits < 60, "success rate should be +/- 10%");
        const mertis3 = await game.getPlayerMerits(player3, 0, {from: stranger});
        mertis3[1].should.be.bignumber.equal(hits * 12);
      });
    });
  });

  describe('save address to ../web/MoraspaceDefense.address', function () {
    it('instantiate a new contract and save the address', async function () {
      game = await MoraspaceDefense.new({from: owner});
      await web3.eth.sendTransaction({from: owner, to: game.address, value: 100 });
      game.prepareLaunchpad(1, 100, {from: owner});
      game.prepareLaunchpad(2, 100, {from: owner});
      game.prepareLaunchpad(3, 100, {from: owner});
      game.prepareLaunchpad(4, 100, {from: owner});
      game.prepareDiscount(1, true, 604800, 0, 8e+14, 0, {from: owner});
      game.adjustRocket(1, 100, 1, 30, 1e+15, 1, {from: owner});
      game.adjustRocket(2, 75, 5, 60, 3e+15, 0, {from: owner});
      game.adjustRocket(3, 50, 12, 120, 5e+15, 0, {from: owner});
      game.updatePrizeDist(50, 24, 11, 10, 5, {from: owner});
      fs.writeFile("../web/MoraspaceDefense.address", game.address, function(err) {
        assert.equal(err, null, 'The file was not saved.');
      });
    });
  });
});
