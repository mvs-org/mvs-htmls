(function() {
	'use strict';

	angular.module('app')
	.controller('HomeController', HomeController)
	.controller('ConsoleController', ConsoleController)
	.controller('AccountController', AccountController)
	.controller('AssetController', AssetController)
	.controller('CreateAssetController', CreateAssetController)
	.controller('AssetsController', AssetsController)
	.controller('ShowAssetsController', ShowAssetsController)
	.controller('ETPController', ETPController)
	.controller('MiningController', MiningController);

	function ETPController(MetaverseService, $rootScope, $scope, FlashService, localStorageService, $translate) {

		$scope.transfer=transfer;

		function init(){
			$scope.sendfrom='';
			$scope.sendto='';
			$scope.fee='';
			$scope.message='';
			$scope.value='';
			$scope.password='';
		}

		function transfer(){

			if($scope.sendfrom != '' || $scope.fee != '' || $scope.message != ''){
				FlashService.Error('Sorry. Only basic transfer works so far.');
			}
			else if($scope.password==''){
				$translate('MESSAGES.PASSWORD_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.sendto==''){
				$translate('MESSAGES.TRANSACTION_RECIPENT_ADDRESS_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else if($scope.value==''){
				$translate('MESSAGES.TRANSACTION_VALUE_NEEDED').then(function (data) {
					FlashService.Error(data);
				});
			}
			else{
				if(localStorageService.get('credentials').password!=$scope.password){
					$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
						FlashService.Error(data);
					});
				}
				else{
					NProgress.start();
					MetaverseService.Send($scope.sendto, $scope.value, $scope.password)
					.then(function (response) {
						NProgress.done();
						if ( typeof response.success !== 'undefined' && response.success) {
							$translate('MESSAGES.TRANSFER_SUCCESS').then(function (data) {
								FlashService.Success(data);
							});
							init();
						}
						else {
							$translate('MESSAGES.TRANSFER_ERROR').then(function (data) {
								FlashService.Error(data);
							});
							$scope.password='';
						}
					});
				}
			}
		}

		init();

	}

	function AccountController(MetaverseService, $translate, $rootScope, $scope, FlashService, $location, localStorageService) {

		$scope.addresses = [];
		$scope.getnewaddress = getnewaddress;
		$scope.showprivatekey = showprivatekey;
		$scope.accountname = localStorageService.get('credentials').user;

		$scope.showqr = showqr;


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

		function listBalances(){
			MetaverseService.ListBalances()
			.then(function (response) {
				if ( typeof response.success !== 'undefined' && response.success) {
					$scope.addresses = response.data.balances;
				}
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

	function AssetController(MetaverseService, $rootScope, $scope, $location) {



	}

	function ShowAssetsController(MetaverseService, $rootScope, $scope, FlashService, $translate, $stateParams){

		$scope.symbol = $stateParams.symbol;

		$scope.assets=[];

		//Load assets
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

		if($scope.symbol!=undefined){

			NProgress.start();
			MetaverseService.GetAsset($scope.symbol)
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
			$scope.issueaddress='';
			$scope.password='';
		}


		$scope.createasset=createasset;

		function createasset(){
			if(localStorageService.get('credentials').password!=$scope.password){
				$translate('MESSAGES.WRONG_PASSWORD').then(function (data) {
  				FlashService.Error(data);
				});
			}
			NProgress.start();
			MetaverseService.CreateAsset($scope.symbol, $scope.max_supply, $scope.description, $scope.address)
			.then(function (response) {
				NProgress.done();
				if ( typeof response.success !== 'undefined' && response.success) {
					//Redirect user to the assets page
					$location.path('/asset/details/');

					$translate('MESSAGES.ASSSET_CREATED_LOCAL_SUCCESS').then(function (data) {
	  				FlashService.Success(data);
					});
				}
			});
		}
	}


	function AssetsController(MetaverseService, $rootScope, $scope, $location, $translate) {

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
