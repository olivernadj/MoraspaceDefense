var dotenv = require('dotenv');
dotenv.load();

var HDWalletProvider = require("truffle-hdwallet-provider");
var infura_apikey = process.env.INFURA_APIKEY;
var mnemonic = process.env.MNEMONIC;


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"  + infura_apikey)
      },
      gas: "4000000",           // 4M
      gasPrice: "20000000000",   // 20gwei
      network_id: 3
    }
  },
  rpc: {
    host: 'localhost',
    post:8080
  }
};
