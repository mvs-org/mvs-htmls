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
  .controller('AssetSecondaryIssueController', AssetSecondaryIssueController)
  .controller('AssetsController', AssetsController)
  .controller('ShowAssetsController', ShowAssetsController)
  .controller('ShowAllAssetsController', ShowAllAssetsController)
  .controller('ETPController', ETPController)
  .controller('ETPMultiSignController', ETPMultiSignController)
  .controller('DepositController', DepositController)
  .controller('ExplorerController', ExplorerController)
  .controller('ProfileController', ProfileController)
  .controller('CreateProfileController', CreateProfileController)
  .controller('AllProfilesController', AllProfilesController)
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
  .directive('z', function($compile, $timeout){
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
  .directive("fileread", [function () {
    return {
      scope: {
        fileread: "="
      },
      link: function (scope, element, attributes) {
        element.bind("change", function (changeEvent) {
          var reader = new FileReader();
          reader.onload = function (loadEvent) {
            scope.$apply(function () {
              scope.fileread = loadEvent.target.result;
            });
          }
          reader.readAsText(changeEvent.target.files[0]);
        });
      }
    }
  }])
  .directive('checkImage', function() {
   return {
      link: function(scope, element, attrs) {
         element.bind('error', function() {
            element.attr('src', 'icon/default.png'); // set default image
         });
       }
     }
  })
  .filter('convertfortx',function(){
      return function(input, asset_type){
          if(typeof asset_type === 'undefined')
              asset_type=8;
          /*input += '';
          asset_type = parseInt(asset_type);
          1: no decimals, 2: correct number of decimals, 3: more decimals than allowed (asset_type)
          return input.indexOf('.') < 0 ? input + '0'.repeat(asset_type) :
            asset_type - (input.length - (input.indexOf('.') + 1)) >= 0 ? input.slice(0, input.indexOf('.')) + input.slice(input.indexOf('.') + 1) + '0'.repeat(asset_type - (input.length - (input.indexOf('.') + 1))) :
            input.slice(0, input.indexOf('.')) + input.slice(input.indexOf('.') + 1, input.indexOf('.') + 1 + asset_type)*/
          return bigDecimal.multiply(input, Math.pow(10,asset_type));
      };
  });


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

    $window.scrollTo(0,0);
    $scope.typeSearch = $location.path().split('/')[2];
    $scope.search = $location.path().split('/')[3];

    $scope.transactionsAddressSearch = [];
    $scope.searchAddressloadTransactions = searchAddressloadTransactions;
    $scope.searchAddressloadMore = searchAddressloadMore;
    $scope.page = 2;            //by default we load the first page only
    $scope.stopLoad = false;
    $scope.showqr = showqr;

    $scope.transaction_count = 0;
    $scope.assets = [];
    $scope.exists = false;
    $scope.noResult = false;
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


    //Used if we search an Address
    function searchAddress () {
      if ( typeof $scope.search !== 'undefined') {
        searchAddressloadTransactions(1, 2);
        //showqr($scope.search);
      }
    }

    function searchAddressloadTransactions(min, max) {
      var page = min;
      for (; (page<max) && (!$scope.stopLoad); page++) {
        NProgress.start();
        MetaverseService.ListTxsAddress($scope.search, page)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success && response.data != undefined) {
            if ((response.data.total_page == response.data.current_page)&&(!isNaN(response.data.total_page))) {     //All the transactions have been loaded
              $scope.stopLoad = true;
            }

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
            $translate('MESSAGES.NO_LISTED_TRANSACTIONS').then( (data) => {
              FlashService.Error(data);
              //$location.path('/explorer');
              $scope.noResult = true;
            });
          }
          NProgress.done();
        });
      }
    }


