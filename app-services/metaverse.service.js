(function() {
    'use strict';

    angular
        .module('app')
        .factory('MetaverseService', MetaverseService)
        .factory('MetaverseHelperService', MetaverseHelperService);

    /**
     * The MetaverseService provides access to the Metaverse JSON RPC.
     */
    MetaverseService.$inject = ['$http', 'localStorageService'];

    function MetaverseService($http, localStorageService) {
        var service = {};

        //Test runned on port 3000. Mainnet is on port 8820
        var SERVER = window.location.hostname+((window.location.port!=80)?":"+((window.location.port==3000 || !window.location.port)?8820:window.location.port) : "");
        var SERVER2 = window.location.hostname+((window.location.port!=80)?":"+((window.location.port==3000 || !window.location.port)?8821:parseInt(window.location.port)+1) : "");

        //var RPC_URL = window.location.protocol + '://' + SERVER + '/rpc';
        var RPC_URL = window.location.protocol + '/rpc';
        var RPC_URL_V2 = window.location.protocol + '/rpc/v2';
        var RPC_URL_V3 = window.location.protocol + '/rpc/v3';


        service.debug = false;

        service.MetaverseNetwork = {
          mainnet: {
              messagePrefix: '\x18Bitcoin Signed Message:\n',
              bech32: 'bc',
              bip32: {
                  public: 0x0488b21e,
                  private: 0x0488ade4
              },
              pubKeyHash: 0x32,
              scriptHash: 0x05,
              locktimes: [25200, 108000, 331200, 655200, 1314000],
              wif: 0x80
          },
          testnet: {
              messagePrefix: '\x18Bitcoin Signed Message:\n',
              bech32: 'tb',
              bip32: {
                  public: 0x043587cf,
                  private: 0x04358394
              },
              pubKeyHash: 0x7f,
              scriptHash: 0xc4,
              locktimes: [10, 20, 30, 40, 50],
              wif: 0xef
          }
        }

        service.hasIcon = ['ETP', 'MVS.ZGC', 'MVS.ZDC', 'CSD.CSD', 'PARCELX.GPX', 'PARCELX.TEST', 'SDG', 'META', 'MVS.HUG', 'RIGHTBTC.RT', 'TIPLR.TPC', 'PANDO', 'VALOTY', 'KOALA.KT'];

        service.burnAddress = '1111111111111111111114oLvT2';
        service.burnAddress_short = 'blackhole';

        service.defaultBountyFee = 80;
        service.bountyFeeMinMiner = 20;

        service.swaptokenAvatar = 'droplet';
        service.ETPMap = '0xa52b0a032139e6303b86cfeb0bb9ae780a610354';
        service.SwapAddress = '0xc1e5fd24fa2b4a3581335fc3f2850f717dd09c86';

        service.SERVER = SERVER;
        service.SERVER2 = SERVER2;

        //Account
        service.CheckAccount = CheckAccount;
        service.GetNewAccount = GetNewAccount;
        service.ImportAccount = ImportAccount;
        service.GetBalance = GetBalance;
        service.ListAddresses = ListAddresses;
        service.ListBalances = ListBalances;
        service.GetAccount = GetAccount;
        service.GetNewAddress = GetNewAddress;
        service.ChangePassword = ChangePassword;
        service.ResetPassword = ResetPassword;
        service.DumpKeyFile = DumpKeyFile;
        service.ImportKeyFile = ImportKeyFile;
        service.PopBlock = PopBlock;

        //Mining
        service.Start = Start;
        service.Stop = Stop;
        service.GetMiningInfo = GetMiningInfo;
        service.GetLocked = GetLocked;
        service.GetStakeInfo = GetStakeInfo;

        //ETP
        service.Send = Send;
        service.SendFrom = SendFrom;
        service.SendMore = SendMore;
        service.ListTxs = ListTxs;
        service.GetPublicKey = GetPublicKey;
        service.GetNewMultiSig = GetNewMultiSig;
        service.ListMultiSig = ListMultiSig;
        service.CreateMultisigTx = CreateMultisigTx;
        service.SignMultisigTx = SignMultisigTx

        //Asset
        service.CreateAsset = CreateAsset;
        service.ListAssets = ListAssets;
        service.ListAllAssets = ListAllAssets;
        service.GetAsset = GetAsset;
        service.GetAddressAsset = GetAddressAsset;
        service.Issue = Issue;
        service.Delete = Delete;
        service.GetAccountAsset = GetAccountAsset;
        service.SecondaryIssue = SecondaryIssue;
        service.CreateAssetMultisigTx = CreateAssetMultisigTx;
        service.ListMITs = ListMITs;
        service.RegisterMIT = RegisterMIT;
        service.TransferMIT = TransferMIT;
        service.GetAssetCertificates = GetAssetCertificates;
        service.ListMstMiningAssets = ListMstMiningAssets;

        //Chain
        service.FetchHeight = FetchHeight;
        service.FetchTx = FetchTx;
        service.FetchHeader = FetchHeader;
        service.GetBlock = GetBlock;
        service.ListTxsAddress = ListTxsAddress;

        //Misc
        service.Query = Query;
        service.Lock = Lock;
        service.GetInfo = GetInfo;
        service.GetInfoV2 = GetInfoV2;

        //DID
        service.RegisterDid = RegisterDid;
        service.ListMyDids = ListMyDids;
        service.ListAllDids = ListAllDids;
        service.DidSendFrom = DidSendFrom;
        service.DidSend = DidSend;
        service.DidSendAssetFrom = DidSendAssetFrom;
        service.DidSendAsset = DidSendAsset;
        service.DidChangeAddress = DidChangeAddress;
        service.GetDid = GetDid;
        service.GetAllDids = GetAllDids;

        //Cert
        service.AccountAssetCert = AccountAssetCert;
        service.TransferCert = TransferCert;
        service.IssueCert = IssueCert;

        //Swaptoken
        service.Swaptoken = Swaptoken;

        return service;


        /**
         **/
        function GetInfo() {
            return _send('getinfo', []);
        }

        function GetInfoV2() {
            return _sendV2('getinfo', []);
        }


        /**
         * @api {post} /rpc Create a new account
         * @apiName New account
         * @apiGroup Account
         *
         * @apiDescription Creation of a new account.
         *
         * @apiParam {Const} method getnewaccount
         * @apiParam {List} params [username, password]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "mnemonic":"xxx",
         *    "main-address":"xxx"
         *	}
         *  @apiErrorExample {json} No-Username-Specified-Response:
         * {
         *  "error": "the option '--ACCOUNTAUTH' is required but missing"
         * }
         **/
        function GetNewAccount(username, password) {
            return _send('getnewaccount', [username, password]);
        }



        /**
         * @api {post} /rpc Get accounts information
         * @apiName Get account
         * @apiGroup Account
         *
         * @apiDescription Get information on the given account.
         *
         * @apiParam {Const} method getaccount
         * @apiParam {List} params [username, password]
         * @apiParam {String} last_word Last word of mnemonic
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "name":"x1",
         *    "mnemonic":"forum super bench parrot duty cliff cannon clump gossip panda other truth cable blossom toast ski thrive violin blood response card mass race corn",
         *    "hd_index":14,
         *    "priority":1
         *	}
         **/
        function GetAccount(last_word) {
            var credentials = localStorageService.get('credentials');
            return _send('getaccount', [credentials.user, credentials.password, last_word]);
        }

        /**
         * @api {post} /rpc Change account password
         * @apiName Change Password
         * @apiGroup Account
         *
         * @apiDescription Change the password the current account.
         *
         * @apiParam {Const} method changepasswd
         * @apiParam {List} params [username, password, '--password', new_password]
         *
         **/
        function ChangePassword(password) {
            var credentials = localStorageService.get('credentials');
            return _send('changepasswd', [credentials.user, credentials.password, '--password', password]);
        }

        /**
         * @api {post} /rpc Reset account password
         * @apiName Reset Password
         * @apiGroup Accoun:t
         *
         * @apiDescription Reset the password the current account.
         *
         * @apiParam {Const} method changepasswd
         * @apiParam {List} params ['-n', username, '-p', password, mnemonic]
         *
         **/
        function ResetPassword(username, password, mnemonic) {
          return _send('changepasswdext', ['-n', username, '-p', password, mnemonic]);
        }


        /*function ExportAccountAsFile(password, last_word) {
          var credentials = localStorageService.get('credentials');
          return _send('exportaccountasfile', [credentials.user, password, last_word]);
        }*/

        function DumpKeyFile(password, last_word) {
          var credentials = localStorageService.get('credentials');
          return _sendV2('dumpkeyfile', [credentials.user, password, last_word, '-d']);
        }


        /*function ImportAccountFromFile(username, password, path, content) {
          return _send('importaccountfromfile', [username, password, path, content]);
        }*/

        function ImportKeyFile(username, password, path, content) {
          return _send('importkeyfile', [username, password, path, content]);
        }


        /**
         * @api {post} /rpc List accounts addresses
         * @apiName List addresses
         * @apiGroup Account
         *
         * @apiDescription Get the addresses of the given account.
         *
         * @apiParam {Const} method listaddresses
         * @apiParam {List} params [username, password]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "addresses": [
         *      "1A1pdan1QgE6mASWtPdNdmRNiXGbLtd6st",
         *      "1MzpeCbAYKXaEjGLcLSqQJSjvRxTQCLdQ6"
         *    ]
         * }
         **/
        function ListAddresses() {
            var credentials = localStorageService.get('credentials');
            return _send('listaddresses', [credentials.user, credentials.password]);
        }

        /**
         * @api {post} /rpc New address
         * @apiName New address
         * @apiGroup Account
         *
         * @apiDescription Get a new address.
         *
         * @apiParam {Const} method getnewaddress
         * @apiParam {List} params [username, password]
         **/
        function GetNewAddress() {
            var credentials = localStorageService.get('credentials');
            return _send('getnewaddress', [credentials.user, credentials.password]);
        }


        /**
         * @api {post} /rpc Get balance
         * @apiName Get balance
         * @apiGroup ETP
         *
         * @apiDescription Get the balance of the given account.
         *
         * @apiParam {Const} method getbalance
         * @apiParam {List} params [username, password]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "total-confirmed": "2320000000000",
         *    "total-received": "2375000000000",
         *    "total-unspent": "2320000000000"
         * }
         **/
        function GetBalance() {
            var credentials = localStorageService.get('credentials');
            return _send('getbalance', [credentials.user, credentials.password]);
        }

        /**
         * @api {post} /rpc List balances
         * @apiName List balances
         * @apiGroup ETP
         *
         * @apiDescription Get the balances of all addresses of the given account.
         *
         * @apiParam {Const} method listbalances
         * @apiParam {List} params [ username, password]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "balances": [
         *      {
         *         "balance": {
         *            "address": "MRRBw9sN6BjpnFEpKsz96rkwfNhYpCN1ad",
         *            "confirmed": "0",
         *            "received": "0",
         *            "unspent": "0"
         *          }
         *      },
         *      {
         *         "balance": {
         *            "address": "MCi9yQat7ES1hRv4e8fiDen7kGpj18bdJo",
         *            "confirmed": "10929119999000",
         *            "received": "10929149999000",
         *            "unspent": "10929119999000"
         *          }
         *      }
         *    ]
         * }
         **/
        function ListBalances(hide_empty) {
            var credentials = localStorageService.get('credentials');
            if (hide_empty)
                return _send('listbalances', ['-n', credentials.user, credentials.password]);
            else
                return _send('listbalances', [credentials.user, credentials.password]);
        }


        /**
         * @api {post} /rpc List transactions
         * @apiName List transactions
         * @apiGroup Misc
         *
         * @apiDescription Get a list of transactions.
         *
         * @apiParam {Const} method listtxs
         * @apiParam {List} params [username, password]
         *
         **/
        function ListTxs(page, limit) {
            var credentials = localStorageService.get('credentials');
            return _send('listtxs', ['-i', page, '-l', limit, credentials.user, credentials.password]);
        }

        function ListTxsAddress(address, page) {
            var credentials = localStorageService.get('credentials');
            return _send('listtxs', [credentials.user, credentials.password, '-a', address, '-i', page]);
        }

        /**
         * @api {post} /rpc Send
         * @apiName Send
         * @apiGroup ETP
         *
         * @apiDescription Send ETP to another address.
         *
         * @apiParam {Const} method send
         * @apiParam {List} params [username, password, recipent address, quantity]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "transaction": {
         *      "hash": "9486cb52db428c267854dd197495263676e0f3c5f122633f78ef39960c7523e0",
         *      "inputs": [
         *       {
         *         "address": "1NyoThWXCRL7ykfN5bYRADtHdi9shAmHtK",
         *         "previous_output": {
         *             "hash": "e87ad5eb94a6936dcb2c86fe97ac219fc2d940f7dcf8658b5fd63f8ec451119d",
         *             "index": "0"
         *         },
         *         "script": "[ 30450221008c8a6cca1eb51055ea64a1a8ef3aea41cc0637ca50276d1a85a44182be0682c502204172a15a924cc17583a0d0853e0a76493636064b45f62e78f336a3249b93df9d01 ] [ 027dd78b5199d67956dfbeedd7bfc562f87199125ff2c44fd7a6d5df331fa89536 ]",
         *         "sequence": "4294967295"
         *       }
         *      ],
         *      "lock_time": "0",
         *      "outputs": [
         *       {
         *         "address": "1GRheH1GgrfPc7Dr9DbrqjwG4auj4KSrE3",
         *         "script": "dup hash160 [ a935cbf118340293e7e8ed4a7a9c6f765ad72ad2 ] equalverify checksig",
         *         "value": "123123456"
         *       }
         *      ],
         *      "version": "1"
         *    }
         * }
         **/
        function Send(recipent, quantity, transactionFee, memo, password) {
            var credentials = localStorageService.get('credentials');
            if(memo == '') {
              return _sendV2('send', [credentials.user, password, recipent, quantity, '-f', transactionFee]);
            } else {
              return _sendV2('send', [credentials.user, password, recipent, quantity, '-f', transactionFee, '-m', memo]);
            }
        }

        /**
         * @api {post} /rpc Send from
         * @apiName Send from
         * @apiGroup ETP
         *
         * @apiDescription Send ETP to another address from a specified address.
         *
         * @apiParam {Const} method send
         * @apiParam {List} params [username, password, from address, recipent address, quantity]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "transaction": {
         *      "hash": "9486cb52db428c267854dd197495263676e0f3c5f122633f78ef39960c7523e0",
         *      "inputs": [
         *       {
         *         "address": "1NyoThWXCRL7ykfN5bYRADtHdi9shAmHtK",
         *         "previous_output": {
         *             "hash": "e87ad5eb94a6936dcb2c86fe97ac219fc2d940f7dcf8658b5fd63f8ec451119d",
         *             "index": "0"
         *         },
         *         "script": "[ 30450221008c8a6cca1eb51055ea64a1a8ef3aea41cc0637ca50276d1a85a44182be0682c502204172a15a924cc17583a0d0853e0a76493636064b45f62e78f336a3249b93df9d01 ] [ 027dd78b5199d67956dfbeedd7bfc562f87199125ff2c44fd7a6d5df331fa89536 ]",
         *         "sequence": "4294967295"
         *       }
         *      ],
         *      "lock_time": "0",
         *      "outputs": [
         *       {
         *         "address": "1GRheH1GgrfPc7Dr9DbrqjwG4auj4KSrE3",
         *         "script": "dup hash160 [ a935cbf118340293e7e8ed4a7a9c6f765ad72ad2 ] equalverify checksig",
         *         "value": "123123456"
         *       }
         *      ],
         *      "version": "1"
         *    }
         * }
         **/
        function SendFrom(sender, recipent, quantity, transactionFee, memo, password) {
            var credentials = localStorageService.get('credentials');
            if(memo == '') {
              return _sendV2('sendfrom', [credentials.user, password, sender, recipent, quantity, '-f', transactionFee]);
            } else {
              return _sendV2('sendfrom', [credentials.user, password, sender, recipent, quantity, '-f', transactionFee, '-m', memo]);
            }
        }

        /**
         * @api {post} /rpc Send more
         * @apiName Send more
         * @apiGroup ETP
         *
         * @apiDescription Send ETP to many addresses.
         *
         * @apiParam {Const} method sendmore
         * @apiParam {List} params [username, password, recipent_address1:quantity1,recipent_address2:quantity2,...]
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "transaction": {
         *        "hash": "9486cb52db428c267854dd197495263676e0f3c5f122633f78ef39960c7523e0",
         *        "inputs": [
         *            {
         *              "address": "1NyoThWXCRL7ykfN5bYRADtHdi9shAmHtK",
         *              "previous_output": {
         *                  "hash": "e87ad5eb94a6936dcb2c86fe97ac219fc2d940f7dcf8658b5fd63f8ec451119d",
         *                  "index": "0"
         *              },
         *              "script": "[ 30450221008c8a6cca1eb51055ea64a1a8ef3aea41cc0637ca50276d1a85a44182be0682c502204172a15a924cc17583a0d0853e0a76493636064b45f62e78f336a3249b93df9d01 ] [ 027dd78b5199d67956dfbeedd7bfc562f87199125ff2c44fd7a6d5df331fa89536 ]",
         *              "sequence": "4294967295"
         *            }
         *        ],
         *        "lock_time": "0",
         *        "outputs": [
         *            {
         *              "address": "1GRheH1GgrfPc7Dr9DbrqjwG4auj4KSrE3",
         *              "script": "dup hash160 [ a935cbf118340293e7e8ed4a7a9c6f765ad72ad2 ] equalverify checksig",
         *              "value": "123123456"
         *            }
         *        ],
         *        "version": "1"
         *    }
         * }
         **/
        function SendMore(from, recipents, transactionFee, memo, password) {
            var credentials = localStorageService.get('credentials');
            var query = [];
            var recipent = '';
            query.push(credentials.user);
            query.push(password);
            query.push('-f');
            query.push(transactionFee);
            if(from) {
                query.push('-s');
                query.push(from);
            }
            if(memo) {
                query.push('-i');
                query.push(memo);
            }
            recipents.forEach( (e) => {
              recipent = e.address + ':' + e.value;
              query.push('-r');
              query.push(recipent);
            });
            return _sendV2('sendmore', query);
        }

        /**
         * @api {post} /rpc Start mining
         * @apiName Start mining
         * @apiGroup Mining
         *
         * @apiDescription Start solo mining with this account.
         *
         * @apiParam {Const} method start
         * @apiParam {List} params [username, password]
         *
         **/
        /*function Start(type, miner, mst) {
            var credentials = localStorageService.get('credentials');
            if(mst) {
                return _send('start', [credentials.user, credentials.password, '-c', type, '-a', miner, '-s', mst]);
            } else {
                return _send('start', [credentials.user, credentials.password, '-c', type, '-a', miner]);
            }
        }*/

        function Start(type, miner, mst) {
            return _send('', []);
        }

        /**
         * @api {post} /rpc Stop mining
         * @apiName Stop mining
         * @apiGroup Mining
         *
         * @apiDescription Stop solo mining with this account.
         *
         * @apiParam {Const} method stop
         * @apiParam {List} params [username, password]
         *
         **/
        function Stop() {
            var credentials = localStorageService.get('credentials');
            return _send('stop', [credentials.user, credentials.password]);
        }

        /**
         * @api {post} /rpc Get mining info
         * @apiName Get mining info
         * @apiGroup Mining
         *
         * @apiDescription Gets information on the current mining status.
         *
         * @apiParam {Const} method getmininginfo
         * @apiParam {List} params [username, password]
         *
         **/
        function GetMiningInfo() {
            //var credentials = localStorageService.get('credentials');
            return _sendV3('getmininginfo');
        }

        /**
         * @api {post} /rpc Get blockchain height
         * @apiName Get blockchain height
         * @apiGroup Misc
         *
         * @apiDescription Get the current height of the blockchain.
         *
         * @apiParam {Const} method fetch-height
         * @apiParam {List} params []
         *
         **/
        function FetchHeight() {
            return _sendV3('fetch-height', []);
        }

        /**
         * @api {post} /rpc Get transaction
         * @apiName Get transaction
         * @apiGroup Misc
         *
         * @apiDescription Returns a blockchain transaction of the given hash.
         *
         * @apiParam {Const} method fetch-tx
         * @apiParam {List} params []
         *
         **/
        function FetchTx(hash) {
            return _send('fetch-tx', [hash]);
        }


        /**
         * @api {post} /rpc
         * @apiName
         * @apiGroup
         *
         * @apiDescription
         *
         * @apiParam {Const} method fetch-tx
         * @apiParam {List} params []
         *
         **/
        function FetchHeader(block_height) {
            return _send('fetch-header', ['-t', block_height]);
        }


        /**
         * @api {post} /rpc
         * @apiName
         * @apiGroup
         *
         * @apiDescription
         *
         * @apiParam {Const} method fetch-tx
         * @apiParam {List} params []
         *
         **/
        function GetBlock(block_hash) {
            return _send('getblock', [block_hash, '--json=true']);
        }




        /**
         * @api {post} /rpc Create asset
         * @apiName Create a new unissued asset
         * @apiGroup Assets
         *
         * @apiDescription Create a new asset. The asset will be created
         * locally and you need to issue it to write it into the blockchain.
         *
         * @apiParam {Const} method createasset
         * @apiParam {List} params [username, password,'-s',symbol,'-v',max_supply,'-n',decimal_number, '-d',description]
         *
         **/
        function CreateAsset(symbol, issuer, quantity, secondary_offering, decimal_number, description, secondaryissue_rate) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('createasset', [credentials.user, credentials.password, '-s', symbol, '-i', issuer, '-v', quantity, '-n',decimal_number, '-d', description, '-r', secondaryissue_rate]);
        }

        /**
         * @api {post} /rpc Issue asset
         * @apiName Issue an unissued asset
         * @apiGroup Assets
         *
         * @apiDescription Issues an asset. The asset will be written it into
         * the blockchain.
         *
         * @apiParam {Const} method issue
         * @apiParam {List} params [username, password,symbol]
         *
         **/
        function Issue(symbol, minerFee, subsidy) {
          var credentials = localStorageService.get('credentials');
          var query = [];
          query.push(credentials.user);
          query.push(credentials.password);
          query.push(symbol);
          query.push('-p');
          query.push(minerFee);
          if(subsidy) {
              query.push('-s');
              query.push(subsidy);
          }
          return _sendV2('issue', query);
        }

        /**
         * @api {post} /rpc Delete asset
         * @apiName Delete an asset
         * @apiGroup Assets
         *
         * @apiDescription Delete an asset. The asset will be deleted definitely
         *
         * @apiParam {Const} method delete
         * @apiParam {List} params ['-s', symbol, username, password]
         *
         **/
        function Delete(symbol) {
            var credentials = localStorageService.get('credentials');
            return _send('deletelocalasset', ['-s', symbol, credentials.user, credentials.password]);
        }


        /**
         * @api {post} /rpc List All assets
         * @apiName List All assets
         * @apiGroup Assets
         *
         * @apiDescription List all assets of the whole network.
         *
         * @apiParam {Const} method listassets
         *
         **/
        function ListAllAssets() {
            return _send('listassets');
        }

        /**
         * @api {post} /rpc List assets
         * @apiName List assets
         * @apiGroup Assets
         *
         * @apiDescription List all assets of the account.
         *
         * @apiParam {Const} method listassets
         * @apiParam {List} params [username, password]
         *
         **/
        function ListAssets() {
            var credentials = localStorageService.get('credentials');
            return _send('listassets', [credentials.user, credentials.password]);
        }

        /**
         * @api {post} /rpc Get asset
         * @apiName Get asset
         * @apiGroup Assets
         *
         * @apiDescription Gets details about an asset.
         *
         * @apiParam {Const} method getasset
         * @apiParam {List} params [username, password, symbol]
         *
         **/
        function GetAsset(symbol) {
            return _send('getasset', [symbol]);
        }


        /**
         * @api {post} /rpc Get asset
         * @apiName Get asset
         * @apiGroup Assets
         *
         * @apiDescription Gets details about an asset.
         *
         * @apiParam {Const} method getasset
         * @apiParam {List} params [username, password, symbol]
         *
         **/
        function GetAddressAsset(address) {
            return _send('getaddressasset', [address]);
        }

        function GetAccountAsset(symbol) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('getaccountasset', [credentials.user, credentials.password, symbol]);
        }

        function GetPublicKey(address) {
            var credentials = localStorageService.get('credentials');
            return _send('getpublickey', [credentials.user, credentials.password, address]);
        }

        function GetNewMultiSig(signaturenum, publickeynum, selfpublickey, recipents) {
            var credentials = localStorageService.get('credentials');
            var query = [];
            query.push('-m');
            query.push(signaturenum);
            query.push('-n');
            query.push(publickeynum);
            query.push('-s');
            query.push(selfpublickey);
            recipents.forEach( (e) => {
              query.push('-k');
              query.push(e.publicKey);
            });
            query.push(credentials.user);
            query.push(credentials.password);
            return _sendV2('getnewmultisig', query);
        }

        function ListMultiSig() {
          var credentials = localStorageService.get('credentials');
          return _send('listmultisig', [credentials.user, credentials.password]);
        }

        function CreateMultisigTx(fromAddress, toAddress, amount, transactionFee, password) {
          var credentials = localStorageService.get('credentials');
          return _sendV2('createmultisigtx', [credentials.user, password, fromAddress, toAddress, amount, '-f', transactionFee]);
        }

        function CreateAssetMultisigTx(symbol, fromAddress, toAddress, amount, transactionFee, password) {
          var credentials = localStorageService.get('credentials');
          return _sendV2('createmultisigtx', [credentials.user, password, fromAddress, toAddress, amount, '-t', '3', '-s', symbol, '-f', transactionFee]);
        }

        function SignMultisigTx(message, password, lastTx) {
          var credentials = localStorageService.get('credentials');
          if(lastTx) {
            return _sendV2('signmultisigtx', [credentials.user, password, message, '-b']);
          } else {
            return _sendV2('signmultisigtx', [credentials.user, password, message]);
          }
        }

        function CheckAccount(user, password) {
            //To check if account exists we can simply check the accounts balance
            return _send('getbalance', [user, password]);
        }

        function ImportAccount(user, password, phrase, address_count) {
          return _send('importaccount', ['-n', user, '-p', password, '-i', address_count, phrase]);
        }

        function RegisterDid(address, symbol, password, minerFee) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('registerdid', [credentials.user, password, address, symbol, '-p', minerFee]);
        }

        function ListMyDids() {
            var credentials = localStorageService.get('credentials');
            return _sendV2('listdids', [credentials.user, credentials.password]);
        }

        function ListAllDids(index, limit) {
            return _sendV2('listdids', ['-i', index, '-l', limit]);
        }

        function DidSendFrom(sendfrom, sendTo, value, transactionFee, memo, password) {
            var credentials = localStorageService.get('credentials');
            if(memo == '') {
              return _sendV2('didsendfrom', [credentials.user, password, sendfrom, sendTo, value, '-f', transactionFee]);
            } else {
              return _sendV2('didsendfrom', [credentials.user, password, sendfrom, sendTo, value, '-f', transactionFee, '-m', memo]);
            }
        }

        function DidSend(sendTo, value, transactionFee, memo, password) {
            var credentials = localStorageService.get('credentials');
            if(memo == '') {
              return _sendV2('didsend', [credentials.user, password, sendTo, value, '-f', transactionFee]);
            } else {
              return _sendV2('didsend', [credentials.user, password, sendTo, value, '-f', transactionFee, '-m', memo]);
            }
        }

        function DidSendAssetFrom(sender_address, recipent_address, symbol, quantity, type, unlockNumber, quantityLocked, periodLocked, periodsModel2, interestRate, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            switch(type){
              case '0':
                var modelToSend = "TYPE=1;LQ=" + quantity + ";LP=" + periodLocked + ";UN=1";
                return _sendV2('didsendassetfrom', [credentials.user, password, sender_address, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              case '1':
                var modelToSend = "TYPE=1;LQ=" + quantityLocked + ";LP=" + periodLocked + ";UN=" + unlockNumber;
                return _sendV2('didsendassetfrom', [credentials.user, password, sender_address, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              case '2':
                var uc = '';
                var uq = '';
                periodsModel2.forEach( (period) => {
                  uc += period.number;
                  uc += ',';
                  uq += period.quantityToSend;
                  uq += ',';
                });
                uc = uc.substring(0, uc.length - 1);
                uq = uq.substring(0, uq.length - 1);
                var modelToSend = "TYPE=2;LQ=" + quantityLocked + ";LP=" + periodLocked + ";UN=" + unlockNumber + ";UC=" + uc + ";UQ=" + uq;
                return _sendV2('didsendassetfrom', [credentials.user, password, sender_address, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              case '3':
                var modelToSend = "TYPE=3;LQ=" + quantity + ";LP=" + periodLocked + ";UN=" + unlockNumber + ";IR=" + interestRate;
                return _sendV2('didsendassetfrom', [credentials.user, password, sender_address, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              default:
                return _sendV2('didsendassetfrom', [credentials.user, password, sender_address, recipent_address, symbol, quantity, '-f', transactionFee]);
            }
        }

        function DidSendAsset(recipent_address, symbol, quantity, type, unlockNumber, quantityLocked, periodLocked, periodsModel2, interestRate, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            switch(type){
              case '0':
                var modelToSend = "TYPE=1;LQ=" + quantity + ";LP=" + periodLocked + ";UN=1";
                return _sendV2('didsendasset', [credentials.user, password, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              case '1':
                var modelToSend = "TYPE=1;LQ=" + quantityLocked + ";LP=" + periodLocked + ";UN=" + unlockNumber;
                return _sendV2('didsendasset', [credentials.user, password, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              case '2':
                var uc = '';
                var uq = '';
                periodsModel2.forEach( (period) => {
                  uc += period.number;
                  uc += ',';
                  uq += period.quantityToSend;
                  uq += ',';
                });
                uc = uc.substring(0, uc.length - 1);
                uq = uq.substring(0, uq.length - 1);
                var modelToSend = "TYPE=2;LQ=" + quantityLocked + ";LP=" + periodLocked + ";UN=" + unlockNumber + ";UC=" + uc + ";UQ=" + uq;
                return _sendV2('didsendasset', [credentials.user, password, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              case '3':
                var modelToSend = "TYPE=3;LQ=" + quantity + ";LP=" + periodLocked + ";UN=" + unlockNumber + ";IR=" + interestRate;
                return _sendV2('didsendasset', [credentials.user, password, recipent_address, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              default:
                return _sendV2('didsendasset', [credentials.user, password, recipent_address, symbol, quantity, '-f', transactionFee]);
            }
        }

        function DidChangeAddress(symbol, toAddress, transactionFee, password) {
            //var credentials = localStorageService.get('credentials');
            //return _sendV2('didchangeaddress', [credentials.user, password, toAddress, symbol, '-f', transactionFee]);
        }

        function GetDid(symbol) {
            return _sendV2('getdid', [symbol]);
        }

        function GetAllDids() {
            return _sendV2('getdid', []);
        }

        function AccountAssetCert() {
            var credentials = localStorageService.get('credentials');
            return _sendV2('getaccountasset', [credentials.user, credentials.password, '-c']);
        }

        function TransferCert(certSymbol, certType, toDID, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('transfercert', [credentials.user, password, toDID, certSymbol, certType, '-f', transactionFee]);
        }

        function IssueCert(domain, type, symbol, toDID, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('issuecert', [credentials.user, password, toDID, symbol, type, '-f', transactionFee]);
        }

        function ListMITs() {
            var credentials = localStorageService.get('credentials');
            return _sendV2('listmits', [credentials.user, credentials.password]);
        }

        function RegisterMIT(symbol, avatar, content, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('registermit', [credentials.user, password, avatar, symbol, '-c', content, '-f', transactionFee]);
        }

        function TransferMIT(symbol, sendto, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            return _sendV2('transfermit', [credentials.user, password, sendto, symbol, '-f', transactionFee]);
        }

        function SecondaryIssue(toDID, symbol, quantity, type, unlockNumber, quantityLocked, periodLocked, periodsModel2, interestRate, transactionFee, password){
            var credentials = localStorageService.get('credentials');
            switch(type){
              case '1':
                var modelToSend = "TYPE=1;LQ=" + quantityLocked + ";LP=" + periodLocked + ";UN=" + unlockNumber;
                return _sendV2('secondaryissue', [credentials.user, password, toDID, symbol, quantity, '-m', modelToSend, '-f', transactionFee]);
              case '2':
                var credentials = localStorageService.get('credentials'); //;UC=20000,20000,20000;UQ=3000,3000,3000
                var uc = '';
                var uq = '';
                periodsModel2.forEach( (period) => {
                  uc += period.number;
                  uc += ',';
                  uq += period.quantityToSend;
                  uq += ',';
                });
                uc = uc.substring(0, uc.length - 1);
                uq = uq.substring(0, uq.length - 1);
                var modelToSend = "TYPE=2;LQ=" + quantityLocked + ";LP=" + periodLocked + ";UN=" + unlockNumber + ";UC=" + uc + ";UQ=" + uq;
                return _sendV2('secondaryissue', [credentials.user, password, toDID, symbol, quantity, '-m', modelToSend, '-f', transactionFee]);
              case '3':
                var modelToSend = "TYPE=3;LQ=" + quantity + ";LP=" + periodLocked + ";UN=" + unlockNumber + ";IR=" + interestRate;
                return _sendV2('secondaryissue', [credentials.user, password, toDID, symbol, quantity, '-f', transactionFee, '-m', modelToSend]);
              default:
                return _sendV2('secondaryissue', [credentials.user, password, toDID, symbol, quantity, '-f', transactionFee]);
            }
        }

        function Swaptoken(sendfrom, sendto, symbol, quantity, ethAddress, swaptokenFee, transactionFee, password) {
          var credentials = localStorageService.get('credentials');
          if(sendfrom) {
            return _sendV2('swaptoken', [credentials.user, password, sendto, symbol, quantity, ethAddress, '-d', sendfrom, '-s', swaptokenFee, '-f', transactionFee]);
          } else {
            return _sendV2('swaptoken', [credentials.user, password, sendto, symbol, quantity, ethAddress, '-s', swaptokenFee, '-f', transactionFee]);
          }
        }

        function GetLocked(user) {
            return _sendV3('getlocked', [user]);
        }

        function GetStakeInfo(user) {
            return _sendV3('getstakeinfo', [user]);
        }

        function GetAssetCertificates(asset) {
            return _sendV3('getasset', [asset, '-c']);
        }

        function Lock(avatar, from, amount, locktime, transactionFee, password) {
            var credentials = localStorageService.get('credentials');
            var query = [];
            query.push(credentials.user);
            query.push(password);
            query.push(avatar);
            query.push(amount);
            query.push(locktime);
            query.push('-f');
            query.push(transactionFee);
            if(from) {
                query.push('-s');
                query.push(from);
            }           
            return _sendV3('lock', query);
        }

        function PopBlock(height) {
            return _sendV3('popblock', [height]);
        }

        function ListMstMiningAssets() {
            return _sendV3('listassets', ['-t', 'mining']);
        }


        function Query(string) {
            var command = string;
            var params = [];
            if (string.indexOf(' ') >= 0) {
                command = string.split(" ")[0];
                params = string.substring(string.indexOf(command) + command.length + 1).replace(/\s{2,}/g, ' ').split(' ');
            }
            return _send(command, params);
        }

        function _send(method, params) {
            return $http.post(RPC_URL, {
                    method: method,
                    params: params
                }, {
                    headers: {}
                })
                .then(
                    function(res) {

                        if (service.debug)
                            console.log({
                                "method": method,
                                "params": params,
                                "result": res.data
                            });
                        return handleSuccess(res);
                    },
                    function(res) {
                        handleError(res);
                    }
                );
        }

        function _sendV2(method, params) {
            return $http.post(RPC_URL_V2, {
                    jsonrpc: "2.0",
                    method: method,
                    params: params
                }, {
                    headers: {}
                })
                .then(
                    function(res) {

                        if (service.debug)
                            console.log({
                                "method": method,
                                "params": params,
                                "result": res.data
                            });
                        return handleSuccess(res);
                    },
                    function(res) {
                        handleError(res);
                    }
                );
        }

        function _sendV3(method, params) {
            return $http.post(RPC_URL_V3, {
                    jsonrpc: "2.0",
                    method: method,
                    params: params
                }, {
                    headers: {}
                })
                .then(
                    function(res) {

                        if (service.debug)
                            console.log({
                                "method": method,
                                "params": params,
                                "result": res.data
                            });
                        return handleSuccess(res);
                    },
                    function(res) {
                        handleError(res);
                    }
                );
        }

        // private functions
        function handleSuccess(res) {
            if (res.data != undefined && res.data.error == undefined)
                return {
                    success: true,
                    data: res.data
                };
            else
                return handleError(res);
        }

        function handleError(res) {
            if (res.data != undefined && res.data.error != undefined)
                return {
                    success: false,
                    message: res.data.error
                };
            return {
                success: false,
                message: 'General connection error'
            };
        }

    }

    MetaverseHelperService.$inject = ['MetaverseService', '$translate'];

    function MetaverseHelperService(MetaverseService, $translate) {
        var service = {};

        const TX_TYPE_ETP = 'ETP';
        const TX_TYPE_ASSET = 'ASSET';
        const TX_TYPE_ISSUE = 'ISSUE';
        const TX_TYPE_CERT = 'CERT';
        const TX_TYPE_DID_REGISTER = 'DID_REGISTER';
        const TX_TYPE_DID_TRANSFER = 'DID_TRANSFER';
        const TX_TYPE_MIT = 'MIT';
        const TX_TYPE_UNKNOWN = 'UNKNOWN';
        const TX_TYPE_COINSTAKE = 'COINSTAKE';
        const TX_TYPE_MST_MINING = 'MST_MINING';

        service.LoadTransactions = LoadTransactions;
        service.GetBalance = GetBalance;

        return service;

        function GetBalance(callback) {
            MetaverseService.GetBalance()
                .then(function(response) {
                    if (typeof response.success !== 'undefined' && response.success) {
                        $translate('MESSAGES.GENERAL_CONNECTION_ERROR').then(function(data) {
                            callback(null, response.data, data);
                        });
                    } else {
                        $translate('MESSAGES.GENERAL_CONNECTION_ERROR').then(function(data) {
                            callback(1, null, data);
                        });
                    }
                });
        }

        function determineTransactionType(tx) {
            //Check if worth to try
            if (tx.outputs != undefined && Array.isArray(tx.outputs)) {
                var result;
                tx.outputs.forEach(function(output) {
                    if (output.attachment.type === 'asset-issue') { //an asset issue has the priority, and contains certs
                        result = TX_TYPE_ISSUE;
                    } else if (output.attachment.type === 'asset-transfer' && result != TX_TYPE_ISSUE) {
                        if(tx.inputs != undefined && Array.isArray(tx.inputs) && tx.inputs[0] && tx.inputs[0].address=='') {
                            result = TX_TYPE_MST_MINING;
                        } else {
                            result = TX_TYPE_ASSET;
                        }
                    } else if (output.attachment.type === 'asset-cert' && result != TX_TYPE_ISSUE) {
                        result = TX_TYPE_CERT;
                    } else if (output.attachment.type === 'did-register') {
                        result = TX_TYPE_DID_REGISTER;
                    } else if (output.attachment.type === 'did-transfer') {
                        result = TX_TYPE_DID_TRANSFER;
                    } else if (output.attachment.type === 'mit') {
                        result = TX_TYPE_MIT;
                    } else if (output.attachment.type === 'coinstake') {
                        result = TX_TYPE_COINSTAKE;
                    }
                });
                return (result) ? result : TX_TYPE_ETP;
            } else {
                return TX_TYPE_UNKNOWN;
            }
        }

        function getLocktimeFromHexa(locktime) {
            var nbrBlocksScriptLenght = locktime.length;
            var nbrBlocksScriptReorderer = "";

            for (var i=0; i < nbrBlocksScriptLenght; i=i+2) {
                nbrBlocksScriptReorderer += locktime.charAt(nbrBlocksScriptLenght-i-2);
                nbrBlocksScriptReorderer += locktime.charAt(nbrBlocksScriptLenght-i-1);
            }
            return parseInt(nbrBlocksScriptReorderer,16);
        }

        function LoadTransactions(callback, type, page, limit) {
            MetaverseService.ListTxs(page, limit)
                .then(function(response) {
                  var transactions = [];
                  var total_page = response.data.total_page;
                    if ( response.success !== 'undefined' && response.success) {
                      if(response.data.current_page==response.data.total_page){
                        transactions.lastpage = true;
                      } else {
                        transactions.lastpage = false;
                      }
                        if (response.data.transactions == undefined) {
                            console.log('unable to load transactions.');
                            callback(1);
                        } else if (response.data.transactions.length > 0) {
                            response.data.transactions.forEach(function(e) {
                                var transaction = {
                                    "height": e.height,
                                    "hash": e.hash,
                                    "timestamp": new Date(e.timestamp * 1000),
                                    "direction": e.direction,
                                    "recipents": [],
                                    "value": 0,
                                    "memo": ""
                                };
                                switch(determineTransactionType(e)){
                                    case TX_TYPE_ETP:
                                        //ETP transaction handling
                                        transaction.type = 'ETP';
                                        transaction.asset_type = 8;
                                        transaction.intrawallet = true;
                                        e.outputs.forEach(function(output){
                                            //first match is for pre-MPC deposit, with reward
                                            //second match is for post-MPC lock, no reward
                                            if (typeof output.script != 'undefined' && (output.script.match(/\[ (\w+) ] numequalverify dup hash160 \[ (\w+) \] equalverify checksig/) != null) || (output.script.match(/\[ (\w+) ] checksequenceverify drop dup hash160 \[ (\w+) \] equalverify checksig/) != null)) {
                                                var re = output.script.match(/\[ (\w+) ] numequalverify dup hash160 \[ (\w+) \] equalverify checksig/) != null ? /\[ (\w+) ] numequalverify dup hash160 \[ (\w+) \] equalverify checksig/ : /\[ (\w+) ] checksequenceverify drop dup hash160 \[ (\w+) \] equalverify checksig/;
                                                var nbrBlocksScript = output.script.replace(re, '$1');
                                                let locktime = getLocktimeFromHexa(nbrBlocksScript);
                                                transaction.locktime = locktime;
                                                transaction.unlockblock = parseInt(transaction.height) + locktime;
                                                transaction.frozen = true;
                                                transaction.intrawallet = true;
                                                transaction.recipents.push({
                                                    "address": output.address,
                                                    "value": parseInt(output['etp-value']),
                                                    "script": output.script
                                                });
                                                transaction.value += parseInt(output['etp-value']);
                                            } else if((transaction.direction==='receive' && output.own==='true') || (transaction.direction==='send' && output.own==='false')){
                                                transaction.frozen = false;
                                                transaction.intrawallet = false;
                                                transaction.recipents.push({
                                                    "address": output.address,
                                                    "value": parseInt(output['etp-value']),
                                                    "script": output.script
                                                });
                                                transaction.value += parseInt(output['etp-value']);
                                            }
                                            //memo
                                            if (typeof output.attachment.content != 'undefined') {
                                            transaction.memo = output.attachment.content;
                                            }
                                        });
                                        if(transaction.intrawallet)
                                            transaction.direction = 'intra';
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_ASSET:
                                        //Asset transactions
                                        transaction.intrawallet = true;
                                        e.outputs.forEach(function(output){
                                            if(output.attachment.type==='asset-transfer') {
                                                transaction.type = output.attachment.symbol;
                                                transaction.decimal_number = output.attachment.decimal_number;
                                                if((transaction.direction==='receive' && output.own==='true') || (transaction.direction==='send' && output.own==='false')){
                                                    transaction.intrawallet = false;
                                                    transaction.recipents.push({
                                                        "address": output.address,
                                                        "value": parseInt(output.attachment.quantity)
                                                    });
                                                    transaction.value += parseInt(output.attachment.quantity);
                                                }
                                            }
                                            //memo
                                            if (typeof output.attachment.content != 'undefined') {
                                              transaction.memo = output.attachment.content;
                                            }
                                        });
                                        if(transaction.intrawallet)
                                            transaction.direction = 'intra';
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_ISSUE:
                                        //Asset issue tx
                                        transaction.direction='issue';
                                        e.outputs.forEach(function(output){
                                            if(output.own==='true' && output.attachment.type==='asset-issue'){
                                                transaction.recipents.push({
                                                    "address": output.address,
                                                    "value": parseInt(output.attachment.quantity)
                                                });
                                                transaction.value += parseInt(output.attachment.quantity);
                                                transaction.type = output.attachment.symbol;
                                                transaction.decimal_number=output.attachment.decimal_number;
                                            } else if(output.own==='true' && output.attachment.type==='asset-cert'){
                                                /*var cert = {
                                                    "height": e.height,
                                                    "hash": e.hash,
                                                    "timestamp": new Date(e.timestamp * 1000),
                                                    "direction": "cert",
                                                    "recipents": [],
                                                    "value": 0,
                                                    "memo": "",
                                                    "type": output.attachment.symbol
                                                };
                                                cert.recipents.push({
                                                    "address": output.address
                                                });
                                                transactions.push(cert);*/
                                            } else if (typeof output.attachment.content != 'undefined') {
                                              //memo
                                              transaction.memo = output.attachment.content;
                                            }
                                        });
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_CERT:
                                        transaction.direction='cert';
                                        e.outputs.forEach(function(output){
                                            if(output.own==='true' && output.attachment.type==='asset-cert'){
                                                transaction.recipents.push({
                                                    "address": output.address
                                                });
                                                if(output.attachment.certs == 'naming') {
                                                    transaction.type = output.attachment.symbol;
                                                } else if (typeof transaction.type == 'undefined') {
                                                    transaction.type = output.attachment.symbol;
                                                }
                                            }
                                        });
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_DID_REGISTER:
                                        transaction.direction='did-register';
                                        e.outputs.forEach(function(output){
                                            if(output.own==='true' && output.attachment.type==='did-register'){
                                                transaction.recipents.push({
                                                    "address": output.address
                                                });
                                                transaction.type = output.attachment.symbol;
                                            }
                                        });
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_DID_TRANSFER:
                                        transaction.direction='did-transfer';
                                        e.outputs.forEach(function(output){
                                            if(output.own==='true' && output.attachment.type==='did-transfer'){
                                                transaction.recipents.push({
                                                    "address": output.address
                                                });
                                                transaction.type = output.attachment.symbol;
                                            }
                                        });
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_MIT:
                                        e.outputs.forEach(function(output){
                                            if(output.attachment.type==='mit'){
                                                if(output.attachment.status == 'transfered') {
                                                    transaction.direction='mit-transfer';
                                                } else {
                                                    transaction.direction='mit-issue';
                                                }
                                                if (typeof output.attachment.content != 'undefined') {
                                                  transaction.memo = output.attachment.content;
                                                }
                                                transaction.recipents.push({
                                                    "address": output.address
                                                });
                                                transaction.type = output.attachment.symbol;
                                            }
                                        });
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_COINSTAKE:
                                        transaction.direction = 'coinstake';
                                        transaction.type = 'ETP';
                                        transactions.push(transaction);
                                        break;
                                    case TX_TYPE_MST_MINING:
                                        transaction.direction = 'mstmining';
                                        transaction.intrawallet = false;
                                        e.outputs.forEach(function(output){
                                            if(output.attachment.type==='asset-transfer') {
                                                transaction.type_mst = output.attachment.symbol;
                                                transaction.decimal_number_mst = output.attachment.decimal_number;
                                                transaction.value_mst = parseInt(output.attachment.quantity);
                                            } else {
                                                transaction.type_etp = 'ETP';
                                                transaction.decimal_number_etp = 8;
                                                transaction.value_etp = parseInt(output['etp-value']);                                             
                                            }
                                        });
                                        transactions.push(transaction);
                                        break;
                                    default:
                                        break;
                                }
                            });
                            //Return transaction list
                            callback(null, transactions, total_page);
                        } else {
                            //Empty transaction list
                            callback(null, []);
                        }
                    } else if (response.message == "no record in this page") {
                      //Empty transaction list
                      callback(null, []);
                    } else {
                        $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then(function(data) {
                            callback(1, null, null, data);
                        });
                    }
                });

        }

    }

})();
