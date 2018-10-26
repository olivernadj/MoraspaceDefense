pragma solidity ^0.4.24;

library DataSets {

  struct Rocket {
    uint8 accuracy; // percentag eg.: 50 => 50% stay statuc during the round
    uint8 merit;
    uint8 knockback;
    uint256 currentCost; // current rocket price cost. it varies during the round
    uint256 launchCount; // number of launches in the current round
  }

}
