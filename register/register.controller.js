(function () {
  'use strict';

  angular
  .module('app')
  .controller('RegisterController', RegisterController);

  RegisterController.$inject = ['MetaverseService','$scope', '$location', '$rootScope', 'FlashService', '$translate'];
  function RegisterController(MetaverseService, $scope, $location, $rootScope, FlashService, $translate) {
    var vm = this;

    vm.register = register;
    vm.user={
      username: ''
    };

    function register() {
      NProgress.start();
      setTimeout(function () {
        NProgress.done();
      }, 500);
      if(vm.user.username==undefined || vm.user.username==''){
        $translate('MESSAGES.NO_ACCOUNTNAME_PROVIDED').then(function (data) {
          FlashService.Error(data);
        });
        return;
      }
      else if(vm.user.password==undefined){
        $translate('MESSAGES.NO_PASSWORD_PROVIDED').then(function (data) {
          FlashService.Error(data);
        });
        return;
      }
      else if(vm.user.password.length<6){
        $translate('MESSAGES.PASSWORD_SHORT').then(function (data) {
          FlashService.Error(data);
        });
        return;
      }
      else if(vm.user.password_repeat!=vm.user.password){
        $translate('MESSAGES.PASSWORD_NOT_MATCH').then(function (data) {
          FlashService.Error(data);
        });
        return;
      }
      if($scope.do_import){ //Import account from phrase
        MetaverseService.ImportAccount(vm.user.username, vm.user.password, $scope.import_phrase, $scope.address_count)
        .then(function (response) {
          if ( typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.IMPORT_SUCCESS').then(function (data) {
              FlashService.Success(data);
            });
            $location.path('/login');
          } else {
            $translate('MESSAGES.IMPORT_ERROR').then(function (data) {
              FlashService.Error(data);
            });
          }
        });
      }
      else{ //Create a new account
        MetaverseService.GetNewAccount(vm.user.username, vm.user.password)
        .then(function (response) {
          if ( typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.REGISTARTION_SUCCESS').then(function (data) {
              FlashService.Success(data);
            });
            vm.registered = {
              "privatekey" : response.data.mnemonic,
              "address" : response.data['default-address']
            }
            //$location.path('/login');
          } else {
            FlashService.Error(response.message);
          }
        });
      }


    }
  }

})();
