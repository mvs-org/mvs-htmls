(function() {
  'use strict';

  angular.module('app')
  .controller('HomeController', HomeController)
  .controller('MenuController', MenuController)
  .controller('ConsoleController', ConsoleController)
  .controller('AddressesController', AddressesController)
  .controller('AccountController', AccountController)
  .controller('TransferAssetController', TransferAssetController)
  .controller('CreateAssetController', CreateAssetController)
  .controller('AssetsController', AssetsController)
  .controller('ShowAssetsController', ShowAssetsController)
  .controller('ShowAllAssetsController', ShowAllAssetsController)
  .controller('ETPController', ETPController)
  .controller('ETPMultiSignController', ETPMultiSignController)
  .controller('DepositController', DepositController)
  .controller('ExplorerController', ExplorerController)
  .controller('MiningController', MiningController)
  .directive('bsTooltip', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
          $(element).hover(function(){
              // on mouseenter
              $(element).tooltip('show');
          }, function(){
              // on mouseleave
              $(element).tooltip('hide');
          });
      }
    };
  })
  .directive('bsPopover', function($compile, $timeout){
    return function(scope, element) {
      $(element).popover();
      $('body').on('click', function (e) {
        //Hide the popover after click somewhere else, only for buttons
        if ($(e.target).data('toggle') !== 'popover' && $(e.target).parents('.popover.in').length === 0) {
            $(element).popover('hide');
        }
      });
   }
  })


  function MenuController($location, $rootScope){

    function setMenu(){
      $rootScope.selectedMenu={
        main: $location.path().split('/')[1]
      }
    }
    setMenu();
    $rootScope.$on("$locationChangeStart", function(event, next, current) {
      setMenu();
    });
  }

  function ExplorerController(MetaverseService, MetaverseHelperService, $location, $stateParams, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    $scope.typeSearch = $location.path().split('/')[2];
    $scope.search = $location.path().split('/')[3];
    $scope.transactionsAddressSearch = [];
    $scope.transaction_count = 0;
    $scope.assets = [];
    $scope.exists = false;
    $scope.transactionInputsValues = [];

    $scope.asset = '';



    //define if the research is a Hash, a Transaction, a Block or an Asset
    function defineTypeSearch () {
      if ($scope.typeSearch=='' || $scope.typeSearch=='noresult' || $scope.typeSearch=='search') {
        //nothing to do
      } else if ($scope.typeSearch === 'tx') {
        searchTransaction();
      } else if ($scope.typeSearch === 'adr') {
        searchAddress();
      } else if ($scope.typeSearch === 'blk') {
        blockInfo();
      } else {    //an error happenned or the user typed the URL manually
        $location.path('/explorer');
      }
    }


    defineTypeSearch();
    $window.scrollTo(0,0);

    //Used if we search an Address
    function searchAddress () {
      if ( typeof $scope.search !== 'undefined') {
        NProgress.start();
        MetaverseService.ListTxsAddress($scope.search)
        .then( (response) => {
          var transactions = [];
          if (typeof response.success !== 'undefined' && response.success && response.data != undefined) {
            response.data.transactions.forEach(function(e) {
              var transaction = {
                "height": e.height,
                "hash": e.hash,
                "timestamp": new Date(e.timestamp * 1000)
                //"direction": e.direction,
                //"recipents": [],
                //"value": 0
              };
              $scope.transactionsAddressSearch.push(transaction);
              $scope.exists = true;
            });
          } else {
            $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
              FlashService.Error(data);
              $location.path('/explorer');
            });
          }
          NProgress.done();
        });
      }
    }

    //Used if we search a Transaction
    function searchTransaction() {
      var transaction_hash = $scope.search;
      if ( typeof transaction_hash !== 'undefined') {
        NProgress.start();
        MetaverseService.FetchTx(transaction_hash)
        .then( (response) => {
          if (typeof response == 'undefined' || typeof response.success == 'undefined' || response.success == false) {
            $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
              FlashService.Error(data);
            });
          } else {
            $scope.transaction = response.data.transaction;
            $scope.exists = true;

            $scope.transaction.outputs.forEach(function(e) {
              if(e.attachment.type!='etp') {
                loadasset(e.attachment.symbol);
              }
            });

            //Search for the value of the input and put it in $scope.transactionInputsValues
            $scope.transactionInputsValues = [];
            response.data.transaction.inputs.forEach(function(e) {
              if (e.previous_output.hash != '0000000000000000000000000000000000000000000000000000000000000000') {
                //searchInputValue(e.previous_output.hash, e.address, e.previous_output.index); Removed, too slow
              } else {
                //console.log("It's coming from Deposit interests or Mining");
              }
            });
          }
          NProgress.done();
        });
      }
    }



    //Loads a given asset
    function loadasset(symbol) {

      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.asset = response.data.assets[0];
        } else {
          //Redirect user to the assets page
          $location.path('/asset/details/');
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }


    //Used to find the value of an Input
    function searchInputValue(transaction_hash, address, index) {
      if ( typeof transaction_hash !== 'undefined') {
        MetaverseService.FetchTx(transaction_hash)
        .then( (response) => {
          if (typeof response == 'undefined' || typeof response.success == 'undefined' || response.success == false) {
            $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
              FlashService.Error(data);
            });
          } else {
            response.data.transaction.outputs.forEach(function(e) {
              if(e.address == address && e.index == index) {
                if(e.attachment.type=='etp') {
                  var input = {
                    "address" : address,
                    "value" : e.value,
                    "hash" : transaction_hash,
                    "index" : e.index,
                    "type" : e.attachment.type
                  }
                } else {
                  //loadasset(e.attachment.symbol); //already calculated when this asset is an output
                  var input = {
                    "address" : address,
                    "value" : e.value,
                    "hash" : transaction_hash,
                    "index" : e.index,
                    "type" : e.attachment.type,
                    "quantity" : e.attachment.quantity,
                    "symbol" : e.attachment.symbol,
                    "decimal_number" :  $scope.asset.decimal_number
                  }
                }
                $scope.transactionInputsValues.push(input);
              }
            });
          }
        });
      }
    }



    //Used if we search a Block
    function blockInfo() {
      var blockHeight = $scope.search;
      $scope.blockInfos = [];

      if ( typeof blockHeight !== 'undefined') {
        NProgress.start();
        MetaverseService.FetchHeader(blockHeight)
        .then( (response) => {
          if (typeof response == 'undefined' || typeof response.success == 'undefined' || response.success == false) {
            $translate('MESSAGES.BLOCK_NOT_FOUND').then( (data) => {
              FlashService.Error(data);
            });
          } else {
            blockInfoTxs(response.data.result.hash);
            $scope.exists = true;
            $scope.blockInfos = {
              "hash": response.data.result.hash,
              "timestamp": new Date(response.data.result.time_stamp * 1000),
              //"transaction_count": response.data.result.transaction_count always display 0, we count the number of txs instead
              "nonce": response.data.result.nonce,
              "mixhash": response.data.result.mixhash,
              "version": response.data.result.version,
              "merkle_tree_hash": response.data.result.merkle_tree_hash,
              "previous_block_hash": response.data.result.previous_block_hash
            };
          }
          NProgress.done();
        });
      }
    }

    //Also used if we search a Block, to display the list of transactions
    function blockInfoTxs (hash) {
      $scope.transactionsPerBlock = [];

      MetaverseService.GetBlock(hash)
      .then( (response) => {
        if (typeof response == 'undefined' || typeof response.success == 'undefined' || response.success == false) {
          $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
            FlashService.Error(data);
            $location.path('/explorer');
          });
        } else {
          response.data.txs.transactions.forEach(function(e) {
            $scope.transaction_count++;
            var transaction = {
              "hash": e.hash
            };
            $scope.transactionsPerBlock.push(transaction);
          });
        }
        NProgress.done();
      });
    }
  }


  function DepositController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    $scope.changeFactor = changeFactor;
    $scope.deposit = deposit;
    $scope.selectAddress = selectAddress;         //Selection of a specific address
    $scope.selectAddressMem = '';                 //Keep in memory the specific address previously selected (if the user go to Auto and come back to Manual)
    $scope.autoSelectAddress=true;                //Automatically select the address
    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.period_select=undefined;

    function init() {
      $scope.sendfrom = '';
      $scope.deposit_address = "";
      $scope.value = "";
      $scope.password = '';
      $scope.value = '';
    }

    $scope.isNumber = angular.isNumber;

    $scope.deposit_options = {
      "DEPOSIT.PERIOD.WEEK": [0.001, 0.05, 7],
      "DEPOSIT.PERIOD.MONTH": [0.0066, 0.08, 30],
      "DEPOSIT.PERIOD.QUARTER": [0.0323, 0.128, 90],
      "DEPOSIT.PERIOD.HALF_YEAR": [0.0798, 0.16, 182],
      "DEPOSIT.PERIOD.YEAR": [0.2, 0.2, 365]
    };



    $scope.setDepositPeriod = setDepositPeriod;

    //Set the deposit period to use
    function setDepositPeriod(period) {
      $scope.period_select=period;
    }

    $rootScope.factor = "FACTOR_ETP";

    function changeFactor(factor) {
      switch (factor) {
        case 'satoshi':
        if ($rootScope.factor == "FACTOR_SATOSHI")
        return;
        $rootScope.factor = "FACTOR_SATOSHI";
        $scope.value *= 100000000;
        $scope.value = Math.round($scope.value);
        break;
        default:
        if ($rootScope.factor == "FACTOR_ETP")
        return;
        $rootScope.factor = "FACTOR_ETP";
        $scope.value /= 100000000;
      }
    }

    function deposit() {
      var credentials = localStorageService.get('credentials');

      if ($scope.password == '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
      } else if ($scope.sendfrom !== '' ) {
        FlashService.Error('Sorry, select the input address is not available for Deposits yet.');
      } else if ($scope.password != credentials.password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
      } else if (!($scope.value > 0)) {
        $translate('MESSAGES.INVALID_VALUE').then( (data) => FlashService.Error(data) );
      } else if ($scope.deposit_options[$scope.period_select] == undefined) {
        $translate('MESSAGES.INVALID_TIME_PERIOD').then( (data) => FlashService.Error(data) );
      } else {
        var deposit_value = ($rootScope.factor == "FACTOR_SATOSHI") ? $scope.value : ("" + $scope.value * 100000000).split(".")[0];
        MetaverseService.Deposit($scope.deposit_options[$scope.period_select][2], deposit_value, $scope.password, ($scope.address_option) ? $scope.deposit_address : undefined)
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success && response.data.error == undefined) {
            init();
            //Transaction was successful
            $translate('MESSAGES.DEPOSIT_SUCCESS').then( (data) => FlashService.Success(data + response.data.transaction.hash) );
            init();
          } else {

            //Transaction problem
            $translate('MESSAGES.DEPOSIT_ERROR').then( (data) => FlashService.Error(data) );
            $scope.password = '';
          }
        });
      }
      $window.scrollTo(0,0);
    }


    function selectAddress(type, address) {
      switch(type) {
        case 'auto':
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
        break;

        case 'manual':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=$scope.selectAddressMem;
        break;

        case 'selectionAddress':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=address;
        $scope.selectAddressMem=address;
        break;

        default:
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
      }
    }

    //Load users ETP balance
    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err)
      FlashService.Error(message);
      else {
        $scope.balance = balance;
      }
    });

    //Load the addresses and their balances
    function listBalances() {
      NProgress.start();
      MetaverseService.ListBalances()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.addresses = [];
          response.data.balances.forEach( (e) => {
            $scope.addresses.push({
              "balance": parseInt(e.balance.unspent),
              "address": e.balance.address,
              "frozen": e.balance.frozen
            });
          });
          init();
        }
        NProgress.done();
      });
    }

    listBalances();
    init();

  }



  /**
  * The ETP Controller provides ETP transaction functionality.
  */
  function ETPController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    //Start loading animation
    NProgress.start();

    $scope.transfer = transfer;
    $scope.changeFactor = changeFactor;

    $rootScope.factor = "FACTOR_ETP";

    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.selectAddress = selectAddress;         //Selection of a specific address
    $scope.selectAddressMem = '';                 //Keep in memory the specific address previously selected (if the user go to Auto and come back to Manual)
    $scope.autoSelectAddress = true;              //Automatically select the address
    $scope.selectAddressAvailable = true;         //If we send to more than 1 recipent, sendfrom is not available

    $scope.recipents = [];

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.fee = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
      MetaverseService.ListBalances(true)
      .then( (response) => {
        if (response.success)
        $scope.from_addresses = response.data.balances;
      });
      $scope.recipents = [];
      $scope.recipents.push({'index': 1, 'address': '', 'value': ''});
    }

    $scope.symbol = 'ETP';

    $scope.assetsIssued = [];

    MetaverseService.ListAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        response.data.assets.forEach( (e) => {
          if(e.status=='unspent') {
            $scope.assetsIssued.push({
              "symbol": e.symbol,
              "quantity": e.quantity,
              "decimal_number": e.decimal_number
            });
          }
        });
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
    });

    function changeFactor(factor) {
      switch (factor) {
        case 'satoshi':
        if ($rootScope.factor == "FACTOR_SATOSHI")
        return;
        $rootScope.factor = "FACTOR_SATOSHI";
        $scope.value *= 100000000;
        $scope.value = Math.round($scope.value);
        break;
        default:
        if ($rootScope.factor == "FACTOR_ETP")
        return;
        $rootScope.factor = "FACTOR_ETP";
        $scope.value /= 100000000;
      }
    }


    function selectAddress(type, address) {
      switch(type) {
        case 'auto':
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
        break;

        case 'manual':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=$scope.selectAddressMem;
        break;

        case 'selectionAddress':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=address;
        $scope.selectAddressMem=address;
        break;

        default:
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
      }
    }


    //Load users ETP balance
    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err)
      FlashService.Error(message);
      else {
        $scope.balance = balance;
      }
    });

    //Load the addresses and their balances
    MetaverseService.ListBalances()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.addresses = [];
        response.data.balances.forEach( (e) => {
          var name = "New address";
          if (localStorageService.get(e.balance.address) != undefined) {
            name = localStorageService.get(e.balance.address);
          }
          $scope.addresses.push({
            "balance": parseInt(e.balance.unspent),
            "address": e.balance.address,
            "name": name,
            "frozen": e.balance.frozen
          });
        });
      }
    });


    $scope.addRecipent = function() {
      $scope.recipents.push({'index': $scope.recipents.length+1, 'address': '', 'value': ''});
      $scope.autoSelectAddress = true;
      $scope.underlineAuto='underline';
      $scope.underlineManual='none';
      $scope.sendfrom='';
      $scope.selectAddressAvailable = false;
    }

    $scope.removeRecipent = function() {
      $scope.recipents.splice($scope.recipents.length-1, 1);
      if($scope.recipents.length==1) {
        $scope.selectAddressAvailable = true;
      }
    }


    //Transfers ETP
    function transfer() {
      var transactionOK=true;
      //Check for unimplemented parameters
      $scope.recipents.forEach( (e) => {
        if (e.address === '') { //Check for recipent address
          $translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then( (data) => FlashService.Error(data) );
          transactionOK = false;
        } else if (e.value === '') { //Check for transaction value
          $translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then( (data) => FlashService.Error(data) );
          transactionOK = false;
        }
      });
      if (transactionOK === false) {
        //error already handle
      } else if ($scope.fee !== '' || $scope.message !== '') {
        FlashService.Error('Sorry, only basic transfer works so far.');
      } else if ($scope.password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
      } else {
        //Check for password
        if (localStorageService.get('credentials').password != $scope.password) {
          $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        } else if ($scope.recipents.length == 1) { //Start transaction for 1 recipent
          transferOne();
        } else {  //Start transaction with more than 1 recipent
          transferMore();
        }
      }
      $window.scrollTo(0,0);
    }



    function transferOne() {
      NProgress.start();
      var value = '';
      var sendTo = '';
      $scope.recipents.forEach( (e) => {
        value = e.value;
        sendTo = e.address;
      });
      switch ($rootScope.factor) {
        case 'FACTOR_SATOSHI':
        break;
        case 'FACTOR_ETP':
        value *= 100000000;
        break;
        default:
        $translate('MESSAGES.TRANSFER_ERROR').then( (data) => FlashService.Error(data) );
        return;
      }
      value = Math.round(value);
      var SendPromise = ($scope.sendfrom) ? MetaverseService.SendFrom($scope.sendfrom, sendTo, value, $scope.password) : MetaverseService.Send(sendTo, value, $scope.password);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data + response.data.transaction.hash) );
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.TRANSFER_ERROR').then( (data) => {
            if (response.message != undefined) {
              FlashService.Error(data + " " + response.message);
            } else {
              FlashService.Error(data);
            }
          });
          $scope.password = '';
        }
      });
    }


    function transferMore() {
      NProgress.start();
      var recipentsQuery = [];    //data that will be used for the query

      $scope.recipents.forEach( (e) => {
        var value = e.value;
        switch ($rootScope.factor) {
          case 'FACTOR_SATOSHI':
            break;
          case 'FACTOR_ETP':
            value *= 100000000;
            break;
          default:
            $translate('MESSAGES.TRANSFER_ERROR').then( (data) => FlashService.Error(data) );
            return;
        }
        value = Math.round(value);
        recipentsQuery.push({
          "address": e.address,
          "value": value
        });
      });

      var SendPromise = MetaverseService.SendMore(recipentsQuery);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data + response.data.transaction.hash) );
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.TRANSFER_ERROR').then( (data) => {
            if (response.message != undefined) {
              FlashService.Error(data + " " + response.message);
            } else {
              FlashService.Error(data);
            }
          });
          $scope.password = '';
        }
      });
    }

    //Load a list of all transactions
    /*MetaverseHelperService.LoadTransactions( (err, transactions) => {
      if (err) {
        $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      } else {
        $scope.transactions = transactions;
      }
      NProgress.done();
    }, 'etp');*/

    //Initialize
    init();
    NProgress.done();

  }


  /**
  * The ETPMultiSign Controller provides ETP multi-signatures transaction functionality.
  */
  function ETPMultiSignController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    //Start loading animation
    NProgress.start();

    $rootScope.factor = "FACTOR_ETP";

    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.selectAddress = selectAddress;         //Selection of a specific address
    $scope.selectAddressMem = '';                 //Keep in memory the specific address previously selected (if the user go to Auto and come back to Manual)
    $scope.autoSelectAddress = true;              //Automatically select the address

    $scope.displayEmptyAdresses = false;

    $scope.recipents = [];

    $scope.getPublicKey = getPublicKey;
    $scope.publicKey = '';
    $scope.cosigners = [];
    $scope.getNewMultisign = getNewMultisign;
    $scope.nbrCosignersRequired = 0;



    $scope.listMultiSig = [];
    $scope.selectedMutliSigAddress = [];
    $scope.setMultiSigAddress = setMultiSigAddress;
    $scope.transferMultiSig = transferMultiSig;

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.fee = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
      MetaverseService.ListBalances(true)
      .then( (response) => {
        if (response.success)
        $scope.from_addresses = response.data.balances;
      });
      $scope.recipents = [];
      $scope.recipents.push({'index': 1, 'address': '', 'value': ''});
      $scope.cosigners = [];
      $scope.cosigners.push({'index': 1, 'publicKey': ''});
      $scope.nbrCosignersRequired = 0;
      $scope.selectedMutliSigAddress = [];
    }

    $scope.symbol = 'ETP';

    $scope.assetsIssued = [];

    function selectAddress(type, address) {
      switch(type) {
        case 'auto':
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
        $scope.publicKey = '';
        break;

        case 'manual':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=$scope.selectAddressMem;
        getPublicKey($scope.sendfrom);
        break;

        case 'selectionAddress':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=address;
        $scope.selectAddressMem=address;
        getPublicKey($scope.sendfrom);
        break;

        default:
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
      }
    }


    function setMultiSigAddress(mutliSig) {
      $scope.selectedMutliSigAddress = mutliSig;
    }


    //Load users ETP balance
    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err)
      FlashService.Error(message);
      else {
        $scope.balance = balance;
      }
    });

    //Load the addresses and their balances
    MetaverseService.ListBalances()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.addresses = [];
        response.data.balances.forEach( (e) => {
          var name = "New address";
          if (localStorageService.get(e.balance.address) != undefined) {
            name = localStorageService.get(e.balance.address);
          }
          $scope.addresses.push({
            "balance": parseInt(e.balance.unspent),
            "address": e.balance.address,
            "name": name,
            "frozen": e.balance.frozen
          });
        });
      }
      NProgress.done();
    });


    function getPublicKey(address) {
      //TODO: if address empty

      NProgress.start();
      MetaverseService.GetPublicKey(address)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.publicKey = response.data['public-key'];
          /*$scope.addresses = [];
          response.data.balances.forEach( (e) => {
            var name = "New address";
            if (localStorageService.get(e.balance.address) != undefined) {
              name = localStorageService.get(e.balance.address);
            }
            $scope.addresses.push({
              "balance": parseInt(e.balance.unspent),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen
            });*/
          }
        });
        NProgress.done();
    }



    $scope.addCoSigner = function() {
      $scope.cosigners.push({'index': $scope.cosigners.length+1, 'publicKey': ''});
    }

    $scope.removeCoSigner = function() {
      $scope.cosigners.splice($scope.cosigners.length-1, 1);
    }

    function getNewMultisign() {
      //console.log($scope.cosigners);
      //console.log($scope.nbrCosignersRequired);
      NProgress.start();
      if ($scope.sendfrom == '') {
        FlashService.Error('Please select an address');
      //TODO} else if ($scope.cosigners == []) {
        //FlashService.Error('Please select at least one co-signer');
      } else if ($scope.password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
      } else {
        MetaverseService.GetNewMultiSig($scope.nbrCosignersRequired, $scope.cosigners.length+1, $scope.publicKey, $scope.cosigners)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            //console.log("Success!");
            //console.log(response);
            /*$scope.addresses = [];
            response.data.balances.forEach( (e) => {
              var name = "New address";
              if (localStorageService.get(e.balance.address) != undefined) {
                name = localStorageService.get(e.balance.address);
              }
              $scope.addresses.push({
                "balance": parseInt(e.balance.unspent),
                "address": e.balance.address,
                "name": name,
                "frozen": e.balance.frozen
              });*/

          } else {
            //console.log("Fail...");
            //console.log(response);
          }
        });
      }
      NProgress.done();
    }

    //Used to dynamically update the number of signature required
    $scope.getNumber = function(num) {
      return new Array(num);
    }



    function listMultiSign() {
      NProgress.start();
      if ($scope.sendfrom == '') {
        FlashService.Error('Please select an address');
      } else if ($scope.password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
      } else {
        MetaverseService.ListMultiSig($scope.nbrCosignersRequired, $scope.cosigners.length+1, $scope.publicKey, $scope.cosigners)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            //console.log("Success!");
            //console.log(response);
            //$scope.listMultiSig = response.data;
            response.data.multisig.forEach( (e) => {
              var name = "New address";
              if (localStorageService.get(e.address) != undefined) {
                name = localStorageService.get(e.address);
              }
              //console.log(e);
              //console.log(e["public-keys"]);
              $scope.listMultiSig.push({
                "index": e.index,
                "m": e.m,
                "n": e.n,
                "selfpublickey": e["self-publickey"],
                "description": e.description,
                "address": e.address,
                "name": name,
                "publicKeys": e["public-keys"]
              });
            });
          } else {
            //console.log("Fail...");
            //console.log(response);
          }
        });
      }
      NProgress.done();
    }

    function transferMultiSig() {
      MetaverseService.SendFromMultiSig('36pgRzGKUfVbDdyKK7R52dERkv281FY6FK', 'tEPoUt8GsK6j9rqworo5KjorhkscS3oxiM', 10)
      .then( (response) => {
        //console.log(response);
      });
    }

    listMultiSign();

    //Initialize
    init();

  }



  function AddressesController(MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService, $window) {


    $scope.addresses = [];
    $scope.getnewaddress = getnewaddress;
    $scope.showqr = showqr;
    $scope.buttonCopyToClipboard = new Clipboard('.btn');

    $scope.enableEditAddressName = enableEditAddressName;
    $scope.endEditAddressName = endEditAddressName;
    $scope.newName = 'New Address';


    //Shows a modal of the address incl. a qr code
    function showqr(address) {
      $('#showqrmodal').modal();
      $("#modal_address").html(address);
      $('#modal_qr').html('');
      var qrcode = new QRCode(document.getElementById("modal_qr"), {
        text: address,
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      $('#showqrmodal').modal('show');
    }
      //Enable the edition of the Address Name
    function enableEditAddressName(address) {
      $scope.addresses.forEach( (e) => {
        if (e.address == address) {
          $scope.newName = e.name;
          e.edit = true;
        }
      });
    }
      //Save the edited name in the local storage
    function endEditAddressName(address, newName) {
      localStorageService.set(address,newName);
      $scope.addresses.forEach( (e) => {
        if (e.address == address) {
          e.name = newName;
          e.edit = false;
      }
    });
    }
      //Load the addresses and their balances
    function listBalances() {
      NProgress.start();
        MetaverseService.ListBalances()
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $scope.addresses = [];
            response.data.balances.forEach( (e) => {
              var name = localStorageService.get(e.balance.address);
              if (name == undefined) {
                name = "New Address";
              }
              $scope.addresses.push({
                "balance": parseInt(e.balance.unspent),
                "address": e.balance.address,
                "frozen": e.balance.frozen,
                "name": name,
                "edit": false
              });
            });
          }
          NProgress.done();
        });
      }

    function getnewaddress() {
      MetaverseService.GetNewAddress()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          FlashService.Success('Created new address: ' + response.data);
          listBalances();
        }
      });
    }

    listBalances();
  }

  function AccountController(MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService, $window) {

    $scope.showprivatekey = showprivatekey;
    $scope.changepassword = changepassword;
    $scope.accountname = localStorageService.get('credentials').user;
    $scope.debugState = MetaverseService.debug;

    $scope.setDeugger = setDeugger;

    function showprivatekey(password, last_word) {
      if (password == undefined) {
        $translate('MESSAGES.PASSWORD_NEEDED_FOR_PRIVATE_KEY').then( (data) => FlashService.Error(data) );
      } else if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
      } else {
        NProgress.start();
        MetaverseService.GetAccount(last_word)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $scope.privatekey = response.data['mnemonic-key'];
          } else {
            //Show mnemonic load error
            $translate('SETTINGS.MNEMONIC_LOAD_ERROR').then( (data) => FlashService.Error(data) );
          }
          NProgress.done();
        });
      }
    }

    function changepassword(password, new_password, new_password_repeat) {
      if (password == undefined || localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
      } else if (new_password == undefined || new_password.length < 6) {
        $translate('MESSAGES.PASSWORD_SHORT').then( (data) => FlashService.Error(data) );
      } else if (new_password != new_password_repeat) {
        $translate('MESSAGES.PASSWORD_NOT_MATCH').then( (data) => FlashService.Error(data) );
      } else {
        NProgress.start();
        MetaverseService.ChangePassword(new_password)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            //Show success message
            $translate('MESSAGES.CHANGE_PASSWORD_SUCCESS').then( (data) => {
              FlashService.Success(data, true);
              $location.path('/login');
            });
          } else {
            //Show change password error
            $translate('SETTINGS.CHANGE_PASSWORD_ERROR').then( (data) => FlashService.Error(data) );
          }
          NProgress.done();
        });

      }
    }

    function setDeugger(state) {
      MetaverseService.debug = (state == 1);
      $scope.debugState = MetaverseService.debug;
    }

  }

  function TransferAssetController(MetaverseService, $stateParams, $rootScope, $scope, $translate, $location, localStorageService, FlashService) {

    //$scope.symbol = $stateParams.symbol;
    $scope.symbol = $location.path().split('/')[2];
    $scope.sender_address = $stateParams.sender_address;
    $scope.sendasset = sendasset;

    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.selectAddress = selectAddress;         //Selection of a specific address
    $scope.selectAddressMem = '';                 //Keep in memory the specific address previously selected (if the user go to Auto and come back to Manual)
    $scope.autoSelectAddress=true;                //Automatically select the address

    $scope.symbol = $location.path().split('/')[2];

    $scope.assetsIssued = [];

    $scope.allAddresses = [];                     //Contains the list of all the addresses
    $scope.assetAddresses = [];                    //Contrain the asset balance of each address
    $scope.listBalances = listBalances;
    $scope.listAssetBalances = listAssetBalances;

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.fee = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
    }

    MetaverseService.ListAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        response.data.assets.forEach( (e) => {
          if(e.status=='unspent') {
            $scope.assetsIssued.push({
              "symbol": e.symbol,
              "quantity": e.quantity,
              "decimal_number": e.decimal_number
            });
          }
        });
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
    });


    function selectAssetType (symbol) {
      $scope.symbol = symbol;
    }


    function selectAddress(type, address) {
      switch(type) {
        case 'auto':
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
        break;

        case 'manual':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=$scope.selectAddressMem;
        break;

        case 'selectionAddress':
        $scope.autoSelectAddress=false;
        $scope.underlineAuto='none';
        $scope.underlineManual='underline';
        $scope.sendfrom=address;
        $scope.selectAddressMem=address;
        break;

        default:
        $scope.autoSelectAddress=true;
        $scope.underlineAuto='underline';
        $scope.underlineManual='none';
        $scope.sendfrom='';
      }
    }


    //We first load the list of all the addresses
    function listBalances() {
      NProgress.start();
      MetaverseService.ListBalances()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.allAddresses = [];
          response.data.balances.forEach( (e) => {
            $scope.allAddresses.push({
              "address": e.balance.address
            });
          });
          listAssetBalances();
        } else {
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
        NProgress.done();
      });
    }

    listBalances();

    function listAssetBalances() {
      NProgress.start();
      $scope.assetAddresses = [];
      $scope.allAddresses.forEach( (e) => {
        MetaverseService.GetAddressAsset(e.address)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success && response.data.assets != '') {    //If the address doesn't contain any asset, we don't need it
            response.data.assets.forEach( (a) => {
              var name = "New address";
              if (localStorageService.get(a.address) != undefined) {
                name = localStorageService.get(a.address);
              }
              a.name = name;
              $scope.assetAddresses.push(a);
            });
          }
        });
      });
      NProgress.done();
    }


    //Loads a given asset
    function loadasset(symbol) {
      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.asset = response.data.assets[0];
          $scope.assetsIssued.forEach( (a) => {
            if (a.symbol == symbol) {
              $scope.asset.quantity = a.quantity;
            }
          });
        } else {
          //Redirect user to the assets page
          $location.path('/asset/details/');
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }

    function sendasset(recipent_address, symbol, quantity) {
      if (localStorageService.get('credentials').password != $scope.password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
      } else if ($scope.recipent_address == undefined || $scope.recipent_address.length != 34) {
        $translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then( (data) => FlashService.Error(data) );
      } else if ($scope.quantity == undefined || !($scope.quantity > 0)) {
        $translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then( (data) => FlashService.Error(data) );
      } else {
        //Modify number to fit to number of decimals defined for asset
        quantity*=Math.pow(10,$scope.asset.decimal_number);
        var SendPromise = ($scope.sendfrom) ? MetaverseService.SendAssetFrom($scope.sendfrom, recipent_address, symbol, quantity) : MetaverseService.SendAsset(recipent_address, symbol, quantity);
        SendPromise
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.ASSETS_TRANSFER_SUCCESS').then( (data) => {
              FlashService.Success(data + response.data.transaction.hash, true);
              //Redirect user to the assets page
              $location.path('/asset/details/');
            });
          } else {
            //Show asset load error
            $translate('MESSAGES.ASSETS_TRANSFER_ERROR').then( (data) => FlashService.Error(data + " " + response.message) );
          }
        });
      }
    }

    init();
    loadasset($scope.symbol);

  }

  function ShowAllAssetsController(MetaverseService, $rootScope, $scope, $location, FlashService, $translate, $stateParams) {

    $scope.symbol = $stateParams.symbol;
    $scope.assets = [];
    $scope.issue = issue;

    //Load assets
    NProgress.start();
    MetaverseService.ListAllAssets()
    .then( (response) => {
      NProgress.done();
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assets = [];
        $scope.assets = response.data.assets;
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => {
          //Show asset load error
          FlashService.Error(data);
          //Redirect user to the assets page
          $location.path('/asset/details/');
        } );
      }
    });

    //If asset is defined -> load it
    if ($scope.symbol != undefined && $scope.symbol != "") {
      NProgress.start();
      loadasset($scope.symbol);
    }

    function issue(symbol) {
      NProgress.start();
      MetaverseService.Issue(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          loadasset($scope.symbol);
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data) );
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => FlashService.Error(data) );
        }
        NProgress.done();
      });
    }

    //Loads a given asset
    function loadasset(symbol) {
      NProgress.start();
      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.asset = response.data.assets[0];
          $scope.assets.forEach( (a) => {
            if (a.symbol == symbol) {
              $scope.asset.quantity = a.quantity;
            }
          });
        } else {
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        }
      });
      NProgress.done();
    }
  }


  function ShowAssetsController(MetaverseService, $rootScope, $scope, FlashService, $translate, $stateParams, $location) {

    $scope.symbol = $stateParams.symbol;
    $scope.assets = [];
    $scope.issue = issue;
    $scope.deleteAsset = deleteAsset;

    //Load assets
    NProgress.start();
    MetaverseService.ListAssets()
    .then( (response) => {
      NProgress.done();
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assets = [];
        $scope.assets = response.data.assets;
      } else {
        //Redirect user to the assets page
        $location.path('/asset/details/');
        //Show asset load error
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
    });

    //If asset is defined -> load it
    if ($scope.symbol != undefined && $scope.symbol != "") {
      NProgress.start();
      loadasset($scope.symbol);
    }

    function issue(symbol) {
      NProgress.start();
      MetaverseService.Issue(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          loadasset($scope.symbol);
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data) );
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => FlashService.Error(data) );
        }
        NProgress.done();
      });
    }

    //Loads a given asset
    function loadasset(symbol) {
      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.asset = response.data.assets[0];
          $scope.assets.forEach( (a) => {
            if (a.symbol == symbol) {
              $scope.asset.quantity = a.quantity;
            }
          });
        } else {
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }

    //Delete a not issued Asset
    function deleteAsset() {
      MetaverseService.Delete($scope.symbol)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.DELETE_SUCCESS').then( (data) => FlashService.Success(data) );
          $scope.asset.symbol='';
        } else {
          //Asset could not be delete
          $translate('MESSAGES.ASSETS_DELETE_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }
  }

  function CreateAssetController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $location, $translate) {

    //This object contains all form errors
    $scope.error = {};
    //Function to create a new asset
    $scope.createasset = createasset;

    //Initialize form data
    function init() {
      $scope.symbol = '';
      $scope.description = '';
      $scope.max_supply = 0;
      $scope.decimals = '';
      $scope.password = '';
    }

    init();

    //Check if the form is submittable
    function checkready() {
      //Check for errors
      for (var error in $scope.error) {
        if ($scope.error[error]) {
          $scope.submittable = false;
          return;
        }
      }
      $scope.submittable = true;
    }

    //Check if the max_supply is valid
    $scope.$watch('max_supply', (newVal, oldVal) => {
      $scope.error.max_supply = (newVal == undefined || !(newVal == parseInt(newVal)));
      checkready();
    });

    //Check if the symbol is valid
    $scope.$watch('symbol', (newVal, oldVal) => {
      $scope.error.symbol = (newVal == undefined || !newVal.match(/^[0-9A-Za-z.]+$/));
      checkready();
    });

    //Check if the decimals is valid
    $scope.$watch('decimals', (newVal, oldVal) => {
      $scope.error.decimals = (newVal == undefined || !(newVal >= 0 && newVal <= 8));
      checkready();
    });

    //Check if the description is valid
    $scope.$watch('description', (newVal, oldVal) => {
      $scope.error.description = (newVal == undefined || !(newVal.length > 0));
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.error.password = (newVal == undefined || !(newVal.length >= 6) || !(localStorageService.get('credentials').password == $scope.password));
      checkready();
    });

    //Create asset function
    function createasset() {
      if (localStorageService.get('credentials').password != $scope.password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
      } else {
        NProgress.start();
        //Let Metaverse create an local asset
        MetaverseService.CreateAsset($scope.symbol, $scope.max_supply, $scope.decimals, $scope.description)
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Show success message
            $translate('MESSAGES.ASSSET_CREATED_LOCAL_SUCCESS').then( (data) => {
              FlashService.Success(data, true);
              //Redirect user to the assets page
              $location.path('/home');
            });
          } else{
            FlashService.Error(response.message);
          }
        });
      }
    }
  }


  function AssetsController(MetaverseHelperService, MetaverseService, $rootScope, $scope, $location, $translate, FlashService) {

    $scope.assets = [];
    $scope.balance = {};
    $scope.transactions = [];
    $scope.transactionsFiltered = [];

    $scope.showDates = false;

    $scope.startDate = new Date(new Date()-(7*86400000)); //By default, display 1 week
    $scope.endDate = new Date();
    $scope.startDateUpdated = new Date();
    $scope.endDateUpdated = new Date();

    //$scope.setDates = setDates;
    //$scope.displayUpdatedDates = displayUpdatedDates;
    //$scope.showHistory = false;


    $scope.assetType = 'All';
    $scope.filterOnAsset = filterOnAsset;

    $scope.loadTransactions = loadTransactions;
    $scope.loadMore = loadMore;
    $scope.stopLoad = false;
    $scope.page = 3;          //By default, we load the 2 first pages


    function filterOnAsset (asset) {
      $scope.assetType = asset;
      filterTransactions();
      //displayUpdatedDates();
    }

    function filterTransactions() {
      $scope.transactionsFiltered = [];
      if ($scope.assetType == 'All') {
        $scope.transactionsFiltered = $scope.transactions;
      } else {
        $scope.transactions.forEach(function(e) {
          if (e.type==$scope.assetType) {
            $scope.transactionsFiltered.push(e);
          }
        });
      }
    }

    //Define the time period to use and show the dates From ... To ... if the Custom button is selected
    /*function setDates(period, startDate, endDate)
    {
      switch (period) {
        case 'week':
        $scope.showDates=false;
        $scope.endDate = new Date();
        $scope.startDate = new Date($scope.endDate-(7*86400000));//8640000 millisecond/day
        break;

        case 'month':
        $scope.showDates=false;
        $scope.endDate = new Date();
        $scope.startDate = new Date($scope.endDate-(30*86400000));
        break;

        case 'threeMonths':
        $scope.showDates=false;
        $scope.endDate = new Date();
        $scope.startDate = new Date($scope.endDate-(90*86400000));
        break;

        case 'custom':
        $scope.showDates=true;
        break;

        default:
        $scope.startDate = new Date();
        $scope.endDate = new Date();
      }
      displayUpdatedDates();
    }*/



    /*$scope.dateRangeFilter = function (transaction, startDate, endDate) {
      if (transaction >= startDate && transaction <= endDate) {
        return true;
      }
      return false;
    }*/


    //Update the startDate, endDate and list of transactions when the Submit button is clicked
    /*function displayUpdatedDates() {
      $scope.startDateUpdated = $scope.startDate;
      $scope.endDateUpdated = $scope.endDate;
      $scope.showHistory = true;
      $scope.transactionsFiltered = [];
      $scope.transactions.forEach(function(e) {
        if ($scope.dateRangeFilter(e.timestamp, $scope.startDateUpdated, $scope.endDateUpdated) && e.type==$scope.assetType) {
          $scope.transactionsFiltered.push(e);
        }
      });
    }*/



    //Load users ETP balance
    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err)
      FlashService.Error(message);
      else {
        $scope.balance = balance;
      }
    });


    MetaverseService.ListAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assets = response.data.assets;
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
    });


    function loadTransactions(min, max) {
      var page = min;
      for (; (page<max) && (!$scope.stopLoad); page++) {
        MetaverseHelperService.LoadTransactions( (err, transactions) => {
          if (err) {
            $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
          } else {
            if ((transactions.lastpage == true) || (transactions.lastpage == undefined)) {     //All the transactions have been loaded
              $scope.stopLoad = true;
            }
            transactions.forEach(function(e) {
              $scope.transactions.push(e);
            });
            //displayUpdatedDates();
            filterTransactions();
          }
          NProgress.done();
        }, 'asset', page);
      }
    }


    loadTransactions(1, 3);

    function loadMore() {
      if(!$scope.stopLoad) {
        $scope.page = $scope.page+1;
        loadTransactions($scope.page - 1, $scope.page);
      }
    }


  }


  function MiningController(MetaverseService, $rootScope, $scope, FlashService, $translate) {

    $scope.start = StartMining;
    $scope.stop = StopMining;
    $scope.status = {};
    $scope.isMining=false;



    function GetMiningInfo() {
      NProgress.start();
      MetaverseService.GetMiningInfo()
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.status = response.data['mining-info'];
          $scope.isMining = (response.data['mining-info'].status === 'true');  //Convert string to boolean
        } else {
          $translate('MESSAGES.MINING_STATUS_ERROR').then( (data) => FlashService.Error(data) );
        }
      });
    }


    function StartMining() {
      NProgress.start();
      MetaverseService.Start()
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.MINING_START_SUCCESS').then( (data) => FlashService.Success(data) );
          GetMiningInfo();
        } else {
          $translate('MESSAGES.MINING_START_ERROR').then( (data) => FlashService.Error(data) );
        }
      });
    }

    function StopMining() {
      NProgress.start();
      MetaverseService.Stop()
      .then(function(response) {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.MINING_STOP_SUCCESS').then( (data) => FlashService.Success(data) );
          GetMiningInfo();
        } else {
          $translate('MESSAGES.MINING_STOP_ERROR').then( (data) => FlashService.Error(data) );
        }
      });
    }

    GetMiningInfo();

  }

  function ConsoleController(MetaverseService, $rootScope, $scope) {

    var ws = new WebSocket('ws://' + MetaverseService.SERVER + '/ws');
    //To test the Console view with Grunt:
    //var ws = new WebSocket('ws://test4.metaverse.live:8820/ws');

    $("#inputField").focus();

    $scope.connected = false;

    ws.onmessage = (ev) => {
      NProgress.done();
      $scope.consolelog.push({
        query: $scope.querystring,
        answer: ev.data
      });
      $scope.connected = true;
      $scope.querystring = '';
      $scope.$apply();
      //scrolldown();
    };

    $scope.querystring = '';
    $scope.consolelog = [];

    /*To put the results in a window that we can scrolldown, with ID = consolelog
    function scrolldown() {
      window.setTimeout( () => {
        var elem = document.getElementById('consolelog');
        elem.scrollTop = elem.scrollHeight;
      }, 100);
    }*/

    $scope.query = () => {
      NProgress.start();
      ws.send($scope.querystring);
    };


  }

  function HomeController(MetaverseService, $rootScope, $scope, localStorageService, $interval, $translate, $location, $filter) {

    var vm = this;
    vm.account = localStorageService.get('credentials').user;
    $scope.height = '';
    $scope.assets = [];
    $scope.language = localStorageService.get('language');


    $scope.menu = {
      account: {
        show: 0
      },
      assets: {
        show: 0
      }
    };

    //Change Language
    vm.changeLang = (key) => $translate.use(key)
    .then( (key) => localStorageService.set('language', key)  )
    .catch( (error) => console.log("Cannot change language.") );



    function updateHeight() {
      MetaverseService.FetchHeight()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.height = response.data;
        }
      });
    }

    updateHeight();
    $interval( () => updateHeight(), 10000);

    $scope.show_account_menu = () => {
      $scope.menu.account.show = 1 - $scope.menu.account.show;
      $scope.menu.assets.show = 0;
    };

    $scope.show_assets_menu = () => {
      $scope.menu.assets.show = 1 - $scope.menu.assets.show;
      $scope.menu.account.show = 0;
    };



    function defineTypeSearch(search) {
      if (search === ' ') {                 //empty research
        $location.path('/noresult');
      } else if ($filter('uppercase')(search) === 'ETP') {
        $location.path('/addresses');
      } else if (search.length === 64) {
        $location.path('/explorer/tx/' + search);
      } else if (search.length === 34) {
        $location.path('/explorer/adr/' + search);
      } else if (!isNaN(search)) {
        $location.path('/explorer/blk/' + search);
      } else {    //The research's format doesn't match any kind, we check if it is in the list of assets
        loadListAssets(search);
      }
    };

    vm.search = (key) => defineTypeSearch(key);


    //Used to get the full list of Assets
    function loadListAssets(search) {
      var path = '/explorer/noresult/'+search;
      NProgress.start();
      MetaverseService.ListAllAssets()
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          response.data.assets.forEach(function(e) {
            //If we found the research in the list of Assets, et redirect to its page
            if ($filter('uppercase')(search) == e.symbol) {
              path = '/asset/details/'+search;
            }
          });
        } else {
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => {
            //Show asset load error
            FlashService.Error(data);
          } );
        }
        $location.path(path);
      });
      NProgress.done();
    }
  }
})();
