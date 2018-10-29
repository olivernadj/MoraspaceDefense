pragma solidity ^0.4.24;

library DataSets {

  struct Rocket {
    uint8 accuracy; // percentag eg.: 50 => 50% stay statuc during the round.
    uint8 merit; // this amount of merit will be debited after each hits.
    uint8 knockback; //extend Round.mayFinish with knockack from hits.
    uint256 cost; // current rocket price cost. it varies during the round.
    uint256 launches; // number of launches in the current round.
    uint8 discount; // foreign key of discount.
  }

  struct Discount {
    bool valid; // the discount become offer if any of the feqture expire or run out.
    uint256 duration; // for time limited offer.
    uint256 qty; // for quantity limited offer.
    uint256 cost; // discount price.
    uint8 next; //when current discont expired can replaced by the next.
  }

  struct Launchpad {
    // size = 0  means out of use
    uint256 size; // batch size of how many rockets can be launched in one time.
  }

  struct PrizeDist {
    uint8 hiro; // hiro jackpot.
    uint8 bounty; // bounty pool.
    uint8 next; // next round pot.
    uint8 partners; // affiliate partners.
    uint8 moraspace; // contract owner.
  }

  struct Round {
    bool over; // true means game over.
    uint256 started; // static value of time stamp when the round started.
    uint256 duration; // statuc value of initial duration.
    uint256 mayFinish; // finish timestamp. can be knockback (increment) with hits before this time reached.
    uint256[] merit; // accumilated merits on each launchpads.
    uint256 bounty; // bounty for each merits on winning launchpad.
    uint256 jackpot; // jackpot amount eg.: 50% of the pot.
    address hiro; // last hero.
    uint8 launchpad; // last launchpad.
  }

  struct Player {
    uint16 round; // last participated round.
    address addr; // ETH address of the player.
    uint256[] merit; // accumilated merits on each launchpads.
    uint256 earnings; // Withdrawable amount.
    uint256 updated; // last modified.
  }

  struct Hero {
    address addr;
    bytes32 name;
  }
}