/*
      var page = min;
      for (; (page<max) && (!$scope.stopLoad); page++) {
        MetaverseHelperService.LoadTransactions( (err, transactions) => {
          if (err) {
            $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
            $window.scrollTo(0,0);
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
*/


    //Shows the QRCode
    function showqr(address) {
      angular.element(document).ready(function () {
        var qrcode = new QRCode(document.getElementById("qrcode"), {
          text: address,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      });
    }





    function searchAddressloadMore() {
      if(!$scope.stopLoad) {
        $scope.page = $scope.page+1;
        searchAddressloadTransactions($scope.page - 1, $scope.page);
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
            $scope.noResult = true;
            $window.scrollTo(0,0);
          } else {
            $scope.transaction = response.data.transaction;
            $scope.exists = true;
            var first = true;

            $scope.transaction.inputs.forEach(function(e) {
              e.display = false;
              if(first) {
                e.first = true;
                first=false;
              } else {
                e.first=false;
              }
            });

            $scope.transaction.outputs.forEach(function(e) {
              e.display = false;
              if(e.attachment.type!='etp') {
                loadasset(e.attachment.symbol);
              }
              //console.log(e.script);
              //var script = e.script;
              //var occurence = script.match('[' + (/[a-z]|[A-Z]|[0-9]| /g) + '] numequalverify dup hash160 ['+ (/[a-z]|[A-Z]|[0-9]| /g) + '] equalverify checksig');

              //var occurence = script.match(\[([\\w| ]+)\] numequalverify dup hash160 \[[\\w| ]+\] equalverify checksig);
              //console.log(occurence);
              /*var occurences = phraseToSend.match(/[a-z]|[A-Z]| /g);
              if(phraseToSend.length != occurences.length){
                $translate('MESSAGE.WRONG_PRIVATE_KEY').then( (data) => FlashService.Error(data) );
                $window.scrollTo(0,0);
                return;*/
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
          $location.path('/asset/myassets');
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
          if (typeof response.success == 'undefined' || response.success == false) {
            $scope.noResult = true;
            $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
              FlashService.Error(data);
            });
            $window.scrollTo(0,0);
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
            $scope.noResult = true;
            $translate('MESSAGES.BLOCK_NOT_FOUND').then( (data) => {
              FlashService.Error(data);
            });
            $window.scrollTo(0,0);
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


  function DepositController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window, $location, $filter) {

    $window.scrollTo(0,0);
    $scope.symbol = $filter('uppercase')($location.path().split('/')[2]);
    $scope.deposit = deposit;

    $scope.period_select=undefined;
    $scope.assetsIssued = [];
    $scope.balance = [];
    $scope.transactionFee = 0.0001;
    $scope.availableBalance = 0;
    $scope.sendAll = sendAll;

    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;


    function init() {
      $scope.deposit_address = "";
      $scope.value = "";
      $scope.password = '';
      $scope.value = '';
      $scope.transactionFee = 0.0001;
      $scope.confirmation = false;
    }

    $scope.isNumber = angular.isNumber;

    MetaverseService.ListAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if(response.data.assets != "") {    //if the user has some assets
          response.data.assets.forEach( (e) => {
            if(e.status=='unspent') {
              $scope.assetsIssued.push({
                "symbol": e.symbol
              });
              if(e.symbol == $scope.symbol) {
                $scope.balance['total-unspent'] = e.quantity,
                $scope.balance['total-frozen'] = e.quantity,
                $scope.decimal_number = e.decimal_number
              }
            }
          });
        } else {    //if the user has 0 asset

        }
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      if($scope.symbol == 'ETP') {
        loadEtpBalance();
      }
    });


    //[effective interest rate, annual interest rate, period, nbr blocks]
    $scope.deposit_options = {
      "DEPOSIT.PERIOD.WEEK": [0.0009589, 0.05, 7, 25200],
      "DEPOSIT.PERIOD.MONTH": [0.0066667, 0.08, 30, 108000],
      "DEPOSIT.PERIOD.QUARTER": [0.032, 0.128, 90, 331200],
      "DEPOSIT.PERIOD.HALF_YEAR": [0.08, 0.16, 182, 655200],
      "DEPOSIT.PERIOD.YEAR": [0.2, 0.2, 365, 1314000]
    };



    $scope.setDepositPeriod = setDepositPeriod;

    //Set the deposit period to use
    function setDepositPeriod(period) {
      $scope.period_select=period;
    }

    function checkInputs(value, transactionFee, period_select, password) {
      if (!(value > 0)) {
        $translate('MESSAGES.INVALID_VALUE').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (transactionFee < 0.0001) {
        $translate('MESSAGES.TOO_LOW_FEE').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if ($scope.deposit_options[period_select] == undefined) {
        $translate('MESSAGES.INVALID_TIME_PERIOD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (password == '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (password != localStorageService.get('credentials').password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }


    function deposit(value, transactionFee, period_select, password) {
      //var deposit_value = ("" + value * Math.pow(10,$scope.decimal_number)).split(".")[0];
      //var fee_value = ("" + transactionFee * Math.pow(10,$scope.decimal_number)).split(".")[0];
      var deposit_value = $filter('convertfortx')(value, $scope.decimal_number);
      var fee_value = $filter('convertfortx')(transactionFee, $scope.decimal_number);

      var SendPromise = ($scope.symbol == 'ETP') ? MetaverseService.Deposit($scope.deposit_options[period_select][2], deposit_value, fee_value, password, ($scope.address_option) ? $scope.deposit_address : undefined) : MetaverseService.FrozenAsset($scope.deposit_options[period_select][2], deposit_value, fee_value, password, $scope.symbol, ($scope.address_option) ? $scope.deposit_address : undefined);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          init();
          //Transaction was successful
          $translate('MESSAGES.DEPOSIT_SUCCESS').then( (data) => FlashService.Success(data + response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.DEPOSIT_ERROR').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " " + response.message.message);
            } else {
              FlashService.Error(data);
            }
          });
          $window.scrollTo(0,0);
          $scope.password = '';
        }
      });
    }

    //Load users ETP balance
    function loadEtpBalance() {
      MetaverseHelperService.GetBalance( (err, balance, message) => {
        if (err) {
        FlashService.Error(message);
          $window.scrollTo(0,0);
        } else {
          $scope.balance = balance;
          $scope.decimal_number = 8;
          $scope.availableBalance = balance['total-available'];
        }
      });
    }

    function availBalance(address) {
      if(address == '') {
        $scope.availableBalance = $scope.balance['total-available'];
      } else {
        $scope.addresses.forEach( (a) => {
          if(a.address == address) {
            $scope.availableBalance = a.balance - a.frozen;
          }
        });
      }
    }

    function sendAll() {
      $scope.value = ($scope.availableBalance - $scope.transactionFee*100000000)/100000000;
    }

    init();

  }



  /**
  * The ETP Controller provides ETP transaction functionality.
  */
  function ETPController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window, $filter) {

    $window.scrollTo(0,0);
    //Start loading animation
    NProgress.start();

    $scope.transfer = transfer;
    $scope.typeTransaction = "simple",

    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.autoSelectAddress = true;              //Automatically select the address
    $scope.selectAddressAvailable = true;         //If we send to more than 1 recipent, sendfrom is not available
    $scope.transactionFee = 0.0001;
    $scope.memo = '';
    $scope.getBalance = getBalance;

    $scope.recipents = [];
    $scope.listAddresses = [];

    $scope.symbol = 'ETP';

    $scope.availBalance = availBalance;
    $scope.availableBalance = 0;
    $scope.sendAll = sendAll;

    $scope.checkRecipent = checkRecipent;
    $scope.allDids = [];
    $scope.allDidsAddresses = [];
    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;

    // Initializes all transaction parameters with empty strings.
    function init() {
      getBalance();
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.fee = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
      $scope.transactionFee = 0.0001;
      $scope.memo = '';
      $scope.confirmation = false;
      $scope.correctEtpAddress = false;
      $scope.correctAvatar = false;
      $scope.burnAddress = false;
      MetaverseService.ListBalances(true)
      .then( (response) => {
        if (response.success)
        $scope.from_addresses = response.data.balances;
      });
      $scope.recipents = [];
      $scope.recipents.push({'index': 1, 'address': '', 'value': ''});
    }

    function getBalance(){
      //Load users ETP balance
      MetaverseHelperService.GetBalance( (err, balance, message) => {
        if (err) {
          FlashService.Error(message);
          $window.scrollTo(0,0);
        } else {
          $scope.balance = balance;
          $scope.availableBalance = balance['total-available'];
        }
      });
    }

    getBalance();

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
        $scope.allDidsSymbols = [];
        $scope.allDids.forEach(function(did) {
          $scope.allDidsSymbols.push(did.symbol);
          $scope.allDidsAddresses[did.address] = did.symbol;
        });
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      //Once all the DIDs have been loaded, we look for the one entered by the user
      checkRecipent($scope.recipents[0].address, 1);
    });

    function checkRecipent(input, index) {
      if (typeof input == 'undefined' || '') {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = false;
      } else if((($rootScope.network == 'testnet' && input.charAt(0) == 't') || ($rootScope.network == 'mainnet' && input.charAt(0) == 'M') || input.charAt(0) == '3') && input.length == 34) {
        $scope.recipents[index-1].correctEtpAddress = true;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = false;
      } else if ($scope.allDidsSymbols.indexOf($filter('uppercase')(input)) > -1) {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = true;
        $scope.recipents[index-1].burnAddress = false;
      } else if (input == MetaverseService.burnAddress) {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = true;
      } else {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = false;
      }
    }



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

    //Check Inputs
    function checkInputs(sendfrom, recipents, transactionFee, memo, password) {
      var transactionOK = true;
      //Check for unimplemented parameters
      recipents.forEach( (e) => {
        if (!e.correctEtpAddress && !e.correctAvatar && !e.burnAddress) { //Check for recipent address
          $translate('TRANSFER.INCORRECT_RECIPIENT').then( (data) =>
            $translate('TRANSFER_RECIPENT_ADDRESS').then( (data2) => FlashService.Error(data + ' (' + data2 + ' ' + e.index + ')' ))
          );
          $window.scrollTo(0,0);
          transactionOK = false;
        } else if (typeof e.value == 'undefined' || e.value === '') { //Check for transaction value
          $translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
          transactionOK = false;
        } else if (e.value > ($scope.availableBalance/100000000 - transactionFee)) { //Check for transaction value
          $translate('MESSAGES.TRANSACTION_AMOUNT_NOT_ENOUGH').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
          transactionOK = false;
        }
      });
      if (transactionOK === false) {
        //error already handle
      } else if (transactionFee < 0.0001) { //Check for empty password
        $translate('MESSAGES.TOO_LOW_FEE').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        if(recipents[0].correctAvatar) {
          recipents[0].address = $filter('uppercase')(recipents[0].address);
        }
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    //Transfers ETP
    function transfer(sendfrom, recipents, transactionFee, memo, password) {
      if (recipents.length == 1) { //Start transaction for 1 recipent
          transferOne(sendfrom, recipents, transactionFee, memo, password);
      } else {  //Start transaction with more than 1 recipent
          transferMore(sendfrom, recipents, transactionFee, memo, password);
      }
      $window.scrollTo(0,0);
    }



    function transferOne(sendfrom, recipents, transactionFee, memo, password) {
      NProgress.start();
      var value = recipents[0].value;
      var sendTo = recipents[0].address;
      //var fee = transactionFee * 100000000;
      //value *= 100000000;
      //value = Math.round(value);
      var fee = $filter('convertfortx')(transactionFee, 8);
      value = $filter('convertfortx')(value, 8);
      if (recipents[0].correctEtpAddress || recipents[0].burnAddress) {
        var SendPromise = (sendfrom) ? MetaverseService.SendFrom(sendfrom, sendTo, value, fee, memo, password) : MetaverseService.Send(sendTo, value, fee, memo, password);
      } else {
        var SendPromise = (sendfrom) ? MetaverseService.DidSendFrom(sendfrom, sendTo, value, fee, memo, password) : MetaverseService.DidSend(sendTo, value, fee, memo, password);
      }
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data + response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.TRANSFER_ERROR').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " " + response.message.message);
            } else {
              FlashService.Error(data);
            }
          });
          $window.scrollTo(0,0);
          $scope.password = '';
        }
      });
    }


    function transferMore(sendfrom, recipents, transactionFee, memo, password) {
      NProgress.start();
      var recipentsQuery = [];    //data that will be used for the query
      var fee = transactionFee * 100000000;

      recipents.forEach( (e) => {
        var value = e.value;
        value *= 100000000;
        value = Math.round(value);
        recipentsQuery.push({
          "address": e.address,
          "value": value
        });
      });

      var SendPromise = MetaverseService.SendMore(recipentsQuery, fee);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data + response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.TRANSFER_ERROR').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " " + response.message.message);
            } else {
              FlashService.Error(data);
            }
          });
          $window.scrollTo(0,0);
          $scope.password = '';
        }
      });
    }

    function availBalance(address) {
      if(address == '') {
        $scope.availableBalance = $scope.balance['total-available'];
      } else {
        $scope.availableBalance = $scope.addresses[address].balance - $scope.addresses[address].frozen;
      }
    }

    function sendAll() {
      $scope.recipents[0].value = ($scope.availableBalance - 100000000*$scope.transactionFee)/100000000;
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



    function listMultiSign() {
      NProgress.start();
      //Load users ETP balance
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
            $scope.addresses[e.balance.address] = ({
              "balance": parseInt(e.balance.unspent),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen,
              "type": "single"
            });
            $scope.listAddresses.push({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address
            });
            /*$scope.addresses[e.balance.address] = parseInt(e.balance.unspent);
            console.log($scope.addresses[e.balance.address]);
            $scope.addresses.push({
              "balance": parseInt(e.balance.unspent),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen,
              "type": "single"
            });*/
          });

          //After loading the balances, we load the multisig addresses
          MetaverseService.ListMultiSig()
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              if(response.data.multisig != "") {    //if the user has some assets
                response.data.multisig.forEach( (e) => {
                  $scope.addresses[e.address].type = "multisig";
                });
              } else {
                //The account has no multi-signature address
              }
            } else {
              //Fail
            }
          });
        }
      });
      NProgress.done();
    }

    listMultiSign();

    //Initialize
    init();
    NProgress.done();

  }


  /**
  * The ETPMultiSign Controller provides ETP multi-signatures transaction functionality.
  */
  function ETPMultiSignController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    $window.scrollTo(0,0);
    //Start loading animation
    NProgress.start();

    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.autoSelectAddress = false;              //Automatically select the address

    $scope.displayEmptyAdresses = false;

    $scope.recipents = [];

    $scope.getPublicKey = getPublicKey;
    $scope.publicKey = '';
    $scope.cosigners = [];
    $scope.getNewMultisign = getNewMultisign;
    $scope.nbrCosignersRequired = 0;

    $scope.availableBalance = 0;

    $scope.sendAllMultisig = sendAllMultisig;
    $scope.transactionFee = 0.0001;
    $scope.listAddresses = [];                    //List of addresses



    $scope.listMultiSig = [];
    $scope.selectedMutliSigAddress = [];
    $scope.setMultiSigAddress = setMultiSigAddress;
    $scope.createMultisigTx = createMultisigTx;
    $scope.transferSuccess = false;                 //Change to True after a successful transaction
    $scope.resultCreateTx = '';
    $scope.signMultisigTx = signMultisigTx;

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.fee = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
      $scope.availableBalance = 0;
      $scope.publicKey = '';
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
      $scope.transferSuccess = false;
      $scope.resultCreateTx = '';
    }



    function setMultiSigAddress(mutliSig) {
      $scope.selectedMutliSigAddress = mutliSig;
    }



    function getPublicKey(address) {
      NProgress.start();
      MetaverseService.GetPublicKey(address)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.publicKey = response.data['public-key'];
        } else {
          $translate('MESSAGES.ADDRESS_NOT_FOUND').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
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
      NProgress.start();
      var transactionOK=true;
      //Check for unimplemented parameters
      $scope.cosigners.forEach( (e) => {
        if (e.publicKey.length != 66) { //Check for public keys
          $translate('MESSAGES.CREATE_MULTISIGNATURE_WRONG_PUBLIC_KEY').then( (data) => FlashService.Error(data + ' ' + e.index) );
          $window.scrollTo(0,0);
          transactionOK = false;
        }
      });

      if (transactionOK == false) {
        //error already handle
      } else {
        var SendPromise = MetaverseService.GetNewMultiSig($scope.nbrCosignersRequired, $scope.cosigners.length+1, $scope.publicKey, $scope.cosigners);
        SendPromise
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Creation was successful
            $translate('MESSAGES.CREATE_MULTISIGNATURE_SUCCESS').then( (data) => FlashService.Success(data + " " + response.data.address) );
            $window.scrollTo(0,0);
            init();
          } else {
            //Transaction problem
            $translate('MESSAGES.CREATE_MULTISIGNATURE_ERROR').then( (data) => {
              if (response.message != undefined) {
                FlashService.Error(data + " " + response.message);
                $window.scrollTo(0,0);
              } else {
                FlashService.Error(data);
                $window.scrollTo(0,0);
              }
            });
          }
        });
      }
      NProgress.done();
    }

    //Used to dynamically update the number of signature required
    $scope.getNumber = function(num) {
      return new Array(num);
    }

    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err) {
        FlashService.Error(message);
        $window.scrollTo(0,0);
      } else {
        $scope.balance = balance;
      }
    });

    function listMultiSign() {
      NProgress.start();
      //Load users ETP balance
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
            $scope.addresses[e.balance.address] = ({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen,
              "type": "single"
            });
            $scope.listAddresses.push({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address
            });
          });

          //After loading the balances, we load the multisig addresses
          MetaverseService.ListMultiSig()
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              if(response.data.multisig != "") {    //if the user has some assets
                response.data.multisig.forEach( (e) => {
                  $scope.addresses[e.address].type = "multisig";
                  var name = "New address";
                  if (localStorageService.get(e.address) != undefined) {
                    name = localStorageService.get(e.address);
                  }
                  var balance = '';
                  $scope.listMultiSig.push({
                    "index": e.index,
                    "m": e.m,
                    "n": e.n,
                    "selfpublickey": e["self-publickey"],
                    "description": e.description,
                    "address": e.address,
                    "name": name,
                    "balance": $scope.addresses[e.address].balance,
                    "available": $scope.addresses[e.address].available,
                    "publicKeys": e["public-keys"]
                  });
                });
              } else {
                //The account has no multi-signature address
              }
            } else {
              //Fail
            }
          });
        }
      });
      NProgress.done();
    }


    function createMultisigTx(sendFrom, sendTo, quantity, transactionFee) {
      //var quantityToSend = ("" + quantity * Math.pow(10,8)).split(".")[0];
      var quantityToSend = $filter('convertfortx')(quantity, 8);
      //var transactionFeeToSend = ("" + transactionFee * Math.pow(10,8)).split(".")[0];
      var transactionFeeToSend = $filter('convertfortx')(transactionFee, 8);
      if ($scope.password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (quantityToSend > ($scope.availableBalance - transactionFeeToSend)) {
        $translate('MESSAGES.TRANSACTION_AMOUNT_NOT_ENOUGH').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        MetaverseService.CreateMultisigTx(sendFrom, sendTo, quantityToSend, transactionFeeToSend)
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Transaction was successful
            $translate('MESSAGES.CREATE_MULTISIGNATURE_SUCCESS').then( (data) => FlashService.Success(data) );
            $window.scrollTo(0,0);
            init();
            $scope.transferSuccess = true;
            $scope.resultCreateTx = response.data;
          } else {
            //Transaction problem
            $translate('MESSAGES.CREATE_MULTISIGNATURE_ERROR').then( (data) => {
              if (response.message != undefined) {
                FlashService.Error(data + " " + response.message);
                $window.scrollTo(0,0);
              } else {
                FlashService.Error(data);
                $window.scrollTo(0,0);
              }
            });
            $scope.password = '';
          }
        });
      }
    }



    function sendAllMultisig() {
      $scope.quantity = ($scope.availableBalance - $scope.transactionFee*100000000)/100000000;
    }

    function signMultisigTx(message, lastTx) {
      MetaverseService.SignMultisigTx(message, lastTx)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          if(lastTx) {
            $translate('MESSAGES.SIGN_AND_BROADCAST_SUCCESS').then( (data) => FlashService.Success(data) );
            $window.scrollTo(0,0);
          } else {
            $translate('MESSAGES.SIGN_SUCCESS').then( (data) => FlashService.Success(data) );
            $window.scrollTo(0,0);
          }
          init();
          $scope.transferSuccess = true;
          $scope.resultSignTx = response.data;
        } else {
          //Transaction problem
          $translate('MESSAGES.SIGN_ERROR').then( (data) => {
            if (response.message != undefined) {
              FlashService.Error(data + " " + response.message);
            } else {
              FlashService.Error(data);
            }
          });
          $window.scrollTo(0,0);
          $scope.password = '';
        }
      });
    }


    listMultiSign();

    //Initialize
    init();

  }



  function AddressesController(MetaverseHelperService, MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService, $window) {

    $window.scrollTo(0,0);
    $scope.addresses = [];
    $scope.addressesFiltered = [];
    $scope.addressesDisplay = [];
    $scope.displayEmpty = displayEmpty;
    $scope.hideEmpty = hideEmpty;
    $scope.getnewaddress = getnewaddress;
    $scope.showqr = showqr;
    $scope.buttonCopyToClipboard = new Clipboard('.btn');

    $scope.enableEditAddressName = enableEditAddressName;
    $scope.endEditAddressName = endEditAddressName;
    $scope.cancelEditAddressName = cancelEditAddressName;
    $scope.newName = 'New Address';

    $scope.balance = {};


    function init() {
      if(($location.path().split('/')[2]) == 'multisignatureaddresses') {
        //listMultiSign();
      } else if(($location.path().split('/')[2]) == 'myaddresses') {
        listBalances();
      }
    }

    init();


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
          e.newName = e.name;
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

    //Cancel the edition
    function cancelEditAddressName(address) {
      $scope.addresses.forEach( (e) => {
        if (e.address == address) {
          e.newName = e.name;
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
          $scope.addressesDisplay = $scope.addresses;
          $scope.addressesFiltered = [];
          $scope.addresses.forEach( (a) => {
            if(a.balance != 0) {
              $scope.addressesFiltered.push(a);
            }
          });
        }
        NProgress.done();
      });
    }

    function displayEmpty() {
      $scope.addressesDisplay = $scope.addresses;
    }

    function hideEmpty() {
      $scope.addressesDisplay = $scope.addressesFiltered;
    }

    function getnewaddress() {
      MetaverseService.GetNewAddress()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          //FlashService.Success('Created new address: ' + response.data);
          $translate('MESSAGES.CREATED_ADDRESS').then( (data) => FlashService.Success(data) );
          $window.scrollTo(0,0);
          listBalances();
        }
      });
    }


    function listMultiSign() {
      NProgress.start();
      if ($scope.sendfrom == '') {
        FlashService.Error('Please select an address');
        $window.scrollTo(0,0);
      } else if ($scope.password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        MetaverseService.ListMultiSig()
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            if(response.data.multisig != "") {    //if the user has some assets
              response.data.multisig.forEach( (e) => {
                var name = localStorageService.get(e.address);
                if (name == undefined) {
                  name = "New Address";
                }
                $scope.addresses.push({
                  "index": e.index,
                  "m": e.m,
                  "n": e.n,
                  "selfpublickey": e["self-publickey"],
                  "description": e.description,
                  "address": e.address,
                  "name": name,
                  "publicKeys": e["public-keys"],
                  "edit": false
                });
              });
            } else {
              //The account has no multi-signature address
            }
          } else {
            //Fail
          }
        });
      }
      NProgress.done();
    }


    //Load users ETP balance
    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err) {
        FlashService.Error(message);
        $window.scrollTo(0,0);
      } else {
        $scope.balance = balance;
      }
    });
  }

  function AccountController(MetaverseService, $translate, $rootScope, $scope, $http, FlashService, $location, localStorageService, $window, FileSaver, Blob) {

    $window.scrollTo(0,0);
    $scope.showprivatekey = showprivatekey;
    $scope.changepassword = changepassword;
    $scope.exportAccount = exportAccount;
    $scope.accountname = localStorageService.get('credentials').user;
    $scope.debugState = MetaverseService.debug;
    $scope.path = "";
    $scope.download = download;
    $scope.showqr = showqr;
    $scope.empty = '';

    $scope.setDeugger = setDeugger;

    function showprivatekey(password, last_word) {
      if (password == undefined) {
        $translate('MESSAGES.PASSWORD_NEEDED_FOR_PRIVATE_KEY').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        NProgress.start();
        MetaverseService.GetAccount(last_word)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $scope.privatekey = response.data['mnemonic-key'];
          } else {
            //Show mnemonic load error
            $translate('SETTINGS.MNEMONIC_LOAD_ERROR').then( (data) => FlashService.Error(data) );
            $window.scrollTo(0,0);
          }
          NProgress.done();
        });
      }
    }

    function changepassword(password, new_password, new_password_repeat) {
      if (password == undefined || localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (new_password == undefined || new_password.length < 6) {
        $translate('MESSAGES.PASSWORD_SHORT').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (new_password != new_password_repeat) {
        $translate('MESSAGES.PASSWORD_NOT_MATCH').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
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
            $window.scrollTo(0,0);
          }
          NProgress.done();
        });
      }
    }

    function setDeugger(state) {
      MetaverseService.debug = (state == 1);
      $scope.debugState = MetaverseService.debug;
    }

    new Blob(['text'], { type: 'text/plain;charset=utf-8' });

    function download(text, fileName) {
      var jsonse = JSON.stringify(text);
      var data = new Blob([jsonse], {type: "application/json"});
      FileSaver.saveAs(data, fileName + '.' + $scope.empty + 'json');
    };


    //Shows a modal of the address incl. a qr code
    function showqr(text, password) {
      let mnemonic = text.mnemonic;
      let index = text.index;

      let decryptedmnemonic = JSON.parse(CryptoJS.AES.decrypt(mnemonic, password).toString(CryptoJS.enc.Utf8));
      let seed = bip39.mnemonicToSeed(decryptedmnemonic, MetaverseService.MetaverseNetwork[$rootScope.network]);
      let encseed = CryptoJS.AES.encrypt(JSON.stringify(seed.toString('hex')), password).toString();

      let display = encseed + "&" + $rootScope.network.charAt(0) + "&" + index;

      $('#showqrmodal').modal();
      $('#modal_account').html(localStorageService.get('credentials').user);
      $('#modal_qr').html('');
      var qrcode = new QRCode(document.getElementById("modal_qr"), {
        text: display,
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      $('#showqrmodal').modal('show');
    }

    function exportAccount(password, last_word, toFile) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      /*} else if (path.split(" ").length > 1) {
        $translate('MESSAGES.CONTAINS_SPACE').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);*/
      } else {
        NProgress.start();
        //MetaverseService.ExportAccountAsFile(password, last_word)
        MetaverseService.DumpKeyFile(password, last_word)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $http.get('./keys/mvs_keystore_' + localStorageService.get('credentials').user + '.' + $scope.empty + 'json')
              .then(function onSuccess(response) {
                if (toFile) {
                  download(response.data, 'mvs_keystore_' + localStorageService.get('credentials').user);
                  $translate('MESSAGES.EXPORT_ACCOUNT_FILE_SUCCESS').then( (data) => {
                    FlashService.Success(data);
                  });
                } else {
                  showqr(response.data, password);
                }
              })
              .catch(function onError(response) {
                $translate('MESSAGES.EXPORT_ACCOUNT_DOWNLOAD_FILE_ERROR').then( (data) => {
                  FlashService.Warning(data);
                });
              });
            $window.scrollTo(0,0);
          } else {
            //Show export error
            $translate('MESSAGES.EXPORT_ACCOUNT_FILE_ERROR').then( (data) => {
              if (response.message != undefined) {
                FlashService.Error(data + " " + response.message.message);
              } else {
                FlashService.Error(data);
              }
            });
            $window.scrollTo(0,0);
          }
          NProgress.done();
        });
      }
    }


  }

  function TransferAssetController(MetaverseService, $stateParams, $rootScope, $scope, $translate, $location, localStorageService, FlashService, $window, $filter) {

    $window.scrollTo(0,0);
    //$scope.symbol = $stateParams.symbol;
    $scope.symbol = $filter('uppercase')($location.path().split('/')[2]);
    $scope.sender_address = $stateParams.sender_address;
    $scope.sendasset = sendasset;

    $scope.underlineAuto='underline';
    $scope.underlineManual='none';
    $scope.autoSelectAddress=true;                //Automatically select the address

    $scope.assetsIssued = [];

    $scope.assetAddresses = [];                   //Contrain the asset balance of each address

    $scope.availBalance = availBalance;
    $scope.availableBalance = 0;
    $scope.sendAll = sendAll;
    $scope.checkRecipent = checkRecipent;
    $scope.allDids = [];
    $scope.checkInputs = checkInputs;

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
      $scope.correctEtpAddress = false;
      $scope.correctAvatar = false;
      $scope.burnAddress = false;
      $scope.confirmation = false;
    }

    MetaverseService.ListAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if(response.data.assets != "") {    //if the user has some assets
          response.data.assets.forEach( (e) => {
            if(e.status=='unspent') {
              $scope.assetsIssued.push({
                "symbol": e.symbol,
                "quantity": e.quantity,
                "decimal_number": e.decimal_number
              });
            }
          });
        } else {    //if the user has 0 asset

        }
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.GetAccountAsset($scope.symbol)
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assetAddresses = response.data.result.assets;
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
        $scope.allDidsSymbols = [];
        $scope.allDids.forEach(function(did) {
          $scope.allDidsSymbols.push(did.symbol);
          $scope.allDidsAddresses[did.address] = did.symbol;
        });
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      //Once all the DIDs have been loaded, we look for the one entered by the user
      checkRecipent($scope.sendto);
    });


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
              $scope.availableBalance = a.quantity;
            }
          });
        } else {
          //Redirect user to the assets page
          $location.path('/asset/myassets');
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }

    function checkInputs(sendto, symbol, quantity, password) {
      if (!$scope.correctEtpAddress && !$scope.correctAvatar && !$scope.burnAddress){
        $translate('MESSAGE.INCORRECT_RECIPIENT_ADDRESS_OR_AVATAR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (sendto.charAt(0) == '3') {
        $translate('MESSAGES.TRANSACTION_ASSET_MULTISIG').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (quantity == undefined || !(quantity > 0)) {
        $translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        if($scope.correctAvatar) {
          $scope.sendto = $filter('uppercase')(sendto);
        }
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    function sendasset(sendfrom, sendto, symbol, quantity, password) {
      NProgress.start();
      //Modify number to fit to number of decimals defined for asset
      //quantity *= Math.pow(10,$scope.asset.decimal_number);
      //quantity = Math.round(quantity);
      quantity = $filter('convertfortx')(quantity, $scope.asset.decimal_number);

      if ($scope.correctEtpAddress || $scope.burnAddress) {
        var SendPromise = (sendfrom) ? MetaverseService.SendAssetFrom(sendfrom, sendto, symbol, quantity, password) : MetaverseService.SendAsset(sendto, symbol, quantity, password);
      } else {
        var SendPromise = (sendfrom) ? MetaverseService.DidSendAssetFrom(sendfrom, sendto, symbol, quantity, password) : MetaverseService.DidSendAsset(sendto, symbol, quantity, password);
      }
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.ASSETS_TRANSFER_SUCCESS').then( (data) => {
            FlashService.Success(data + response.data.result.transaction.hash, true);
            //Redirect user to the assets page
            $location.path('/asset/myassets');
          });
        } else {
          //Show asset load error
          $translate('MESSAGES.ASSETS_TRANSFER_ERROR').then( (data) => FlashService.Error(data + " " + response.message.message) );
          $window.scrollTo(0,0);
        }
      });
    }

    function availBalance(address) {
      if (address == '') {
        $scope.availableBalance = $scope.asset.quantity;
      } else {
        $scope.assetAddresses.forEach( (a) => {
          if(a.address == address) {
            $scope.availableBalance = a.quantity; // - a.frozen;
          }
        });
      }
    }

    function checkRecipent(input) {
      if (typeof input == 'undefined' || '') {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      } else if((($rootScope.network == 'testnet' && input.charAt(0) == 't') || ($rootScope.network == 'mainnet' && input.charAt(0) == 'M') || input.charAt(0) == '3') && input.length == 34) {
        $scope.correctEtpAddress = true;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      } else if ($scope.allDidsSymbols.indexOf($filter('uppercase')(input)) > -1) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = true;
        $scope.burnAddress = false;
      } else if (input == MetaverseService.burnAddress) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = true;
      } else {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      }
    }


    function sendAll() {
      //$scope.quantity = $scope.availableBalance/$scope.asset.decimal_number;
      //$scope.quantity = parseFloat($scope.availableBalance)/Math.pow(10,$scope.asset.decimal_number);
      $scope.quantity = $filter('assetformat')($scope.availableBalance, $scope.asset.decimal_number);
    }

    init();
    loadasset($scope.symbol);

  }

  function ShowAllAssetsController(MetaverseService, $rootScope, $scope, $location, FlashService, $translate, $stateParams, $window) {

    $window.scrollTo(0,0);
    $scope.symbol = $stateParams.symbol;
    $scope.assets = [];
    $scope.icons = MetaverseService.hasIcon;

    //Load assets
    NProgress.start();
    MetaverseService.ListAllAssets()
    .then( (response) => {
      NProgress.done();
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assets = [];
        $scope.assets = response.data.assets;
        //All the details are hidden at the loading
        $scope.assets.forEach( (asset) => {
          asset.details = false;
          asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default';
        });
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => {
          //Show asset load error
          FlashService.Error(data);
          //Redirect user to the assets page
          $location.path('/asset/myassets');
        } );
      }
    });

  }


  function ShowAssetsController(MetaverseService, $rootScope, $scope, localStorageService, FlashService, $translate, $stateParams, $location, $window, ngDialog, $filter) {

    $window.scrollTo(0,0);
    $scope.symbol = $stateParams.symbol;
    $scope.assets = [];
    $scope.issue = issue;
    $scope.secondIssue = secondIssue;
    $scope.deleteAsset = deleteAsset;
    $scope.editMaxSupply = false;
    $scope.enableEditAssetMaxSupply = enableEditAssetMaxSupply;
    $scope.endEditAssetMaxSupply = endEditAssetMaxSupply;
    $scope.cancelEditAssetMaxSupply = cancelEditAssetMaxSupply;
    $scope.increase_maximum_supply = 0;  //the maximum supply increase
    $scope.owner = false;               //true if the user is the owner of this asset

    $scope.listBalances = listBalances;
    $scope.listAssetBalances = listAssetBalances;
    $scope.enableEditAddressName = enableEditAddressName;
    $scope.endEditAddressName = endEditAddressName;
    $scope.cancelEditAddressName = cancelEditAddressName;
    $scope.showqr = showqr;
    $scope.buttonCopyToClipboard = new Clipboard('.btn');
    $scope.icons = MetaverseService.hasIcon;


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



    //Load assets
    NProgress.start();
    MetaverseService.ListAssets()
    .then( (response) => {
      NProgress.done();
      if(response.data.assets != "") {    //if the user has some assets
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.assets = [];
          $scope.assets = response.data.assets;
          $scope.assets.forEach( (asset) => {
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default';
          });
          //If asset is defined -> load it
          if ($scope.symbol != undefined && $scope.symbol != "") {
            NProgress.start();
            loadasset($scope.symbol);
          }
        } else {
          //Redirect user to the assets page
          $location.path('/asset/myassets');
          //Show asset load error
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        }
      } else {
        if ($scope.symbol != undefined && $scope.symbol != "") {
          NProgress.start();
          loadasset($scope.symbol);
        }
      }
    });



    function issue(symbol) {
      NProgress.start();
      MetaverseService.Issue(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          loadasset($scope.symbol);
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data) );
          $window.scrollTo(0,0);
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        NProgress.done();
      });
    }


    function secondIssue(symbol, increase_maximum_supply, decimal_number) {
      NProgress.start();
      //increase_maximum_supply*=Math.pow(10,decimal_number);
      increase_maximum_supply = $filter('convertfortx')(increase_maximum_supply, decimal_number);
      if(increase_maximum_supply < 0) {
        $translate('MESSAGES.ASSETS_SECOND_ISSUE_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      MetaverseService.SecondIssue(symbol, increase_maximum_supply)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          loadasset($scope.symbol);
          $translate('MESSAGES.ASSETS_SECOND_ISSUE_SUCCESS').then( (data) => FlashService.Success(data) );
          $window.scrollTo(0,0);
        } else {
          $translate('MESSAGES.ASSETS_SECOND_ISSUE_ERROR').then( (data) => FlashService.Error(data + ' ' + response.message) );
          $window.scrollTo(0,0);
        }
        NProgress.done();
      });
    }

    //Loads a given asset, used in the page asset/details
    function loadasset(symbol) {
      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.assets != "") {    //if the user has some assets
            $scope.asset = response.data.assets[0];
            if ($scope.asset.issuer == localStorageService.get('credentials').user) {
              $scope.owner = true;
            }
            //$scope.initial_maximum_supply = parseFloat($scope.asset.maximum_supply)/Math.pow(10,$scope.asset.decimal_number);
            $scope.initial_maximum_supply = $filter('assetformat')($scope.asset.maximum_supply, $scope.asset.decimal_number);
            $scope.current_maximum_supply = $scope.initial_maximum_supply;
            $scope.new_maximum_supply = $scope.initial_maximum_supply;
            $scope.details = false;
            $scope.assets.forEach( (a) => {
              if (a.symbol == symbol) {
                $scope.asset.quantity = a.quantity;
              }
            });
          } else {
            //The user as no Assets
          }
        } else {
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
          $window.scrollTo(0,0);
        }
        NProgress.done();
      });
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
          $window.scrollTo(0,0);
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
              if(a.symbol == $scope.symbol) {
                var name = "New address";
                if (localStorageService.get(a.address) != undefined) {
                  name = localStorageService.get(a.address);
                }
                a.name = name;
                a.edit = false;
                $scope.assetAddresses.push(a);
              }
            });
          }
        });
      });
      NProgress.done();
    }

    //Enable the edition of the Address Name
    function enableEditAddressName(address) {
      $scope.assetAddresses.forEach( (e) => {
        if (e.address == address) {
          e.newName = e.name;
          e.edit = true;
        }
      });
    }

    //Save the edited name in the local storage
    function endEditAddressName(address, newName) {
      localStorageService.set(address,newName);
      $scope.assetAddresses.forEach( (e) => {
        if (e.address == address) {
          e.name = newName;
          e.edit = false;
        }
      });
    }

    //Cancel the edition
    function cancelEditAddressName(address) {
      $scope.assetAddresses.forEach( (e) => {
        if (e.address == address) {
          e.newName = e.name;
          e.edit = false;
        }
      });
    }


    //Delete a not issued Asset
    function deleteAsset(symbol) {
      MetaverseService.Delete(symbol)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.ASSETS_DELETE_SUCCESS').then( (data) => FlashService.Success(data, true) );
          $window.scrollTo(0,0);
          $location.path('/home');
        } else {
          //Asset could not be delete
          $translate('MESSAGES.ASSETS_DELETE_ERROR').then( (data) =>  FlashService.Error(data));
          $window.scrollTo(0,0);
        }
      });
    }

    //Enable the edition of the Address Name
    function enableEditAssetMaxSupply() {
      $scope.editMaxSupply = true;
    }

    //Save the edited name in the local storage
    function endEditAssetMaxSupply() {
      $scope.editMaxSupply = false;
    }

    //Cancel the change
    function cancelEditAssetMaxSupply() {
      $scope.increase_maximum_supply = 0;
      $scope.editMaxSupply = false;
    }

    //Close the pop-up after asset creation
    $scope.closeAll = function () {
      ngDialog.closeAll();
    };
  }

  function AssetSecondaryIssueController(MetaverseService, $rootScope, $scope, $location, localStorageService, FlashService, $translate, $window, ngDialog, $filter) {

    $scope.symbol = $filter('uppercase')($location.path().split('/')[3]);
    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.secondaryIssue = secondaryIssue;
    $scope.error = {};
    $scope.didAddress = '';
    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;
    $scope.transactionFee = 0.0001;


    function listAddresses() {
      NProgress.start();
      //Load users ETP balance
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
            $scope.addresses[e.balance.address] = ({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen,
              "type": "single"
            });
            $scope.listAddresses.push({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address
            });
          });

          //After loading the balances, we load the multisig addresses
          MetaverseService.ListMultiSig()
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              if(response.data.multisig != "") {    //if the user has some assets
                response.data.multisig.forEach( (e) => {
                  $scope.addresses[e.address].type = "multisig";
                });
              } else {
                //The account has no multi-signature address
              }
            } else {
              //Fail
            }
          });
        }
      });
      NProgress.done();
    }

    listAddresses();

    function checkInputs(password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        $scope.didSymbol = $filter('uppercase')($scope.didSymbol);
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    function secondaryIssue(quantity, address, transactionFee, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        MetaverseService.SecondaryIssue(didAddress, didSymbol, password)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.DID_CREATED').then( (data) =>  FlashService.Success(data, true));
            $location.path('/profile/myprofile');
          } else {
            $translate('MESSAGES.ERROR_DID_CREATION').then( (data) => {
              if (response.message.message != undefined) {
                if (response.message.code == 7002) {
                  $translate('MESSAGES.DID_ALREADY_EXIST').then( (data2) =>  FlashService.Error(data + " : " + data2));
                } else {
                  FlashService.Error(data + " : " + response.message.message);
                }
              } else {
                FlashService.Error(data);
              }
            });
          }
        });
      }
    }

    $scope.closeAll = function () {
      ngDialog.closeAll();
    };

    function popupSecondaryIssue() {
      ngDialog.open({
          template: 'secondaryIssue',
          scope: $scope
      });
    }

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

    //Check if the quantity is valid
    $scope.$watch('quantity', (newVal, oldVal) => {
      console.log(newVal);
      $scope.error.quantity = (newVal == undefined || newVal == '' || newVal < 0);
      checkready();
    });

    //Check if the address is valid
    $scope.$watch('address', (newVal, oldVal) => {
      $scope.error.address_empty = (newVal == undefined || newVal == '');
      $scope.error.address_not_enough_etp = newVal != undefined ? $scope.addresses[newVal].available<$scope.transactionFee : false;
      checkready();
    });

    //Check if the fee is valid
    $scope.$watch('transactionFee', (newVal, oldVal) => {
      $scope.error.fee_empty = (newVal == undefined);
      $scope.error.fee_too_low = newVal != undefined ? newVal<0.0001 : false;
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.error.password = (newVal == undefined || newVal == '');
      checkready();
    });

  }

  function CreateAssetController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $location, $translate, $window, ngDialog, $filter) {

    $window.scrollTo(0,0);
    //This object contains all form errors
    $scope.error = {};
    //Function to create a new asset
    $scope.createasset = createasset;
    $scope.popupIssue = popupIssue;
    $scope.issue = issue;

    $scope.checkInputs = checkInputs;

    //Initialize form data
    function init() {
      $scope.symbol = '';
      $scope.description = '';
      $scope.max_supply = 0;
      $scope.secondary_offering = 0;
      $scope.decimals = '';
      $scope.password = '';
      $scope.confirmation = false;
      $scope.secondaryissue_rate = 0;
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
      $scope.error.max_supply = (newVal == undefined || !(newVal == parseInt(newVal)) || newVal == 0);
      checkready();
    });

    //Check if the symbol is valid
    $scope.$watch('symbol', (newVal, oldVal) => {
      $scope.error.symbol = (newVal == undefined || !newVal.match(/^[0-9A-Za-z.]+$/));
      checkready();
    });

    //Check if the decimals is valid
    $scope.$watch('decimals', (newVal, oldVal) => {
      $scope.error.decimals = (newVal == undefined || !(newVal >= 0 && newVal <= 8) || newVal == '');
      checkready();
    });

    //Check if the description is valid
    $scope.$watch('description', (newVal, oldVal) => {
      $scope.error.description = (newVal == undefined || !(newVal.length > 0));
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.error.password = (newVal == undefined || newVal == '');
      checkready();
    });

    //Define the range used for the secondary offering
    $scope.range = function(min, max, step) {
      step = step || 1;
      var input = [];
      for (var i = min; i <= max; i += step) {
          input.push(i);
      }
      return input;
    };

    function checkInputs() {
      if (localStorageService.get('credentials').password != $scope.password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        $scope.symbol = $filter('uppercase')($scope.symbol);
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    //Create asset function
    function createasset() {
      NProgress.start();
      //Let Metaverse create an local asset
      MetaverseService.CreateAsset($scope.symbol, $scope.max_supply, $scope.secondary_offering, $scope.decimals, $scope.description, $scope.secondaryissue_rate)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Show success message
          popupIssue($scope.symbol);
          $translate('MESSAGES.ASSSET_CREATED_LOCAL_SUCCESS').then( (data) => {
            FlashService.Success(data, true);
            //Redirect user to the assets page
          });
          $window.scrollTo(0,0);
        } else{
          $translate('MESSAGES.ASSETS_CREATE_ERROR').then( (data) => FlashService.Error(data + ' ' + response.message.message) );
          $window.scrollTo(0,0);
        }
      });
    }
    $scope.closeAll = function () {
      ngDialog.closeAll();
    };

    function popupIssue(symbol) {
      $scope.symbol = symbol;
      ngDialog.open({
          template: 'templateId',
          scope: $scope
      });
    }

    function issue(symbol) {
      NProgress.start();
      MetaverseService.Issue(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data) );
          $window.scrollTo(0,0);
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        NProgress.done();
      });
    }



  }


  function AssetsController(MetaverseHelperService, MetaverseService, $rootScope, $scope, $location, $translate, FlashService, $window) {

    $window.scrollTo(0,0);
    $scope.assets = [];
    $scope.balance = {};
    $scope.transactions = [];
    $scope.transactionsFiltered = [];

    $scope.showDates = false;

    $scope.startDate = new Date(new Date()-(7*86400000)); //By default, display 1 week
    $scope.endDate = new Date();
    $scope.startDateUpdated = new Date();
    $scope.endDateUpdated = new Date();

    $scope.assetType = 'ALL';
    $scope.filterOnAsset = filterOnAsset;

    $scope.loadTransactions = loadTransactions;
    $scope.loadMore = loadMore;
    $scope.stopLoad = false;
    $scope.page = 3;          //By default, we load the 2 first pages
    $scope.icons = MetaverseService.hasIcon;

    //For unfrozen calculation time
    //$scope.averageBlockTime = 0;


    function filterOnAsset (asset) {
      $scope.assetType = asset;
      filterTransactions();
    }

    function filterTransactions() {
      $scope.transactionsFiltered = [];
      if ($scope.assetType == 'ALL') {
        $scope.transactionsFiltered = $scope.transactions;
      } else {
        $scope.transactions.forEach(function(e) {
          if (e.type==$scope.assetType) {
            $scope.transactionsFiltered.push(e);
          }
        });
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


    MetaverseService.ListAssets()
    .then( (response) => {
      if(typeof response.data.assets != undefined && response.data.assets != "") {    //if the user has some assets
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.assets = response.data.assets;
          $scope.assets.forEach( (asset) => {
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default';
          });
        } else {
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
      } else {
        //the user has no asset
        $scope.assets = "";
      }
    });


    function loadTransactions(min, max) {
      var page = min;
      for (; (page<max) && (!$scope.stopLoad); page++) {
        MetaverseHelperService.LoadTransactions( (err, transactions) => {
          if (err) {
            $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
            $window.scrollTo(0,0);
          } else {
            if ((transactions.lastpage == true) || (transactions.lastpage == undefined)) {     //All the transactions have been loaded
              $scope.stopLoad = true;
            }
            transactions.forEach(function(e) {
              /*if($scope.averageBlockTime == 0){   //if it hasn't been calculated yet, we calculated the average block time
                //1486815046 is the timestamp of the genesis block
                //1497080262 is the timestamp of the genesis block on TestNet
                $scope.averageBlockTime = ((e.timestamp/1000)-1486815046)/e.height;
              }*/
              if (e.frozen == true) {
                e.recipents.forEach(function(recipent) {
                  var re = /\[ (\w+) ] numequalverify dup hash160 \[ (\w+) \] equalverify checksig/;
                  var nbrBlocksScript = recipent.script.replace(re, '$1');
                  //var address = e.script.replace(re, '$2');

                  var nbrBlocksScriptLenght = nbrBlocksScript.length;
                  var nbrBlocksScriptReorderer = "";

                  for (var i=0; i < nbrBlocksScriptLenght; i=i+2) {
                    nbrBlocksScriptReorderer += nbrBlocksScript.charAt(nbrBlocksScriptLenght-i-2);
                    nbrBlocksScriptReorderer += nbrBlocksScript.charAt(nbrBlocksScriptLenght-i-1);
                  }

                  var nbrBlocksDec = parseInt(nbrBlocksScriptReorderer,16);
                  e.availableBlockNo = parseInt(e.height) + parseInt(nbrBlocksDec);

                  /*if((e.availableBlockNo - $rootScope.height) > 0){   //If the Frozen ETP are still locked
                    e.availableInBlock = e.availableBlockNo - $rootScope.height;
                    //e.availableInTime = e.availableInBlock * $scope.averageBlockTime;
                    //e.availableInTimeDays = Math.floor(e.availableInTime / 86400);
                    //e.availableInTimeHours = Math.floor(e.availableInTime / 3600) - (e.availableInTimeDays * 24);
                    //console.log("Days:", e.availableInTimeDays);
                    //console.log("Hours:", e.availableInTimeHours);
                  } else {                //If the Frozen ETP are not unlocked
                    e.availableInBlock = 0;
                  }*/
                });
              }

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

  function ConsoleController(MetaverseService, $rootScope, FlashService, $translate, $scope, $window) {

    $window.scrollTo(0,0);

    //var ws = new WebSocket('ws://localhost:8820/ws'); //For test
    var ws = new WebSocket('ws://' + MetaverseService.SERVER + '/ws');  //Live

    $("#inputField").focus();

    $scope.showConnected = false;
    $scope.index = 0;

    ws.onmessage = (ev) => {
      $scope.showConnected = true;
      $scope.index++;
      NProgress.done();
      $scope.consolelog.push({
        query: $scope.querystring,
        answer: ev.data,
        index: $scope.index
      });

      $scope.querystring = '';
      $scope.$apply();
      scrolldown();
    };

    $scope.querystring = '';
    $scope.consolelog = [];

    /*To put the results in a window that we can scrolldown, with ID = consolelog*/
    function scrolldown() {
      window.setTimeout( () => {
        var elem = document.getElementById('consolelog');
        elem.scrollTop = elem.scrollHeight;
      }, 100);
    }

    $scope.query = () => {
      NProgress.start();
      ws.send($scope.querystring);
    };

  }

  function HomeController(MetaverseService, $rootScope, $scope, localStorageService, $interval, $translate, $location, $filter, $http, FlashService) {

    var vm = this;
    vm.account = localStorageService.get('credentials').user;
    $scope.height = '';
    $scope.assets = [];
    $scope.language = localStorageService.get('language');
    $scope.getHeightFromExplorer = getHeightFromExplorer;
    $scope.heightFromExplorer = 0;
    $scope.loadingPercent = 0;
    $scope.subscribed = false;

    //var ws = new WebSocket('ws://localhost:8821/ws');
    var ws = new WebSocket('ws://' + MetaverseService.SERVER2 + '/ws');  //Live

    $scope.showConnected = false;
    $scope.index = 0;
    $scope.sound = true;

    $scope.version = "";
    $scope.popoverSynchShown = false;
    $scope.peers = "";

    MetaverseService.GetInfoV2()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.height = response.data.result.height;
        $rootScope.network = response.data.result.testnet ? 'testnet' : 'mainnet';
        $scope.loadingPercent = Math.floor($scope.height/$scope.heightFromExplorer*100);
        $scope.version = response.data.result['wallet-version'];
        $scope.checkVersion();
        $scope.peers = response.data.result.peers;
      }
    });


    $scope.ClickCloseFlashMessage = () => {
      FlashService.CloseFlashMessage();
    }

    $scope.checkVersion = function () {
      if($scope.version.charAt(0) == '<') {    //Dev
        //no check
      } else {        //Live
        $http.get('https://explorer.mvs.org/api/fullnode/version')
          .then((response)=>{
            var walletVersion = $scope.version.split(".");
            var supportVersion = response.data.support.split(".");
            var currentVersion = response.data.current.split(".");
            if($scope.checkNeedUpdate(walletVersion,supportVersion)) {
              $translate('MESSAGES.NEW_VERSION_MAJOR_CHANGE').then( (data) =>  FlashService.Error(data, false, "", "mvs.org"));
            } else if ($scope.checkNeedUpdate(walletVersion,currentVersion)) {
              $translate('MESSAGES.NEW_VERSION_AVAILABLE').then( (data) =>  FlashService.Warning(data, false, "", "mvs.org"));
            }
          })
          .catch( (error) => console.log("Cannot get Version from explorer") );
      }
    }

    $scope.checkNeedUpdate = function (walletVersion, comparedVersion){
      if((walletVersion[0]<comparedVersion[0])||((walletVersion[0]==comparedVersion[0])&&(walletVersion[1]<comparedVersion[1]))||((walletVersion[0]==comparedVersion[0])&&(walletVersion[1]==comparedVersion[1])&&(walletVersion[2]<comparedVersion[2]))){
        return true;
      }
      return false;
    }

    ws.onmessage = (ev) => {
      var response = JSON.parse(ev.data);
      if(!$scope.subscribed) {      //Websocket connected, need to subscribe to all addresses
        $scope.subscribed = true;
        $scope.subscribeToAllMyAddresses();
      } else if (response.channel == 'tx' && response.event == 'publish' && response.result.height != '0'){
        //New transaction detected
        if((parseInt($scope.heightFromExplorer) - parseInt($scope.height)) < 100) {
          $translate('MESSAGES.TX_PROCESSED').then( (data) =>  FlashService.Info(data, false, response.result.hash));
          if($scope.sound) {
            $scope.playNewTx();
          }
        }
      }
    };

    $scope.playNewTx = function() {
     var audio = new Audio('audio/message.mp3');
     audio.play();
    };

    $scope.onOffSound = function () {
      $scope.sound = !$scope.sound;
    }

    $scope.subscribeToAllMyAddresses = () => {
      NProgress.start();
      MetaverseService.ListBalances()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          response.data.balances.forEach( (e) => {
            ws.send(JSON.stringify({
              "event": "subscribe",
              "channel": "tx",
              "address": e.balance.address
            }));
          });
        }
        NProgress.done();
      });
    };

    function getHeightFromExplorer() {
      $http.get('https://explorer.mvs.org/api/height')
        .then((response)=>{
          if(!$scope.popoverSynchShown) {
            $(function () { $('.popover-show').popover('show');});
            $scope.popoverSynchShown = true;
          }
          $scope.heightFromExplorer = response.data.result;
          $scope.loadingPercent = Math.floor($scope.height/$scope.heightFromExplorer*100);
        })
        .catch( (error) => console.log("Cannot get Height from explorer") );
    }

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
      getHeightFromExplorer();
      MetaverseService.GetInfoV2()
      .then( (response) => {
        if (response.success == undefined && response.success) {
          $scope.height = response.data.result.height;
          $rootScope.network = response.data.result.testnet ? 'testnet' : 'mainnet';
          $scope.loadingPercent = Math.floor($scope.height/$scope.heightFromExplorer*100);
          $scope.peers = response.data.result.peers;
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
      if (search === '' || search == undefined) {            //empty research
        $location.path('/explorer/search/');
      } else if ($filter('uppercase')(search) === 'ETP') {
        $location.path('/addresses/myaddresses');
      } else if (search.length === 64) {
        $location.path('/explorer/tx/' + search);
      } else if (search.length === 34 || search == MetaverseService.burnAddress) {
        $location.path('/explorer/adr/' + search);
      } else if (!isNaN(search)) {
        $location.path('/explorer/blk/' + search);
      } else {                        //The research's format doesn't match any kind, we check if it is in the list of assets
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
          $window.scrollTo(0,0);
        }
        $location.path(path);
      });
      NProgress.done();
    }
  }

  function ProfileController(MetaverseHelperService, MetaverseService, $scope, $translate, $window, localStorageService, FlashService) {

    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.myDids = [];
    $scope.noDids = false;

    $scope.onChain = false;
    $scope.selectedDid = {};

    $scope.changeDid = changeDid;
    $scope.listDidsAddresses = listDidsAddresses;

    function listMultiSign() {
      NProgress.start();
      //Load users ETP balance
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
            $scope.addresses[e.balance.address] = ({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen,
              "type": "single"
            });
            $scope.listAddresses.push({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address
            });
          });

          //After loading the balances, we load the multisig addresses
          MetaverseService.ListMultiSig()
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              if(response.data.multisig != "") {    //if the user has some assets
                response.data.multisig.forEach( (e) => {
                  $scope.addresses[e.address].type = "multisig";
                  var name = "New address";
                  if (localStorageService.get(e.address) != undefined) {
                    name = localStorageService.get(e.address);
                  }
                  var balance = '';
                  $scope.listMultiSig.push({
                    "index": e.index,
                    "m": e.m,
                    "n": e.n,
                    "selfpublickey": e["self-publickey"],
                    "description": e.description,
                    "address": e.address,
                    "name": name,
                    "balance": $scope.addresses[e.address].balance,
                    "available": $scope.addresses[e.address].available,
                    "publicKeys": e["public-keys"]
                  });
                });
              } else {
                //The account has no multi-signature address
              }
            } else {
              //Fail
            }
          });
        }
      });
      NProgress.done();
    }

    listMultiSign();

    function changeDid(selectedDid) {

    }


    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if (response.data.result.dids) {
          $scope.myDids = response.data.result.dids;
          $scope.selectedDid = $scope.myDids[0].symbol;
        } else {
          $scope.noDids = true;
          $scope.selectedDid = "";
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function listDidsAddresses(symbol) {
      MetaverseService.ListDidAddresses(symbol)
      .then( (response) => {
        console.log(response);
      });
    }

  }

  function AllProfilesController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location) {

    $scope.allDids = [];

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });
  }


  function CreateProfileController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location, $rootScope, $filter) {

    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.createProfile = createProfile;
    $scope.popupIssueDid = popupIssueDid;
    $scope.error = {};
    $scope.didAddress = '';
    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;
    $scope.allDids = [];


    function listAddresses() {
      NProgress.start();
      //Load users ETP balance
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
            $scope.addresses[e.balance.address] = ({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address,
              "name": name,
              "frozen": e.balance.frozen,
              "type": "single"
            });
            $scope.listAddresses.push({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address
            });
          });

          //After loading the balances, we load the multisig addresses
          MetaverseService.ListMultiSig()
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              if(response.data.multisig != "") {    //if the user has some assets
                response.data.multisig.forEach( (e) => {
                  $scope.addresses[e.address].type = "multisig";
                });
              } else {
                //The account has no multi-signature address
              }
            } else {
              //Fail
            }
          });
        }
      });
      NProgress.done();
    }

    listAddresses();

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
        $scope.allDidsSymbols = [];
        $scope.allDids.forEach(function(did) {
          $scope.allDidsSymbols.push(did.symbol);
        });
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function checkInputs(password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        $scope.didSymbol = $filter('uppercase')($scope.didSymbol);
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    function createProfile(didAddress, didSymbol, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        MetaverseService.IssueDid(didAddress, didSymbol, password)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.DID_CREATED').then( (data) =>  FlashService.Success(data, true));
            $location.path('/profile/myprofile');
          } else {
            $translate('MESSAGES.ERROR_DID_CREATION').then( (data) => {
              if (response.message.message != undefined) {
                if (response.message.code == 7002) {
                  $translate('MESSAGES.DID_ALREADY_EXIST').then( (data2) =>  FlashService.Error(data + " : " + data2));
                } else {
                  FlashService.Error(data + " : " + response.message.message);
                }
              } else {
                FlashService.Error(data);
              }
            });
          }
        });
      }
    }

    $scope.closeAll = function () {
      ngDialog.closeAll();
    };

    function popupIssueDid() {
      ngDialog.open({
          template: 'issueDid',
          scope: $scope
      });

    }

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

    //Check if the avatar name is valid
    $scope.$watch('didSymbol', (newVal, oldVal) => {
      $scope.error.symbol_empty = (newVal == undefined);
      $scope.error.symbol_wrong_char = newVal != undefined ? !newVal.match(/^[0-9A-Za-z.]+$/) : false;
      $scope.error.symbol_already_exist = newVal != undefined ? ($scope.allDidsSymbols.indexOf($filter('uppercase')(newVal)) > -1) : false;
      checkready();
    });

    //Check if the address is valid
    $scope.$watch('didAddress', (newVal, oldVal) => {
      //$scope.error.didAddress = (newVal == undefined || !newVal.match(/^[0-9A-Za-z]+$/) || !(($rootScope.network == 'testnet' && newVal.charAt(0) == 't') || ($rootScope.network == 'mainnet' && newVal.charAt(0) == 'M') || newVal.charAt(0) == '3') || newVal.length != 34);
      $scope.error.didAddress = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.error.password = (newVal == undefined || newVal == '');
      checkready();
    });

  }

})();
