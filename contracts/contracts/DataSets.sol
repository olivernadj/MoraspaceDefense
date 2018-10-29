pragma solidity ^0.4.24;

library DataSets {

  struct Rocket {
    uint8 accuracy; // percentag eg.: 50 => 50% stay statuc during the round
    uint8 merit;
    uint8 knockback;
    uint256 cost; // current rocket price cost. it varies during the round
    uint256 launches; // number of launches in the current round
    uint8 discount; // foreign key of discount
  }

  struct Discount {
    bool valid; // the discount become offer if any of the feqture expire or run out
    uint256 duration; // for time limited offer
    uint256 qty; // for quantity limited offer
    uint256 cost;
    uint8 next; //when current discont expired can replaced by the next.
  }

  struct Launchpad {
    // size = 0  means out of use
    uint256 size; // batch size of how many rockets can be launched in one time
    uint256 merits; // accumilated merits
  }

  struct PrizeDist {
    uint8 hiro; // hiro jackpot
    uint8 bounty; // bounty pool
    uint8 next; // next round pot
    uint8 partners; // affiliate partners
    uint8 moraspace; // contract owner
  }

  struct Round {
    bool over;
    uint256 started;
    uint256 duration;
    uint256 mayFinish;
    int256[] merit; // accumilated merits on each launchpads
    uint256 bounty; // bounty for each merits on winning launchpad
    address hiro;
    uint256 jackpot;
    uint8 launchpad;
  }

  struct Player {
    uint16 round; // last participated round
    uint256[] merit; // accumilated merits on each launchpads
    uint256 earnings;
  }

}
