(function() {
    'use strict';

    angular.module('app', ['ui.router', 'ngCookies', 'LocalStorageModule', 'pascalprecht.translate', 'angularUtils.directives.dirPagination'])
        .config(config)
  	    .filter('assetformat',function(){
			      return function(input, asset_type){
                if(typeof asset_type === 'undefined')
                    asset_type=8;
                return parseFloat(input)/Math.pow(10,asset_type);
            };
        })
        .config(['$compileProvider', function($compileProvider) {
            //$compileProvider.debugInfoEnabled(false);
        }])
        .config(function(localStorageServiceProvider) {
            localStorageServiceProvider
                .setPrefix('mvs.live');
        }).config(function($translateProvider) {
            $translateProvider.useStaticFilesLoader({
                prefix: 'lang/',
                suffix: '.json'
            });
            $translateProvider.registerAvailableLanguageKeys(['en', 'de', 'zh'], {
                'en-US': 'en',
                'en-UK': 'en',
                'de-DE': 'de',
                'zh-ZH': 'zh'
            });
            $translateProvider.useSanitizeValueStrategy('escapeParameters');
            $translateProvider.preferredLanguage('zh_ZH');
        })
        .constant('appName', 'Metaverse')
        .run(run);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];

    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('login', {
                url: "/login",
                templateUrl: "login/login.view.html",
                controller: 'LoginController',
                controllerAs: 'vm'
            })

            .state('register', {
                url: "/register",
                templateUrl: "register/register.view.html",
                controller: 'RegisterController',
                controllerAs: 'vm'
            })

            .state('home', {
                abstract: true,
                templateUrl: "home/index.view.html",
                controller: 'HomeController',
                controllerAs: 'vm'
            })

            .state('home.account', {
                abstract: true,
                templateUrl: "home/account/index.view.html",
                controller: 'AccountController',
                controllerAs: 'vm'
            })

            .state('home.account.details', {
                url: "/account/details",
                templateUrl: "home/account/details.view.html",
                controller: 'AccountController',
                controllerAs: 'vm'
            })

            .state('home.account.privatekey', {
                url: "/account/privatekey",
                templateUrl: "home/account/privatekey.view.html",
                controller: 'AccountController',
                controllerAs: 'vm'
            })

            .state('home.addresses', {
                url: "/home/addresses",
                templateUrl: "home/addresses.view.html",
                controller: 'AddressesController',
                controllerAs: 'vm'
            })


            .state('home.assets', {
                url: "/home",
                templateUrl: "home/assets.view.html",
                controller: 'AssetsController',
                controllerAs: 'vm'
            })

            .state('home.explorer', {
                templateUrl: "home/explorer/index.view.html",
                controller: 'ExplorerController'
            })

            .state('home.explorer.search', {
                url: "/explorer",
                templateUrl: "home/explorer/search.view.html",
                controller: 'ExplorerController'
            })

            .state('home.explorer.transaction', {
                url: "/explorer/tx/:hash",
                templateUrl: "home/explorer/transaction.view.html",
                controller: 'ExplorerController'
            })

            .state('home.explorer.address', {
                url: "/explorer/adr/:address",
                templateUrl: "home/explorer/address.view.html",
                controller: 'ExplorerController'
            })

            .state('home.explorer.block', {
                url: "/explorer/blk/:block",
                templateUrl: "home/explorer/block.view.html",
                controller: 'ExplorerController'
            })

            .state('home.explorer.noresult', {
                url: "/explorer/noresult/:search",
                templateUrl: "home/explorer/noresult.view.html",
                controller: 'ExplorerController'
            })

            .state('home.asset', {
                abstract: true,
                templateUrl: "home/assets/index.view.html"
            })

            .state('home.asset.alldetails', {
                url: "/asset/all",
                templateUrl: "home/assets/all.view.html",
                controller: 'ShowAllAssetsController',
                controllerAs: 'vm'
            })

            .state('home.asset.details', {
                url: "/asset/details/:symbol",
                templateUrl: "home/assets/details.view.html",
                controller: 'ShowAssetsController',
                controllerAs: 'vm'
            })

            .state('home.asset.create', {
                url: "/asset/create",
                templateUrl: "home/assets/create.view.html",
                controller: 'CreateAssetController',
                controllerAs: 'vm'
            })

            .state('home.transferasset', {
                url: "/transfer/:symbol/:sender_address",
                templateUrl: "home/transfer/transferasset.view.html",
                controller: 'TransferAssetController',
                controllerAs: 'vm'
            })

            .state('home.transferetp', {
                url: "/transfer/ETP",
                templateUrl: "home/transfer/transferetp.view.html",
                controller: 'ETPController',
                controllerAs: 'vm'
            })

            /*.state('home.multisignature', {
                url: "/transfer/multisignature",
                templateUrl: "home/transfer/multisignature.view.html",
                controller: 'ETPMultiSignController',
                controllerAs: 'vm'
            })

            .state('home.createmultisignature', {
                url: "/transfer/newmultisignature",
                templateUrl: "home/transfer/createmultisignature.view.html",
                controller: 'ETPMultiSignController',
                controllerAs: 'vm'
            })*/

            .state('home.deposit', {
                url: "/deposit",
                templateUrl: "home/deposit.view.html",
                controller: 'DepositController',
                controllerAs: 'vm'
            })

            .state('home.mining', {
                url: "/mining",
                templateUrl: "home/mining.view.html",
                controller: 'MiningController'
            })

            .state('home.console', {
                url: "/console",
                templateUrl: "home/console.view.html",
                controller: 'ConsoleController'
            });
        $urlRouterProvider.otherwise("/login");
    };

    run.$inject = ['$rootScope', '$location', 'localStorageService', '$translate'];

    function run($rootScope, $location, $localStorageService, $translate) {

        if ($localStorageService.get('language') != undefined) {
            $translate.use($localStorageService.get('language'));
        }

        $rootScope.$on('$locationChangeStart', function(event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = (['/login', '/register'].indexOf($location.path()) === -1);
            var loggedIn = $localStorageService.get('credentials') != undefined;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        });
    }

})();
