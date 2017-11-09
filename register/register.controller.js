(function () {
  'use strict';

  angular
  .module('app')
  .controller('RegisterController', RegisterController);

  RegisterController.$inject = ['MetaverseService', '$scope', '$interval', '$location', 'localStorageService', '$rootScope', 'FlashService', '$translate', '$window'];

  function RegisterController(MetaverseService, $scope, $interval, $location, localStorageService, $rootScope, FlashService, $translate, $window) {
    var vm = this;

    vm.register = register;
    vm.user={
      username: ''
    };

    vm.changeLang = (key) => $translate.use(key)
        .then(  (key) => localStorageService.set('language',key) )
        .catch( (error) => console.log("Cannot change language.") );

    vm.height = '';

    function updateHeight() {
      MetaverseService.FetchHeight()
      .then( (response) => {
        if (typeof response.success !== 'undefined' && response.success) {
          vm.height = response.data;
        }
      });
    }

    updateHeight();
    $interval( () => updateHeight(), 10000);

    function register() {
      NProgress.start();
      setTimeout( () => NProgress.done() , 500);
      if((vm.user.username==undefined || vm.user.username=='') && !$scope.import_from_file) {
        $translate('MESSAGES.NO_ACCOUNTNAME_PROVIDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
        return;
      }
      else if(vm.user.password==undefined){
        $translate('MESSAGES.NO_PASSWORD_PROVIDED').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
        return;
      }
      else if(vm.user.password.length<6){
        $translate('MESSAGES.PASSWORD_SHORT').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
        return;
      }
      else if((vm.user.password_repeat!=vm.user.password) && !$scope.import_from_file && !$scope.import_from_phrase){
        $translate('MESSAGES.PASSWORD_NOT_MATCH').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
        return;
      }
      else if(vm.user.username.indexOf(" ") != -1){
        $translate('MESSAGES.USERNAME_CONTAINS_SPACE').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
        return;
      }
      else if(vm.user.password.indexOf(" ") != -1){
        $translate('MESSAGES.PASSWORD_CONTAINS_SPACE').then( (data) => FlashService.Error(data) );
        $window.scrollTo(0,0);
        return;
      }
      if($scope.import_from_phrase){ //Import account from phrase
        if($scope.import_phrase == undefined){
          $translate('MESSAGES.NO_PHRASE').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
          return;
        } else if($scope.address_count == undefined){
          $translate('MESSAGES.NO_ADDRESS_NBR').then( (data) => FlashService.Error(data) );
          $window.scrollTo(0,0);
          return;
        } else {
          //Remove the Enter key from the phrase
          var re = /(\r\n|\n|\r)/gm;
          var phraseToSend = $scope.import_phrase.replace(re," ");
          phraseToSend = phraseToSend.replace("  "," ");

          //Check if the key contains special characters
          var occurences = phraseToSend.match(/[a-z]|[A-Z]| /g);
          if(phraseToSend.length != occurences.length){
            $translate('MESSAGE.WRONG_PRIVATE_KEY').then( (data) => FlashService.Error(data) );
            $window.scrollTo(0,0);
            return;
          } else {
            MetaverseService.ImportAccount(vm.user.username, vm.user.password, phraseToSend, $scope.address_count)
            .then(function (response) {
              if (typeof response.success !== 'undefined' && response.success) {
                  $translate('MESSAGES.IMPORT_SUCCESS').then( (data) => {
                      FlashService.Success(data,true);
                      $window.scrollTo(0,0);
                      $location.path('/login');
                  });
              } else {
                $translate('MESSAGES.IMPORT_ERROR').then( (data) => {
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
        }
      } else if($scope.import_from_file){ //Import account from file
        //MetaverseService.ImportAccountFromFile($scope.accountInfo, vm.user.password)
        //.then(function (response) {
        MetaverseService.ImportAccountFromFile($scope.path, vm.user.password)
        .then(function (response) {
          if (typeof response.success !== 'undefined' && response.success) {
              $translate('MESSAGES.IMPORT_SUCCESS').then( (data) => {
                  FlashService.Success(data,true);
                  $location.path('/login');
              });
          } else {
            $translate('MESSAGES.IMPORT_ERROR').then( (data) => {
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

      } else { //Create a new account
        MetaverseService.GetNewAccount(vm.user.username, vm.user.password)
        .then( (response) => {
          if ( typeof response.success !== 'undefined' && response.success) {
            $translate('MESSAGES.REGISTARTION_SUCCESS').then( (data) => FlashService.Success(data) );
            $window.scrollTo(0,0);
            vm.registered = {
              "privatekey" : response.data.mnemonic,
              "address" : response.data['default-address']
            };
          } else {
            FlashService.Error(response.message);
            $window.scrollTo(0,0);
          }
        });
      }
    }
  }

})();
