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
	.controller('ETPController', ETPController)
	.controller('MiningController', MiningController);

	function ETPController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $translate) {

		$scope.transfer=transfer;

		// Initializes all transaction parameters with empty strings.
		function init(){
			$scope.sendfrom='';
			$scope.sendto='';
			$scope.fee='';
			$scope.message='';
			$scope.value='';
			$scope.password='';
		}

		//Transfers ETP
		function transfer(){
			//Check for unimplemented parameters
			if($scope.sendfrom != '' || $scope.fee != '' || $scope.message != ''){
				FlashService.Error('Sorry. Only basic transfer works so far.');
			}
			else if($scope.password==''){ //Check for empty password
				$translate('MESSAGES.PASSWORD_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.sendto==''){ //Check for recipent address
				$translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.value==''){ //Check for transaction value
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
					MetaverseService.Send($scope.sendto, $scope.value, $scope.password)
					.then(function (response) {
						NProgress.done();
						if ( typeof response.success !== 'undefined' && response.success) {
							//Transaction was successful
							$translate('MESSAGES.TRANSFER_SUCCESS').then(function (data) {
								FlashService.Success(data);
							});
							init();
						}
						else {
							//Transaction problem
							$translate('MESSAGES.TRANSFER_ERROR').then(function (data) {
								FlashService.Error(data);
							});
							$scope.password='';
						}
					});
				}
			}
		}

		//Initialize
		init();

	}

	function AccountController(MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService) {

		$scope.addresses = [];
		$scope.getnewaddress = getnewaddress;
		$scope.showprivatekey = showprivatekey;
		$scope.accountname = localStorageService.get('credentials').user;

		$scope.showqr = showqr;

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
					$scope.addresses = response.data.balances;
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

		function showprivatekey(password){
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
				$scope.privatekey="Here you will see your private key very soon!";
			}
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
					//$location.path('/asset/details/');
					console.log(response);

					$translate('MESSAGES.ASSETS_TRANSFER_SUCCESS').then(function (data) {
	  				FlashService.Success(data);
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

		function loadasset(symbol){
			MetaverseService.GetAsset(symbol)
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.asset = response.data.assets[0];
				}
				else {
					$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
	  				FlashService.Error(data);
					});
				}
			});
		}



	}

	function CreateAssetController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $location, $translate){


		function init(){
			$scope.symbol='';
			$scope.description='';
			$scope.max_supply='';
			$scope.password='';
		}

		function checkready(){
			for (var error in $scope.error) {
				if($scope.error[error]){
					$scope.submittable=false;
					return;
				}
			}
			$scope.submittable=true;
		}

		$scope.error={};

		$scope.createasset=createasset;

		$scope.$watch('max_supply', function(newVal, oldVal){
			$scope.error.max_supply = (newVal == undefined || ! (newVal==parseInt(newVal)));
			checkready();
  	});

		$scope.$watch('symbol', function(newVal, oldVal){
			$scope.error.symbol = (newVal == undefined || !newVal.match(/^[0-9A-Za-z.]+$/));
			checkready();
  	});

		$scope.$watch('description', function(newVal, oldVal){
			$scope.error.description = (newVal == undefined || !(newVal.length >0));
			checkready();
  	});



		function createasset(){
			if(localStorageService.get('credentials').password!=$scope.password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
  				FlashService.Error(data);
				});
			}
			else{
			NProgress.start();
			MetaverseService.CreateAsset($scope.symbol, $scope.max_supply, $scope.description, $scope.address)
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					
					//Redirect user to the assets page
					$location.path('/assets');

					$translate('MESSAGES.ASSSET_CREATED_LOCAL_SUCCESS').then(function (data) {

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


	function AssetsController(MetaverseService, $rootScope, $scope, $location, $translate, FlashService) {

		$scope.assets=[];
		$scope.balance={};

		MetaverseService.GetBalance()
		.then(function (response) {
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.balance = response.data;
			}
		});



		NProgress.start();
		MetaverseService.ListAssets()
		.then(function (response) {
			NProgress.done();
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.assets = response.data.assets;
			}
			else {
				$translate('MESSAGES.ASSETS_LOAD_ERROR').then(function (data) {
  				FlashService.Error(data);
				});
			}
		});

	}


	function MiningController(MetaverseService, $rootScope, $scope, FlashService, $translate) {

		$scope.start = function(){
			NProgress.start();
			$translate('MESSAGES.FUNCTION_NOT_IMPLEMENTED').then(function (data) {
				FlashService.Error(data);
				NProgress.done();
			});
			/*
			MetaverseService.Start()
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$translate('MESSAGES.MINING_START_SUCCESS').then(function (data) {
	  				FlashService.Success(data);
					});
				}
				else {
					$translate('MESSAGES.MINING_START_ERROR').then(function (data) {
	  				FlashService.Error(data);
					});
				}
			});
			*/
		}

		$scope.stop = function(){
			NProgress.start();
			MetaverseService.Stop()
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					$translate('MESSAGES.MINING_STOP_SUCCESS').then(function (data) {
	  				FlashService.Success(data);
					});
				}
				else {
					$translate('MESSAGES.MINING_STOP_ERROR').then(function (data) {
	  				FlashService.Error(data);
					});
				}
			});
		}

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

		MetaverseService.FetchHeight()
		.then(function (response) {
			if ( typeof response.success !== 'undefined' && response.success) {
				$scope.height=response.data;
			}
		});

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
