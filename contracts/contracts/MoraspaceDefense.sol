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
    require(msg.sender == owner, "Only owner can do that!");
    _;
  }

  function transferOwnership(address _newOwner) public onlyOwner {
    newOwner = _newOwner;
  }

  function acceptOwnership() public {
    require(msg.sender == newOwner, "Only new owner can do that!");
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
  mapping (uint8 => DataSets.Rocket) public rocketClass;
  mapping (uint8 => DataSets.Rocket) public rocketSupply;
  uint8 public rocketClasses;
  mapping (uint8 => DataSets.Discount) public discount;
  uint8 public discounts;
  mapping (uint8 => DataSets.Launchpad) public launchpad;
  uint8 public launchpads;
  mapping (uint16 => DataSets.Hero) public hero;
  mapping (uint16 => DataSets.Round) public round;
  uint16 public rounds;
  mapping (uint256 => DataSets.Player) public player;
  address[] public playerDict;

  event potWithdraw(uint256 indexed _eth, address indexed _to, address indexed _by);

  /**
   * @dev allows things happen before the new round started
   */
  modifier onlyBeforeARound {
    require(round[rounds].over == true, "Sorry the round has begun!");
    _;
  }

  /**
   * @dev allows things happen before the new round started
   */
  modifier beforeNotTooLate {
    require(round[rounds].mayFinish < now, "Sorry it is too late!");
    _;
  }

  /**
   * @dev allows things happen only during the live round
   */
  modifier onlyLiveRound {
    require(round[rounds].over == false, "Sorry the new round has not started yet!");
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
   * - initial settings can be modified later by owner
   * - mapping index starts with 1, 0 is used to terminate reference
   */
  constructor() public {
    round[0].over       = true;
    rounds              = 0;
    launchpad[1]        = DataSets.Launchpad(100);
    launchpad[2]        = DataSets.Launchpad(100);
    launchpad[3]        = DataSets.Launchpad(100);
    launchpad[4]        = DataSets.Launchpad(100);
    launchpads          = 4;
    discount[1]         = DataSets.Discount(true, 604800, 0, 800000000000000, 0);
    discounts           = 1;
    rocketClass[1]      = DataSets.Rocket(100, 1, 30, 1000000000000000, 0, 1);
    rocketClass[2]      = DataSets.Rocket(75, 5, 60, 3000000000000000, 0, 0);
    rocketClass[3]      = DataSets.Rocket(50, 12, 120, 5000000000000000, 0, 0);
    rocketClasses       = 3;
    prizeDist.hiro      = 50;
    prizeDist.bounty    = 24;
    prizeDist.next      = 11;
    prizeDist.partners  = 10;
    prizeDist.moraspace = 5;
  }

  function prepareLaunchpad (
    uint8 _i,
    uint256 _size //0 means out of use
  ) external onlyOwner() onlyBeforeARound() {
    require(_i <= launchpads + 1, "Index can not be higher with more than one!");
    require(!(_size == 0 && _i != launchpads), "You can remove only the last item.");
    launchpad[_i].size = _size;
    if (_size == 0) --launchpads;
    if (_i == launchpads + 1) ++launchpads;
  }

  function adjustRocket(
    uint8 _i,
    uint8 _accuracy, //0 means removed
    uint8 _merit,
    uint8 _knockback,
    uint256 _cost,
    uint8 _discount // link to discount
  ) external onlyOwner() onlyBeforeARound() {
    require(_i <= rocketClasses + 1, "Index can not be higher with more than one!");
    require(!(_accuracy == 0 && _i != rocketClasses), "You can remove only the last item!");
    require(_accuracy <= 100, "Maxumum accuracy is 100!");
    require(!(_discount > 0 && (_discount > discounts || !discount[_discount].valid)),
      "The linked discount must exists and need to be valid");
    rocketClass[_i].accuracy  = _accuracy;
    rocketClass[_i].merit     = _merit;
    rocketClass[_i].knockback = _knockback;
    rocketClass[_i].cost      = _cost;
    rocketClass[_i].discount  = _discount;
    if (_accuracy == 0) --rocketClasses;
    if (_i == rocketClasses + 1) ++rocketClasses;
  }

  function prepareDiscount (
    uint8 _i,
    bool _valid, //false means removed
    uint256 _duration,
    uint256 _qty,
    uint256 _cost,
    uint8 _nextDiscount //when current discount expired can replaced by the next.
  ) external onlyOwner() onlyBeforeARound() {
    require(_i <= discounts + 1, "Index can not be higher with more than one!");
    require(!(_valid == false && _i != discounts), "You can remove only the last item!");
    require(!(_nextDiscount > 0 && !discount[_nextDiscount].valid), "Invalid next discount!");
    discount[_i].valid    = _valid;
    discount[_i].duration = _duration;
    discount[_i].qty      = _qty;
    discount[_i].cost     = _cost;
    discount[_i].next     = _nextDiscount;
    if (_valid == false) --discounts;
    if (_i == discounts + 1) ++discounts;
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
    prizeDist.hiro      = _hiro;
    prizeDist.bounty    = _bounty;
    prizeDist.next      = _next;
    prizeDist.partners  = _partners;
    prizeDist.moraspace = _moraspace;
  }

  /**
   * @dev sets the prize or increments it
   */
  function () external payable {
    require(msg.value > 0, "The payment must be more than 0!");
    pot = pot.add(msg.value);
  }

  /**
   * @dev Withdraws from remaining pot and sends to given address
   */
  function potWithdrawTo(uint256 _eth, address _to) external onlyOwner() onlyBeforeARound() {
    require(_eth > 0, "The requested amount need to be explicit!");
    require(_eth <= pot, "Insufficient found!");
    require(_to != address(0), "Address can not be zero!");
    emit potWithdraw(_eth, _to, msg.sender);
    pot = pot.sub(_eth);
    _to.transfer(_eth);
  }


  /**
   * @dev start a new round
   */
  function start(uint256 _duration) external onlyOwner() onlyBeforeARound() {
    require(prizeDist.hiro + prizeDist.bounty + prizeDist.next + prizeDist.partners + prizeDist.moraspace == 100,
      "O.o The sum of pie char should be around 100!");
    require(rocketClasses > 0, "Not rocket calsses added!");
    require(_duration > 59, "Round duration must be at least 1 minute!");
    for (uint8 i = 0; i < rocketClasses; ++i) {
      rocketSupply[i] = rocketClass[i];
    }
    ++rounds;
    round[rounds].over      = false;
    round[rounds].duration  = _duration;
    round[rounds].started   = now;
    round[rounds].mayFinish = now.add(_duration);
  }

  function maintainPlayer (address _addr, uint256 _index) internal returns (uint256) {
    require(!(_index > 0 && _addr != playerDict[_index]), "Forbidden!");
    if (_index == 0) {
      for (uint i = 0; i < playerDict.length; i++) {
        if (playerDict[i]==_addr) {
          _index = i;
          break;
        }
      }
    }
    if (_index == 0) {
      DataSets.Player memory _pm;
      _index = playerDict.push(_addr) - 1;
      _pm.addr = _addr;
      _pm.round = rounds;
      _pm.updated = now;
      player[_index] = _pm;
    }
    DataSets.Player storage _p = player[_index];
    DataSets.Round storage _r = round[_p.round];
    if (_p.round != rounds) {
      if (_p.merit[_r.launchpad] > 0 ) {
        _p.earnings = _p.merit[_r.launchpad].mul(_r.bounty);
        _p.updated = now;
        for (i = 0; i < _p.merit.length; i++) {
          delete _p.merit[i];
        }
      }
    }
    return _index;
  }

  function maintainDiscount(uint8 _rocket, uint8 _amount) internal returns (uint256) {
    require(_rocket < rocketClasses, "Undefined rocket!");
    DataSets.Rocket storage _r = rocketSupply[_rocket];
    uint256 _cost = _r.cost;
    if (_r.discount > 0) { //check if already expired
      DataSets.Discount storage _exp = discount[_r.discount];
      if (_exp.duration > 0 && now > round[rounds].started.add(_exp.duration)) {
        _exp.valid = false;
        _r.discount = _exp.next;
      }
    }
    if (_r.discount > 0) {
      DataSets.Discount storage _d = discount[_r.discount];
      _cost = _d.cost;
      if (_d.qty > 0) {
        if (_d.qty <= _amount) {
          _d.valid = false;
          _r.discount = _d.next;
        } else {
          _d.qty = _d.qty.sub(_amount);
        }
      }
    }
    return _cost.mul(_amount);
  }

  /**
   * @dev uses the previous blockhash for random generation
   */
  function getRandom(uint8 _maxRan) public view returns(uint8) {
      uint256 _genNum = uint256(keccak256(abi.encodePacked(blockhash(block.number-1))));
      return uint8(_genNum % _maxRan);
  }

  /**
    * @dev launches Rockets
    * -price and discount for n+1 rocket is same as for 1st rocket, regardles of limited discount or price tier.
    */
  function lunchRocket (
    uint8 _rocket,
    uint8 _amount,
    uint8 _launchpad,
    uint256 _player // performance improvement. Let web3 find the user index
  ) external payable onlyLiveRound() beforeNotTooLate() returns(uint8 _hits) {
    require(_launchpad < launchpads, "Undefined launchpad!");
    require(_amount > 0 && _amount <= launchpad[_launchpad].size,
      "Rockets need to be more than one and maximam as mach as the launchpad can handle");
    uint256 _pIndex = maintainPlayer(msg.sender, _player);
    uint256 _totalCost = maintainDiscount(_rocket, _amount);
    require(_totalCost > msg.value, "Insufficient found!");
    require(_totalCost < msg.value, "We do not accept tips!");
    DataSets.Rocket storage _rt    = rocketSupply[_rocket];
    DataSets.Player storage _pr    = player[_pIndex];
    DataSets.Round storage _rd     = round[rounds];
    pot = pot.add(_totalCost);
    for (uint8 i = 0; i < _amount; ++i)
      if (getRandom(100) < _rt.accuracy)
        ++_hits;
    if (_hits > 0) {
      uint256 _m             = _rt.merit.mul(_hits);
      _pr.merit[_launchpad] += _m;
      _rd.merit[_launchpad] += _m;
      _rd.mayFinish         += _rt.knockback.mul(_hits);
      _rd.hiro               = msg.sender;
    }
    return _hits;
  }

  function timeTillImpact() public view returns (uint256) {
    if (round[rounds].mayFinish < now){
      return round[rounds].mayFinish.sub(now);
    } else {
      return 0;
    }
  }

  function finish(uint256 _player) public onlyOwner() onlyLiveRound() {
    require(timeTillImpact() == 0, "Not yet!");
    DataSets.Round storage _rd   = round[rounds];
    _player                      = maintainPlayer(_rd.hiro, _player);
    DataSets.Player storage _pr  = player[_player];
    hero[rounds].addr            = _rd.hiro;
    _rd.jackpot                  = pot.div(100).mul(prizeDist.hiro);
    _rd.bounty                   = pot.div(_rd.merit[_rd.launchpad].sub(_pr.merit[_rd.launchpad]));
    _rd.merit[_rd.launchpad]     = _rd.merit[_rd.launchpad].sub(_pr.merit[_rd.launchpad]);
    _pr.merit[_rd.launchpad]     = 0;
    _pr.earnings                 = _rd.jackpot;
    pot                          = pot.sub(_rd.jackpot).sub(_rd.merit[_rd.launchpad].mul(_rd.bounty));
    _rd.over                     = true;
  }

  function prizeWithdrawTo(uint256 _eth, address _to, uint256 _player) public {
    require(_to != address(0), "Address can not be zero!");
    _player                      = maintainPlayer(msg.sender, _player);
    DataSets.Player storage _pr  = player[_player];
    require(_eth > _pr.earnings, "Insufficient found!");
    if (_eth == 0) _eth = _pr.earnings;
    _pr.earnings = _pr.earnings.sub(_eth);
    _to.transfer(_eth);
  }

  function setHiroName(uint16 _round, string _name) external payable {
    require(msg.sender == hero[_round].addr, "The address does not match with the hiro!");
    require(10000000000000000 == msg.value, "The payment must be 0.01ETH!");
    pot              += 10000000000000000; // temporary goes to pot
    hero[_round].name = _name.nameFilter();
  }
}
