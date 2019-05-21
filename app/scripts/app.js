'use strict';

/**
 * @ngdoc overview
 * @name actualApp
 * @description
 * # actualApp
 *
 * Main module of the application.
 */
angular
  .module('actualApp', [
    'ngAnimate',
    'ngStorage',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMaterial',
    'slick',
    'LocalStorageModule',
    'angular-jwt',
    'datatables',
    'chart.js',
    'ezplus',
    'pikaday',
    'ui.timepicker',
    'ngFileUpload',
    'sly',
    'infinite-scroll',
    'ngPhotoswipe',
    'ui.utils.masks',
    'localytics.directives',
    'ng-currency',
    'angular-google-analytics',
    'envconfig'
  ])

  .config(function (
    $routeProvider,
    $httpProvider,
    $locationProvider,
    $mdThemingProvider,
    localStorageServiceProvider,
    pikadayConfigProvider,
    AnalyticsProvider,
    ENV
  ) {

    AnalyticsProvider.setAccount('UA-101469133-1');  //UU-XXXXXXX-X should be your tracking code

    $mdThemingProvider.theme('default')
      .accentPalette('red', {
        'default': '700' // use shade 200 for default, and keep all other shades the same
      });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');

    $routeProvider
      .when('/', {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl',
        controllerAs: 'vm',
        resolve: {
          activeStore: function($rootScope, $q, authService){
            if(!authService.isUserSignedIn()){
              return $q.resolve(false);
            }
            if($rootScope.activeStore){
              return $q.resolve($rootScope.activeStore);
            }else{
              var deferred = $q.defer();
              $rootScope.$on('activeStoreAssigned', function(ev, _activeStore){
                deferred.resolve(_activeStore);
              });
              return deferred.promise;
            }
          }
        }
      })
      .when('/category/:category', {
        templateUrl: 'views/category.html',
        controller: 'CategoryCtrl',
        controllerAs: 'vm'
      })
      .when('/product/:id', {
        templateUrl: 'views/product.html',
        controller: 'ProductCtrl',
        controllerAs: 'vm',
        resolve: {
          activeStore: function($rootScope, $q){
            if($rootScope.activeStore){
              return $q.resolve($rootScope.activeStore);
            }else{
              var deferred = $q.defer();
              $rootScope.$on('activeStoreAssigned', function(ev, _activeStore){
                deferred.resolve(_activeStore);
              });
              return deferred.promise;
            }
          }
        }                
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl',
        controllerAs: 'vm',
        resolve: {
          activeStore: function($rootScope, $q){
            if($rootScope.activeStore){
              return $q.resolve($rootScope.activeStore);
            }else{
              var deferred = $q.defer();
              $rootScope.$on('activeStoreAssigned', function(ev, _activeStore){
                deferred.resolve(_activeStore);
              });
              return deferred.promise;
            }
          }
        }                        
      })
      .when('/servicios', {
        templateUrl: 'views/sr-services.html',
        controller: 'SrServicesCtrl',
        controllerAs: 'vm'
      })      
      .when('/addquotation', {
        templateUrl: 'views/addquotation.html',
        controller: 'AddquotationCtrl',
        controllerAs: 'vm'
      })
      .when('/clients/create', {
        templateUrl: 'views/clients/create.html',
        controller: 'ClientCreateCtrl',
        controllerAs: 'vm'
      })
      .when('/clients/profile/:id', {
        templateUrl: 'views/clients/profile.html',
        controller: 'ClientProfileCtrl',
        controllerAs: 'vm'
      })
      .when('/clients/list', {
        templateUrl: 'views/clients/list.html',
        controller: 'ClientsListCtrl',
        controllerAs: 'vm'
      })
      .when('/user/profile', {
        templateUrl: 'views/users/profile.html',
        controller: 'UserProfileCtrl',
        controllerAs: 'vm'
      })
      .when('/quotations/list', {
        templateUrl: 'views/quotations/list.html',
        controller: 'QuotationsListCtrl',
        controllerAs: 'vm'
      })
      .when('/quotations/edit/:id', {
        templateUrl: 'views/quotations/edit.html',
        controller: 'QuotationsEditCtrl',
        controllerAs: 'vm',
        resolve: {
          activeStore: function($rootScope, $q){
            if($rootScope.activeStore){
              return $q.resolve($rootScope.activeStore);
            }else{
              var deferred = $q.defer();
              $rootScope.$on('activeStoreAssigned', function(ev, _activeStore){
                deferred.resolve(_activeStore);
              });
              return deferred.promise;
            }
          }
        }                
      })
      .when('/dashboard', {
        templateUrl: 'views/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        controllerAs: 'vm'
      })
      .when('/checkout/client/:id', {
        templateUrl: 'views/checkout/client.html',
        controller: 'CheckoutClientCtrl',
        controllerAs: 'vm'
      })
      .when('/checkout/paymentmethod/:id', {
        templateUrl: 'views/checkout/payments.html',
        controller: 'CheckoutPaymentsCtrl',
        controllerAs: 'vm',
        resolve: {
          activeStore: function($rootScope, $q){
            if($rootScope.activeStore){
              return $q.resolve($rootScope.activeStore);
            }else{
              var deferred = $q.defer();
              $rootScope.$on('activeStoreAssigned', function(ev, _activeStore){
                deferred.resolve(_activeStore);
              });
              return deferred.promise;
            }
          }
        }        
      })
      .when('/continuequotation', {
        templateUrl: 'views/continuequotation.html',
        controller: 'ContinuequotationCtrl',
        controllerAs: 'vm'
      })
      .when('/orders/list', {
        templateUrl: 'views/orders/list.html',
        controller: 'OrdersListCtrl',
        controllerAs: 'vm'
      })
      .when('/checkout/order/:id', {
        templateUrl: 'views/checkout/order.html',
        controller: 'CheckoutOrderCtrl',
        controllerAs: 'vm'
      })
      .when('/users/brokerprofile', {
        templateUrl: 'views/users/broker.html',
        controller: 'UsersBrokerCtrl',
        controllerAs: 'vm'
      })
      .when('/ofertas', {
        templateUrl: 'views/offers.html',
        controller: 'OffersCtrl',
        controllerAs: 'vm',
        resolve: {
          activeStore: function($rootScope, $q){
            if($rootScope.activeStore){
              return $q.resolve($rootScope.activeStore);
            }else{
              var deferred = $q.defer();
              $rootScope.$on('activeStoreAssigned', function(ev, _activeStore){
                deferred.resolve(_activeStore);
              });
              return deferred.promise;
            }
          }
        }        
      })
      .when('/politicas-de-entrega', {
        templateUrl: 'views/delivery-policy.html',
        controller: 'DeliveryPolicyCtrl',
        controllerAs: 'deliveryPolicy'
      })
      .when('/politicas-de-instalacion-y-ensamble', {
        templateUrl: 'views/ensamble-policy.html',
        controller: 'EnsamblePolicyCtrl',
        controllerAs: 'ensamblePolicy'
      })
      .when('/politicas-de-almacenaje', {
        templateUrl: 'views/storage-policy.html',
        controller: 'StoragePolicyCtrl',
        controllerAs: 'storagePolicy'
      })
      .when('/politicas-de-garantia', {
        templateUrl: 'views/warranty-policy.html',
        controller: 'WarrantyPolicyCtrl',
        controllerAs: 'warrantyPolicy'
      })
      .when('/manual-de-cuidados-y-recomendaciones/pieles', {
        templateUrl: 'views/manual/pieles.html',
        controller: 'ManualPielesCtrl',
        controllerAs: 'manual/pieles'
      })
      .when('/manual-de-cuidados-y-recomendaciones/aceros', {
        templateUrl: 'views/manual/aceros.html',
        controller: 'ManualAcerosCtrl',
        controllerAs: 'manual/aceros'
      })
      .when('/manual-de-cuidados-y-recomendaciones/aluminios', {
        templateUrl: 'views/manual/aluminios.html',
        controller: 'ManualAluminiosCtrl',
        controllerAs: 'manual/aluminios'
      })
      .when('/manual-de-cuidados-y-recomendaciones/cristales', {
        templateUrl: 'views/manual/cristales.html',
        controller: 'ManualCristalesCtrl',
        controllerAs: 'manual/cristales'
      })
      .when('/manual-de-cuidados-y-recomendaciones/cromados', {
        templateUrl: 'views/manual/cromados.html',
        controller: 'ManualCromadosCtrl',
        controllerAs: 'manual/cromados'
      })
      .when('/manual-de-cuidados-y-recomendaciones', {
        templateUrl: 'views/manual.html',
        controller: 'ManualCtrl',
        controllerAs: 'manual'
      })
      .when('/manual-de-cuidados-y-recomendaciones/maderas', {
        templateUrl: 'views/manual/maderas.html',
        controller: 'ManualMaderasCtrl',
        controllerAs: 'manual/maderas'
      })
      .when('/manual-de-cuidados-y-recomendaciones/piezas-plasticas', {
        templateUrl: 'views/manual/piezas-plasticas.html',
        controller: 'ManualPiezasPlasticasCtrl',
        controllerAs: 'manual/piezasPlasticas'
      })
      .when('/manual-de-cuidados-y-recomendaciones/textiles', {
        templateUrl: 'views/manual/textiles.html',
        controller: 'ManualTextilesCtrl',
        controllerAs: 'manual/textiles'
      })
      .when('/manual-de-cuidados-y-recomendaciones/viniles', {
        templateUrl: 'views/manual/viniles.html',
        controller: 'ManualVinilesCtrl',
        controllerAs: 'manual/viniles'
      })
      .when('/manual-de-cuidados-y-recomendaciones/vinilos', {
        templateUrl: 'views/manual/vinilos.html',
        controller: 'ManualVinilosCtrl',
        controllerAs: 'manual/vinilos'
      })
      .when('/manual-de-cuidados-y-recomendaciones/pintura-electrostatica', {
        templateUrl: 'views/manual/pintura-electrostatica.html',
        controller: 'ManualPinturaElectrostaticaCtrl',
        controllerAs: 'manual/pinturaElectrostatica'
      })
      .when('/forgot-password', {
        templateUrl: 'views/forgot-password.html',
        controller: 'ForgotPasswordCtrl',
        controllerAs: 'vm'
      })
      .when('/reset-password', {
        templateUrl: 'views/reset-password.html',
        controller: 'ResetPasswordCtrl',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/'
      });

    localStorageServiceProvider.setPrefix(ENV.tokenPrefix + 'actualFront');

    moment.locale('es');
    var locales = {
      es: {
        months        : moment.localeData()._months,
        weekdays      : moment.localeData()._weekdays,
        weekdaysShort : moment.localeData()._weekdaysShort,
      }
    };
    pikadayConfigProvider.setConfig({
      i18n: locales.es,
      locales: locales,
      format: 'D/MM/YYYY'
    });

    //JWT TOKENS CONFIG
    $httpProvider.interceptors.push([
      '$q', 
      '$location', 
      'localStorageService',
       function ($q, $location, localStorageService) {
        return {
          request: function (config) {
            config.headers = config.headers || {};
            if ( localStorageService.get('token') ) {
              config.headers.Authorization = 'JWT ' + localStorageService.get('token');
            }

            if( localStorageService.get('activeStore') ){
              config.headers.ActiveStoreId = localStorageService.get('activeStore');
            }

            return config;
          },
        };
      }
    ]);

  })
  .run(function(
    Analytics,
    localStorageService, 
    authService, 
    jwtHelper, 
    userService, 
    $location, 
    $rootScope,
    $route
  ){
    authService.runPolicies();
    
    //Configures $location.path second parameter, for no reloading
    var original = $location.path;
    $location.path = function (path, reload) {
      if (reload === false) {
        var lastRoute = $route.current;
        var un = $rootScope.$on('$locationChangeSuccess', function () {
          $route.current = lastRoute;
          un();
        });
      }
      return original.apply($location, [path]);
    };
  });
