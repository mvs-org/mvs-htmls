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
  .controller('LockController', LockController)
  .controller('ExplorerController', ExplorerController)
  .controller('ProfileController', ProfileController)
  .controller('CreateProfileController', CreateProfileController)
  .controller('AllProfilesController', AllProfilesController)
  .controller('ModifyAddressController', ModifyAddressController)
  .controller('TransferCertController', TransferCertController)
  .controller('IssueCertController', IssueCertController)
  .controller('ShowMITsController', ShowMITsController)
  .controller('CreateMITController', CreateMITController)
  .controller('TransferMITController', TransferMITController)
  .controller('LinkEthController', LinkEthController)
  .controller('PowController', PowController)
  .controller('PosController', PosController)
  .controller('AdvancedController', AdvancedController)
  .controller('OptimizeVoteController', OptimizeVoteController)
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
            element.attr('src', 'icon/default_mst.png'); // set default image
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


  function LockController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate, $window, $location, $filter) {

    $window.scrollTo(0,0);
    $scope.avatar = $location.path().split('/')[2];
    $scope.lock = lock;
    $scope.decimal_number = 8;

    $scope.balance = [];
    $scope.availableBalance = 0;
    $scope.error = [];
    $scope.warning = [];

    $scope.confirmation = false;
    $scope.checkInputs = checkInputs;
    $scope.checkready = checkready;
    $scope.loadingBalances = true;

    $scope.avatars = [];
    $scope.addresses = [];
    $scope.avatarsAddresses = [];
    $scope.locktimeDefaultPeriod = 24000;
    $scope.locktimePeriods = [];
    $translate('WEEK', 'WEEKS').then( (week, weeks) => $scope.locktimePeriods.push({"blocks": $scope.locktimeDefaultPeriod.toString(), "text": "1" + week}) );
    $translate('WEEKS').then( (weeks) => {
      for(var i = 2; i < 11; i++) {
        $scope.locktimePeriods.push({"blocks": ($scope.locktimeDefaultPeriod*i).toString(), "text": i.toString() + weeks});
      }
    });

    $scope.balancesLoaded = false;
    $scope.avatarsLoaded = false;
    $scope.checkboxLocktimeChange = checkboxLocktimeChange;

    function init() {
      $scope.password = '';
      $scope.quantity = '';
      $scope.transactionFee = 0.0001;
      $scope.confirmation = false;
      $scope.submittable = false;
      $scope.locktime = "24000";
      $scope.customLocktimeValue = undefined;
    }

    function checkInputs() {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function lock(avatar, quantity, locktime, transactionFee, password) {
      var lock_value = $filter('convertfortx')(quantity, $scope.decimal_number);
      var fee_value = $filter('convertfortx')(transactionFee, $scope.decimal_number);
      if (password != localStorageService.get('credentials').password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        MetaverseService.Lock(avatar, lock_value, locktime, fee_value, password)
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Transaction was successful
            $translate('MESSAGES.DEPOSIT_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.hash) );
            $window.scrollTo(0,0);
            init();
          } else {
            //Transaction problem
            $translate('MESSAGES.LOCK_ERROR').then( (data) => {
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


    //Load users ETP balance
    //Load the addresses and their balances
    MetaverseService.ListBalances()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        response.data.balances.forEach( (e) => {
          $scope.addresses[e.balance.address] = ({
            "balance": parseInt(e.balance.unspent),
            "available": parseInt(e.balance.available),
            "address": e.balance.address,
            "frozen": e.balance.frozen
          });  
        });
        if($scope.avatar && $scope.avatarsAddresses[$scope.avatar] && $scope.addresses[$scope.avatarsAddresses[$scope.avatar]]) {
          $scope.availableBalance = $scope.addresses[$scope.avatarsAddresses[$scope.avatar]].available;
          validQuantity($scope.quantity);
        }
        $scope.balancesLoaded = true;
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        let avatarsDetails = response.data.result.dids;
        if(typeof avatarsDetails != 'undefined' && avatarsDetails != null) {
          avatarsDetails.forEach(function(avatar) {
            $scope.avatars.push(avatar.symbol);
            $scope.avatarsAddresses[avatar.symbol] = avatar.address;
          });
          if(!$scope.avatarsAddresses[$scope.avatar]) {
            $scope.avatar = '';
          } else if ($scope.addresses[$scope.avatarsAddresses[$scope.avatar]]) {
            $scope.availableBalance = $scope.addresses[$scope.avatarsAddresses[$scope.avatar]].available;
            validQuantity($scope.quantity);
          }
        } else {
          $scope.avatars = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
      $scope.avatarsLoaded = true;
    });

    function checkboxLocktimeChange(customLocktime) {
      checkready();
    }

    //Check if the form is submittable
    function checkready() {
      //Check for errors
      for (var error in $scope.error) {
        if ($scope.error[error]) {
          console.log($scope.error)
          console.log($scope.error[error])
          $scope.submittable = false;
          return;
        }
      }
      if(($scope.customLocktime && $scope.warning.customLocktime) || (!$scope.customLocktime && $scope.warning.locktime)){
        $scope.submittable = false;
        return;
      }
      $scope.submittable = true;
    }

    //Check if the avatar is valid
    $scope.$watch('avatar', (newVal, oldVal) => {
      $scope.error.avatar_empty = (newVal == undefined || newVal == '');
      if($scope.addresses && $scope.avatarsAddresses && $scope.avatarsAddresses[$scope.avatar])
        $scope.availableBalance = $scope.addresses[$scope.avatarsAddresses[$scope.avatar]].available;
      validQuantity($scope.quantity);
      checkready();
    });

    //Check if the amount is valid
    $scope.$watch('quantity', (newVal, oldVal) => validQuantity(newVal));

    var validQuantity = function(newVal){
      $scope.error.quantity_empty = (newVal == undefined || newVal == '' || newVal < 0);
      $scope.error.quantity_not_enough_balance = (newVal != undefined && newVal != '') ? newVal > ($scope.availableBalance - $scope.transactionFee*100000000)/100000000 : false;
      $scope.error.quantity_not_a_number = (newVal != undefined && newVal != '') ? isNaN(newVal) : false;
      $scope.warning.quantity_high = newVal != undefined && newVal != '' && newVal > 5000;
      $scope.warning.quantity_low = newVal != undefined && newVal != '' && newVal < 1000;
      checkready();
    }

    //Check if the locktime is valid
    $scope.$watch('locktime', (newVal, oldVal) => {
      $scope.warning.locktime = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the custom locktime is valid
    $scope.$watch('customLocktimeValue', (newVal, oldVal) => {
      $scope.warning.customLocktime = (newVal == undefined || newVal == '');
      $scope.warning.customLocktime_high = newVal != undefined && newVal != '' && newVal > 2000000;
      $scope.warning.customLocktime_low = newVal != undefined && newVal != '' && newVal < 24000;
      checkready();
    });

    //Check if the fee is valid
    $scope.$watch('transactionFee', (newVal, oldVal) => {
      $scope.error.fee_empty = (newVal == undefined);
      $scope.error.fee_too_low = newVal != undefined ? newVal<0.0001 : false;
      $scope.error.fee_not_a_number = newVal != undefined ? isNaN(newVal) : false;
      validQuantity($scope.quantity);
      checkready();
    });

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
      checkready();
    });

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
    $scope.allDidsSymbols = [];
    $scope.myDidsAddresses = [];
    $scope.checkInputs = checkInputs;
    $scope.senderAddressesLoaded = false;
    $scope.loadingBalances = true;
    $scope.loadingDids = true;
    $scope.balancesLoaded = false;

    $scope.myDids = [];

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
          $scope.loadingBalances = false;
        }
      });
    }

    getBalance();

    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        //Once all the DIDs have been loaded, we look for the one entered by the user
        checkRecipent($scope.recipents[0].address, 1);
        checkAmount('', 1);
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
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
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
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

    //Add a recipient
    $scope.addRecipent = function() {
      $scope.recipents.push({'index': $scope.recipents.length+1, 'address': '', 'value': '', 'correctEtpAddress': false, 'correctAvatar': false, 'burnAddress': false, 'emptyAmount': true, 'wrongAmount': false, 'notEnough': false});
      $scope.recipientOK.push(false);
      $scope.amountOK.push(false);
      availBalance('');
      checkready();
    }

    //Remove a recipient
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
      if($scope.myDidsAddresses[sendfrom]) {
        sendfrom = $scope.myDidsAddresses[sendfrom];
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

      var SendPromise = MetaverseService.SendMore(sendfrom, recipentsQuery, fee, memo, password);
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
          $scope.senderAddressesLoaded = true;

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
    $scope.allDidsSymbols = [];
    $scope.checkInputs = checkInputs;
    $scope.myDidsAddresses = [];
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
      $scope.avatarRecipient = '';
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
                $scope.listAssetMultiSig[address.address] = address;
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

    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        //Once all the DIDs have been loaded, we look for the one entered by the user
        checkRecipent($scope.sendTo);
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        $scope.balancesLoaded = true;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function checkInputs() {
      //Since multi sig to did is not available, we replace it by the address
      if($scope.burnAddress) {
        $scope.sendTo = MetaverseService.burnAddress;
      } else if ($scope.correctAvatar){   //if send to avatar
        MetaverseService.GetDid($scope.sendTo)
        .then( (response) => {
          $scope.avatarRecipient = $scope.sendTo;
          response.data.result.addresses.forEach( (address) => {
            if(address.status == 'current') {
              $scope.sendTo = address.address;
            }
          });
        });
      }
      if ($scope.myDidsAddresses[this.sendFrom]) {    //if send from avatar
        $scope.sendFrom = $scope.myDidsAddresses[$scope.sendFrom];
      }
      $scope.confirmation = true;
      delete $rootScope.flash;
    }


    function createMultisigTx(sendFrom, sendTo, quantity, transactionFee, password) {
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
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
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
    $scope.popblock = popblock;
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

    function popblock(blocks) {
      NProgress.start();
      MetaverseService.FetchHeight()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          let currentHeight = response.data.result;
          let popHeight = currentHeight - blocks;
          MetaverseService.PopBlock(popHeight)
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              //Show success message
              $translate('MESSAGES.POPBLOCKS_SUCCESS').then( (data) => FlashService.Success(data) );
            } else {
              //Show popblocks error
              $translate('MESSAGES.POPBLOCKS_ERROR').then( (data) => FlashService.Error(data) );
              $window.scrollTo(0,0);
            }
          });
        NProgress.done();
        }
      });
    }

  }

  function TransferAssetController(MetaverseService, $stateParams, $rootScope, $scope, $translate, $location, localStorageService, FlashService, $window, $filter, $http) {

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
    $scope.checkInputs = checkInputs;
    $scope.updateUnlockNumber = updateUnlockNumber;
    $scope.checkready = checkready;
    $scope.loadingBalances = true;
    $scope.loadingSender = true;
    $scope.allDidsSymbols = [];
    $scope.myDidsAddresses = [];
    $scope.loadingDids = true;
    $scope.swaptokenAvatar = MetaverseService.swaptokenAvatar;
    $scope.canSwap = false;
    $scope.changeSwaptokenOption = changeSwaptokenOption;

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
      $scope.ethAddress = '';
      $scope.swaptokenFee = 1;
      $scope.error = [];
      $scope.errorDeposit = [];
      $scope.errorSwaptoken = [];
      $scope.unlockNumber = 1;
      $scope.unlockNumberString = '1';
      $scope.interestRate = '0';
      $scope.model = '0';
      $scope.model2ToSend = [];
      $scope.model2Displayed = 1;
      for(var i = 0, value = {"index":i,"number": "", "quantity": ""}, size = 100, array = new Array(100); i < size; i++, value = {"index":i,"number": "", "quantity": ""}) array[i] = value;
      $scope.model2 = array;
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
        $scope.loadingSender = false;
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        //Once all the DIDs have been loaded, we look for the one entered by the user
        checkRecipent($scope.sendto);
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        $scope.balancesLoaded = true;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function getWhitelistFromExplorer() {
      let url = $rootScope.network == 'testnet' ? 'https://explorer-testnet.mvs.org/api/bridge/whitelist' : 'https://explorer.mvs.org/api/bridge/whitelist'
      $http.get(url)
        .then((response)=>{
          $scope.bridgeWhitelist = response.data.result;
          $scope.canSwap = $scope.bridgeWhitelist.indexOf($scope.symbol) > -1;
        })
        .catch( (error) => console.log("Cannot get Whitelist from explorer") );
    }

    getWhitelistFromExplorer()

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
              $scope.loadingBalances = false;
            }
          });
        } else {
          //Asset could not be loaded
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) =>  FlashService.Error(data));
        }
      });
    }

    function checkInputs(quantityLocked, model2) {
      if($scope.frozen_option && $scope.model == 2) {
        var inputOK = true;
        $scope.unlockNumber = parseInt($scope.unlockNumberString);
        $scope.model2ToSend = model2.slice(0, $scope.unlockNumber);
        var sumNumber = 0;
        var sumQuantity = 0;
        $scope.model2ToSend.forEach( (period) => {
          sumNumber += period.number;
          sumQuantity += period.quantity;
          period.quantityToSend = $filter('convertfortx')(period.quantity, $scope.asset.decimal_number);
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
          $scope.confirmation = true;
          delete $rootScope.flash;
        }
      } else {      //Default model
        $scope.confirmation = true;
        delete $rootScope.flash;
      }
    }

    function sendasset(sendfrom, sendto, symbol, quantity, transactionFee, password) {
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        NProgress.start();
        //Update send from it is from an avatar
        if($scope.myDidsAddresses[sendfrom]) {
          sendfrom = $scope.myDidsAddresses[sendfrom];
        }
        //Modify number to fit to number of decimals defined for asset
        //quantity *= Math.pow(10,$scope.asset.decimal_number);
        //quantity = Math.round(quantity);
        quantity = $filter('convertfortx')(quantity, $scope.asset.decimal_number);
        var quantityLockedToSend = $filter('convertfortx')($scope.quantityLocked, $scope.asset.decimal_number);
        var fee_value = $filter('convertfortx')(transactionFee, 8);
        var swaptokenFee = $filter('convertfortx')($scope.swaptokenFee, 8);
        $scope.model = ($scope.frozen_option) ? $scope.model : '-1';

        if($scope.swaptoken_option) {
          var SendPromise = MetaverseService.Swaptoken(sendfrom, $scope.swaptokenAvatar, symbol, quantity, $scope.ethAddress, swaptokenFee, fee_value, password);
        } else if($scope.burnAddress) {
          var SendPromise = (sendfrom) ? MetaverseService.DidSendAssetFrom(sendfrom, MetaverseService.burnAddress, symbol, quantity, $scope.model, $scope.unlockNumber, quantityLockedToSend, $scope.periodLocked, $scope.model2ToSend, $scope.interestRate, fee_value, password) : MetaverseService.DidSendAsset(MetaverseService.burnAddress, symbol, quantity, $scope.model, $scope.unlockNumber, quantityLockedToSend, $scope.periodLocked, $scope.model2ToSend, $scope.interestRate, fee_value, password);
        } else {
          var SendPromise = (sendfrom) ? MetaverseService.DidSendAssetFrom(sendfrom, sendto, symbol, quantity, $scope.model, $scope.unlockNumber, quantityLockedToSend, $scope.periodLocked, $scope.model2ToSend, $scope.interestRate, fee_value, password) : MetaverseService.DidSendAsset(sendto, symbol, quantity, $scope.model, $scope.unlockNumber, quantityLockedToSend, $scope.periodLocked, $scope.model2ToSend, $scope.interestRate, fee_value, password);
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

    function updateUnlockNumber(unlockNumber) {
      if(unlockNumber == undefined || unlockNumber == ''){
        $scope.model2Displayed = 0;
      } else {
        $scope.model2Displayed = unlockNumber;
      }
    }

    function changeSwaptokenOption(swaptoken_option) {
      $scope.sendto = swaptoken_option ? $scope.swaptokenAvatar : '';
      checkRecipent($scope.sendto);
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
      if(!$scope.correctEtpAddress && !$scope.correctAvatar && !$scope.burnAddress && !$scope.swaptoken_option) {
        $scope.submittable = false;
        return;
      }
      if($scope.frozen_option){
        if($scope.model == 0 && $scope.errorDeposit.periodLocked_empty) {
          $scope.submittable = false;
          return;
        } else if ($scope.model == 1 && ($scope.errorDeposit.unlock_number_empty || $scope.errorDeposit.quantityLocked_empty || $scope.errorDeposit.quantityLocked_lower_quantity || $scope.errorDeposit.periodLocked_empty)) {
          $scope.submittable = false;
          return;
        } else if ($scope.model == 2 && ($scope.errorDeposit.unlockNumber_empty)) {
          $scope.submittable = false;
          return;
        } else if ($scope.model == 3 && ($scope.errorDeposit.unlock_number_empty || $scope.errorDeposit.periodLocked_empty)) {
          $scope.submittable = false;
          return;
        }
      }
      if($scope.swaptoken_option){
        for (var error in $scope.errorSwaptoken) {
          if ($scope.errorSwaptoken[error]) {
            $scope.submittable = false;
            return;
          }
        }
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
      $scope.error.quantity_not_enough_balance = (newVal != undefined && newVal != '' && $scope.asset != undefined && $scope.asset.decimal_number != undefined) ? parseInt($filter('convertfortx')(newVal, $scope.asset.decimal_number)) > parseInt($scope.availableBalance) : false;
      $scope.errorDeposit.quantityLocked_lower_quantity = newVal != undefined ? $scope.quantityLocked > newVal : false;
      checkready();
    });

    //Check if the number of periods is valid
    $scope.$watch('unlockNumber', (newVal, oldVal) => {
      $scope.errorDeposit.unlock_number_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the total locked quantity is valid
    $scope.$watch('quantityLocked', (newVal, oldVal) => {
      $scope.errorDeposit.quantityLocked_empty = (newVal == undefined || newVal == '');
      $scope.errorDeposit.quantityLocked_lower_quantity = newVal != undefined ? newVal > $scope.quantity : false;
      checkready();
    });

    //Check if the total locked period is valid
    $scope.$watch('periodLocked', (newVal, oldVal) => {
      $scope.errorDeposit.periodLocked_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the fee is valid
    $scope.$watch('transactionFee', (newVal, oldVal) => {
      $scope.error.fee_empty = (newVal == undefined || newVal == '');
      $scope.error.fee_too_low = newVal != undefined ? newVal<0.0001 : false;
      checkready();
    });

    //Check if the swaptoken fee is valid
    $scope.$watch('swaptokenFee', (newVal, oldVal) => {
      $scope.errorSwaptoken.swaptoken_fee_empty = (newVal == undefined || newVal == '');
      $scope.errorSwaptoken.swaptoken_fee_too_low = newVal != undefined ? newVal<1 : false;
      checkready();
    });

    //Check if the ETH address is valid
    $scope.$watch('ethAddress', (newVal, oldVal) => {
      $scope.errorSwaptoken.ethAddress_empty = (newVal == undefined || newVal == '');
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
        $scope.assets = response.data.assets;
        //All the details are hidden at the loading
        if ($scope.assets != '') {
          $scope.assets.forEach( (asset) => {
            asset.details = false;
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default_mst';
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
    $scope.bountyFee = MetaverseService.defaultBountyFee;
    $scope.bountyFeeUpdate = bountyFeeUpdate;
    $scope.bountyFeeMinMiner = MetaverseService.bountyFeeMinMiner;
    $scope.popupIssue = popupIssue;


    //Load assets
    NProgress.start();
    MetaverseService.ListAssets()
    .then( (response) => {
      if(response.data.assets != "") {    //if the user has some assets
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.assets = response.data.assets;
          $scope.assets.forEach( (asset) => {
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default_mst';
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

    function popupIssue(symbol) {
      $scope.symbol = symbol;
      ngDialog.open({
          template: 'templateId',
          scope: $scope
      });
    }

    function bountyFeeUpdate(bountyFee) {
      if(bountyFee > 100 - $scope.bountyFeeMinMiner)
        this.bountyFee = 100 - $scope.bountyFeeMinMiner;
    }

    function issue(symbol, bountyFee) {
      NProgress.start();
      MetaverseService.Issue(symbol, 100-bountyFee)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " : " + response.message.message);
            } else {
              FlashService.Error(data);
            }
          });
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
    $scope.myAssetsBalances = [];
    $scope.myAsset = [];


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

    //Load assets
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
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      $scope.balancesLoaded = true;
      $scope.myDidsSymbols = [];
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            //$scope.myDidsSymbols.push(did.symbol);
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.myDids = [];
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
    $scope.checkInputs = checkInputs;
    $scope.myAsset = [];
    $scope.myAssets = [];
    $scope.updateQuantity = updateQuantity;
    $scope.availBalance = availBalance;
    $scope.myDids = [];
    $scope.myDidsSymbols = [];
    $scope.myDidsAddresses = [];
    $scope.popupSecondaryIssue = popupSecondaryIssue;
    $scope.updateUnlockNumber = updateUnlockNumber;
    $scope.assetAddresses = [];
    $scope.getAssetBalance = [];
    $scope.checkready = checkready;
    $scope.updateSymbol = updateSymbol;
    $scope.getAsset = getAsset;
    $scope.getAccountAsset = getAccountAsset;
    $scope.avatarsLoaded = false;


    function init(){
      $scope.didAddress = '';
      $scope.confirmation = false;
      $scope.transactionFee = 0.0001;
      $scope.model = '';
      $scope.assetOriginal = 0;
      $scope.assetSecondaryIssue = 0;
      $scope.issueCertOwner = false;
      $scope.myCertsLoaded = false;
      $scope.availableBalance = 0;
      $scope.balancesLoaded = false;
      $scope.recipientAvatar = '';
      $scope.avatar = '';
      $scope.availableBalanceAsset = 0;
      $scope.model2Displayed = 1;
      $scope.unlockNumber = 1;
      $scope.unlockNumberString = '1';
      $scope.interestRate = '0';
      $scope.error = [];
      $scope.errorDeposit = [];
      $scope.model2ToSend = [];
      for(var i = 0, value = {"index":i,"number": "", "quantity": ""}, size = 100, array = new Array(100); i < size; i++, value = {"index":i,"number": "", "quantity": ""}) array[i] = value;
      $scope.model2 = array;
      getAsset($scope.symbol);
      getAccountAsset($scope.symbol);
    }


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
      $scope.balancesLoaded = true;
      $scope.myDidsSymbols = [];
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            $scope.myDidsSymbols.push(did.symbol);
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.myDids = [];
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function getAsset(symbol) {
      //Loads a given asset, used in the page asset/details
      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.assets != "") {    //if the user has some assets
            $scope.assets = response.data.assets;
            $scope.assetSecondaryIssue = 0;
            $scope.assets.forEach( (asset) => {
              if(asset.is_secondaryissue == 'false'){
                $scope.assetOriginal = parseInt(asset.maximum_supply);
              } else {
                if(typeof $scope.assetSecondaryIssue == 0) {
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
        $scope.error.address_not_enough_asset = $scope.address != undefined && $scope.myAsset != undefined && $scope.myAsset.secondaryissue_threshold != 127 && $scope.myAsset.secondaryissue_threshold != 0 ? ($scope.getAssetBalance[$scope.address]/($scope.assetOriginal + $scope.assetSecondaryIssue)*100 < $scope.myAsset.secondaryissue_threshold) || $scope.getAssetBalance[$scope.address] == undefined : false;
        checkready();
      });
    }

    function getAccountAsset (symbol) {
      $scope.getAssetBalance = [];
      $scope.loadingAvatars = true;
      MetaverseService.GetAccountAsset(symbol)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success && response.data.result.assets != null) {    //If the address doesn't contain any asset, we don't need it
          $scope.assetAddresses = response.data.result.assets;
          $scope.assetAddresses.forEach( (address) => {
            $scope.getAssetBalance[address.address] = address.quantity;
          });
          availBalance($scope.address);
          $scope.error.address_not_enough_asset = $scope.address != undefined && $scope.myAsset != undefined && $scope.myAsset.secondaryissue_threshold != 127 && $scope.myAsset.secondaryissue_threshold != 0 ? ($scope.getAssetBalance[$scope.address]/($scope.assetOriginal + $scope.assetSecondaryIssue)*100 < $scope.myAsset.secondaryissue_threshold) || $scope.getAssetBalance[$scope.address] == undefined : false;
          checkready();
        }
        $scope.avatarsLoaded = true;
      });

    }

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

    function updateSymbol (symbol) {
      $scope.avatarsLoaded = false;
      getAsset(symbol);
      getAccountAsset(symbol);
      $scope.myAssetsBalances.forEach( (asset) => {
        if(asset.symbol == symbol)
          $scope.myAsset = asset;
      });
      $scope.issueCertOwner = false;
      $scope.myCerts.forEach( (cert) => {
        if(cert.symbol == symbol && cert.cert == 'issue')
          $scope.issueCertOwner = true;
      });
      $scope.error.address_not_enough_etp = $scope.address != undefined && $scope.addresses != undefined && $scope.addresses[$scope.address] != undefined ? $scope.addresses[$scope.address].available<$scope.transactionFee : false;
      checkready();
    }

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

    function checkInputs(address, quantityLocked, model2) {
      $scope.recipientAvatar = $scope.myDidsAddresses[address];
      if($scope.model == 2) {
        var inputOK = true;
        $scope.unlockNumber = parseInt($scope.unlockNumberString);
        $scope.model2ToSend = model2.slice(0, $scope.unlockNumber);
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
      var quantityLockedToSend = $filter('convertfortx')($scope.quantityLocked, $scope.myAsset.decimal_number);
      var SendPromise = MetaverseService.SecondaryIssue($scope.recipientAvatar, $scope.symbol, $scope.toTxConvertedQuantity, $scope.model, $scope.unlockNumber, quantityLockedToSend, $scope.periodLocked, $scope.model2ToSend, $scope.interestRate, fee_value, $scope.password);

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
      if($scope.myAsset.secondaryissue_threshold == 0 || (($scope.myAsset.secondaryissue_threshold != 127) && ($scope.availableBalanceAsset/($scope.assetOriginal + $scope.assetSecondaryIssue)*100) < $scope.myAsset.secondaryissue_threshold)) {
        $scope.submittable = false;
        return;
      }
      if(!$scope.availableBalance >= 10000) {
        $scope.submittable = false;
        return;
      }
      if ($scope.model == 1 && ($scope.errorDeposit.unlock_number_empty || $scope.errorDeposit.quantityLocked_empty || $scope.errorDeposit.quantityLocked_lower_quantity || $scope.errorDeposit.periodLocked_empty)) {
        $scope.submittable = false;
        return;
      } else if ($scope.model == 2 && ($scope.errorDeposit.unlockNumber_empty)) {
        $scope.submittable = false;
        return;
      } else if ($scope.model == 3 && ($scope.errorDeposit.unlock_number_empty || $scope.errorDeposit.periodLocked_empty)) {
        $scope.submittable = false;
        return;
      }
      $scope.submittable = true;
    }

    //Check if symbol
    $scope.$watch('symbol', (newVal, oldVal) => {
      $scope.error.symbol_empty = (newVal == undefined || newVal == '');
      $scope.error.symbol_no_secondary_issue = newVal != undefined && $scope.myAsset != undefined ? $scope.myAsset.secondaryissue_threshold == 0 : false;
      checkready();
    });

    //Check if the avatar is valid
    $scope.$watch('address', (newVal, oldVal) => {
      $scope.error.address_empty = (newVal == undefined || newVal == '');
      $scope.error.address_not_enough_etp = newVal != undefined && $scope.addresses != undefined && $scope.addresses[newVal] != undefined ? $scope.addresses[newVal].available<$scope.transactionFee : false;
      $scope.error.address_not_enough_asset = newVal != undefined && $scope.myAsset != undefined && $scope.myAsset.secondaryissue_threshold != 127 && $scope.myAsset.secondaryissue_threshold != 0 ? ($scope.getAssetBalance[newVal]/($scope.assetOriginal + $scope.assetSecondaryIssue)*100 < $scope.myAsset.secondaryissue_threshold) || $scope.getAssetBalance[newVal] == undefined : false;
      checkready();
    });

    //Check if the quantity is valid
    $scope.$watch('quantity', (newVal, oldVal) => {
      $scope.error.quantity = (newVal == undefined || newVal == '');
      $scope.errorDeposit.quantityLocked_lower_quantity = newVal != undefined ? $scope.quantityLocked > newVal : false;
      checkready();
    });

    //Check if the number of periods is valid
    $scope.$watch('unlockNumber', (newVal, oldVal) => {
      $scope.errorDeposit.unlock_number_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the total locked quantity is valid
    $scope.$watch('quantityLocked', (newVal, oldVal) => {
      $scope.errorDeposit.quantityLocked_empty = (newVal == undefined || newVal == '');
      $scope.errorDeposit.quantityLocked_lower_quantity = newVal != undefined ? newVal > $scope.quantity : false;
      checkready();
    });

    //Check if the total locked period is valid
    $scope.$watch('periodLocked', (newVal, oldVal) => {
      $scope.errorDeposit.periodLocked_empty = (newVal == undefined || newVal == '');
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

    init();

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
    $scope.bountyFeeUpdate = bountyFeeUpdate;

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
      $scope.bountyFee = MetaverseService.defaultBountyFee;
      $scope.bountyFeeMinMiner = MetaverseService.bountyFeeMinMiner;
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
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "nodid";
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
            "frozen": e.balance.frozen
          });
        });
      }
    });

    function bountyFeeUpdate(bountyFee) {
      if(bountyFee > 100 - $scope.bountyFeeMinMiner)
        this.bountyFee = 100 - $scope.bountyFeeMinMiner;
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

    function issue(symbol, bountyFee) {
      NProgress.start();
      MetaverseService.Issue(symbol, 100-bountyFee)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then( (data) => FlashService.Success(data, false, response.data.result.transaction.hash) );
          $window.scrollTo(0,0);
        } else {
          $translate('MESSAGES.ASSETS_ISSUE_ERROR').then( (data) => {
            if (response.message.message != undefined) {
              FlashService.Error(data + " : " + response.message.message);
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
    $scope.icons = MetaverseService.hasIcon;
    $scope.filterTransactions = filterTransactions;
    $scope.items_per_page = 10;
    $scope.transactionsLoaded = false;


    function filterTransactions(asset) {
      $scope.assetType = asset;
      $scope.transactionsFiltered = [];
      if (asset == 'ALL') {
        $scope.transactionsFiltered = $scope.transactions;
      /*} else if  (asset == 'Avatars') {
        $scope.transactions.forEach(function(e) {
          if (e.direction=='did-register' || e.direction=='did-transfer') {
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
            asset.icon = ($scope.icons.indexOf(asset.symbol) > -1) ? asset.symbol : 'default_mst';
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


    function loadTransactions() {
      MetaverseHelperService.LoadTransactions( (err, transactions, total_page) => {
        if (err) {
          $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        } else {
          $scope.transactions = transactions;
          $scope.total_count = total_page * $scope.items_per_page;
          $scope.transactionsLoaded = true;
          //displayUpdatedDates();
          filterTransactions('ALL');
        }
        NProgress.done();
      }, 'asset', $scope.current_page, $scope.items_per_page);
    }

    $scope.switchPage = (page) => {
        $scope.current_page = page;
        return loadTransactions();
    };

    $scope.applyFilters = () => {
        $scope.current_page = 1;
        return loadTransactions();
    };

    $scope.switchPage(1);

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
    $scope.heightFromExplorer = 0;

    //var ws = new WebSocket('ws://localhost:8821/ws');
    var ws = new WebSocket('ws://' + MetaverseService.SERVER2 + '/ws');  //Live

    $scope.showConnected = false;
    $scope.index = 0;
    $scope.sound = true;

    $scope.version = "";
    $scope.popoverSynchShown = false;
    $scope.peers = "";

    $scope.logout = logout;

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
      let url = $rootScope.network == 'testnet' ? 'https://explorer-testnet.mvs.org/api/height' : 'https://explorer.mvs.org/api/height'
      $http.get(url)
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
      MetaverseService.GetInfoV2()
      .then( (response) => {
        if (typeof response != 'undefined' && response.success) {
          $scope.height = response.data.result.height;
          $rootScope.network = response.data.result.testnet ? 'testnet' : 'mainnet';
          $scope.version = response.data.result['wallet-version'];
          $scope.peers = response.data.result.peers;
        }
      })
      .then(() => {
        if($scope.heightFromExplorer == 0) {
          getHeightFromExplorer()
        } else {
          $scope.loadingPercent = Math.floor($scope.height/$scope.heightFromExplorer*100);
        }
      })
    }

    updateHeight();
    $scope.stopUpdateHeight = $interval(updateHeight, 10000);
    $scope.stopGetHeightFromExplorer = $interval(getHeightFromExplorer, 600000);

    function logout() {
      $interval.cancel($scope.stopUpdateHeight);
      $interval.cancel($scope.stopGetHeightFromExplorer);
      $location.path('/login');
    }

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
    $scope.symbolAddress = [];
    $scope.selectedDidAddress = '';


    MetaverseService.ListMyDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        if (response.data.result.dids) {
          $scope.myDids = response.data.result.dids;
          if(typeof $scope.selectedDid == 'indefined' || $scope.selectedDid == '') {
            $scope.selectedDid = $scope.myDids[0].symbol;
            $scope.myDids.forEach(function(did) {
              $scope.symbolAddress[did.symbol] = did.address;
              if(did.symbol == $scope.selectedDid)
                $scope.selectedDidAddress = did.address;
            })
          }
          listDidsAddresses($scope.selectedDid);
        } else {
          $scope.myDids = [];
          $scope.selectedDid = "";
        }
      } else if (response.message.message == "no record in this page") {
        $scope.myDids = [];
        $scope.selectedDid = "";
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
      MetaverseService.GetDid(symbol)
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
    $scope.items_per_page = 10;

    function load () {
      MetaverseService.ListAllDids($scope.current_page, $scope.items_per_page)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.allDids = response.data.result.dids;
          $scope.total_count = response.data.result.total_count;
        } else if (response.message.message == "no record in this page") {
          //No avatar
        } else {
          $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        $scope.loaded = true;
      });
    };



    $scope.switchPage = (page) => {
        $scope.current_page = page;
        return load();
    };

    $scope.applyFilters = () => {
        $scope.current_page = 1;
        return load();
    };

    $scope.switchPage(1);

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
    $scope.allDidsSymbols = [];
    $scope.myDidsAddresses = [];
    $scope.didAddress = '';
    $scope.addresses = [];
    $scope.resultMultisigTx = '';
    $scope.resultMultisigTxSaved = false;
    $scope.bountyFee = MetaverseService.defaultBountyFee;
    $scope.bountyFeeUpdate = bountyFeeUpdate;
    $scope.bountyFeeMinMiner = MetaverseService.bountyFeeMinMiner;
    $scope.myDids = [];
    $scope.loadingDids = true;


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
        }
      });
      NProgress.done();
    }

    listAddresses();

    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        $scope.error.symbol_already_exist = $scope.didSymbol != undefined ? ($scope.allDidsSymbols.indexOf($scope.didSymbol) > -1) : false;
        checkready();
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if (response.data.result.dids) {
          $scope.myDids = response.data.result.dids;
          if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
            $scope.myDids.forEach(function(did) {
              $scope.myDidsAddresses.push(did.address);
            })
          }
        }
      } else if (response.message.message == "no record in this page") {
        //No Avatar
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function bountyFeeUpdate(bountyFee) {
      if(bountyFee > 100 - $scope.bountyFeeMinMiner)
        this.bountyFee = 100 - $scope.bountyFeeMinMiner;
    }

    function checkInputs(password) {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    function createProfile(didAddress, didSymbol, password, bountyFee) {
      NProgress.start();
      MetaverseService.RegisterDid(didAddress, didSymbol, password, 100-bountyFee)
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
      $scope.error.didAddress_already_used = newVal != undefined ? ($scope.myDidsAddresses.indexOf(newVal) > -1) : false;
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
          }
        } else {
          $scope.noDids = true;
          $scope.selectedDid = "";
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
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
        /*NProgress.start();
        var fee_value = $filter('convertfortx')(transactionFee, 8);
        MetaverseService.DidChangeAddress(selectedDid, toAddress, fee_value, password)
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
        });*/
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
    $scope.checkInputs = checkInputs;
    $scope.transferCert = transferCert;
    $scope.myCertsLoaded = false;
    $scope.allDidsSymbols = [];
    $scope.loadingDids = true;

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


    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        $scope.error.toDID_not_exist = $scope.toDID != undefined && $scope.allDidsSymbols != undefined ? !($scope.allDidsSymbols.indexOf($scope.toDID) > -1) : false;
        checkready();
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
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

    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        $scope.error.toDID_not_exist = $scope.toDID != undefined && $scope.allDidsSymbols != undefined ? !($scope.allDidsSymbols.indexOf($scope.toDID) > -1) : false;
        checkready();
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
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

  function ShowMITsController(MetaverseHelperService, MetaverseService, $scope, $translate, $window, localStorageService, FlashService) {

    $scope.loaded = false;
    $scope.mymits = [];

    NProgress.start();
    MetaverseService.ListMITs()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.mymits = response.data.result.mits != null ? response.data.result.mits : [];
      } else {
        $translate('MESSAGES.MITS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
      $scope.loaded = true;
      NProgress.done();
    });
  }


  function CreateMITController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location, $rootScope, $filter) {

    $scope.listAddresses = [];
    $scope.registerMIT = registerMIT;
    $scope.error = [];
    $scope.checkInputs = checkInputs;
    $scope.addresses = [];

    //$scope.allMitsSymbols = [];
    $scope.myDidsAddresses = [];
    $scope.symbolAddress = [];
    $scope.noDids = false;

    function init() {
      $scope.mitSymbol = '';
      $scope.mitAvatar = '';
      $scope.content = '';
      $scope.password = '';
      $scope.transactionFee = 0.0001;
      $scope.confirmation = false;
      $scope.submittable = false;
    }


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
              "frozen": e.balance.frozen
            });
            $scope.listAddresses.push({
              "balance": parseInt(e.balance.unspent),
              "available": parseInt(e.balance.available),
              "address": e.balance.address
            });
          });
        }
      });
      NProgress.done();
    }

    listAddresses();

    function checkInputs(password) {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        if (response.data.result.dids) {
          $scope.myDids = response.data.result.dids;
          if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
            $scope.myDids.forEach(function(did) {
              $scope.myDidsAddresses.push(did.address);
              $scope.symbolAddress[did.symbol] = did.address;
            })
          } else {
          }
        } else {
          $scope.noDids = true;
          $scope.selectedDid = "";
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function registerMIT(password) {
      NProgress.start();
      var fee_value = $filter('convertfortx')($scope.transactionFee, 8);
      MetaverseService.RegisterMIT($scope.mitSymbol, $scope.mitAvatar, $scope.content, fee_value, password)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.result.transaction) {
            $translate('MESSAGES.MIT_CREATED').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
            init();
          }
        } else {
          $translate('MESSAGES.ERROR_MIT_CREATION').then( (data) => {
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
    $scope.$watch('mitSymbol', (newVal, oldVal) => {
      $scope.error.symbol_empty = (newVal == undefined || newVal == '');
      $scope.error.symbol_wrong_char = newVal != undefined && newVal != '' ? !newVal.match(/^[0-9A-Za-z.@_-]+$/) : false;
      //$scope.error.symbol_already_exist = newVal != undefined && newVal != '' ? ($scope.allMitsSymbols.indexOf(newVal) > -1) : false;
      checkready();
    });

    //Check if the address is valid
    $scope.$watch('mitAvatar', (newVal, oldVal) => {
      $scope.error.mitAvatar_empty = (newVal == undefined || newVal == '');
      $scope.error.mitAvatar_not_enough_etp = newVal != undefined && $scope.addresses[newVal] != undefined ? ($scope.addresses[newVal].available < 0.0001) : false;
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

  function TransferMITController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location, $rootScope, $filter) {

    $scope.transferMIT = transferMIT;
    $scope.error = [];
    $scope.checkInputs = checkInputs;
    $scope.mymits = [];
    $scope.allDidsSymbols = [];
    $scope.loaded = false;
    $scope.loadingDids = true;

    $scope.mitSymbol = $location.path().split('/')[3];

    function init() {
      $scope.sendto = '';
      $scope.password = '';
      $scope.transactionFee = 0.0001;
      $scope.confirmation = false;
      $scope.submittable = false;
    }

    NProgress.start();
    MetaverseService.ListMITs()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.mymits = response.data.result.mits != null ? response.data.result.mits : [];
      } else {
        $translate('MESSAGES.MITS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
      $scope.loaded = true;
      NProgress.done();
    });

    MetaverseService.GetAllDids()
    .then( (response) => {
      $scope.loadingDids = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.allDidsSymbols = response.data.result.dids;
        $scope.error.sendto_not_exist = $scope.sendto != undefined && $scope.sendto != '' ? !($scope.allDidsSymbols.indexOf($scope.sendto) > -1) : false;
        checkready();
      } else {
        $translate('MESSAGES.CANT_LOAD_ALL_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function checkInputs(password) {
      $scope.confirmation = true;
      delete $rootScope.flash;
    }


    function transferMIT(password) {
      NProgress.start();
      var fee_value = $filter('convertfortx')($scope.transactionFee, 8);
      MetaverseService.TransferMIT($scope.mitSymbol, $scope.sendto, fee_value, password)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          if(response.data.result.transaction) {
            $translate('MESSAGES.MIT_CREATED').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
            init();
          }
        } else {
          $translate('MESSAGES.ERROR_MIT_CREATION').then( (data) => {
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

    //Check if the MIT symbol is valid
    $scope.$watch('mitSymbol', (newVal, oldVal) => {
      $scope.error.mitSymbol_empty = (newVal == undefined || newVal == '');
      checkready();
    });

    //Check if the address is valid
    $scope.$watch('sendto', (newVal, oldVal) => {
      $scope.error.sendto_empty = (newVal == undefined || newVal == '');
      $scope.error.sendto_not_exist = newVal != undefined && newVal != '' ? !($scope.allDidsSymbols.indexOf(newVal) > -1) : false;
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


  function LinkEthController(MetaverseHelperService, MetaverseService, localStorageService, $scope, $translate, $window, FlashService, ngDialog, $location) {

    $scope.listAddresses = [];
    $scope.senderAddressesLoaded = false;
    $scope.error = [];
    $scope.etpAddress = $location.path().split('/')[3];
    $scope.confirmation = false;
    $scope.registerEthBridge = registerEthBridge;
    $scope.result = "";
    $scope.ETPMap = MetaverseService.ETPMap;
    $scope.SwapAddress = MetaverseService.SwapAddress;

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
            "frozen": e.balance.frozen
          });
          $scope.listAddresses.push({
            "balance": parseInt(e.balance.unspent),
            "available": parseInt(e.balance.available),
            "address": e.balance.address
          });
        });
        $scope.senderAddressesLoaded = true;
      }
    });

    function toHex(s) {
      var s = unescape(encodeURIComponent(s));
      var h = '';
      for (var i = 0; i < s.length; i++)
        h += s.charCodeAt(i).toString(16);
      return h;
    }

    function zerofill(content, length, direction) {
      if(content.length>length)
        return (zerofill(content.slice(0, 64), 64, direction) + zerofill(content.slice(64), 64, direction))
      if(direction !== 'left')
        direction == 'right';
      let result = "" + content;
      var zeros = length - (result).length;
      for(let i = 0; i < zeros; i++)
        result = (direction == 'left') ? "0" + result:result + "0";
      return result;
    }

    function registerEthBridge(etpAddress) {
      const FUNCTION_ID = "0xfa42f3e5";
      const LOCATION = "0000000000000000000000000000000000000000000000000000000000000020";
      var avatar_or_address = $scope.myDidsAddresses[etpAddress] ? $scope.myDidsAddresses[etpAddress] : etpAddress;
      var dynamic = toHex(avatar_or_address);
      var hexLength = avatar_or_address.length.toString(16);
      $scope.result = FUNCTION_ID + LOCATION + zerofill(hexLength, 64, 'left') + zerofill(dynamic, 64, 'right');
      $scope.confirmation = true;
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

    //Check if the fee is valid
    $scope.$watch('etpAddress', (newVal, oldVal) => {
      $scope.error.etpAddress = (newVal == undefined || newVal == '');
      checkready();
    });

  }

  function AdvancedController(MetaverseService, FlashService, $translate, $scope, $window) {
   

  }

  function PosController(MetaverseService, $rootScope, FlashService, $translate, $scope, $window) {

    $window.scrollTo(0,0);

    $scope.startPosMining = startPosMining;
    $scope.stop = StopMining;
    $scope.getLocked = getLocked;
    $scope.getStakeInfo = getStakeInfo;
    $scope.minerChanged = minerChanged;
    $scope.status = {};

    $scope.addresses = [];
    $scope.listAddresses = [];
    $scope.myDidsAddresses = [];
    $scope.symbolAddress = [];
    $scope.loadingMiner = true;
    $scope.mst = '';

    $scope.min_locked_etp = 100000000000;
    $scope.min_locked_range = 24000;
    $scope.forbidden_period_end_range = 1000;
    $scope.can_mine_till = 0;
    $scope.nbr_lock_above_min_locked_etp = 0;

    $scope.stakeBalanceLoaded = true;
    $scope.initCheckLockRequirement = true;

    $scope.mstMiningList = [];
    $scope.mstMinable = false;

    $scope.stakeUtxoLoaded = true;
    $scope.nbr_vote = [];

    GetMiningInfo();

    

    function startPosMining() {
      NProgress.start();
      MetaverseService.Start('pos', $scope.miner, $scope.mst)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $translate('MESSAGES.MINING_START_SUCCESS').then( (data) => FlashService.Success(data) );
          $window.scrollTo(0,0);
          GetMiningInfo();
        } else {
          $translate('MESSAGES.MINING_START_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
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
          $window.scrollTo(0,0);
          GetMiningInfo();
        } else {
          $translate('MESSAGES.MINING_STOP_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
      });
    }

    function GetMiningInfo() {
      $scope.loadingMiningInfo = true;
      NProgress.start();
      MetaverseService.GetMiningInfo()
      .then( (response) => {
        NProgress.done();
        $scope.loadingMiningInfo = false;
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.status = response.data.result;
          if($scope.initCheckLockRequirement && $scope.status.is_mining)
            minerChanged($scope.status.payment_address)
          $scope.initCheckLockRequirement = false;
        } else {
          $translate('MESSAGES.MINING_STATUS_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
      });
    }

    function minerChanged(miner) {
      getLocked(miner);
      getStakeInfo(miner);
    }

    function getLocked(miner) {
      $scope.stakeBalanceLoaded = false;
      MetaverseService.GetLocked(miner)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          let locked_outputs = response.data.result;
          $scope.can_mine_till = 0;
          $scope.nbr_lock_above_min_locked_etp = 0;
          let latest_valid_unlock = 0;
          if(locked_outputs) {
            locked_outputs.forEach(function(locked_output) {
              if(locked_output.locked_balance >= $scope.min_locked_etp && locked_output.locked_height > $scope.min_locked_range && locked_output.expiration_height - $scope.status.height > $scope.forbidden_period_end_range) {
                $scope.nbr_lock_above_min_locked_etp++;
                latest_valid_unlock = locked_output.expiration_height > latest_valid_unlock ? locked_output.expiration_height : latest_valid_unlock;
              }           
            });
            $scope.can_mine_till = latest_valid_unlock > 0 ? latest_valid_unlock - $scope.forbidden_period_end_range : 0;
          }
          $scope.stakeBalanceLoaded = true;
        } else {
          $translate('MESSAGES.GET_LOCKED_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        
      });
    }

    //Load users ETP balance
    //Load the addresses and their balances
    MetaverseService.ListBalances()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        response.data.balances.forEach( (e) => {
          $scope.addresses[e.balance.address] = ({
            "balance": parseInt(e.balance.unspent),
            "available": parseInt(e.balance.available),
            "address": e.balance.address,
            "frozen": e.balance.frozen
          });
          $scope.listAddresses.push({
            "balance": parseInt(e.balance.unspent),
            "available": parseInt(e.balance.available),
            "address": e.balance.address
          });
        });
        $scope.loadingMiner = false;
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    MetaverseService.ListMstMiningAssets()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.mstMiningList = response.data.result;
      } else {
        $translate('MESSAGES.MST_MINING_LOAD_ERROR').then( (data) => {
          //Show asset load error
          FlashService.Error(data);
        } );
      }
    });

    function getStakeInfo(miner) {
      $scope.stakeUtxoLoaded = false;
      MetaverseService.GetStakeInfo(miner)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.stakeUtxoLoaded = true;
          $scope.nbr_vote = response.data.result
        } else {
          $translate('MESSAGES.GET_STAKE_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        
      });
    }

  }

  function PowController(MetaverseService, $rootScope, FlashService, $translate, $scope, $window) {

    $window.scrollTo(0,0);

    $scope.status = {}

    let testnet = $rootScope.network == 'testnet'

    NProgress.start();
    MetaverseService.GetMiningInfo()
    .then( (response) => {
      NProgress.done();
      $scope.loadingMiningInfo = false;
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.status = response.data.result;
      } else {
        $translate('MESSAGES.MINING_STATUS_ERROR').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });
    

  }

  function OptimizeVoteController(MetaverseService, $rootScope, $location, localStorageService, FlashService, $translate, $scope, $window) {

    $window.scrollTo(0,0);

    $scope.getStakeInfo = getStakeInfo;
    $scope.status = {};

    $scope.addresses = [];
    $scope.listAddresses = [];
    $scope.myDidsAddresses = [];
    $scope.symbolAddress = [];
    $scope.loadingMiner = true;
    $scope.mst = '';

    $scope.min_locked_etp = 100000000000;
    $scope.min_locked_range = 24000;
    $scope.forbidden_period_end_range = 1000;
    $scope.can_mine_till = 0;
    $scope.nbr_lock_above_min_locked_etp = 0;

    $scope.stakeBalanceLoaded = true;
    $scope.initCheckLockRequirement = true;

    $scope.assets = [];
    $scope.mstMinable = false;

    $scope.stakeUtxoLoaded = true;
    $scope.nbr_vote = [];

    $scope.transferMore = transferMore;
    $scope.addressChanged = addressChanged;
    $scope.checkInputs = checkInputs;
    $scope.sendfrom = $location.path().split('/')[3];
    $scope.maxRecipients = 100;

    // Initializes all transaction parameters with empty strings.
    function init() {
      $scope.fee = '';
      //$scope.message = '';
      $scope.password = '';
      $scope.transactionFee = 0.0001;
      //$scope.memo = '';
      $scope.confirmation = false;
      $scope.error = [];
      $scope.option = [];
      //$scope.option.memo_empty = true;
      $scope.recipientOK = [];
      $scope.amountOK = [];
      $scope.recipents = [];
      $scope.recipents.push({'index': 1, 'address': '', 'value': '', 'correctEtpAddress': false, 'correctAvatar': false, 'burnAddress': false, 'emptyAmount': true, 'wrongAmount': false, 'notEnough': false});
    }
  
    //Load users ETP balance
    //Load the addresses and their balances
    MetaverseService.ListBalances()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        response.data.balances.forEach( (e) => {
          $scope.addresses[e.balance.address] = ({
            "balance": parseInt(e.balance.unspent),
            "available": parseInt(e.balance.available),
            "address": e.balance.address,
            "frozen": e.balance.frozen
          });
          $scope.listAddresses.push({
            "balance": parseInt(e.balance.unspent),
            "available": parseInt(e.balance.available),
            "address": e.balance.address
          });
        });
        $scope.balancesLoaded = true;
      }
    });

    MetaverseService.ListMyDids()
    .then( (response) => {
      if (typeof response.success !== 'undefined' && response.success) {
        $scope.myDids = response.data.result.dids;
        if(typeof $scope.myDids != 'undefined' && $scope.myDids != null) {
          $scope.myDids.forEach(function(did) {
            $scope.myDidsAddresses[did.address] = did.symbol;
          });
        } else {
          $scope.myDids = [];
        }
      } else if (response.message.message == "no record in this page") {
        $scope.noDids = true;
        $scope.selectedDid = "";
      } else {
        $translate('MESSAGES.CANT_LOAD_MY_DIDS').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      }
    });

    function addressChanged(address) {
      getNbrVoteMax(address);
      getStakeInfo(address);
    }

    function getNbrVoteMax(address) {
      $scope.nbrMaxVote = Math.min(Math.floor($scope.addresses[address].available / 100000000 / 1000), $scope.maxRecipients);
    }

    function getStakeInfo(miner) {
      $scope.stakeUtxoLoaded = false;
      MetaverseService.GetStakeInfo(miner)
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.stakeUtxoLoaded = true;
          $scope.nbr_vote = response.data.result
        } else {
          $translate('MESSAGES.GET_STAKE_ERROR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
        }
        
      });
    }

    function checkInputs() {
      $scope.confirmation = true;
      organizeRecipients($scope.nbrMaxVote, 100000000000, $scope.sendfrom);
      delete $rootScope.flash;
    }

    function organizeRecipients(nbrOutputs, quantity, recipient) {
      $scope.recipents = [];
      for(var i = 0; i < nbrOutputs; i++) {
        $scope.recipents.push({'index': i, 'address': recipient, 'value': quantity});
      }
    }

    function transferMore(sendfrom, recipents, transactionFee, password) {
      
      if (localStorageService.get('credentials').password != password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
      } else {
        NProgress.start();
        var fee = transactionFee * 100000000;

        var SendPromise = MetaverseService.SendMore(sendfrom, recipents, fee, undefined, password);
        SendPromise
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {
            //Transaction was successful
            $translate('MESSAGES.TRANSFER_SUCCESS').then( (data) => FlashService.Success(data, true, response.data.result.transaction.hash) );
            $location.path('/home');
            $window.scrollTo(0,0);
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

    //Check if the password is valid
    $scope.$watch('password', (newVal, oldVal) => {
      $scope.errorPassword = (newVal == undefined || newVal == '');
      checkready();
    });

    init();

  }

})();
