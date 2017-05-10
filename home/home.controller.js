(function() {
	'use strict';

	angular.module('app')
	.controller('HomeController', HomeController)
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
	.controller('MiningController', MiningController);


	function ExplorerController(MetaverseService, MetaverseHelperService, $location, $stateParams, $rootScope, $scope, FlashService, localStorageService, $translate) {

		$scope.show_transaction = show_transaction;

		var transaction_hash = $stateParams.hash;
		if(transaction_hash!=undefined){
			NProgress.start();
			MetaverseService.FetchTx(transaction_hash)
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success && response.data !=undefined && response.data.transaction != undefined) {
					$scope.transaction = response.data.transaction;
				}
				else{
					$translate('MESSAGES.TRANSACTION_NOT_FOUND').then(function (data) {
							setTimeout(function(){
								FlashService.Error(data);
								$rootScope.$apply();
							}, 100);
						});
					$location.path('/explorer');
				}
				NProgress.done();
			});
		}

		function show_transaction(){
			$location.path('/explorer/tx/'+$scope.hash);
		}

	}

	function DepositController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate) {

	$scope.changeFactor=changeFactor;
	$scope.deposit = deposit;

      function init(){
          $scope.deposit_address="";
        	$scope.value="";			
    			$scope.password = '';
			  	$scope.value= '';
      }

	$scope.isNumber = angular.isNumber;

		$scope.deposit_options = {
			"DEPOSIT.PERIOD.WEEK" : [0.001,0.05,7],
			"DEPOSIT.PERIOD.MONTH" : [0.0066,0.08,30],
			"DEPOSIT.PERIOD.QUARTER": [0.0323,0.128,90],
			"DEPOSIT.PERIOD.HALF_YEAR": [0.0798,0.16,182],
			"DEPOSIT.PERIOD.YEAR": [0.2,0.2,365]
			};

		$rootScope.factor="FACTOR_ETP";

		function changeFactor(factor){
			switch (factor) {
				case 'satoshi':
					if($rootScope.factor=="FACTOR_SATOSHI")
						return;
					$rootScope.factor="FACTOR_SATOSHI";
					$scope.value*=100000000;
					$scope.value=Math.round($scope.value);
					break;
				default:
					if($rootScope.factor=="FACTOR_ETP")
						return;
				  $rootScope.factor="FACTOR_ETP";
					$scope.value/=100000000;
			}
		}

		function deposit(){
			var credentials = localStorageService.get('credentials');

			if($scope.password==''){ //Check for empty password
				$translate('MESSAGES.PASSWORD_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.password!=credentials.password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if(!($scope.value>0)){
				$translate('MESSAGES.INVALID_VALUE').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.deposit_options[$scope.period_select] == undefined){
				$translate('MESSAGES.INVALID_TIME_PERIOD').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				var deposit_value = ($rootScope.factor=="FACTOR_SATOSHI") ? $scope.value : $scope.value * 100000000;
				  MetaverseService.Deposit($scope.deposit_options[$scope.period_select][2], deposit_value, $scope.password, ($scope.address_option)?$scope.deposit_address:undefined)
				.then(function (response) {
					NProgress.done();
					if ( typeof response.success !== 'undefined' && response.success && response.data.error == undefined) {
              init();
						//Transaction was successful
						$translate('MESSAGES.DEPOSIT_SUCCESS').then(function (data) {
							FlashService.Success(data + response.data.transaction.hash);
						});
						init();
					}
					else {

						//Transaction problem
						$translate('MESSAGES.DEPOSIT_ERROR').then(function (data) {
							FlashService.Error(data);
						});
						$scope.password='';
					}
				});
			}
		}


	}
	/**
	 * The ETP Controller provides ETP transaction functionality.
	 */
	function ETPController(MetaverseService, MetaverseHelperService, $rootScope, $scope, FlashService, localStorageService, $translate) {

		//Start loading animation
		NProgress.start();

		$scope.transfer=transfer;
		$scope.changeFactor=changeFactor;

		$rootScope.factor="FACTOR_ETP";

		// Initializes all transaction parameters with empty strings.
		function init(){
			$scope.sendfrom='';
			$scope.sendto='';
			$scope.fee='';
			$scope.message='';
			$scope.value='';
			$scope.password='';
      MetaverseService.ListBalances(true)
      	.then(function(response){
          if(response.success)
						$scope.from_addresses=response.data.balances;
        });
		}

		function changeFactor(factor){
			switch (factor) {
				case 'satoshi':
					if($rootScope.factor=="FACTOR_SATOSHI")
						return;
					$rootScope.factor="FACTOR_SATOSHI";
					$scope.value*=100000000;
					$scope.value=Math.round($scope.value);
					break;
				default:
					if($rootScope.factor=="FACTOR_ETP")
						return;
				  $rootScope.factor="FACTOR_ETP";
					$scope.value/=100000000;
			}
		}

		//Transfers ETP
		function transfer(){
			//Check for unimplemented parameters
			if($scope.sendfrom !== '' || $scope.fee !== '' || $scope.message !== ''){
				FlashService.Error('Sorry. Only basic transfer works so far.');
			}
			else if($scope.password===''){ //Check for empty password
				$translate('MESSAGES.PASSWORD_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.sendto===''){ //Check for recipent address
				$translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.value===''){ //Check for transaction value
				$translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				//Check for password
				if(localStorageService.get('credentials').password!=$scope.password){
					$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
						FlashService.Error(data);
					});
				}
				else{ //Start transaction
					NProgress.start();
					var value=$scope.value;
					switch ($rootScope.factor) {
						case 'FACTOR_SATOSHI':
							break;
						case 'FACTOR_ETP':
							value*=100000000;
							break;
						default:
							$translate('MESSAGES.TRANSFER_ERROR').then(function (data) {
								FlashService.Error(data);
							});
							return;
					}

					value=Math.round(value);

          var SendPromise=($scope.from_address)?MetaverseService.SendFrom($scope.from_address,$scope.sendto, value, $scope.password):MetaverseService.Send($scope.sendto, value, $scope.password);

					SendPromise
					.then(function (response) {
						NProgress.done();
						if ( typeof response.success !== 'undefined' && response.success) {
							//Transaction was successful
							$translate('MESSAGES.TRANSFER_SUCCESS').then(function (data) {
								FlashService.Success(data + response.data.transaction.hash);
							});
							init();
						}
						else {
							//Transaction problem
							$translate('MESSAGES.TRANSFER_ERROR').then(function (data) {
								if(response.message!=undefined){
									FlashService.Error(data + " " + response.message);
								}
								else {
									FlashService.Error(data);
								}
							});
							$scope.password='';
						}
					});
				}
			}
		}

		//Load a list of all transactions
		MetaverseHelperService.LoadTransactions(function(err,transactions){
			if(err){
				$translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				$scope.transactions=transactions;
			}
			NProgress.done();
		}, 'etp');

		//Initialize
		init();

	}

	function AccountController(MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService) {

		$scope.addresses = [];
		$scope.showprivatekey = showprivatekey;
		$scope.getnewaddress = getnewaddress;
		$scope.changepassword = changepassword;
		$scope.accountname = localStorageService.get('credentials').user;
		$scope.debugState=MetaverseService.debug;

		$scope.setDeugger=setDeugger;
		$scope.showqr = showqr;
		$scope.setOrder = setOrder;

		$scope.sortType = 'balance';
		$scope.sortReverse =true;

		function setOrder(order){
			if($scope.sortType==order){
				$scope.sortReverse=!$scope.sortReverse;
			}
			else{
				switch(order){
					case 'address':
					case 'balance':
						$scope.sortType = order;
						break;
				}
			}
		}


		//Shows a modal of the address incl. a qr code
		function showqr(address){
			$('#showqrmodal').modal();
			$("#modal_address").html(address);
			$('#modal_qr').html('');
			var qrcode = new QRCode(document.getElementById("modal_qr"), {
				text: address,
				width: 300,
				height: 300,
				colorDark : "#000000",
				colorLight : "#ffffff",
				correctLevel : QRCode.CorrectLevel.H
			});
			$('#showqrmodal').modal('show');
		}

		//Load the addresses and their balances
		function listBalances(){
			NProgress.start();
			MetaverseService.ListBalances()
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.addresses=[];
					response.data.balances.forEach(function(e){
						$scope.addresses.push({
							"balance" : parseInt(e.balance.unspent),
							"address" : e.balance.address
						})
					})
				}
				NProgress.done();
			});
		}

		function getnewaddress(){
			MetaverseService.GetNewAddress()
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success) {
					FlashService.Success('Created new address: '+response.data, true);
					listBalances();
				}
			});
		}

		function showprivatekey(password, last_word){
			if(password==undefined){
				$translate('MESSAGES.PASSWORD_NEEDED_FOR_PRIVATE_KEY').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if(localStorageService.get('credentials').password!=password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				NProgress.start();
				MetaverseService.GetAccount(last_word)
				.then(function (response) {
					if ( typeof response.success !== 'undefined' && response.success) {
						$scope.privatekey = response.data['mnemonic-key'];
					}
					else {
						//Show mnemonic load error
							$translate('SETTINGS.MNEMONIC_LOAD_ERROR').then(function (data) {
								FlashService.Error(data);
							});
					}
					NProgress.done();
				});
			}
		}

        function changepassword(password, new_password, new_password_repeat){
            console.log('hallo')
            if(password==undefined || localStorageService.get('credentials').password!=password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
					FlashService.Error(data);
				});
			}
            else if(new_password==undefined || new_password.length < 6){
                $translate('MESSAGES.PASSWORD_SHORT').then(function (data) {
					FlashService.Error(data);
				});
            }
            else if(new_password!=new_password_repeat){
                $translate('MESSAGES.PASSWORD_NOT_MATCH').then(function (data) {
					FlashService.Error(data);
				});
            }
			else{
            NProgress.start();
				MetaverseService.ChangePassword(new_password)
				.then(function (response) {
					if ( typeof response.success !== 'undefined' && response.success) {
                        $location.path('/login');
						//Show success message
						$translate('MESSAGES.CHANGE_PASSWORD_SUCCESS').then(function (data) {
							//Wait some time to make sure the user gets the message
							setTimeout(function(){
								FlashService.Success(data);
								$rootScope.$apply();
							}, 100);
						});
					}
					else {
						//Show change password error
							$translate('SETTINGS.CHANGE_PASSWORD_ERROR').then(function (data) {
								FlashService.Error(data);
							});
					}
					NProgress.done();
				});

            }
        }
		function setDeugger(state){
			MetaverseService.debug=(state==1);
			$scope.debugState=MetaverseService.debug;
		}

		listBalances();

	}

	function TransferAssetController(MetaverseService, $stateParams, $rootScope, $scope, $translate, $location,localStorageService, FlashService) {

		$scope.symbol = $stateParams.symbol;
		$scope.sender_address = $stateParams.sender_address;

		$scope.sendassetfrom=sendassetfrom;

		function loadasset(symbol){

			MetaverseService.GetAsset(symbol)
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.asset = response.data.assets[0];
				}
				else {
					//Redirect user to the assets page
					$location.path('/asset/details/');

					//Show asset load error
					$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
						FlashService.Error(data);
					});

				}
			});
		}

		function sendassetfrom(sender_address, recipent_address, symbol, quantity){
			if(localStorageService.get('credentials').password!=$scope.password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.recipent_address==undefined || $scope.recipent_address.length != 34){
				$translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.quantity==undefined || ! ($scope.quantity > 0)){
				$translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				MetaverseService.SendAssetFrom(sender_address, recipent_address, symbol, quantity)
				.then(function (response) {
					NProgress.done();
					if ( typeof response.success !== 'undefined' && response.success) {
						//Redirect user to the assets page
						$location.path('/asset/details/');

						$translate('MESSAGES.ASSETS_TRANSFER_SUCCESS').then(function (data) {
							setTimeout(function(){
								FlashService.Success(data);
								$rootScope.$apply();
							}, 100);
						});
					}
					else {
						//Show asset load error
						$translate('MESSAGES.ASSETS_TRANSFER_ERROR').then(function (data) {
							FlashService.Error(data);
						});

					}
				});
			}
		}

		loadasset($scope.symbol);

	}

	function ShowAllAssetsController(MetaverseService, $rootScope, $scope, FlashService, $translate, $stateParams){

		$scope.symbol = $stateParams.symbol;
		$scope.assets=[];
		$scope.issue = issue;

		//Load assets
		NProgress.start();
		MetaverseService.ListAllAssets()
		.then(function (response) {
			NProgress.done();
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.assets=[];
				$scope.assets = response.data.assets;

			}
			else {
				//Redirect user to the assets page
				$location.path('/asset/details/');

				//Show asset load error
				$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
					FlashService.Error(data);
				});
			}
		});

		//If asset is defined -> load it
		if($scope.symbol!=undefined && $scope.symbol!=""){
			NProgress.start();
			loadasset($scope.symbol);
		}

		function issue(symbol){
			NProgress.start();
			MetaverseService.Issue(symbol)
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success) {
					loadasset($scope.symbol);
					$translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then(function (data) {
						FlashService.Success(data);
					});
				}
				else {
					$translate('MESSAGES.ASSETS_ISSUE_ERROR').then(function (data) {
						FlashService.Error(data);
					});
				}
				NProgress.done();
			});
		}

		//Loads a given asset
		function loadasset(symbol){
			MetaverseService.GetAsset(symbol)
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.asset = response.data.assets[0];
					$scope.assets.forEach(function(a){
						if(a.symbol==symbol){
							$scope.asset.quantity=a.amount;
						}
					});
				}
				else {
					//Asset could not be loaded
					$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
						FlashService.Error(data);
					});
				}
			});
		}
	}


	function ShowAssetsController(MetaverseService, $rootScope, $scope, FlashService, $translate, $stateParams){

		$scope.symbol = $stateParams.symbol;
		$scope.assets=[];
		$scope.issue = issue;

		//Load assets
		NProgress.start();
		MetaverseService.ListAssets()
		.then(function (response) {
			NProgress.done();
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.assets=[];
				$scope.assets = response.data.assets;

			}
			else {
				//Redirect user to the assets page
				$location.path('/asset/details/');

				//Show asset load error
				$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
					FlashService.Error(data);
				});
			}
		});

		//If asset is defined -> load it
		if($scope.symbol!=undefined && $scope.symbol!=""){
			NProgress.start();
			loadasset($scope.symbol);
		}

		function issue(symbol){
			NProgress.start();
			MetaverseService.Issue(symbol)
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success) {
					loadasset($scope.symbol);
					$translate('MESSAGES.ASSETS_ISSUE_SUCCESS').then(function (data) {
						FlashService.Success(data);
					});
				}
				else {
					$translate('MESSAGES.ASSETS_ISSUE_ERROR').then(function (data) {
						FlashService.Error(data);
					});
				}
				NProgress.done();
			});
		}

		//Loads a given asset
		function loadasset(symbol){
			MetaverseService.GetAsset(symbol)
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.asset = response.data.assets[0];
					$scope.assets.forEach(function(a){
						if(a.symbol==symbol){
							$scope.asset.quantity=a.amount;
						}
					});
				}
				else {
					//Asset could not be loaded
					$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
						FlashService.Error(data);
					});
				}
			});
		}
	}

	function CreateAssetController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $location, $translate){

		//This object contains all form errors
		$scope.error={};

		//Function to create a new asset
		$scope.createasset=createasset;

		//Initialize form data
		function init(){
			$scope.symbol='';
			$scope.description='';
			$scope.max_supply='';
			$scope.password='';
		}

		//Check if the form is submittable
		function checkready(){
			//Check for errors
			for (var error in $scope.error) {
				if($scope.error[error]){
					$scope.submittable=false;
					return;
				}
			}
			$scope.submittable=true;
		}

		//Check if the max_supply is valid
		$scope.$watch('max_supply', function(newVal, oldVal){
			$scope.error.max_supply = (newVal == undefined || ! (newVal==parseInt(newVal)));
			checkready();
		});

		//Check if the symbol is valid
		$scope.$watch('symbol', function(newVal, oldVal){
			$scope.error.symbol = (newVal == undefined || !newVal.match(/^[0-9A-Za-z.]+$/));
			checkready();
		});

		//Check if the description is valid
		$scope.$watch('description', function(newVal, oldVal){
			$scope.error.description = (newVal == undefined || !(newVal.length >0));
			checkready();
		});

		//Check if the password is valid
		$scope.$watch('password', function(newVal, oldVal){
			$scope.error.password = (newVal == undefined || !(newVal.length >=6) || !(localStorageService.get('credentials').password==$scope.password));
			checkready();
		});

		//Create asset function
		function createasset(){
			if(localStorageService.get('credentials').password!=$scope.password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				NProgress.start();
				//Let Metaverse create an local asset
				MetaverseService.CreateAsset($scope.symbol, $scope.max_supply, $scope.description)
				.then(function (response) {
					NProgress.done();
					if ( typeof response.success !== 'undefined' && response.success) {
						//Redirect user to the assets page
						$location.path('/assets');
						//Show success message
						$translate('MESSAGES.ASSSET_CREATED_LOCAL_SUCCESS').then(function (data) {
							//Wait some time to make sure the user gets the message
							setTimeout(function(){
								FlashService.Success(data);
								$rootScope.$apply();
							}, 100);
						});
					}
				});
			}
		}
	}


	function AssetsController(MetaverseHelperService, MetaverseService, $rootScope, $scope, $location, $translate, FlashService) {

		$scope.assets=[];
		$scope.balance={};
		$scope.transactions=[];

		NProgress.start();

		//Load users ETP balance
		MetaverseHelperService.GetBalance(function(err, balance, message){
			if(err)
					FlashService.Error(message);
			else{
				$scope.balance = balance;
			}
		});

		MetaverseService.ListAssets()
		.then(function (response) {
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.assets = response.data.assets;
			}
			else {
				$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
					FlashService.Error(data);
				});
			}
		});

		MetaverseHelperService.LoadTransactions(function(err,transactions){
			if(err){
				$translate('MESSAGES.TRANSACTIONS_LOAD_ERROR').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				$scope.transactions=transactions;
			}
			NProgress.done();
		})

	}


	function MiningController(MetaverseService, $rootScope, $scope, FlashService, $translate) {

		$scope.start = StartMining;
		$scope.stop = StopMining;
		$scope.status={};

		function GetMiningInfo(){
		NProgress.start();
		MetaverseService.GetMiningInfo()
		.then(function (response) {
			NProgress.done();
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.status = response.data['mining-info'];
			}
			else {
				$translate('MESSAGES.MINING_STATUS_ERROR').then(function (data) {
					FlashService.Error(data);
				});
			}
		});
	}


		function StartMining(){
			NProgress.start();
			/*
			$translate('MESSAGES.FUNCTION_NOT_IMPLEMENTED').then(function (data) {
				FlashService.Error(data);
				NProgress.done();
			});
			*/
			MetaverseService.Start()
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$translate('MESSAGES.MINING_START_SUCCESS').then(function (data) {
						FlashService.Success(data);
					});
					GetMiningInfo();
				}
				else {
					$translate('MESSAGES.MINING_START_ERROR').then(function (data) {
						FlashService.Error(data);
					});
				}
			});
		}

		function StopMining(){
			NProgress.start();
			MetaverseService.Stop()
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$translate('MESSAGES.MINING_STOP_SUCCESS').then(function (data) {
						FlashService.Success(data);
					});
					GetMiningInfo();
				}
				else {
					$translate('MESSAGES.MINING_STOP_ERROR').then(function (data) {
						FlashService.Error(data);
					});
				}
			});
		}

		GetMiningInfo();

	}

	function ConsoleController(MetaverseService, $rootScope, $scope) {

		var ws = new WebSocket('ws://'+MetaverseService.SERVER+'/ws');

		ws.onmessage = function(ev) {
			NProgress.done();
			$scope.consolelog.push({query: $scope.querystring, answer: ev.data});
			$scope.querystring='';
			$scope.$apply();
			scrolldown();
		};

		$scope.querystring='';
		$scope.consolelog = [];

		function scrolldown(){
			window.setTimeout(function() {
				var elem = document.getElementById('consolelog');
				elem.scrollTop = elem.scrollHeight;
			}, 100);
		}

		$scope.query = function(){
			NProgress.start();
			ws.send($scope.querystring);
		}


	}

	function HomeController(MetaverseService, $rootScope, $scope, localStorageService) {

		var vm = this;
		vm.account = localStorageService.get('credentials').user;
		$scope.height='';
		$scope.assets=[];

		$scope.menu = {
			account : {
				show: 0
			},
			assets : {
				show: 0
			}
		};

		function updateHeight(){
			MetaverseService.FetchHeight()
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.height=response.data;
				}
			});
		}

		updateHeight();
		setInterval( function() { updateHeight();}, 10000);

		$scope.show_account_menu = function(){
			$scope.menu.account.show = 1-$scope.menu.account.show;
			$scope.menu.assets.show = 0;
		}

		$scope.show_assets_menu = function(){
			$scope.menu.assets.show = 1-$scope.menu.assets.show;
			$scope.menu.account.show = 0;
		}

	}

})();
