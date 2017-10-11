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

        //Test runned on port 3000, via Grunt
        var SERVER = window.location.hostname+":3000";

        //Replaced via the Gruntfile to the port 8820 in Live
        //var SERVER = window.location.hostname+":8820";
        //If we want to change the port, don't forget to change it in home.controller.js for the Console!

        var RPC_URL = 'http://' + SERVER + '/rpc';


        service.debug = false;

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
        service.ExportAccountAsFile = ExportAccountAsFile;
        service.ImportAccountFromFile = ImportAccountFromFile;


        service.SERVER = SERVER;

        //Mining
        service.Start = Start;
        service.Stop = Stop;
        service.GetMiningInfo = GetMiningInfo;

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
        service.SendAssetFrom = SendAssetFrom;
        service.SendAsset = SendAsset;
        service.Issue = Issue;
        service.SecondIssue = SecondIssue;
        service.Delete = Delete;


        //Chain
        service.FetchHeight = FetchHeight;
        service.FetchTx = FetchTx;
        service.FetchHeader = FetchHeader;
        service.GetBlock = GetBlock;
        service.ListTxsAddress = ListTxsAddress;

        //Misc
        service.Query = Query;
        service.Deposit = Deposit;
        service.FrozenAsset = FrozenAsset;

        return service;

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

        function ExportAccountAsFile(password, last_word, path) {
          var credentials = localStorageService.get('credentials');
          return _send('exportaccountasfile', [credentials.user, password, last_word, path]);
        }

        function ImportAccountFromFile(path, password) {
          return _send('importaccountfromfile', [path, password]);
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
        function ListTxs(page) {
            var credentials = localStorageService.get('credentials');
            //return _send('listtxs', ['-i', page, '-l', 1, credentials.user, credentials.password]);
            return _send('listtxs', ['-i', page, credentials.user, credentials.password]);
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
        function Send(recipent, quantity, transactionFee, memo) {
            var credentials = localStorageService.get('credentials');
            if(memo == '') {
              return _send('send', [credentials.user, credentials.password, recipent, quantity, '-f', transactionFee]);
            } else {
              return _send('send', [credentials.user, credentials.password, recipent, quantity, '-f', transactionFee, '-m', memo]);
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
        function SendFrom(sender, recipent, quantity, transactionFee, memo) {
            var credentials = localStorageService.get('credentials');
            if(memo == '') {
              return _send('sendfrom', [credentials.user, credentials.password, sender, recipent, quantity, '-f', transactionFee]);
            } else {
              return _send('sendfrom', [credentials.user, credentials.password, sender, recipent, quantity, '-f', transactionFee, '-m', memo]);
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
        function SendMore(recipents, transactionFee) {
            var credentials = localStorageService.get('credentials');
            var query = [];
            var recipent = '';
            query.push(credentials.user);
            query.push(credentials.password);
            query.push('-f');
            query.push(transactionFee);
            recipents.forEach( (e) => {
              recipent = e.address + ':' + e.value;
              query.push('-r');
              query.push(recipent);
            });
            return _send('sendmore', query);
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
        function Start() {
            var credentials = localStorageService.get('credentials');
            return _send('start', [credentials.user, credentials.password]);
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
            var credentials = localStorageService.get('credentials');
            return _send('getmininginfo', [credentials.user, credentials.password]);
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
            return _send('fetch-height', []);
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
        function CreateAsset(symbol, max_supply, secondary_offering, decimal_number, description) {
            max_supply*=Math.pow(10,decimal_number);
            var credentials = localStorageService.get('credentials');
            return _send('createasset', [credentials.user, credentials.password, '-s', symbol, '-v', max_supply, '-n',decimal_number, '-d', description]);
            //return _send('createasset', [credentials.user, credentials.password, '-s', symbol, '-v', max_supply, '-r', secondary_offering, '-n',decimal_number, '-d', description]);
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
        function Issue(symbol) {
          var credentials = localStorageService.get('credentials');
          return _send('issue', [credentials.user, credentials.password, symbol]);
        }



        function SecondIssue(symbol, increase_maximum_supply) {
          var credentials = localStorageService.get('credentials');
          return _send('secondissue', [credentials.user, credentials.password, symbol, increase_maximum_supply]);
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
            return _send('deleteunissuedasset', ['-s', symbol, credentials.user, credentials.password]);
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
            var credentials = localStorageService.get('credentials');
            return _send('getasset', [credentials.user, credentials.password, symbol]);
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

        /**
         * @api {post} /rpc Send asset
         * @apiName Send asset
         * @apiGroup Assets
         *
         * @apiDescription Sends an asset to a specified address.
         *
         * @apiParam {Const} method sendasset
         * @apiParam {List} params [username, password, recipent_address, symbol, quantity]
         *
         **/
        function SendAsset(recipent_address, symbol, quantity) {
            var credentials = localStorageService.get('credentials');
            return _send('sendasset', [credentials.user, credentials.password, recipent_address, symbol, quantity]);
        }

        /**
         * @api {post} /rpc Deposit ETP
         * @apiName Deposit
         * @apiGroup Deposit
         *
         * @apiDescription Detposits some ETP for a fixed period of time.
         *
         * @apiParam {Const} method deposit
         * @apiParam {List} params [-f depositperiod,username, password, amount]
         *
         **/
        function Deposit(deposit_period, amount, transactionFee, password, address) {
            var credentials = localStorageService.get('credentials');
            if (address != undefined) {
                return _send('deposit', ['-d', deposit_period, '-a', address, '-f', transactionFee, credentials.user, password, amount]);
                //return _send('deposit', ['-d', deposit_period, '-a', address, credentials.user, password, amount]);
            } else {
                return _send('deposit', ['-d', deposit_period, '-f', transactionFee, credentials.user, password, amount]);
                //return _send('deposit', ['-d', deposit_period, credentials.user, password, amount]);
            }
        }

        function FrozenAsset(deposit_period, amount, password, symbol, address) {
            var credentials = localStorageService.get('credentials');
            deposit_period *= 60*60*24;  //convert from day to second
            if (address != undefined) {
                return _send('frozenasset', ['-d', address, credentials.user, password, symbol, amount, deposit_period]);
            } else {
                return _send('frozenasset', [credentials.user, password, symbol, amount, deposit_period]);
            }
        }

        /**
         * @api {post} /rpc Send asset from
         * @apiName Send asset from
         * @apiGroup Assets
         *
         * @apiDescription Sends an asset from a specified address.
         *
         * @apiParam {Const} method sendassetfrom
         * @apiParam {List} params [username, password, sender_address, recipent_address, symbol, quantity]
         *
         **/
        function SendAssetFrom(sender_address, recipent_address, symbol, quantity) {
            var credentials = localStorageService.get('credentials');
            return _send('sendassetfrom', [credentials.user, credentials.password, sender_address, recipent_address, symbol, quantity]);
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
            return _send('getnewmultisig', query);
        }

        function ListMultiSig() {
          var credentials = localStorageService.get('credentials');
          return _send('listmultisig', [credentials.user, credentials.password]);
        }


        function CreateMultisigTx(fromAddress, toAddress, amount, transactionFee) {
          var credentials = localStorageService.get('credentials');
          return _send('createmultisigtx', [credentials.user, credentials.password, fromAddress, toAddress, amount, '-f', transactionFee]);
        }

        function SignMultisigTx(message, lastTx) {
          var credentials = localStorageService.get('credentials');
          if(lastTx) {
            return _send('signmultisigtx', [credentials.user, credentials.password, message, '-b']);
          } else {
            return _send('signmultisigtx', [credentials.user, credentials.password, message]);
          }
        }

        function CheckAccount(user, password) {
            //To check if account exists we can simply check the accounts balance
            return _send('getbalance', [user, password]);
        }

        function ImportAccount(user, password, phrase, address_count) {
          return _send('importaccount', ['-n', user, '-p', password, '-i', address_count, phrase]);
            //return this.Query('importaccount --accoutname ' + user + ' --password ' + password + ' -i' + address_count + ' ' + phrase);
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
        const TX_TYPE_UNKNOWN = 'UNKNOWN';

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
                    if (output.attachment.type === 'asset-transfer')
                        result = TX_TYPE_ASSET;
                    if (output.attachment.type === 'asset-issue')
                        result = TX_TYPE_ISSUE;
                });
                return (result) ? result : TX_TYPE_ETP;
            } else {
                return TX_TYPE_UNKNOWN;
            }
        }

        function LoadTransactions(callback, type, page) {
            MetaverseService.ListTxs(page)
                .then(function(response) {
                  var transactions = [];
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
                                    "value": 0
                                };
                                switch(determineTransactionType(e)){
                                case TX_TYPE_ETP:
                                    //ETP transaction handling
                                    transaction.type = 'ETP';
                                    transaction.asset_type=8;
                                    e.outputs.forEach(function(output){
                                        if((transaction.direction==='receive' && output.own==='true') || (transaction.direction==='send' && output.own==='false')){
                                            transaction.recipents.push({
                                                "address": output.address,
                                                "value": parseInt(output['etp-value'])
                                            });
                                            transaction.value += parseInt(output['etp-value']);
                                        }
                                    });
                                    if(transaction.value) {
                                      transactions.push(transaction);
                                    } else {
                                      //console.log(transaction);
                                    }
                                    break;
                                case TX_TYPE_ASSET:
                                    //Asset transactions
                                    e.outputs.forEach(function(output){
                                        if((transaction.direction==='receive' && output.own==='true') || (transaction.direction==='send' && output.own==='false') && output.attachment.type==='asset-transfer'){
                                            transaction.recipents.push({
                                                "address": output.address,
                                                "value": parseInt(output.attachment.quantity)
                                            });
                                            transaction.value += parseInt(output.attachment.quantity);
                                            transaction.type = output.attachment.symbol;
                                            transaction.decimal_number=output.attachment.decimal_number;
                                        }
                                    });
                                    if(transaction.value) {
                                      transactions.push(transaction);
                                    } else {
                                      //console.log(transaction);
                                    }
                                    break;
                                case TX_TYPE_ISSUE:
                                    //Asset issue tx
                                    transaction.direction='issue';
                                    e.outputs.forEach(function(output){
                                        if(output.own==='true' && output.attachment.type==='asset-issue'){
                                            transaction.recipents.push({
                                                "address": output.address,
                                                "value": parseInt(output.attachment.maximum_supply)
                                            });
                                            transaction.value += parseInt(output.attachment.maximum_supply);
                                            transaction.type = output.attachment.symbol;
                                            transaction.decimal_number=output.attachment.decimal_number;
                                        }
                                    });
                                    if(transaction.value) {
                                      transactions.push(transaction);
                                    } else {
                                      //console.log(transaction);
                                    }
                                }
                            });
                            //Return transaction list
                            callback(null, transactions);
                        } else {
                            //Empty transaction list
                            callback(null, []);
                        }
                    } else if (response.error = "no record in this page") {
                      //Empty transaction list
                      callback(null, []);
                    } else {
                        $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then(function(data) {
                            callback(1, null, data);
                        });
                    }
                });

        }

    }

})();
