# MoraspaceDefense
Smart Contract Game on Ethereum


## Deployment
https://ropsten.etherscan.io/address/0x6382b5b06d571cced3c4426b03e967788786bbc3#readContract


## Test
![Mocha Test](https://raw.githubusercontent.com/olivernadj/MoraspaceDefense/master/contracts/test/result.png "Mocha Test")


## Story

No one knew why they came, and in the end, it didn’t matter. The cold silhouette appeared as a green, blinking dot on the Extraterrestrial Investigation Agency’s radar, creeping its way towards Earth in approximately 24 hours. But we are not afraid. Afterall, the human race survived the Battle of Mercury in 2087 with worse equipments. 
2:16 am. Still half asleep, you picked up an unexpected phone call. “It’s time.” - then the line went dead. As a Guardian of the new world, you knew exactly what it meant.

### Mission
The last Guardian to hit the alien ship when the timer runs out will be hailed as Hero and win the jackpot!

### Guardian Manual

**Rockets**
You will purchase and launch rockets from a launchpad of choice.


Rockets will knockback the vessel upon impact. They carry the pyrophoric substance Mortanium which covers the alien ship and explodes when in contact with Earth’s oxygen.


MoraSpace currently has 3 different types of rocket:
Tier 1 - 100% accuracy, 1 merit, +30s knockback, costs 0.001 eth
Tier 2 - 75% accuracy, 5 merit, +60s knockback, costs 0.003 eth
Tier 3 - 50% accuracy, 12 Merit, +90s knockback, costs 0.005 eth


Cost of Rockets will double for every 10,000 rockets.

Sample of Rocket Tier 3


Timer caps at 24 hours (~360,000 km from Earth), beyond that, the ship is out of range.



**Peace Merits & Bounty**
For every successful rocket hit, you will accumulate Merits. There will be a side bounty pool for all rockets from the same launchpad as the last rocket. 


Bounty is divided proportionally to the amount of Merits you have at that launchpad. 

One can buy many rockets from different launchpad, let's say I have 10 merits in launchpad 1 and 20 in launchpad 2. If the winner had the last rocket in launchpad 1, only merits in launchpad 1 are counted for me. So I will receive some $ from that. = (25% of Jackpot) / (total merits in launchpad 1 of all users - merits of winners) * (my merits in launchpad 1)
