pragma solidity ^0.4.24;
import "./SafeMath.sol";
import "./NameFilter.sol";
import "./DataSets.sol";

/**
 * Owned contract
 */
contract Owned {
  address public owner;
  address public newOwner;

  event OwnershipTransferred(address indexed _from, address indexed _to);

  constructor() public {
    owner = msg.sender;
  }

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  function transferOwnership(address _newOwner) public onlyOwner {
    newOwner = _newOwner;
  }

  function acceptOwnership() public {
    require(msg.sender == newOwner);
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
    newOwner = address(0);
  }
}

/**
 * @title MoraspaceDefense contract implementation
 */
contract MoraspaceDefense is Owned {
  using SafeMath for *; // solity directive using A for B;
  using NameFilter for string;
  uint256 public pot = 0;
  DataSets.PrizeDist public prizeDist;
  DataSets.Round public round;
  uint8 public rocketClasses;
  uint8 public discounts;
  uint8 public launchpads;
  mapping (uint8 => DataSets.Rocket) public rocketClass;
  mapping (uint8 => DataSets.Rocket) public rocketSupply;
  mapping (uint8 => DataSets.Discount) public discount;
  mapping (uint8 => DataSets.Launchpad) public launchpad;

  /**
   * @dev allows things happen before the new round started
   */
  modifier onlyBeforeARound {
    require(round.over == true, "Sorry the round has begun!");
    _;
  }

  /**
   * @dev allows things happen only during the live round
   */
  modifier onlyLiveRound {
    require(round.over == false, "Sorry the new round has not started yet!");
    _;
  }

  /**
   * @dev prevents contracts from interacting with fomo3d
   */
  modifier isHuman(address _addr) {
    uint256 _codeSize;
    assembly {_codeSize := extcodesize(_addr)}
    require(_codeSize == 0, "Sorry humans only!");
    _;
  }

  /**
   * @dev The constructor responsible to set and reset variables.
   */
  constructor() public {
    // initial settings what can be modified
    rocketClass[0] = DataSets.Rocket(100, 1, 30, 1000000000000000, 0);
    rocketClass[1] = DataSets.Rocket(75, 5, 60, 3000000000000000, 0);
    rocketClass[2] = DataSets.Rocket(50, 12, 120, 5000000000000000, 0);
    rocketClasses  = 3;
    launchpad[0]   = DataSets.Launchpad(100);
    launchpad[1]   = DataSets.Launchpad(100);
    launchpad[2]   = DataSets.Launchpad(100);
    launchpad[3]   = DataSets.Launchpad(100);
    launchpads     = 4;
    round.over     = true;
  }

  function prepareLaunchpad (
    uint8 _i,
    uint256 _size //0 means out of use
  ) external onlyOwner() onlyBeforeARound() {
    require(_i <= launchpads, "Index can not higher than one.");
    require(!(_size == 0 && _i != launchpads - 1), "You can remove only the last item.");
    launchpad[_i].size = _size;
    if (_size == 0) launchpads.sub(1);
    if (_i == launchpads) launchpads.add(1);
  }

  function adjustRocket(
    uint8 _i,
    uint8 _accuracy, //0 means removed
    uint8 _merit,
    uint8 _knockback,
    uint256 _cost
  ) external onlyOwner() onlyBeforeARound() {
    require(_i <= rocketClasses, "Index can not higher than one.");
    require(!(_accuracy == 0 && _i != rocketClasses - 1), "You can remove only the last item.");
    require(_accuracy <= 100, "Maxumum accuracy is 100!");
    rocketClass[_i].accuracy = _accuracy;
    rocketClass[_i].merit = _merit;
    rocketClass[_i].knockback = _knockback;
    rocketClass[_i].cost = _cost;
    if (_accuracy == 0) rocketClasses.sub(1);
    if (_i == rocketClasses) rocketClasses.add(1);
  }

  function prepareDiscount (
    uint8 _i,
    bool _valid, //false means removed
    uint256 _duration,
    uint256 _qty,
    uint8 _nextDiscount //when current discount expired can replaced by the next.
  ) external onlyOwner() onlyBeforeARound() {
    require(_i <= discounts, "Index can not higher than one.");
    require(!(_valid == false && _i != discounts - 1), "You can remove only the last item.");
    discount[_i].valid = _valid;
    discount[_i].duration = _duration;
    discount[_i].qty = _qty;
    discount[_i].next = _nextDiscount;
    if (_valid == false) discounts.sub(1);
    if (_i == discounts) discounts.add(1);
  }

  function updatePrizeDist(
    uint8 _hiro,
    uint8 _bounty,
    uint8 _next,
    uint8 _partners,
    uint8 _moraspace
  ) external onlyOwner() onlyBeforeARound() {
    require(_hiro + _bounty + _next + _partners + _moraspace == 100,
      "O.o The sum of pie char should be around 100!");
    prizeDist.hiro = _hiro;
    prizeDist.bounty = _bounty;
    prizeDist.next = _next;
    prizeDist.partners = _partners;
    prizeDist.moraspace = _moraspace;
  }

  /**
   * @dev sets the prize or increments is
   */
  function potUp() payable external {
    require(msg.value > 0, "Nothing to deposit!");
    pot.add(msg.value);
  }

  /**
   * @dev Withdraws from remaining pot and sends to given address
   */
  function potWithdrawTo(uint256 _eth, address _to) external onlyOwner() onlyBeforeARound() {
    require(_eth >= 0, "The requested amount need to be explicit!");
    require(_eth > pot, "Insufficient found!");
    require(_to != address(0), "Address can not be zero!");
    _to.transfer(_eth);
  }

  /**
   * @dev start a new round
   */
  function start() external onlyOwner() onlyBeforeARound() {
    require(prizeDist.hiro + prizeDist.bounty + prizeDist.next + prizeDist.partners + prizeDist.moraspace == 100,
      "O.o The sum of pie char should be around 100!");
    require(rocketClasses > 0, "Not rocket calsses added!");
    for (uint8 i = 0; i < rocketClasses; ++i) {
      rocketSupply[i] = rocketClass[i];
    }
    round.over = false;
  }


  function lunchRocket (uint8 _rocket, uint8 _amount, uint8 _launchpad) external payable onlyLiveRound() {
    require(_rocket < rocketClasses, "Undefined rocket!");
    require(_amount > 0, "0 rockets can not be lounched!");
    //require(_amount >= rocketSupply[_i].maxBatchSize, "Max rocket batch size exceed!");
    //accounts[msg.sender].eth.add(msg.value);
    for (uint8 i = 0; i < _amount; ++i) {

    }
  }

  /**
   * @dev uses the previous blockhash for random generation
   */
  function getRandom(uint8 _maxRan) public view returns(uint8) {
      uint256 _genNum = uint256(keccak256(abi.encodePacked(blockhash(block.number-1))));
      return uint8(_genNum % _maxRan);
  }

}
