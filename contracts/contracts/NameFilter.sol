pragma solidity ^0.4.24;

library NameFilter {
  /**
    * @dev filters name strings
    * -makes sure it does not start/end with a space
    * -makes sure it does not contain multiple spaces in a row
    * -cannot be only numbers
    * -cannot start with 0x
    * -restricts characters to A-Z, a-z, 0-9, and space.
    * @return reprocessed string in bytes32 format
    */
  function nameFilter(string _input) internal pure returns (bytes32) {
    bytes memory _name = bytes(_input);
    require(_name.length <= 32 && _name.length > 0, "Name must be between 1 and 32 characters!");
    require(_name[0] != 0x20 && _name[_name.length-1] != 0x20, "Name cannot start neither end with spac!");
    if (_name[0] == 0x30) {
      require(_name[1] != 0x78, "Name cannot start with 0x");
      require(_name[1] != 0x58, "Name cannot start with 0X");
    }
    bool _hasAlphaChar = false;
    byte c;
    for (uint8 i = 0; i < _name.length; i++) {
      // We know that we only access the array in bounds, so we can avoid the check.
      // 0x20 needs to be added to an array because the first slot contains the
      // array length.
      // https://solidity.readthedocs.io/en/v0.4.25/assembly.html
      assembly {
        c := mload(add(add(_name, 0x20), mul(i, 0x20)))
      }
      //if uppercase A-Z OR lowercase a-z
      if ((c > 0x40 && c < 0x5b) || (c > 0x60 && c < 0x7b)) {
        if (_hasAlphaChar == false) _hasAlphaChar = true;
      } else {
        // require character is a space OR 0-9
        require (c == 0x20 || (c > 0x2f && c < 0x3a),
          "Name contains invalid characters. Other than A-Z, a-z, 0-9, and space."
        );
        // make sure theres not 2x spaces in a row
        if (c == 0x20 && i < (_name.length-2)) require( _name[i+1] != 0x20, "Name cannot contain consecutive spaces");
      }
    }
    require(_hasAlphaChar == true, "Name cannot be only numbers");
    bytes32 _ret;
    assembly { // https://ethereum.stackexchange.com/questions/9142/how-to-convert-a-string-to-bytes32
        _ret := mload(add(_name, 32))
    }
    return (_ret);
  }
}
