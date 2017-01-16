(function () {
    'use strict';

    angular
        .module('app')
        .factory('MetaverseService', MetaverseService);

    MetaverseService.$inject = ['$http','localStorageService'];
    function MetaverseService($http, localStorageService) {
        var service = {};

        var SERVER = '127.0.0.1:8820';

        var RPC_URL = 'http://'+SERVER+'/rpc';

        service.GetNewAccount = GetNewAccount;
        service.GetBalance = GetBalance;
        service.ListAddresses = ListAddresses;
        service.ListBalances = ListBalances;
        service.GetAccount = GetAccount;
        service.GetNewAddress = GetNewAddress;
        service.Send = Send;


        service.SERVER = SERVER;

        //Mining
        service.Start = Start;
        service.Stop = Stop;

        //Asset
        service.CreateAsset = CreateAsset;
        service.ListAssets = ListAssets;
        service.GetAsset = GetAsset;


        //Chain
        service.FetchHeight = FetchHeight;

        //Misc
        service.Query = Query;

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
          return $http.post(RPC_URL, { method: 'getnewaccount', params: [username,password] }).then(handleSuccess, handleError);
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
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *    "name":"x1",
         *    "mnemonic":"forum super bench parrot duty cliff cannon clump gossip panda other truth cable blossom toast ski thrive violin blood response card mass race corn",
         *    "hd_index":14,
         *    "priority":1
         *	}
         **/
        function GetAccount(user, password) {
            return $http.post(RPC_URL, { method: 'getaccount', params: [user,password] },{headers : {}}).then(handleSuccess, handleError);
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
            return $http.post(RPC_URL, { method: 'listaddresses', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
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
            return $http.post(RPC_URL, { method: 'getnewaddress', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
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
            return $http.post(RPC_URL, { method: 'getbalance', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
        }

        /**
         * @api {post} /rpc List balances
         * @apiName List balances
         * @apiGroup ETP
         *
         * @apiDescription Get the balances of all addresses of the given account.
         *
         * @apiParam {Const} method listbalances
         * @apiParam {List} params [username, password]
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
        function ListBalances() {
            var credentials = localStorageService.get('credentials');
            return $http.post(RPC_URL, { method: 'listbalances', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
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
        function Send(recipent,quantity) {

            var credentials = localStorageService.get('credentials');
            console.log([credentials.user,credentials.password, recipent, quantity]);
            return $http.post(RPC_URL, { method: 'send', params: [credentials.user,credentials.password, recipent, quantity] },{headers : {}}).then(handleSuccess, handleError);
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
        function SendMore(recipent,quantity) {
            var credentials = localStorageService.get('credentials');
            return $http.post(RPC_URL, { method: 'sendmore', params: [credentials.user,credentials.password, recipent, quantity] },{headers : {}}).then(handleSuccess, handleError);
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
            return $http.post(RPC_URL, { method: 'start', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
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
            return $http.post(RPC_URL, { method: 'stop', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
        }

        /**
         * @api {post} /rpc Get blockchain height
         * @apiName Get blockchain height
         * @apiGroup Blockchain
         *
         * @apiDescription Get the current height of the blockchain.
         *
         * @apiParam {Const} method fetch-height
         * @apiParam {List} params []
         *
         **/
        function FetchHeight() {
            return $http.post(RPC_URL, { method: 'fetch-height', params: [] },{headers : {}}).then(handleSuccess, handleError);
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
         * @apiParam {List} params [username, password,'-s',symbol,'-v',max_supply,'-d',description]
         *
         **/
        function CreateAsset(symbol, max_supply, description, address){
          var credentials = localStorageService.get('credentials');
          return $http.post(RPC_URL, { method: 'createasset', params: [credentials.user,credentials.password,'-s',symbol,'-v',max_supply,'-d',description] },{headers : {}}).then(handleSuccess, handleError);
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
        function ListAssets(){
          var credentials = localStorageService.get('credentials');
          return $http.post(RPC_URL, { method: 'listassets', params: [credentials.user,credentials.password] },{headers : {}}).then(handleSuccess, handleError);
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
        function GetAsset(symbol){
          var credentials = localStorageService.get('credentials');
          return $http.post(RPC_URL, { method: 'getasset', params: [credentials.user,credentials.password, symbol] },{headers : {}}).then(handleSuccess, handleError);
        }

        function Query(string){
          var command = string;
          var params = [];
          if(string.indexOf(' ') >= 0){
            command = string.split(" ")[0];
            params = string.substring(string.indexOf(command)+command.length+1).replace(/\s{2,}/g, ' ').split(' ');
          }
          return $http.post(RPC_URL, { method: command, params: params },{headers : {}}).then(handleSuccess, handleError);
        }

        // private functions
        function handleSuccess(res) {
        	if(res.error==undefined)
        		return { success: true, data: res.data};
        	else
        		return handleError(res);
        }

        function handleError(res) {
          if(res.error!=undefined)
            return { success: false, message: res.error };
          return { success: false, message: 'General connection error' };
        }



    }

})();
