(function () {
    'use strict';

    angular
        .module('app')
        .factory('FlashService', FlashService);

    FlashService.$inject = ['$rootScope'];
    function FlashService($rootScope) {
        var service = {};

        service.Success = Success;
        service.Error = Error;
        service.Info = Info;
        service.CloseFlashMessage = CloseFlashMessage;

        initService();

        return service;

        function initService() {
            $rootScope.$on('$locationChangeStart', function () {
                clearFlashMessage();
            });

            function clearFlashMessage() {
                var flash = $rootScope.flash;
                if (flash) {
                    if (!flash.keepAfterLocationChange) {
                        delete $rootScope.flash;
                    } else {
                        // only keep for a single location change
                        flash.keepAfterLocationChange = false;
                    }
                }
            }
        }

        function CloseFlashMessage() {
            delete $rootScope.flash;
        }

        function Success(message, keepAfterLocationChange, hash) {
            $rootScope.flash = {
                message: message,
                type: 'success',
                keepAfterLocationChange: keepAfterLocationChange,
                hash: hash
            };
        }

        function Error(message, keepAfterLocationChange, hash) {
            $rootScope.flash = {
                message: message,
                type: 'error',
                keepAfterLocationChange: keepAfterLocationChange,
                hash: hash
            };
        }

        function Info(message, keepAfterLocationChange, hash) {
            $rootScope.flash = {
                message: message,
                type: 'info',
                keepAfterLocationChange: keepAfterLocationChange,
                hash: hash
            };
        }
    }

})();
