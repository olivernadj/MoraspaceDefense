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
 * @title Interface for MoraspaceDefense
 */
interface MoraspaceDefenseI {
  function potUp() payable external; // initial prize or prize increase
  function start() external; // start a new round
  function getRandom(uint8 _maxRan) external returns(uint8);
}

/**
 * @title MoraspaceDefense contract implementation
 */
contract MoraspaceDefense is Owned, MoraspaceDefenseI {
  using SafeMath for *; // solity directive using A for B;
  using NameFilter for string;
  uint256 public pot = 0;
  bool public gameover = true;
  mapping (uint8 => DataSets.Rocket) public rockets;

  /**
   * @dev allows things happen before the new round started
   */
  modifier onlyBeforeARound {
    require(gameover == true);
    _;
  }

  /**
   * @dev prevents contracts from interacting with fomo3d
   */
  modifier isHuman(address _addr) {
    uint256 _codeSize;
    assembly {_codeSize := extcodesize(_addr)}
    require(_codeSize == 0, "Sorry humans only");
    _;
  }

  /**
   * @dev sets the prize or increments is
   */
  function potUp() payable external {
    require(msg.value > 0, "Nothing to deposit!");
    pot.add(msg.value);
  }

  /**
   * @dev start a new round
   */
  function start() external onlyOwner() onlyBeforeARound() {
    gameover = false;
    rockets[0] = DataSets.Rocket(100, 1, 30, 1000000000000000, 0);
    rockets[0] = DataSets.Rocket(75, 5, 60, 3000000000000000, 0);
    rockets[0] = DataSets.Rocket(50, 12, 120, 5000000000000000, 0);
  }

  /**
   * @dev uses the previous blockhash for random generation
   */
  function getRandom(uint8 _maxRan) public returns(uint8) {
      uint256 _genNum = uint256(keccak256(blockhash(block.number-1)));
      return uint8(_genNum % _maxRan);
  }

}
