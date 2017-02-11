(function () {
    'use strict';

    angular.module('app', ['angulartics','angulartics.piwik','ui.router','ngCookies','LocalStorageModule', 'pascalprecht.translate'])
        .config(config)
        .config(['$compileProvider', function ($compileProvider) {
            //$compileProvider.debugInfoEnabled(false);
          }])
        .config(function (localStorageServiceProvider) {
          localStorageServiceProvider
          .setPrefix('mvs.live');
        }).config(function ($translateProvider) {
            $translateProvider.useStaticFilesLoader({
              prefix: 'lang/',
              suffix: '.json'
            });
            $translateProvider.registerAvailableLanguageKeys(['en', 'de', 'zh'], {
                'en-US': 'en',
                'en-UK': 'en',
                'de-DE': 'de',
                'zh-ZH': 'zh',
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

    .state('reset', {
      url: "/reset",
      templateUrl: "login/reset.view.html",
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

    .state('home.account.addresses', {
      url: "/account/addresses",
      templateUrl: "home/account/addresses.view.html",
      controller: 'AccountController',
      controllerAs: 'vm'
    })


    .state('home.assets', {
      url: "/assets",
      templateUrl: "home/assets.view.html",
      controller: 'AssetsController',
      controllerAs: 'vm'
    })

    .state('home.explorer', {
      url: "/explorer",
      templateUrl: "home/explorer.view.html",
      controller: 'ExplorerController',
      controllerAs: 'vm'
    })

    .state('home.asset', {
      abstract: true,
      templateUrl: "home/assets/index.view.html"
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

    .state('home.asset.transfer', {
      url: "/asset/transfer/:symbol/:sender_address",
      templateUrl: "home/assets/transfer.view.html",
      controller: 'TransferAssetController',
      controllerAs: 'vm'
    })

    .state('home.transfer', {
      url: "/transfer",
      templateUrl: "home/transfer.view.html",
      controller: 'ETPController',
      controllerAs: 'vm'
    })

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
    })
    ;
    $urlRouterProvider.otherwise("/login");
};

    run.$inject = ['$rootScope', '$location', 'localStorageService', '$translate'];
    function run($rootScope, $location, $localStorageService, $translate) {

      if($localStorageService.get('language') != undefined){
        $translate.use($localStorageService.get('language'));
      }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = (['/login', '/register', '/reset'].indexOf($location.path()) === -1);
            var loggedIn = $localStorageService.get('credentials') != undefined ;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        });
    }

})();
