(function() {
  'use strict';

  angular.module('app')
  .controller('HomeController', HomeController)
  .controller('MenuController', MenuController)
  .controller('ConsoleController', ConsoleController)
  .controller('AccountController', AccountController)
  .controller('TransferAssetController', TransferAssetController)
  .controller('CreateAssetController', CreateAssetController)
  .controller('AssetsController', AssetsController)
  .controller('ShowAssetsController', ShowAssetsController)
  .controller('ShowAllAssetsController', ShowAllAssetsController)
  .controller('ETPController', ETPController)
  .controller('DepositController', DepositController)
  .controller('ExplorerController', ExplorerController)
  .controller('MiningController', MiningController)


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



    //define if the research is a Hash, a Transaction, a Block or an Asset
    function defineTypeSearch () {
      //console.log($scope.search);
      if ($scope.typeSearch=='' || $scope.typeSearch=='noresult') {
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
        MetaverseService.ListTxs($scope.search)
        .then( (response) => {
          var transactions = [];
          if (typeof response.success !== 'undefined' && response.success && response.data != undefined) {
            response.data.transactions.forEach(function(e) {
              var transaction = {
                "height": e.height,
                "hash": e.hash,
                //"timestamp": new Date(e.timestamp * 1000),
                //"direction": e.direction,
                //"recipents": [],
                //"value": 0
              };
              $scope.transactionsAddressSearch.push(transaction);
              $scope.exists = true;
            });
          } else {
            $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
              FlashService.Error(data, true);
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
              FlashService.Error(data, true);
            });
          } else {
            $scope.transaction = response.data.transaction;
            $scope.exists = true;

            //Search for the value of the input and put it in $scope.transactionInputsValues
            $scope.transactionInputsValues = [];
            response.data.transaction.inputs.forEach(function(e) {
              if (e.previous_output.hash != '0000000000000000000000000000000000000000000000000000000000000000') {
                searchInputValue(e.previous_output.hash, e.address, e.previous_output.index);
              } else {
                //console.log("It's coming from Deposit interests or Mining");
              }
            });
          }
          NProgress.done();
        });
      }
    }


    //Used to find the value of an Input
    function searchInputValue(transaction_hash, address, index) {
      //console.log(transaction_hash);
      if ( typeof transaction_hash !== 'undefined') {
        MetaverseService.FetchTx(transaction_hash)
        .then( (response) => {
          if (typeof response == 'undefined' || typeof response.success == 'undefined' || response.success == false) {
            $translate('MESSAGES.TRANSACTION_NOT_FOUND').then( (data) => {
              FlashService.Error(data, true);
            });
          } else {
            response.data.transaction.outputs.forEach(function(e) {
              if(e.address == address && e.index == index) {
                var input = {
                  "address" : address,
                  "value" : e.value,
                  "hash" : transaction_hash,
                  "index" : e.index,
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
              FlashService.Error(data, true);
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
            FlashService.Error(data, true);
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

    /************TEST FROM HERE*************/
    /*function loadFrozenHistory() {
      MetaverseService.ListTxs()
        .then(function(response) {
            var transactions = [];
            if (typeof response.success !== 'undefined' && response.success) {
                if (response.data.transactions == undefined) {
                    console.log('unable to load transactions.');
                    callback(1);
                } else if (response.data.transactions.length > 0) {
                    response.data.transactions.forEach(function(e) {
                      console.log(e.hash);
                        var transaction = {
                            "height": e.height,
                            "hash": e.hash,
                            "timestamp": new Date(e.timestamp * 1000),
                            "direction": e.direction,
                            "recipents": [],
                            "value": 0
                        };
                      });
                    }
                  }
                });
              }

              loadFrozenHistory();*/
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
    $scope.autoSelectAddress=true;                //Automatically select the address

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
    }

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
        }
        NProgress.done();
      });
    }

    listBalances();





    //Transfers ETP
    function transfer() {
      //Check for unimplemented parameters
      if ($scope.fee !== '' || $scope.message !== '') {
        FlashService.Error('Sorry, only basic transfer works so far.');
      } else if ($scope.password === '') { //Check for empty password
        $translate('MESSAGES.PASSWORD_NEEDED').then( (data) => FlashService.Error(data) );
      } else if ($scope.sendto === '') { //Check for recipent address
        $translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then( (data) => FlashService.Error(data) );
      } else if ($scope.value === '') { //Check for transaction value
        $translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then( (data) => FlashService.Error(data) );
      } else {
        //Check for password
        if (localStorageService.get('credentials').password != $scope.password) {
          $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
        } else { //Start transaction
          NProgress.start();
          var value = $scope.value;
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

          var SendPromise = ($scope.sendfrom) ? MetaverseService.SendFrom($scope.sendfrom, $scope.sendto, value, $scope.password) : MetaverseService.Send($scope.sendto, value, $scope.password);
          //console.log($scope.sendfrom);
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
      }
      $window.scrollTo(0,0);
    }

    //Load a list of all transactions
    MetaverseHelperService.LoadTransactions( (err, transactions) => {
      if (err) {
        $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      } else {
        $scope.transactions = transactions;
      }
      NProgress.done();
    }, 'etp');

    //Initialize
    init();

  }

  function AccountController(MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService, $window) {

    $scope.addresses = [];
    $scope.showprivatekey = showprivatekey;
    $scope.getnewaddress = getnewaddress;
    $scope.changepassword = changepassword;
    $scope.accountname = localStorageService.get('credentials').user;
    $scope.debugState = MetaverseService.debug;

    $scope.setDeugger = setDeugger;
    $scope.showqr = showqr;
    $scope.setOrder = setOrder;

    $scope.sortType = 'balance';
    $scope.sortReverse = true;

    function setOrder(order) {
      if ($scope.sortType == order) {
        $scope.sortReverse = !$scope.sortReverse;
      } else {
        switch (order) {
          case 'address':
          case 'balance':
          $scope.sortType = order;
          break;
        }
      }
    }


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
        }
        NProgress.done();
      });
    }

    function getnewaddress() {
      MetaverseService.GetNewAddress()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          FlashService.Success('Created new address: ' + response.data, true);
          listBalances();
        }
      });
    }

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

    /*$scope.copyToClipboard=copyToClipboard;

    function copyToClipboard(toCopy) {
      var body = angular.element($window.document.body);
              var textarea = angular.element('<textarea/>');
              textarea.css({
                  position: 'fixed',
                  opacity: '0'
              });

              function copy(toCopy) {
                  textarea.val(toCopy);
                  body.append(textarea);
                  textarea[0].select();

                  try {
                      var successful = document.execCommand('copy');
                      if (!successful) throw successful;
                  } catch (err) {
                      console.log("failed to copy", toCopy);
                  }
                  textarea.remove();
              }

              return {
                  restrict: 'A',
                  link: function (scope, element, attrs) {
                      element.bind('click', function (e) {
                          copy(attrs.copyToClipboard);
                      });
                  }
              }
            }*/


    listBalances();

  }

  function TransferAssetController(MetaverseService, $stateParams, $rootScope, $scope, $translate, $location, localStorageService, FlashService) {

    $scope.symbol = $stateParams.symbol;
    $scope.sender_address = $stateParams.sender_address;
    $scope.sendasset = sendasset;
    $scope.sendassetfrom = sendassetfrom;


    function loadasset(symbol) {
      MetaverseService.GetAsset(symbol)
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.asset = response.data.assets[0];
        } else {
          //Redirect user to the assets page
          $location.path('/asset/details/');
          //Show asset load error
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
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
        MetaverseService.SendAsset(recipent_address, symbol, quantity)
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
            $translate('MESSAGES.ASSETS_TRANSFER_ERROR').then( (data) => FlashService.Error(data) );

          }
        });
      }
    }

    function sendassetfrom(sender_address, recipent_address, symbol, quantity) {
      if (localStorageService.get('credentials').password != $scope.password) {
        $translate('MESSAGES.WRONG_PASSWORD').then( (data) => FlashService.Error(data) );
      } else if ($scope.recipent_address == undefined || $scope.recipent_address.length != 34) {
        $translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then( (data) => FlashService.Error(data) );
      } else if ($scope.quantity == undefined || !($scope.quantity > 0)) {
        $translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then( (data) => FlashService.Error(data) );
      } else {
        MetaverseService.SendAssetFrom(sender_address, recipent_address, symbol, quantity)
        .then( (response) => {
          NProgress.done();
          if (typeof response.success !== 'undefined' && response.success) {

            $translate('MESSAGES.ASSETS_TRANSFER_SUCCESS').then( (data) => {
              FlashService.Success(data, true);
              //Redirect user to the assets page
              $location.path('/asset/details/');
            });
          } else {
            //Show asset load error
            $translate('MESSAGES.ASSETS_TRANSFER_ERROR').then( (data) => FlashService.Error(data) );

          }
        });
      }
    }

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
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
        }
      });
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
      $scope.max_supply = '';
      $scope.password = '';
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


    NProgress.start();


    $scope.showDates = false;

    $scope.startDate = new Date()-(7*86400000); //By default, display 1 week
    $scope.endDate = new Date();
    $scope.startDateUpdated = new Date();
    $scope.endDateUpdated = new Date();

    $scope.setDates = setDates;
    $scope.displayUpdatedDates = displayUpdatedDates;
    $scope.showHistory = false;


    $scope.assetType = 'ETP';
    $scope.filterOnAsset = filterOnAsset;


    function filterOnAsset (asset) {
      $scope.assetType = asset;
    }

    //Define the time period to use and show the dates From ... To ... if the Custom button is selected
    function setDates(period, startDate, endDate)
    {
      switch (period) {
        case 'week':
        $scope.showDates=false;
        $scope.endDate = new Date();
        $scope.startDate = $scope.endDate-(7*86400000);//8640000 millisecond/day
        break;

        case 'month':
        $scope.showDates=false;
        $scope.endDate = new Date();
        $scope.startDate = $scope.endDate-(30*86400000);
        break;

        case 'threeMonths':
        $scope.showDates=false;
        $scope.endDate = new Date();
        $scope.startDate = $scope.endDate-(90*86400000);
        break;

        case 'custom':
        $scope.showDates=true;
        break;

        default:
        $scope.startDate = new Date();
        $scope.endDate = new Date();
      }
    }



    $scope.dateRangeFilter = function (transaction, startDate, endDate) {
      if (transaction >= startDate && transaction <= endDate) {
        return true;
      }
      return false;
    }


    //Update the startDate, endDate and list of transactions when the Submit button is clicked
    function displayUpdatedDates() {
      $scope.startDateUpdated = $scope.startDate;
      $scope.endDateUpdated = $scope.endDate;
      $scope.showHistory = true;
      $scope.transactionsFiltered = [];
      $scope.transactions.forEach(function(e) {
        if ($scope.dateRangeFilter(e.timestamp, $scope.startDateUpdated, $scope.endDateUpdated) && e.type==$scope.assetType) {
          $scope.transactionsFiltered.push(e);
        }
      });
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
        $scope.assets = response.data.assets;
      } else {
        $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      }
    });

    MetaverseHelperService.LoadTransactions( (err, transactions) => {
      if (err) {
        $translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then( (data) => FlashService.Error(data) );
      } else {
        $scope.transactions = transactions;
      }
      NProgress.done();
    });
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



    ws.onmessage = (ev) => {
      NProgress.done();
      $scope.consolelog.push({
        query: $scope.querystring,
        answer: ev.data
      });
      $scope.querystring = '';
      $scope.$apply();
      scrolldown();
    };

    $scope.querystring = '';
    $scope.consolelog = [];

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

  function HomeController(MetaverseService, $rootScope, $scope, localStorageService, $interval, $translate, $location) {

    var vm = this;
    vm.account = localStorageService.get('credentials').user;
    $scope.height = '';
    $scope.assets = [];

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
    .then(  (key) => localStorageService.set('language',key) )
    .catch( (error) => console.log("Cannot change language.") );



    /*function updateHeight() {
      MetaverseService.FetchHeight()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          $scope.height = response.data;
        }
      });
    }*/

    //updateHeight();
    //$interval( () => updateHeight(), 10000);

    $scope.show_account_menu = () => {
      $scope.menu.account.show = 1 - $scope.menu.account.show;
      $scope.menu.assets.show = 0;
    };

    $scope.show_assets_menu = () => {
      $scope.menu.assets.show = 1 - $scope.menu.assets.show;
      $scope.menu.account.show = 0;
    };



    function defineTypeSearch(search) {
      if (search === '') {                 //empty research
        $location.path('/explorer');
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
      NProgress.start();
      MetaverseService.ListAllAssets()
      .then( (response) => {
        NProgress.done();
        if (typeof response.success !== 'undefined' && response.success) {
          response.data.assets.forEach(function(e) {
            //If we found the research in the list of Assets, et redirect to its page
            if (search == e.symbol) {
              $location.path('/asset/details/'+search);
            }
          });
        } else {
          $translate('MESSAGES.ASSETS_LOAD_ERROR').then( (data) => {
            //Show asset load error
            FlashService.Error(data);
            //Redirect user to the search page
            $location.path('/explorer/noresult');
          } );
        }
      });
      NProgress.done();
      $location.path('/explorer/noresult');
    }
  }

})();
