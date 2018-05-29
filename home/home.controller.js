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
  .controller('AssetDetailController', AssetDetailController)
  .controller('ShowAllAssetsController', ShowAllAssetsController)
  .controller('ETPController', ETPController)
  .controller('SignMultiSignController', SignMultiSignController)
  .controller('TransferMultiSignController', TransferMultiSignController)
  .controller('NewMultiSignController', NewMultiSignController)
  .controller('DepositController', DepositController)
  .controller('ExplorerController', ExplorerController)
  .controller('ProfileController', ProfileController)
  .controller('CreateProfileController', CreateProfileController)
  .controller('AllProfilesController', AllProfilesController)
  .controller('ModifyAddressController', ModifyAddressController)
  .controller('TransferCertController', TransferCertController)
  .controller('IssueCertController', IssueCertController)
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
  })
  .filter('converttodisplay',function(){
      return function(input, asset_type){
          if(typeof asset_type === 'undefined')
              asset_type=8;
          return bigDecimal.divide(input, Math.pow(10,asset_type));
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
              if(e.attachment.type =='asset-transfer' || e.attachment.type =='asset-issue') {
                loadasset(e.attachment.symbol);
              }
              //var script = e.script;
              //var occurence = script.match('[' + (/[a-z]|[A-Z]|[0-9]| /g) + '] numequalverify dup hash160 ['+ (/[a-z]|[A-Z]|[0-9]| /g) + '] equalverify checksig');

              //var occurence = script.match(\[([\\w| ]+)\] numequalverify dup hash160 \[[\\w| ]+\] equalverify checksig);
              /*var occurences = phraseToSend.match(/[a-z]|[A-Z]| /g);
              if(phraseToSend.length != occurences.length){
                $translate('MESSAGE.WRONG_PRIVATE_KEY').then( (data) => FlashService.Error(data) );
                $window.scrollTo(0,0);
                return;*/
            });

            //Search for the value of the input and put it in $scope.transactionInputsValues
            $scope.transactionInputsValues = [];
            /*response.data.transaction.inputs.forEach(function(e) { Removed, too slow
              if (e.previous_output.hash != '0000000000000000000000000000000000000000000000000000000000000000') {
                searchInputValue(e.previous_output.hash, e.address, e.previous_output.index);
              } else {
                //It's coming from Deposit interests or Mining
              }
            });*/
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
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }


    //Used to find the value of an Input
    /*function searchInputValue(transaction_hash, address, index) {
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
    }*/



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

    $scope.assetsIssued = [];
    $scope.balance = [];
    $scope.availableBalance = 0;
    $scope.sendAll = sendAll;
    $scope.error = [];
    $scope.option = [];

    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;


    function init() {
      $scope.deposit_address = '';
      $scope.password = '';
      $scope.value = '';
      $scope.transactionFee = 0.0001;
      $scope.confirmation = false;
      $scope.period_select = '';
      $scope.submittable = false;
    }

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

    function checkInputs() {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function deposit(value, transactionFee, period_select, password) {
      //var deposit_value = ("" + value * Math.pow(10,$scope.decimal_number)).split(".")[0];
      //var fee_value = ("" + transactionFee * Math.pow(10,$scope.decimal_number)).split(".")[0];
      var deposit_value = $filter('convertfortx')(value, $scope.decimal_number);
      var fee_value = $filter('convertfortx')(transactionFee, $scope.decimal_number);

      if (password != localStorageService.get('credentials').password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        var SendPromise = ($scope.symbol == 'ETP') ? MetaverseService.Deposit($scope.deposit_options[period_select][2], deposit_value, fee_value, password, ($scope.address_option) ? $scope.deposit_address : undefined) : MetaverseService.FrozenAsset($scope.deposit_options[period_select][2], deposit_value, fee_value, password, $scope.symbol, ($scope.address_option) ? $scope.deposit_address : undefined);
        SendPromise
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Transaction was successful
            $translate('MESSAGES.DEPOSIT_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );
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
      if ($scope.address_option && $scope.option.deposit_address_incorrect) {
        $scope.submittable = false;
        return;
      }
      $scope.submittable = true;
    }

    //Check if the certification symbol is valid
    $scope.$watch('value', (newVal, oldVal) => {
      /*var fee = $filter('convertfortx')($scope.transactionFee, 8);
      var max_send = parseInt($scope.availableBalance) - parseInt(fee);
      var value_tx = $filter('convertfortx')(newVal, 8);*/
      $scope.error.value_empty = (newVal == undefined || newVal == '' || newVal < 0);
      $scope.error.value_not_enough_balance = (newVal != undefined && newVal != '') ? newVal > ($scope.availableBalance - $scope.transactionFee*100000000)/100000000 : false;
      $scope.error.value_not_a_number = (newVal != undefined && newVal != '') ? isNaN(newVal) : false;
      checkready();
    });

    //Check if the certification type is valid
    $scope.$watch('period_select', (newVal, oldVal) => {
      $scope.error.period_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the new address is valid
    $scope.$watch('deposit_address', (newVal, oldVal) => {
      $scope.option.deposit_address_empty = (newVal == undefined || newVal == '');
      $scope.option.deposit_address_incorrect = (newVal != undefined && newVal != '') ? !((($rootScope.network == 'testnet' && newVal.charAt(0) == 't') || ($rootScope.network == 'mainnet' && newVal.charAt(0) == 'M') || newVal.charAt(0) == '3') && newVal.length == 34 && newVal.match(/^[0-9A-Za-z]+$/)) : false;
      checkready();
    });

    //Check if the fee is valid
    $scope.$watch('transactionFee', (newVal, oldVal) => {
      $scope.error.fee_empty = (newVal == undefined);
      $scope.error.fee_too_low = newVal != undefined ? newVal<0.0001 : false;
      $scope.error.fee_not_a_number = newVal != undefined ? isNaN(newVal) : false;
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
      checkready();
    });

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
      /*var fee = $filter('convertfortx')($scope.transactionFee, 8);
      var max_send = parseInt($scope.availableBalance) - parseInt(fee);
      $scope.value = $filter('converttodisplay')(max_send, 8);*/
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
    $scope.getBalance = getBalance;
    $scope.listAddresses = [];
    $scope.symbol = 'ETP';

    $scope.availBalance = availBalance;
    $scope.availableBalance = 0;
    $scope.sendAll = sendAll;

    $scope.checkRecipent = checkRecipent;
    $scope.checkAmount = checkAmount;
    $scope.allDids = [];
    $scope.allDidsAddresses = [];
    $scope.checkInputs = checkInputs;
    $scope.didFromAddress = [];

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
      $scope.error = [];
      $scope.option = [];
      $scope.option.memo_empty = true;
      $scope.recipientOK = [];
      $scope.amountOK = [];
      $scope.recipents = [];
      $scope.recipents.push({'index': 1, 'address': '', 'value': '', 'correctEtpAddress': false, 'correctAvatar': false, 'burnAddress': false, 'emptyAmount': true, 'wrongAmount': false, 'notEnough': false});
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
        if(typeof $scope.allDids != 'undefined' && $scope.allDids != null) {
          $scope.allDids.forEach(function(did) {
            $scope.allDidsSymbols.push(did.symbol);
            $scope.allDidsAddresses[did.address] = did.symbol;
            $scope.didFromAddress[did.symbol] = did.address;
          });
        } else {
          $scope.allDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      //Once all the DIDs have been loaded, we look for the one entered by the user
      checkRecipent($scope.recipents[0].address, 1);
      checkAmount('', 1);
    });

    function checkRecipent(input, index) {
      if (typeof input == 'undefined' || '') {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = false;
        $scope.recipientOK[index-1] = false;
      } else if((($rootScope.network == 'testnet' && input.charAt(0) == 't') || ($rootScope.network == 'mainnet' && input.charAt(0) == 'M') || input.charAt(0) == '3') && input.length == 34 && input.match(/^[0-9A-Za-z]+$/)) {
        $scope.recipents[index-1].correctEtpAddress = true;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = false;
        $scope.recipientOK[index-1] = true;
      } else if ($scope.allDidsSymbols.indexOf(input) > -1) {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = true;
        $scope.recipents[index-1].burnAddress = false;
        $scope.recipientOK[index-1] = true;
      } else if (input == MetaverseService.burnAddress || $filter('lowercase')(input) == MetaverseService.burnAddress_short) {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = true;
        $scope.recipientOK[index-1] = true;
      } else {
        $scope.recipents[index-1].correctEtpAddress = false;
        $scope.recipents[index-1].correctAvatar = false;
        $scope.recipents[index-1].burnAddress = false;
        $scope.recipientOK[index-1] = false;
      }
      checkready();
    }

    function checkAmount(input, index) {
      if (typeof input == 'undefined' || input === '') {
        $scope.recipents[index-1].emptyAmount = true;
        $scope.recipents[index-1].wrongAmount = false;
        $scope.recipents[index-1].notEnough = false;
        $scope.amountOK[index-1] = false;
      } else if (input < 0) {
        $scope.recipents[index-1].emptyAmount = false;
        $scope.recipents[index-1].wrongAmount = true;
        $scope.recipents[index-1].notEnough = false;
        $scope.amountOK[index-1] = false;
      } else if (input > $scope.availableBalance/100000000 - $scope.transactionFee) {
        $scope.recipents[index-1].emptyAmount = false;
        $scope.recipents[index-1].wrongAmount = false;
        $scope.recipents[index-1].notEnough = true;
        $scope.amountOK[index-1] = false;
      } else {
        $scope.recipents[index-1].emptyAmount = false;
        $scope.recipents[index-1].wrongAmount = false;
        $scope.recipents[index-1].notEnough = false;
        $scope.amountOK[index-1] = true;
      }
      checkready();
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
      for (var recipient in $scope.recipientOK) {
        if (!$scope.recipientOK[recipient]) {
          $scope.submittable = false;
          return;
        }
      }
      for (var amount in $scope.amountOK) {
        if (!$scope.amountOK[amount]) {
          $scope.submittable = false;
          return;
        }
      }
      $scope.submittable = true;
    }

    //Check if the send from address is valid
    $scope.$watch('sendfrom', (newVal, oldVal) => {
      $scope.error.sendfrom = (newVal == undefined);
      checkAmount($scope.recipents[0].value, 1);
      checkready();
    });

    //Check if the fee is valid
    $scope.$watch('transactionFee', (newVal, oldVal) => {
      $scope.error.fee_empty = (newVal == undefined);
      $scope.error.fee_too_low = newVal != undefined ? newVal<0.0001 : false;
      checkready();
    });

    //Check if the memo is valid TODO check char
    $scope.$watch('memo', (newVal, oldVal) => {
      $scope.option.memo_empty = (newVal == undefined || newVal == '');
      $scope.error.memo_wrong_char = newVal != undefined ? false : false;
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
      checkready();
    });



    $scope.addRecipent = function() {
      $scope.recipents.push({'index': $scope.recipents.length+1, 'address': '', 'value': '', 'correctEtpAddress': false, 'correctAvatar': false, 'burnAddress': false, 'emptyAmount': true, 'wrongAmount': false, 'notEnough': false});
      $scope.sendfrom='';
      $scope.recipientOK.push(false);
      $scope.amountOK.push(false);
      availBalance('');
      checkready();
    }

    $scope.removeRecipent = function() {
      $scope.recipents.splice($scope.recipents.length-1, 1);
      $scope.recipientOK.splice($scope.recipientOK.length-1, 1);
      $scope.amountOK.splice($scope.recipientOK.length-1, 1);
      checkAmount($scope.recipents[0].value, 1);
      availBalance('');
      checkready();
    }

    //Check Inputs
    function checkInputs(sendfrom, recipents, transactionFee, memo, password) {
      //var transactionOK = true;
      //Check for unimplemented parameters
      /*recipents.forEach( (e) => {
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
      } else */
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    //Transfers ETP
    function transfer(sendfrom, recipents, transactionFee, memo, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        if (recipents.length == 1) { //Start transaction for 1 recipent
            transferOne(sendfrom, recipents, transactionFee, memo, password);
        } else {  //Start transaction with more than 1 recipent
            transferMore(sendfrom, recipents, transactionFee, memo, password);
        }
        $window.scrollTo(0,0);
        $scope.password = '';
      }
    }



    function transferOne(sendfrom, recipents, transactionFee, memo, password) {
      NProgress.start();
      var value = recipents[0].value;
      var sendTo = recipents[0].address;
      var sendFromAvatar = false;
      //var fee = transactionFee * 100000000;
      //value *= 100000000;
      //value = Math.round(value);
      var fee = $filter('convertfortx')(transactionFee, 8);
      value = $filter('convertfortx')(value, 8);
      //Update send from it is from an avatar
      if($scope.allDidsAddresses[sendfrom]) {
        sendfrom = $scope.allDidsAddresses[sendfrom];
        sendFromAvatar = true;
      }
      if (recipents[0].correctEtpAddress && !sendFromAvatar) {
        var SendPromise = (sendfrom) ? MetaverseService.SendFrom(sendfrom, sendTo, value, fee, memo, password) : MetaverseService.Send(sendTo, value, fee, memo, password);
      } else if (recipents[0].burnAddress) {
        var SendPromise = (sendfrom) ? MetaverseService.DidSendFrom(MetaverseService.burnAddress, sendTo, value, fee, memo, password) : MetaverseService.DidSend(MetaverseService.burnAddress, value, fee, memo, password);
      } else {
        var SendPromise = (sendfrom) ? MetaverseService.DidSendFrom(sendfrom, sendTo, value, fee, memo, password) : MetaverseService.DidSend(sendTo, value, fee, memo, password);
      }
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.TRANSFER_ERROR').then( (data) => {
            $scope.confirmation = false;
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
        if(e.burnAddress) {
          e.address = MetaverseService.burnAddress;
        }
        recipentsQuery.push({
          "address": e.address,
          "value": value
        });
      });

      var SendPromise = MetaverseService.DidSendMore(recipentsQuery, fee, password);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
          init();
        } else {
          //Transaction problem
          $scope.confirmation = false;
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
        $scope.availableBalance = $scope.addresses[address].available;
      }
      checkAmount($scope.recipents[0].value, 1);
    }

    function sendAll() {
      $scope.recipents[0].value = ($scope.availableBalance - 100000000*$scope.transactionFee)/100000000;
      checkAmount($scope.recipents[0].value, 1);
    }


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
  function SignMultiSignController(MetaverseService, MetaverseHelperService, $filter, $location, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    $scope.transferSuccess = false;
    $scope.signMultisigTx = signMultisigTx;
    $scope.lastTx = false;
    $scope.symbol = $filter('uppercase')($location.path().split('/')[3]);

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.resultSignTx = '';
      $scope.error = [];
      $scope.transaction = '';
    }

    function signMultisigTx(message, password, lastTx) {
      if (password == undefined || localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        MetaverseService.SignMultisigTx(message, password, lastTx)
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
            $scope.resultSignTx = response.data.result;
          } else {
            //Transaction problem
            $translate('MESSAGES.SIGN_ERROR').then( (data) => {
              if (response.message != undefined && response.message.message != undefined) {
                FlashService.Error(data + " " + response.message.message);
              } else {
                FlashService.Error(data);
              }
            });
            $window.scrollTo(0,0);
          }
        });
      }
    }

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });

    //Initialize
    init();

  }


  /**
  * The ETPMultiSign Controller provides ETP multi-signatures transaction functionality.
  */
  function TransferMultiSignController(MetaverseService, MetaverseHelperService, $location, $filter, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    $window.scrollTo(0,0);
    //Start loading animation
    NProgress.start();
    $scope.symbol = $filter('uppercase')($location.path().split('/')[3]);

    $scope.sendAllMultisig = sendAllMultisig;
    $scope.transactionFee = 0.0001;
    $scope.listAddresses = [];                    //List of addresses

    $scope.listMultiSig = [];
    $scope.listAssetMultiSig = [];
    $scope.createMultisigTx = createMultisigTx;
    $scope.transferSuccess = false;                 //Change to True after a successful transaction
    $scope.resultCreateTx = '';
    $scope.checkRecipent = checkRecipent;
    $scope.allDids = [];
    $scope.allDidsSymbols = [];
    $scope.checkInputs = checkInputs;
    $scope.didFromAddress = [];
    $scope.allDidsAddresses = [];
    $scope.availBalance = availBalance;
    $scope.availBalanceAsset = availBalanceAsset;
    $scope.assetAddresses = [];

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.fee = '';
      $scope.message = '';
      $scope.value = '';
      $scope.password = '';
      $scope.availableBalance = 0;
      $scope.error = [];
      $scope.transferSuccess = false;
      $scope.resultCreateTx = '';
      $scope.correctEtpAddress = false;
      $scope.correctAvatar = false;
      $scope.burnAddress = false;
      $scope.confirmation = false;
    }


    MetaverseHelperService.GetBalance( (err, balance, message) => {
      if (err) {
        FlashService.Error(message);
        $window.scrollTo(0,0);
      } else {
        $scope.balance = balance;
      }
    });

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
      NProgress.done();
    });

    if($scope.symbol != 'ETP') {
      MetaverseService.GetAccountAsset($scope.symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.assetAddresses = response.data.result.assets;
          if($scope.assetAddresses) {
            $scope.decimal_number = $scope.assetAddresses[0].decimal_number;
            $scope.assetAddresses.forEach( (address) => {
              var balance = '';
              if(address.address.charAt(0) == '3') {
                $scope.listAssetMultiSig.push(address);
              }
            });
          }

        } else {
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
      });
    } else {
      $scope.decimal_number = 8;
    }

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
        if(typeof $scope.allDids != 'undefined' && $scope.allDids != null) {
          $scope.allDids.forEach(function(did) {
            $scope.allDidsSymbols.push(did.symbol);
            $scope.allDidsAddresses[did.address] = did.symbol;
            $scope.didFromAddress[did.symbol] = did.address;
          });
        } else {
          $scope.allDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      //Once all the DIDs have been loaded, we look for the one entered by the user
      checkRecipent($scope.sendTo);
    });

    function checkInputs() {
      //Since multi sig to did is not available, we replace it by the address
      $scope.confirmation = true;
      delete $rootScope.flash;
    }


    function createMultisigTx(sendFrom, sendTo, quantity, transactionFee, password) {
      if($scope.burnAddress) {
        sendTo = MetaverseService.burnAddress;
      } else if ($scope.correctAvatar){   //if send to avatar
        sendTo = $scope.didFromAddress[sendTo];
      }
      if ($scope.didFromAddress[sendFrom]) {    //if send from avatar
        sendFrom = $scope.didFromAddress[sendFrom];
      }
      //var quantityToSend = ("" + quantity * Math.pow(10,8)).split(".")[0];
      var quantityToSend = $filter('convertfortx')(quantity, $scope.decimal_number);
      //var transactionFeeToSend = ("" + transactionFee * Math.pow(10,8)).split(".")[0];
      var transactionFeeToSend = $filter('convertfortx')(transactionFee, 8);
      var SendPromise = ($scope.symbol == 'ETP') ? MetaverseService.CreateMultisigTx(sendFrom, sendTo, quantityToSend, transactionFeeToSend, password) : MetaverseService.CreateAssetMultisigTx($scope.symbol, sendFrom, sendTo, quantityToSend, transactionFeeToSend, password);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Transaction was successful
          $translate('MESSAGES.CREATE_MULTISIGNATURE_SUCCESS').then( (data) => FlashService.Success(data) );
          $window.scrollTo(0,0);
          init();
          $scope.transferSuccess = true;
          $scope.resultCreateTx = response.data.result;
        } else {
          //Transaction problem
          $translate('MESSAGES.CREATE_MULTISIGNATURE_ERROR').then( (data) => {
            if (response.message != undefined && response.message.message != undefined) {
              FlashService.Error(data + " " + response.message.message);
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

    function sendAllMultisig() {
      $scope.quantity = $scope.symbol == 'ETP' ? ($scope.availableBalance - $scope.transactionFee*100000000)/100000000 : parseFloat($filter('converttodisplay')($scope.availableBalance, $scope.decimal_number));
      if($scope.quantity < 0)
        $scope.quantity = 0;
    }

    function checkRecipent(input) {
      if (typeof input == 'undefined' || input == '') {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
        $scope.correctMutliSignAddress = false;
      } else if((($rootScope.network == 'testnet' && input.charAt(0) == 't') || ($rootScope.network == 'mainnet' && input.charAt(0) == 'M') || input.charAt(0) == '3') && input.length == 34 && input.match(/^[0-9A-Za-z]+$/)) {
        $scope.correctEtpAddress = true;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
        $scope.correctMultiSignAddress = false;
      } else if ($scope.allDidsSymbols.indexOf(input) > -1) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = true;
        $scope.burnAddress = false;
        $scope.correctMultiSignAddress = false;
      } else if (input == MetaverseService.burnAddress || $filter('lowercase')(input) == MetaverseService.burnAddress_short) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = true;
        $scope.correctMultiSignAddress = false;
      } else {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
        $scope.correctMultiSignAddress = false;
      }
      checkready();
    }

    function availBalance(address) {
      $scope.availableBalance = $scope.addresses[address].available;
      $scope.error.quantity_not_enough_ETP_balance = ($scope.quantity != undefined && $scope.quantity != '' && $scope.symbol == 'ETP') ? parseInt($filter('convertfortx')($scope.quantity, 8)) > parseInt($scope.availableBalance) - parseInt($filter('convertfortx')($scope.transactionFee, 8)) : false;
    }

    function availBalanceAsset(address) {
      $scope.assetAddresses.forEach( (a) => {
        if(a.address == address) {
          $scope.availableBalance = a.quantity - a.locked_quantity;
        }
      });
      $scope.error.quantity_not_enough_balance = ($scope.quantity != undefined && $scope.quantity != '' && $scope.symbol != 'ETP') ? parseInt($filter('convertfortx')($scope.quantity, $scope.decimal_number)) > parseInt($scope.availableBalance) : false;
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
      if(!$scope.correctEtpAddress && !$scope.correctAvatar && !$scope.burnAddress) {
        $scope.submittable = false;
        return;
      }
      $scope.submittable = true;
    }

    //Check if the send from address is valid
    $scope.$watch('sendfrom', (newVal, oldVal) => {
      $scope.error.sendfrom = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the recipient is valid
    $scope.$watch('sendTo', (newVal, oldVal) => {
      $scope.error.sendTo_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the amount is valid
    $scope.$watch('quantity', (newVal, oldVal) => {
      $scope.error.quantity_empty = (newVal == undefined);
      $scope.error.quantity_not_enough_ETP_balance = ($scope.quantity != undefined && $scope.quantity != '' && $scope.symbol == 'ETP') ? parseInt($filter('convertfortx')($scope.quantity, 8)) > parseInt($scope.availableBalance) - parseInt($filter('convertfortx')($scope.transactionFee, 8)) : false;
      $scope.error.quantity_not_enough_balance = ($scope.quantity != undefined && $scope.quantity != '' && $scope.symbol != 'ETP') ? parseInt($filter('convertfortx')($scope.quantity, $scope.decimal_number)) > parseInt($scope.availableBalance) : false;
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
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });

    //Initialize
    init();

  }


  /**
  * Create new multi-signature address
  */
  function NewMultiSignController(MetaverseService, MetaverseHelperService, $filter, $rootScope, $scope, FlashService, localStorageService, $translate, $window) {

    $window.scrollTo(0,0);
    //Start loading animation
    NProgress.start();
    $scope.displayEmptyAdresses = false;
    $scope.recipents = [];
    $scope.buttonCopyToClipboard = new Clipboard('.btn');
    $scope.getPublicKey = getPublicKey;
    $scope.publicKey = '';
    $scope.cosigners = [];
    $scope.getNewMultisign = getNewMultisign;
    $scope.nbrCosignersRequired = 0;

    $scope.listAddresses = [];                    //List of addresses
    $scope.listMultiSig = [];
    $scope.error = [];
    $scope.checkHash = checkHash;

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.publicKey = '';
      $scope.cosigners = [];
      $scope.cosigners.push({'index': 1, 'publicKey': ''});
      $scope.cosignersError = [];
      $scope.cosignersError.push(true);
      $scope.nbrCosignersRequired = '';
      $scope.transferSuccess = false;
      $scope.resultCreateTx = '';
      $scope.submittable = false;
    }

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
      NProgress.done();
    });

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
      $scope.cosigners.push({'index': $scope.cosigners.length+1, 'publicKey': '', 'error': true});
      $scope.cosignersError.push(true);
    }

    $scope.removeCoSigner = function() {
      $scope.cosigners.splice($scope.cosigners.length-1, 1);
      $scope.cosignersError.splice($scope.cosignersError.length-1, 1);
    }

    //Used to dynamically update the number of signature required
    $scope.getNumber = function(num) {
      return new Array(num);
    }

    function getNewMultisign() {
      NProgress.start();
      var SendPromise = MetaverseService.GetNewMultiSig($scope.nbrCosignersRequired, $scope.cosigners.length+1, $scope.publicKey, $scope.cosigners);
      SendPromise
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          //Creation was successful
          $translate('MESSAGES.CREATE_MULTISIGNATURE_SUCCESS').then( (data) => FlashService.Success(data + " : " + response.data.result.address) );
          $window.scrollTo(0,0);
          init();
        } else {
          //Transaction problem
          $translate('MESSAGES.CREATE_MULTISIGNATURE_ERROR').then( (data) => {
            if (response.message != undefined && response.message.message != undefined) {
              FlashService.Error(data + " : " + response.message.message);
              $window.scrollTo(0,0);
            } else {
              FlashService.Error(data);
              $window.scrollTo(0,0);
            }
          });
        }
        NProgress.done();
      });
    }

    function checkHash(publicKey, index) {
      if (typeof publicKey == undefined || publicKey == '' || publicKey.length != 66 || !publicKey.match(/^[0-9A-Za-z]+$/)) {
        $scope.cosignersError[index-1] = true;
      } else {
        $scope.cosignersError[index-1] = false;
      }
      checkready();
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
      for (var cosigner in $scope.cosignersError) {
        if ($scope.cosignersError[cosigner]) {
          $scope.submittable = false;
          return;
        }
      }
      $scope.submittable = true;
    }

    //Check if the send from address is valid
    $scope.$watch('sendfrom', (newVal, oldVal) => {
      $scope.error.sendfrom = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the send from hash is valid
    $scope.$watch('publicKey', (newVal, oldVal) => {
      $scope.error.publicKey = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the send from hash is valid
    $scope.$watch('nbrCosignersRequired', (newVal, oldVal) => {
      $scope.error.nbrCosignersRequired = (newVal == undefined || newVal == '');
      checkready();
    });

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
    $scope.myDidsAddresses = [];
    $scope.myDidsSymbols = [];

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
          response.data.balances.forEach( (e, i) => {
            var name = localStorageService.get(e.balance.address);
            if (name == undefined) {
              name = "New Address";
            }
            $scope.addresses.push({
              "balance": parseInt(e.balance.unspent),
              "address": e.balance.address,
              "frozen": e.balance.frozen,
              "name": name,
              "edit": false,
              "index": response.data.balances.length-i
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

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        $scope.balancesLoaded = true;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            //$scope.myDidsSymbols.push(did.symbol);
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
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
    $scope.addressesNbr = 0;

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
      $scope.addressesNbr = index;

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
            if (toFile) {
              download(response.data.result, 'mvs_keystore_' + localStorageService.get('credentials').user);
              $translate('MESSAGES.EXPORT_ACCOUNT_FILE_SUCCESS').then( (data) => FlashService.Success(data));
            } else {
              showqr(response.data.result, password);
            }
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
    $scope.symbol = $filter('uppercase')($location.path().split('/')[3]);
    $scope.sendasset = sendasset;

    $scope.assetsIssued = [];

    $scope.assetAddresses = [];                   //Contrain the asset balance of each address

    $scope.availBalance = availBalance;
    $scope.availableBalance = 0;
    $scope.sendAll = sendAll;
    $scope.checkRecipent = checkRecipent;
    $scope.allDids = [];
    $scope.allDidsAddresses = [];
    $scope.checkInputs = checkInputs;
    $scope.error = [];
    $scope.didFromAddress = [];

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.sendfrom = '';
      $scope.sendto = '';
      $scope.message = '';
      $scope.quantity = undefined;
      $scope.password = '';
      $scope.correctEtpAddress = false;
      $scope.correctAvatar = false;
      $scope.burnAddress = false;
      $scope.confirmation = false;
      $scope.transactionFee = 0.0001;
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
                "available": e.quantity - e.locked_quantity,
                "decimal_number": e.decimal_number
              });
            }
          });
          loadasset($scope.symbol);
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
        if(typeof $scope.allDids != 'undefined' && $scope.allDids != null) {
          $scope.allDids.forEach(function(did) {
            $scope.allDidsSymbols.push(did.symbol);
            $scope.allDidsAddresses[did.address] = did.symbol;
            $scope.didFromAddress[did.symbol] = did.address;
          });
        } else {
          $scope.allDids = [];
        }
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
              $scope.asset.available = a.available;
              $scope.availableBalance = a.available;
            }
          });
        } else {
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }

    function checkInputs(sendto, symbol, quantity, transactionFee) {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function sendasset(sendfrom, sendto, symbol, quantity, transactionFee, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        NProgress.start();
        var sendFromAvatar = false;
        //Update send from it is from an avatar
        if($scope.allDidsAddresses[sendfrom]) {
          sendfrom = $scope.allDidsAddresses[sendfrom];
          sendFromAvatar = true;
        }
        //Modify number to fit to number of decimals defined for asset
        //quantity *= Math.pow(10,$scope.asset.decimal_number);
        //quantity = Math.round(quantity);
        quantity = $filter('convertfortx')(quantity, $scope.asset.decimal_number);
        var fee_value = $filter('convertfortx')(transactionFee, 8);

        if ($scope.correctEtpAddress && !sendFromAvatar) {
          var SendPromise = (sendfrom) ? MetaverseService.SendAssetFrom(sendfrom, sendto, symbol, quantity, fee_value, password) : MetaverseService.SendAsset(sendto, symbol, quantity, fee_value, password);
        } else if($scope.burnAddress) {
          var SendPromise = (sendfrom) ? MetaverseService.SendAssetFrom(sendfrom, MetaverseService.burnAddress, symbol, quantity, fee_value, password) : MetaverseService.SendAsset(MetaverseService.burnAddress, symbol, quantity, fee_value, password);
        } else {
          var SendPromise = (sendfrom) ? MetaverseService.DidSendAssetFrom(sendfrom, sendto, symbol, quantity, fee_value, password) : MetaverseService.DidSendAsset(sendto, symbol, quantity, fee_value, password);
        }
        SendPromise
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.ASSETS_TRANSFER_SUCCESS').then( (data) => {
              FlashService.Success(data, true, response.data.result.transaction.hash);
              //Redirect user to the assets page
              $location.path('/asset/myassets');
            });
          } else {
            //Show asset load error
            $scope.confirmation = false;
            $translate('MESSAGES.ASSETS_TRANSFER_ERROR').then( (data) => FlashService.Error(data + " " + response.message.message) );
            $window.scrollTo(0,0);
          }
          $scope.password = '';
        });
      }
    }

    function availBalance(address) {
      if (address == '') {
        $scope.availableBalance = $scope.asset.available;
      } else {
        $scope.assetAddresses.forEach( (a) => {
          if(a.address == address) {
            $scope.availableBalance = a.quantity - a.locked_quantity;
          }
        });
      }
      $scope.error.quantity_not_enough_balance = ($scope.quantity != undefined && $scope.quantity != '' && typeof $scope.asset.decimal_number != 'undefined') ? parseInt($filter('convertfortx')($scope.quantity, $scope.asset.decimal_number)) > parseInt($scope.availableBalance) : false;
    }

    function checkRecipent(input) {
      if (typeof input == 'undefined' || input == '') {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      } else if((($rootScope.network == 'testnet' && input.charAt(0) == 't') || ($rootScope.network == 'mainnet' && input.charAt(0) == 'M') || input.charAt(0) == '3') && input.length == 34 && input.match(/^[0-9A-Za-z]+$/)) {
        $scope.correctEtpAddress = true;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      } else if(input.charAt(0) == '3' && input.length == 34 && input.match(/^[0-9A-Za-z]+$/)) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      } else if ($scope.allDidsSymbols.indexOf(input) > -1) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = true;
        $scope.burnAddress = false;
      } else if (input == MetaverseService.burnAddress || $filter('lowercase')(input) == MetaverseService.burnAddress_short) {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = true;
      } else {
        $scope.correctEtpAddress = false;
        $scope.correctAvatar = false;
        $scope.burnAddress = false;
      }
      checkready();
    }


    function sendAll() {
      //$scope.quantity = $scope.availableBalance/$scope.asset.decimal_number;
      //$scope.quantity = parseFloat($scope.availableBalance)/Math.pow(10,$scope.asset.decimal_number);
      $scope.quantity = parseFloat($filter('converttodisplay')($scope.availableBalance, $scope.asset.decimal_number));
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
      if(!$scope.correctEtpAddress && !$scope.correctAvatar && !$scope.burnAddress) {
        $scope.submittable = false;
        return;
      }
      $scope.submittable = true;
    }

    //Check if the send from address is valid
    $scope.$watch('sendfrom', (newVal, oldVal) => {
      $scope.error.sendfrom = (newVal == undefined);
      checkready();
    });

    //Check if the new recipient is valid
    $scope.$watch('sendto', (newVal, oldVal) => {
      $scope.error.sendto_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the amount is valid
    $scope.$watch('quantity', (newVal, oldVal) => {
      $scope.error.quantity_empty = (newVal == undefined);
      $scope.error.quantity_not_enough_balance = (newVal != undefined && newVal != '' && typeof $scope.asset.decimal_number != 'undefined') ? parseInt($filter('convertfortx')(newVal, $scope.asset.decimal_number)) > parseInt($scope.availableBalance) : false;
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
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });

    init();

  }

  function ShowAllAssetsController(MetaverseService, $rootScope, $scope, $location, FlashService, $translate, $stateParams, $window) {

    $window.scrollTo(0,0);
    $scope.symbol = $stateParams.symbol;
    $scope.assets = [];
    $scope.assetsOriginal = [];
    $scope.assetsSecondaryIssue = [];
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
        if ($scope.assets != '') {
          $scope.assets.forEach( (asset) => {
            asset.details = false;
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default';
            if(asset.is_secondaryissue == 'false'){
              asset.maximum_supply = parseInt(asset.maximum_supply);
              $scope.assetsOriginal.push(asset);
            } else {
              if(typeof $scope.assetsSecondaryIssue[asset.symbol] == 'undefined') {
                $scope.assetsSecondaryIssue[asset.symbol] = parseInt(asset.maximum_supply);
              } else {
                $scope.assetsSecondaryIssue[asset.symbol] += parseInt(asset.maximum_supply);
              }
            }
          });
        } //else, there is no asset on the blockchain
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => {
          //Show asset load error
          FlashService.Error(data);
        } );
      }
    });

  }


  function ShowAssetsController(MetaverseService, $rootScope, $scope, localStorageService, FlashService, $translate, $stateParams, $location, $window, ngDialog, $filter) {

    $window.scrollTo(0,0);
    $scope.symbol = $stateParams.symbol;
    $scope.assets = [];
    $scope.issue = issue;
    $scope.deleteAsset = deleteAsset;

    //$scope.listAssetBalances = listAssetBalances;
    $scope.buttonCopyToClipboard = new Clipboard('.btn');
    $scope.icons = MetaverseService.hasIcon;
    $scope.assetsLoaded = false;
    $scope.assets = [];


    //Load assets
    NProgress.start();
    MetaverseService.ListAssets()
    .then( (response) => {
      if(response.data.assets != "") {    //if the user has some assets
        if (typeof response.success !== 'undefined' && response.success) {
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
          //Show asset load error
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        }
      } else {
        if ($scope.symbol != undefined && $scope.symbol != "") {
          NProgress.start();
          loadasset($scope.symbol);
        }
      }
      NProgress.done();
      $scope.assetsLoaded = true;
    });



    function issue(symbol) {
      NProgress.start();
      MetaverseService.Issue(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        NProgress.done();
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

    //Close the pop-up after asset creation
    $scope.closeAll = function () {
      ngDialog.closeAll();
    };
  }


  function AssetDetailController(MetaverseService, $rootScope, $scope, localStorageService, FlashService, $translate, $stateParams, $location, $window, ngDialog, $filter) {

    $scope.symbol = $stateParams.symbol;
    $scope.asset = [];
    $scope.assets = [];
    $scope.enableEditAddressName = enableEditAddressName;
    $scope.endEditAddressName = endEditAddressName;
    $scope.cancelEditAddressName = cancelEditAddressName;

    $scope.showqr = showqr;
    $scope.buttonCopyToClipboard = new Clipboard('.btn');
    $scope.assetsLoaded = false;
    $scope.assetOriginal = 0;
    $scope.assetSecondaryIssue = 0;
    $scope.assetAddresses = [];
    $scope.getAssetBalance = [];
    $scope.myDidsAddresses = [];


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


    //Loads a given asset, used in the page asset/details
    MetaverseService.GetAsset($scope.symbol)
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if(response.data.assets != "") {    //if the user has some assets
          $scope.assets = response.data.assets;
          $scope.asset = response.data.assets[0];
          $scope.assets.forEach( (asset) => {
            if(asset.is_secondaryissue == 'false'){
              $scope.assetOriginal = parseInt(asset.maximum_supply);
            } else {
              $scope.assetSecondaryIssue += parseInt(asset.maximum_supply);
            }
          });
        } else {
          //The user has no Assets
        }
      } else {
        //Asset could not be loaded
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        $window.scrollTo(0,0);
      }
      NProgress.done();
    });


    MetaverseService.GetAccountAsset($scope.symbol)
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success && response.data.result.assets != null) {    //If the address doesn't contain any asset, we don't need it
        $scope.assetAddresses = response.data.result.assets;
        $scope.assetAddresses.forEach( (address) => {
          var name = "New address";
          if (localStorageService.get(address.address) != undefined) {
            name = localStorageService.get(address.address);
          }
          address.name = name;
          address.edit = false;
          $scope.getAssetBalance[address.address] = address.quantity;
        });
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        $scope.balancesLoaded = true;
        $scope.myDidsSymbols = [];
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            //$scope.myDidsSymbols.push(did.symbol);
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    //Load the addresses and their balances
    NProgress.start();
    MetaverseService.ListBalances()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.addressIndex = [];
        response.data.balances.forEach( (e, i) => {
          $scope.addressIndex[e.balance.address] = response.data.balances.length-i;
        });
      }
      NProgress.done();
    });



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

  }

  function AssetSecondaryIssueController(MetaverseService, $rootScope, $scope, $location, localStorageService, FlashService, $translate, $window, ngDialog, $filter) {

    $scope.symbol = $filter('uppercase')($location.path().split('/')[3]);
    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.secondaryIssue = secondaryIssue;
    $scope.error = [];
    $scope.didAddress = '';
    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;
    $scope.transactionFee = 0.0001;
    $scope.model = '';
    $scope.myAssets = [];
    $scope.assetOriginal = 0;
    $scope.assetSecondaryIssue = 0;
    $scope.updateQuantity = updateQuantity;
    $scope.issueCertOwner = false;
    $scope.myCertsLoaded = false;
    $scope.availBalance = availBalance;
    $scope.availableBalance = 0;
    $scope.balancesLoaded = false;
    $scope.myDids = [];
    $scope.myDidsSymbols = [];
    $scope.myDidsAddresses = [];
    $scope.popupSecondaryIssue = popupSecondaryIssue;
    $scope.recipientAvatar = '';
    $scope.avatar = '';
    $scope.availableBalanceAsset = 0;
    $scope.model2 = [];
    $scope.model2ToSend = [];
    $scope.model2Displayed = 0;
    $scope.updateUnlockNumber = updateUnlockNumber;

    function init(){
      for(var i = 0, value = {"index":i,"number": "", "quantity": ""}, size = 100, array = new Array(100); i < size; i++, value = {"index":i,"number": "", "quantity": ""}) array[i] = value;
      $scope.model2 = array;
    }

    init();



    function listAddresses() {
      NProgress.start();
      //Load users ETP balance
      //Load the addresses and their balances
      MetaverseService.ListBalances()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.addresses = [];
          response.data.balances.forEach( (e) => {
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

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        //$scope.address = $scope.myDids[0].address;
        //availBalance($scope.address);
        $scope.balancesLoaded = true;
        $scope.myDidsSymbols = [];
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            $scope.myDidsSymbols.push(did.symbol);
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    //Loads a given asset, used in the page asset/details
    MetaverseService.GetAsset($scope.symbol)
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if(response.data.assets != "") {    //if the user has some assets
          $scope.assets = response.data.assets;
          $scope.assets.forEach( (asset) => {
            if(asset.is_secondaryissue == 'false'){
              $scope.assetOriginal = parseInt(asset.maximum_supply);
            } else {
              if(typeof $scope.assetsSecondaryIssue == 'undefined') {
                $scope.assetSecondaryIssue = parseInt(asset.maximum_supply);
              } else {
                $scope.assetSecondaryIssue += parseInt(asset.maximum_supply);
              }
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



    $scope.assetAddresses = [];
    $scope.getAssetBalance = [];
    MetaverseService.GetAccountAsset($scope.symbol)
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success && response.data.result.assets != null) {    //If the address doesn't contain any asset, we don't need it
        $scope.assetAddresses = response.data.result.assets;
        $scope.assetAddresses.forEach( (address) => {
          $scope.getAssetBalance[address.address] = address.quantity;
        });
      }
    });



    //Load assets
    NProgress.start();
    MetaverseService.ListAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success && response.data.assets != "") {
        $scope.myAssetsBalances = response.data.assets;
        //If asset is defined -> load it
        if (typeof $scope.symbol != 'undefined' && $scope.symbol != "") {
          $scope.myAssetsBalances.forEach( (asset) => {
            if(asset.symbol == $scope.symbol)
              $scope.myAsset = asset;
          });
        }
      } else {
        //Show asset load error
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
      NProgress.done();
      $scope.assetsLoaded = true;
    });

    MetaverseService.AccountAssetCert()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if(response.data.result.assetcerts != null) {
          $scope.myCerts = response.data.result.assetcerts;
          $scope.myCerts.forEach( (cert) => {
            if(cert.symbol == $scope.symbol && cert.cert == 'issue')
              $scope.issueCertOwner = true;
          });
        } else {
          $scope.myCerts = [];
        }
        $scope.myCertsLoaded = true;
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_CERTS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function updateQuantity(quantity) {
      $scope.toTxConvertedQuantity = parseInt($filter('convertfortx')(quantity, $scope.myAsset.decimal_number));
    }

    function updateUnlockNumber(unlockNumber) {
      if(unlockNumber == undefined || unlockNumber == ''){
        $scope.model2Displayed = 0;
      } else {
        $scope.model2Displayed = unlockNumber;
      }
    }

    function checkInputs(address, unlockNumber, quantityLocked, model2, password) {
      $scope.recipientAvatar = $scope.myDidsAddresses[address];
      if($scope.model == 2){
        var inputOK = true;
        $scope.model2ToSend = model2.slice(0, unlockNumber);
        var sumNumber = 0;
        var sumQuantity = 0;
        $scope.model2ToSend.forEach( (period) => {
          sumNumber += period.number;
          sumQuantity += period.quantity;
          period.quantityToSend = $filter('convertfortx')(period.quantity, $scope.myAsset.decimal_number);
          if(period.number == '' || period.quantity == ''){
            inputOK = false;
            $translate('MESSAGES.SECONDARY_ISSUE_MODEL2_MISSING_PERIOD_INPUT').then( (data) => FlashService.Error(data) );
            $window.scrollTo(0,0);
          }
        });
        $scope.periodLocked = sumNumber;
        $scope.quantityLocked = sumQuantity;
        if($scope.quantityLocked > $scope.quantity){
          inputOK = false;
          $translate('MESSAGES.SECONDARY_ISSUE_MODEL2_LOCKED_HIGHER_ISSUED').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        if(inputOK == true) {
          $scope.quantityLockedToSend = $filter('convertfortx')($scope.quantityLocked, $scope.myAsset.decimal_number);
          $scope.confirmation = true;
          delete $rootScope.flash;
        }
      } else if ($scope.model == 1) {
        if($scope.quantityLocked > $scope.quantity){
          $translate('MESSAGES.SECONDARY_ISSUE_MODEL1_LOCKED_HIGHER_ISSUED').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        } else {
          $scope.quantityLockedToSend = $filter('convertfortx')($scope.quantityLocked, $scope.myAsset.decimal_number);
          $scope.confirmation = true;
          delete $rootScope.flash;
        }
      } else {      //Default model
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    function secondaryIssue() {
      NProgress.start();
      var fee_value = $filter('convertfortx')($scope.transactionFee, 8);
      var SendPromise;
      switch($scope.model){
        case '':
          SendPromise = MetaverseService.SecondaryIssueDefault($scope.recipientAvatar, $scope.symbol, $scope.toTxConvertedQuantity, fee_value, $scope.password);
          break;
        case '1':
          SendPromise = MetaverseService.SecondaryIssueModel1($scope.recipientAvatar, $scope.symbol, $scope.toTxConvertedQuantity, $scope.unlockNumber, $scope.quantityLockedToSend, $scope.periodLocked, fee_value, $scope.password);
          break;
        case '2':
          SendPromise = MetaverseService.SecondaryIssueModel2($scope.recipientAvatar, $scope.symbol, $scope.toTxConvertedQuantity, $scope.unlockNumber, $scope.quantityLockedToSend, $scope.periodLocked, $scope.model2ToSend, fee_value, $scope.password);
          break;
        default:
          console.log("Unknow secondary issue model");
          NProgress.done();
          return;
      }
      SendPromise
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.SECONDARY_ISSUE_SUCCESS').then( (data) =>  FlashService.Success(data, true, response.data.result.transaction.hash));
          $location.path('/avatar/myavatars/');
        } else {
          $translate('MESSAGES.ERROR_SECONDARY_ISSUE').then( (data) => {
            $scope.confirmation = false;
            if (response.message.message != undefined) {
              FlashService.Error(data + " : " + response.message.message);
            } else {
              FlashService.Error(data);
            }
            $window.scrollTo(0,0);
          });
        }
        NProgress.done();
        $scope.password = '';
      });
    }

    function availBalance(address) {
      $scope.availableBalance = address != '' && $scope.addresses != undefined && $scope.addresses[address] != undefined ? $scope.addresses[address].available : 0;
      $scope.availableBalanceAsset = address != '' && $scope.getAssetBalance != undefined && $scope.getAssetBalance[address] != undefined ? $scope.getAssetBalance[address] : 0;
      checkready();
    }

    $scope.closeAll = function () {
      ngDialog.closeAll();
    };

    function popupSecondaryIssue(password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        ngDialog.open({
            template: 'secondaryIssue',
            scope: $scope
        });
      }
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
      if(!$scope.issueCertOwner) {
        $scope.submittable = false;
        return;
      }
      if($scope.myAsset.secondaryissue_threshold == 0 || ($scope.availableBalanceAsset/($scope.assetOriginal + $scope.assetSecondaryIssue)*100) < $scope.myAsset.secondaryissue_threshold) {
        $scope.submittable = false;
        return;
      }
      if(!$scope.availableBalance >= 10000) {
        $scope.submittable = false;
        return;
      }
      $scope.submittable = true;
    }

    //Check if the avatar is valid
    $scope.$watch('address', (newVal, oldVal) => {
      $scope.error.address_empty = (newVal == undefined || newVal == '');
      $scope.error.address_not_enough_etp = newVal != undefined && $scope.addresses != undefined && $scope.addresses[newVal] != undefined ? $scope.addresses[newVal].available<$scope.transactionFee : false;
      $scope.error.address_not_enough_asset = newVal != undefined && $scope.myAsset != undefined && $scope.myAsset.secondaryissue_threshold != 127 && $scope.myAsset.secondaryissue_threshold != 0 ? ($scope.getAssetBalance[newVal]/($scope.assetOriginal + $scope.assetSecondaryIssue)*100 < $scope.myAsset.secondaryissue_threshold) || $scope.getAssetBalance[newVal] == undefined : false;
      checkready();
    });

    //Check if the quantity is valid
    $scope.$watch('quantity', (newVal, oldVal) => {
      $scope.error.quantity = (newVal == undefined || newVal === '' || newVal < 0);
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
      $scope.errorPassword = (newVal == undefined || newVal == '');
      checkready();
    });

  }

  function CreateAssetController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $location, $translate, $window, ngDialog, $filter) {

    $window.scrollTo(0,0);
    //Function to create a new asset
    $scope.createasset = createasset;
    $scope.popupIssue = popupIssue;
    $scope.issue = issue;

    $scope.checkInputs = checkInputs;
    $scope.myDids = [];
    $scope.noDids = false;
    $scope.selectedDid = "";
    $scope.assets = [];
    $scope.listAllAssets = [];

    //Initialize form data
    function init() {
      $scope.symbol = '';
      $scope.description = '';
      $scope.max_supply = '';
      $scope.secondary_offering = 0;
      $scope.decimals = '';
      $scope.password = '';
      $scope.confirmation = false;
      $scope.secondaryissue_rate = 0;
      //This object contains all form errors
      $scope.error = [];
    }

    init();

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if (response.data.result.dids) {
          $scope.noDids = false;
          $scope.myDids = response.data.result.dids;
        } else {
          $scope.noDids = true;
          $scope.selectedDid = "nodid";
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.ListAllAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assets = response.data.assets;
        //All the details are hidden at the loading
        if ($scope.assets != '') {
          $scope.assets.forEach( (asset) => {
            $scope.listAllAssets.push(asset.symbol);
          });
        } //else, there is no asset on the blockchain
      } else {
        //error while loading assets
      }
    });

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

    //Check if the symbol is valid
    $scope.$watch('symbol', (newVal, oldVal) => {
      $scope.error.symbol_empty = (newVal == undefined || newVal === '');
      $scope.error.symbol_too_long = newVal != undefined ? !(newVal.length < 65) : false;
      $scope.error.symbol_wrong_char = (newVal != undefined && newVal != '') ? !newVal.match(/^[0-9A-Za-z.]+$/) : false;
      $scope.error.symbol_already_exist = newVal != undefined ? $scope.listAllAssets.indexOf($filter('uppercase')(newVal)) > -1 : false;
      checkready();
    });

    //Check if the avatar is valid
    $scope.$watch('selectedDid', (newVal, oldVal) => {
      $scope.error.avatar = (newVal == undefined || newVal === '' || newVal == 'nodid');
      checkready();
    });

    //Check if the max_supply is valid
    $scope.$watch('max_supply', (newVal, oldVal) => {
      $scope.error.max_supply_empty = (newVal == undefined || !(newVal == parseInt(newVal)) || newVal == 0);
      $scope.error.max_supply_decimals_too_high = newVal != undefined ? (newVal * Math.pow(10, $scope.decimals)) > 10000000000000000000 : false;
      checkready();
    });

    //Check if the decimals is valid
    $scope.$watch('decimals', (newVal, oldVal) => {
      $scope.error.decimals_empty = (newVal == undefined || !(newVal >= 0 && newVal <= 8) || newVal === '');
      $scope.error.max_supply_decimals_too_high = newVal != undefined ? ($scope.max_supply * Math.pow(10, newVal)) > 10000000000000000000 : false;
      checkready();
    });

    //Check if the description is valid
    $scope.$watch('description', (newVal, oldVal) => {
      $scope.error.description_empty = (newVal == undefined || !(newVal.length > 0));
      $scope.error.description_too_long = newVal != undefined ? !(newVal.length < 65) : false;
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });

    function checkInputs() {
      $scope.symbol = $filter('uppercase')($scope.symbol);
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    //Create asset function
    function createasset() {
      if (localStorageService.get('credentials').password != $scope.password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        var quantity = $filter('convertfortx')($scope.max_supply, $scope.decimals);
        NProgress.start();
        //Let Metaverse create an local asset
        MetaverseService.CreateAsset($scope.symbol, $scope.selectedDid, quantity, $scope.secondary_offering, $scope.decimals, $scope.description, $scope.secondaryissue_rate)
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Show success message
            popupIssue($scope.symbol);
            $translate('MESSAGES.ASSET_CREATED_LOCAL_SUCCESS').then( (data) => {
              FlashService.Success(data, true);
              //Redirect user to the assets page
            });
            $window.scrollTo(0,0);
          } else{
            $translate('MESSAGES.ASSETS_CREATE_ERROR').then( (data) => FlashService.Error(data + ' ' + response.message.message) );
            $window.scrollTo(0,0);
          }
        });
        $scope.password = '';
      }
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
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );

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

    $scope.loadTransactions = loadTransactions;
    $scope.loadMore = loadMore;
    $scope.stopLoad = false;
    $scope.page = 3;          //By default, we load the 2 first pages
    $scope.icons = MetaverseService.hasIcon;
    $scope.filterTransactions = filterTransactions;


    function filterTransactions(asset) {
      $scope.assetType = asset;
      $scope.transactionsFiltered = [];
      if (asset == 'ALL') {
        $scope.transactionsFiltered = $scope.transactions;
      /*} else if  (asset == 'Avatars') {
        $scope.transactions.forEach(function(e) {
          if (e.direction=='did-issue' || e.direction=='did-transfer') {
            $scope.transactionsFiltered.push(e);
          }
        });
      } else if  (asset == 'Certs') {
        $scope.transactions.forEach(function(e) {
          if (e.direction=='cert') {
            $scope.transactionsFiltered.push(e);
          }
        });*/
      } else {
        $scope.transactions.forEach(function(e) {
          if (e.type==asset) {
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
      if (typeof response.success !== 'undefined' && response.success) {
        if(typeof response.data.assets != 'undefined' && response.data.assets != "") {    //if the user has some assets
          $scope.assets = response.data.assets;
          $scope.assets.forEach( (asset) => {
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default';
          });
        } else {
          //the user has no asset
          $scope.assets = "";
        }
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
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
                  } else {                //If the Frozen ETP are not unlocked
                    e.availableInBlock = 0;
                  }*/
                });
              }

              $scope.transactions.push(e);
            });
            //displayUpdatedDates();
            filterTransactions('ALL');
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
    $scope.queryHistory = 0;

    ws.onmessage = (ev) => {
      $scope.showConnected = true;
      $scope.index++;
      NProgress.done();
      $scope.consolelog.push({
        query: $scope.querystring,
        answer: ev.data,
        index: $scope.index
      });
      $scope.queryHistory = $scope.consolelog.length;
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
      if ($scope.querystring == "clear") {
        var connectionstatus = $scope.consolelog[0];
        $scope.consolelog = [];
        $scope.consolelog.push(connectionstatus);
        $scope.querystring = '';
        $scope.queryHistory = 0;
      } else {
        NProgress.start();
        ws.send($scope.querystring);
      }
    };

    $scope.arrowup = () => {
      if ($scope.queryHistory > 1) {
        $scope.queryHistory--;
        $scope.querystring = $scope.consolelog[$scope.queryHistory].query;
      }
    };

    $scope.arrowdown = () => {
      if ($scope.queryHistory < $scope.consolelog.length-1) {
        $scope.queryHistory++;
        $scope.querystring = $scope.consolelog[$scope.queryHistory].query;
      } else if ($scope.queryHistory = $scope.consolelog.length-1) {
        $scope.queryHistory++;
        $scope.querystring = '';
      }
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
        if (typeof response != 'undefined' && response.success) {
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
      } else if (search.length === 34 || search == MetaverseService.burnAddress || search == $filter('lowercase')(MetaverseService.burnAddress_short)) {
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
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        $location.path(path);
      });
      NProgress.done();
    }
  }

  function ProfileController(MetaverseHelperService, MetaverseService, $scope, $location, $translate, $window, localStorageService, FlashService) {

    $scope.selectedDid = $location.path().split('/')[3];
    $scope.myDids = [];
    $scope.myCerts = [];
    $scope.loadingDids = true;

    $scope.onChain = true;
    $scope.myCertsLoaded = false;
    $scope.loadingAddressHistory = true;

    $scope.listDidsAddresses = listDidsAddresses;

    $scope.addressesHistory = [];
    $scope.changeDid = changeDid;


    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.loadingDids = false;
        if (response.data.result.dids) {
          $scope.myDids = response.data.result.dids;
          if(typeof $scope.selectedDid == 'indefined' || $scope.selectedDid == '') {
            $scope.selectedDid = $scope.myDids[0].symbol;
          }
          listDidsAddresses($scope.selectedDid);
        } else {
          $scope.myDids = [];
          $scope.selectedDid = "";
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function changeDid(symbol) {
      listDidsAddresses(symbol);
    }

    function listDidsAddresses(symbol) {
      $scope.loadingAddressHistory = true;
      MetaverseService.ListDidAddresses(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.addressesHistory = response.data.result.addresses;
        } else {
          $translate('MESSAGES.LISTDIDSADDRESSE_LOAD_ERROR').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " " + response.message.message);
            } else {
              FlashService.Error(data);
            }
          });
          $window.scrollTo(0,0);
        }
        $scope.loadingAddressHistory = false;
      });
    }

    MetaverseService.AccountAssetCert()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if(response.data.result.assetcerts != null) {
          $scope.myCerts = response.data.result.assetcerts;
        } else {
          $scope.myCerts = [];
        }
        $scope.myCertsLoaded = true;
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_CERTS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });


  }

  function AllProfilesController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location) {

    $scope.allDids = [];
    $scope.loaded = false;

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      $scope.loaded = true;
    });
  }


  function CreateProfileController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location, $rootScope, $filter) {

    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.createProfile = createProfile;
    $scope.popupIssueDid = popupIssueDid;
    $scope.error = [];
    $scope.didAddress = '';
    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;
    $scope.allDids = [];
    $scope.allDidsSymbols = [];
    $scope.allDidsAddresses = [];
    $scope.didAddress = '';
    $scope.addresses = [];
    $scope.resultMultisigTx = '';
    $scope.resultMultisigTxSaved = false;


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
        if(typeof $scope.allDids != 'undefined' && $scope.allDids != null) {
          $scope.allDids.forEach(function(did) {
            $scope.allDidsSymbols.push(did.symbol);
            $scope.allDidsAddresses.push(did.address);
          });
        } else {
          $scope.allDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function checkInputs(password) {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function createProfile(didAddress, didSymbol, password) {
      NProgress.start();
      MetaverseService.IssueDid(didAddress, didSymbol, password)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.result.transaction) {
            $translate('MESSAGES.DID_CREATED').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
            $location.path('/avatar/myavatars/');
          } else {
            $translate('MESSAGES.MULTISIGNATURE_SUCCESS').then( (data) => FlashService.Success(data) );
            $scope.resultMultisigTx = response.data.result;
          }
        } else {
          $translate('MESSAGES.ERROR_DID_CREATION').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " : " + response.message.message);
            } else {
              FlashService.Error(data);
            }
          });
        }
        NProgress.done();
        $scope.password = '';
      });
    }

    $scope.closeAll = function () {
      ngDialog.closeAll();
    };

    function popupIssueDid(password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        ngDialog.open({
            template: 'issueDid',
            scope: $scope
        });
      }
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
      $scope.error.symbol_wrong_char = newVal != undefined ? !newVal.match(/^[0-9A-Za-z.@_-]+$/) : false;
      $scope.error.symbol_already_exist = newVal != undefined ? ($scope.allDidsSymbols.indexOf(newVal) > -1) : false;
      checkready();
    });

    //Check if the address is valid
    $scope.$watch('didAddress', (newVal, oldVal) => {
      $scope.error.didAddress_empty = (newVal == undefined || newVal == '');
      $scope.error.didAddress_already_used = newVal != undefined ? ($scope.allDidsAddresses.indexOf(newVal) > -1) : false;
      $scope.error.didAddress_not_enough_etp = newVal != undefined && $scope.addresses[newVal] != undefined ? ($scope.addresses[newVal].available < 1) : false;
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });

  }

  function ModifyAddressController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location, $rootScope, $filter) {

    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.modifyAddress = modifyAddress;
    $scope.error = [];
    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;
    $scope.selectedDid = $location.path().split('/')[3];
    $scope.myDidsAddresses = [];
    $scope.symbolAddress = [];
    $scope.selectedDidAddress = '';
    $scope.changeDid = changeDid;
    $scope.transactionFee = 0.0001;
    $scope.resultMultisigTx = '';
    $scope.resultMultisigTxSaved = false;


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

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if (response.data.result.dids) {
          $scope.myDids = response.data.result.dids;
          if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
            $scope.myDids.forEach(function(did) {
              $scope.myDidsAddresses.push(did.address);
              $scope.symbolAddress[did.symbol] = did.address;
              if(did.symbol == $scope.selectedDid)
                $scope.selectedDidAddress = did.address;
            })
          } else {
          }
        } else {
          $scope.noDids = true;
          $scope.selectedDid = "";
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function changeDid(symbol) {
      $scope.selectedDidAddress = $scope.symbolAddress[symbol];
    }

    function checkInputs(password) {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }


    function modifyAddress(selectedDid, toAddress, transactionFee, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        NProgress.start();
        var fee_value = $filter('convertfortx')(transactionFee, 8);
        MetaverseService.DidModifyAddress(selectedDid, toAddress, fee_value, password)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            if(response.data.result.transaction) {
              $translate('MESSAGES.DID_ADDRESS_UPDATED').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
              $location.path('/avatar/myavatars/');
            } else {
              $translate('MESSAGES.MULTISIGNATURE_SUCCESS').then( (data) => FlashService.Success(data) );
              $scope.resultMultisigTx = response.data.result;
            }
          } else {
            $translate('MESSAGES.ERROR_DID_MODIFY_ADDRESS').then( (data) => {
              if (response.message.message != undefined) {
                FlashService.Error(data + " : " + response.message.message);
              } else {
                FlashService.Error(data);
              }
            });
          }
          NProgress.done();
          $scope.password = '';
        });
      }
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
    $scope.$watch('selectedDid', (newVal, oldVal) => {
      $scope.error.selectedDid = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the new address is valid
    $scope.$watch('toAddress', (newVal, oldVal) => {
      $scope.error.toAddress_empty = (newVal == undefined || newVal == '');
      $scope.error.toAddress_already_used = newVal != undefined ? ($scope.myDidsAddresses.indexOf(newVal) > -1) : false;
      $scope.error.toAddress_not_enough_balance = newVal != undefined ? ($scope.addresses[newVal].available < 1) : false;
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
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });


  }

  function TransferCertController(MetaverseHelperService, MetaverseService, $scope, $filter, $rootScope, $location, $translate, $window, localStorageService, FlashService) {

    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.myDids = [];
    $scope.myCerts = [];
    $scope.certs = [];
    $scope.noCerts = false;
    $scope.error = [];
    $scope.changeSymbol = changeSymbol;
    $scope.transactionFee = 0.0001;
    $scope.allDidsAddresses = [];
    $scope.listMyCerts = listMyCerts;
    $scope.checkInputs = checkInputs;
    $scope.transferCert = transferCert;
    $scope.myCertsLoaded = false;
    $scope.allDidsSymbols = [];

    $scope.onChain = true;
    $scope.selectedCert = $location.path().split('/')[3];
    changeSymbol($scope.selectedCert);

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

    function changeSymbol(cert) {
      $scope.certSymbol = cert.split(":")[0];
      $scope.certType = cert.split(":")[1];
    }

    function listMyCerts() {
      MetaverseService.AccountAssetCert()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.result.assetcerts != null && response.data.result.assetcerts != '') {
            $scope.myCerts = response.data.result.assetcerts;
            $scope.myCerts.forEach( (e) => {
              $scope.certs[e.symbol] = e;
            });
          } else {
            $scope.myCerts = [];
            $scope.noCerts = true;
          }
          $scope.myCertsLoaded = true;
        } else {
          $translate('MESSAGES.CANT_LOAD_MY_CERTS').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
      });
    }

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
        $scope.allDidsSymbols = [];
        if(typeof $scope.allDids != 'undefined' && $scope.allDids != null) {
          $scope.allDids.forEach(function(did) {
            $scope.allDidsSymbols.push(did.symbol);
            //$scope.allDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.allDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      listMyCerts();
    });

    function checkInputs() {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function transferCert(certSymbol, certType, toDID, transactionFee, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        var fee_value = $filter('convertfortx')(transactionFee, 8);
        NProgress.start();
        MetaverseService.TransferCert(certSymbol, certType, toDID, fee_value, password)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success && response.data.result.transaction) {
            $translate('MESSAGES.CERT_TRANSFERED').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
            $location.path('/avatar/myavatars/');
          } else {
            $translate('MESSAGES.ERROR_CERT_TRANSFERED').then( (data) => {
              if (response.message.message != undefined) {
                FlashService.Error(data + " : " + response.message.message);
              } else {
                FlashService.Error(data);
              }
            });
          }
          NProgress.done();
          $scope.password = '';
        });
      }
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

    //Check if the certification symbol is valid
    $scope.$watch('certSymbol', (newVal, oldVal) => {
      $scope.error.certSymbol = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the certification type is valid
    $scope.$watch('certType', (newVal, oldVal) => {
      $scope.error.certType = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the new address is valid
    $scope.$watch('toDID', (newVal, oldVal) => {
      $scope.error.toDID_empty = (newVal == undefined || newVal == '');
      $scope.error.toDID_not_exist = newVal != undefined && $scope.allDidsSymbols != undefined ? !($scope.allDidsSymbols.indexOf(newVal) > -1) : false;
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
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });


  }

  function IssueCertController(MetaverseHelperService, MetaverseService, $scope, $filter, $rootScope, $location, $translate, $window, localStorageService, FlashService) {

    $scope.listAddresses = [];
    $scope.listMultiSig = [];
    $scope.myDids = [];
    $scope.myCerts = [];
    $scope.certs = [];
    $scope.error = [];
    $scope.warning = [];
    $scope.certType = '';
    $scope.changeDomain = changeDomain;
    $scope.transactionFee = 0.0001;
    $scope.allDidsAddresses = [];
    $scope.listMyCerts = listMyCerts;
    $scope.checkInputs = checkInputs;
    $scope.issueCert = issueCert;
    $scope.myCertsLoaded = false;
    $scope.symbol = '';
    $scope.assets = [];
    $scope.listAllAssets = [];

    $scope.onChain = true;
    $scope.domain = $filter('uppercase')($location.path().split('/')[3]);

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

    function changeDomain(domain) {
      $scope.symbol = domain + '.';
    }

    function listMyCerts() {
      MetaverseService.AccountAssetCert()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.result.assetcerts != null && response.data.result.assetcerts != '') {
            $scope.myCerts = response.data.result.assetcerts;
            $scope.myCerts.forEach( (e) => {
              $scope.certs[e.symbol] = e;
              if (e.symbol == $scope.certSymbol)
                $scope.certType = e.certs;
            });
          } else {
            $scope.myCerts = [];
          }
          $scope.myCertsLoaded = true;
        } else {
          $translate('MESSAGES.CANT_LOAD_MY_CERTS').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
      });
    }

    MetaverseService.ListAllAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.assets = response.data.assets;
        //All the details are hidden at the loading
        if ($scope.assets != '') {
          $scope.assets.forEach( (asset) => {
            $scope.listAllAssets.push(asset.symbol);
          });
        } //else, there is no asset on the blockchain
      } else {
        //error while loading assets
      }
    });

    MetaverseService.ListAllDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDids = response.data.result.dids;
        $scope.allDidsSymbols = [];
        if(typeof $scope.allDids != 'undefined' && $scope.allDids != null) {
          $scope.allDids.forEach(function(did) {
            $scope.allDidsSymbols.push(did.symbol);
          });
        } else {
          $scope.allDids = [];
        }
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      listMyCerts();
    });

    function checkInputs(password) {
      $scope.symbol = $filter('uppercase')($scope.symbol);
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function issueCert(domain, symbol, toDID, transactionFee, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        var fee_value = $filter('convertfortx')(transactionFee, 8);
        NProgress.start();
        MetaverseService.IssueCert(domain, 'naming', symbol, toDID, fee_value, password)
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.CERT_ISSUED').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
            $location.path('/avatar/myavatars/');
          } else {
            $translate('MESSAGES.ERROR_CERT_ISSUE').then( (data) => {
              if (response.message.message != undefined) {
                FlashService.Error(data + " : " + response.message.message);
              } else {
                FlashService.Error(data);
              }
            });
          }
          NProgress.done();
          $scope.password = '';
        });
      }
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

    //Check if the certification symbol is valid
    $scope.$watch('domain', (newVal, oldVal) => {
      $scope.error.domain_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the new asset symbol is valid
    $scope.$watch('symbol', (newVal, oldVal) => {
      $scope.error.symbol_empty = (newVal == undefined || newVal == '');
      $scope.error.symbol_not_under_my_domain = newVal != undefined && $scope.domain != undefined ? !($filter('uppercase')(newVal).startsWith($scope.domain + '.')) : false;
      $scope.error.symbol_wrong_char = (newVal != undefined && newVal != '') ? !newVal.match(/^[0-9A-Za-z.]+$/) : false;
      $scope.error.symbol_already_exist = newVal != undefined ? $scope.listAllAssets.indexOf($filter('uppercase')(newVal)) > -1 : false;
      $scope.warning.symbol_end_dot = newVal != undefined ? newVal.charAt(newVal.length-1) == '.' : false;
      checkready();
    });

    //Check if the new address is valid
    $scope.$watch('toDID', (newVal, oldVal) => {
      $scope.error.toDID_empty = (newVal == undefined || newVal == '');
      $scope.error.toDID_not_exist = newVal != undefined ? !($scope.allDidsSymbols.indexOf(newVal) > -1) : false;
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
      $scope.errorPassword = (newVal == undefined || newVal == '');
    });


  }

})();
