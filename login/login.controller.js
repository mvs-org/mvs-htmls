(function () {
    'use strict';

    angular
        .module('app')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$location', 'MetaverseService', '$rootScope', 'FlashService','localStorageService', '$interval', '$translate', '$window', '$http'];

    function LoginController($location, MetaverseService, $rootScope, FlashService, localStorageService, $interval, $translate, $window, $http) {
        var vm = this;

        vm.login = login;

        (function initController() {
            // reset login status
            localStorageService.remove('credentials');
        })();

        vm.changeLang = (key) => $translate.use(key)
            .then(  (key) => localStorageService.set('language',key) )
            .catch( (error) => console.log("Cannot change language.") );

        vm.height = '';

        vm.getHeightFromExplorer = getHeightFromExplorer;
        vm.heightFromExplorer = 0;
        vm.loadingPercent = 0;

        vm.popoverSynchShown = false;

        vm.version = "";
        vm.peers = "";

        MetaverseService.GetInfoV2()
        .then( (response) => {
          if (typeof response.success !== 'undefined' && response.success) {
            vm.height = response.data.result.height;
            $rootScope.network = response.data.result.testnet ? 'testnet' : 'mainnet';
            vm.version = response.data.result['wallet-version'];
            vm.peers = response.data.result.peers;
          }
        })
        .then(() => getHeightFromExplorer())
        .then(() => vm.loadingPercent = Math.floor(vm.height/vm.heightFromExplorer*100));

        function getHeightFromExplorer() {
          let url = $rootScope.network == 'testnet' ? 'https://explorer-testnet.mvs.org/api/height' : 'https://explorer.mvs.org/api/height'
          $http.get(url)
            .then((response)=>{
              if(!vm.popoverSynchShown) {
                $(function () { $('.popover-show').popover('show');});
                vm.popoverSynchShown = true;
              }
              vm.heightFromExplorer = response.data.result;
              vm.loadingPercent = Math.floor(vm.height/vm.heightFromExplorer*100);
            })
            .catch( (error) => console.log("Cannot get Height from explorer") );
        }

        function updateHeight() {
          if(vm.heightFromExplorer == 0)
              vm.getHeightFromExplorer();
          MetaverseService.GetInfo()
          .then( (response) => {
            if (typeof response.success !== 'undefined' && response.success) {
              vm.height = response.data.height;
              vm.loadingPercent = Math.floor(vm.height/vm.heightFromExplorer*100);
              vm.peers = response.data.peers;
            }
          });
        }

        updateHeight();
        $interval( () => updateHeight(), 10000);


        function login() {
            //Show loading
            NProgress.start();
            //Check login data
            MetaverseService.CheckAccount(vm.username, vm.password)
      	        .then( (response) => {
      	            if ( typeof response.success !== 'undefined' && response.success && response.data != undefined) {
                       //Success
                          //Save user login credentials
                          localStorageService.set('credentials', {
                              user: vm.username,
                              password: vm.password
                          });
                          setTimeout(  () => NProgress.done(), 500);
                          //Redirect user to home
                          $location.path('/home');
                      } else {
                          //Show login error message
                          setTimeout( () => NProgress.done(), 1000);
                          $translate('MESSAGES.LOGIN_WRONG_CREDENTIALS').then( (data) => FlashService.Error(data) );
                          $window.scrollTo(0,0);
                      }

      	        })
                .catch( ()=> {
                  setTimeout( () =>  NProgress.done(), 500 );
                  //Show login error message
                  $translate('MESSAGES.GENERAL_CONNECTION_ERROR').then( (data) => FlashService.Error(data) );
                  $window.scrollTo(0,0);
                }
              );
        };
    }
})();
