(function() {
    'use strict';

    angular.module('app', ['ui.router', 'ngCookies', 'LocalStorageModule', 'pascalprecht.translate', 'angularUtils.directives.dirPagination', 'ngDialog', 'ngFileSaver'])
        .config(config)
        .filter('assetformat',function(){
            return function(input, asset_type){
                if(typeof asset_type === 'undefined')
                    asset_type=8;
                return bigDecimal.getPrettyValue(bigDecimal.divide(input, Math.pow(10,asset_type), parseInt(asset_type)));
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

            .state('home.account.export', {
                url: "/account/export",
                templateUrl: "home/account/export.view.html",
                controller: 'AccountController',
                controllerAs: 'vm'
            })

            .state('home.addresses', {
                templateUrl: "home/addresses/index.view.html",
                controller: 'AddressesController'
            })

            .state('home.addresses.myaddresses', {
                url: "/addresses/myaddresses",
                templateUrl: "home/addresses/myaddresses.view.html",
                controller: 'AddressesController',
                controllerAs: 'vm'
            })

            /*.state('home.addresses.multisigaddresses', {
                url: "/addresses/multisignatureaddresses",
                templateUrl: "home/addresses/multisigaddresses.view.html",
                controller: 'AddressesController',
                controllerAs: 'vm'
            })*/

            .state('home.home', {
                url: "/home",
                templateUrl: "home/home.view.html",
                controller: 'AssetsController',
                controllerAs: 'vm'
            })

            .state('home.explorer', {
                templateUrl: "home/explorer/index.view.html",
                controller: 'ExplorerController'
            })

            .state('home.explorer.search', {
                url: "/explorer/search/:search",
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

            .state('home.asset.myassets', {
                url: "/asset/myassets",
                templateUrl: "home/assets/myassets.view.html",
                controller: 'ShowAssetsController',
                controllerAs: 'vm'
            })

            .state('home.asset.details', {
                url: "/asset/details/:symbol",
                templateUrl: "home/assets/details.view.html",
                controller: 'AssetDetailController',
                controllerAs: 'vm'
            })

            .state('home.asset.secondaryissue', {
                url: "/asset/secondaryissue/:symbol",
                templateUrl: "home/assets/secondaryissue.view.html",
                controller: 'AssetSecondaryIssueController',
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

            .state('home.multisignature', {
                url: "/transfer/multisignature",
                templateUrl: "home/transfer/multisignature.view.html",
                controller: 'TransferMultiSignController',
                controllerAs: 'vm'
            })

            .state('home.sign', {
                url: "/transfer/sign",
                templateUrl: "home/transfer/sign.view.html",
                controller: 'SignMultiSignController',
                controllerAs: 'vm'
            })

            .state('home.createmultisignature', {
                url: "/addresses/newmultisignature",
                templateUrl: "home/addresses/createmultisignature.view.html",
                controller: 'NewMultiSignController',
                controllerAs: 'vm'
            })

            .state('home.deposit', {
                url: "/deposit/:symbol",
                templateUrl: "home/deposit.view.html",
                controller: 'DepositController',
                controllerAs: 'vm'
            })

            .state('home.console', {
                url: "/advanced",
                templateUrl: "home/console.view.html",
                controller: 'ConsoleController'
            })

            .state('home.profile', {
                templateUrl: "home/avatar/index.view.html",
                controller: 'ProfileController'
            })

            .state('home.profile.myprofile', {
                url: "/avatar/myavatars",
                templateUrl: "home/avatar/myavatars.view.html",
                controller: 'ProfileController'
            })

            .state('home.profile.create', {
                url: "/avatar/create",
                templateUrl: "home/avatar/create.view.html",
                controller: 'CreateProfileController'
            })

            .state('home.profile.all', {
                url: "/avatar/all",
                templateUrl: "home/avatar/all.view.html",
                controller: 'AllProfilesController'
            })

            .state('home.profile.modifyaddress', {
                url: "/avatar/modifyaddress/:didsymbol",
                templateUrl: "home/avatar/modifyaddress.view.html",
                controller: 'ModifyAddressController'
            })

            .state('home.profile.transfercert', {
                url: "/avatar/transfercert/:symboltype",
                templateUrl: "home/avatar/transfercert.view.html",
                controller: 'TransferCertController'
            })

            .state('home.profile.issuecert', {
                url: "/avatar/issuecert/:symbol",
                templateUrl: "home/avatar/issuecert.view.html",
                controller: 'IssueCertController'
            })

        $urlRouterProvider.otherwise("/login");
    };

    run.$inject = ['$rootScope', '$location', 'localStorageService', '$translate', 'FileSaver', 'Blob'];

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
