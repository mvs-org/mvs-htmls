(function () {
    'use strict';

    angular
        .module('app')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$location', 'MetaverseService', 'FlashService','localStorageService', '$translate'];
    function LoginController($location, MetaverseService, FlashService, localStorageService, $translate) {
        var vm = this;

        vm.login = login;

        (function initController() {

            // reset login status
            localStorageService.remove('credentials');

        })();


        vm.changeLang = function (key) {
    			$translate.use(key).then(function (key) {
    				localStorageService.set('language',key);
    			}, function (key) {
    				console.log("Cannot change language.");
    			});
    		};



        function login() {

            //Show loading
            NProgress.start();

            //Check login data
            MetaverseService.CheckAccount(vm.username, vm.password)
      	        .then(function (response) {
      	            if ( typeof response.success !== 'undefined' && response.success && response.data != undefined) {
                       //Success

                          //Save user login credentials
                          localStorageService.set('credentials', {
                              user: vm.username,
                              password: vm.password
                          });
                          setTimeout(function () {
                            NProgress.done();
                          }, 500);

                          //Redirect user to home
                          $location.path('/assets');

                      } else {
                          //Show login error message
                          setTimeout(function () {
                            NProgress.done();
                          }, 1000);
                          $translate('MESSAGES.LOGIN_WRONG_CREDENTIALS').then(function (data) {
                    				FlashService.Error(data);
                  				});
                      }


      	        },
                function(){

                  setTimeout(function () {
                    NProgress.done();
                  }, 500);

                  //Show login error message
                  $translate('MESSAGES.GENERAL_CONNECTION_ERROR').then(function (data) {
                    FlashService.Error(data);
                  });

                }
              );
        };


    }

})();
