(function() {
  'use strict';

  angular.module('actualApp').factory('authService', authService);

  /** @ngInject */
  function authService(
    $http,
    $rootScope,
    $location,
    localStorageService,
    dialogService,
    api,
    jwtHelper,
    userService
  ) {
    var USER_ROLES = {
      ADMIN: 'admin',
      BROKER: 'broker',
      SELLER: 'seller',
      STORE_MANAGER: 'store manager',
      ACCOUNTING: 'accounting'
    };

    var PUBLIC_PATHS = [
      '/',
      '/forgot-password',
      '/reset-password',
      '/politicas-de-entrega',
      '/politicas-de-garantia',
      '/politicas-de-almacenaje',
      '/politicas-de-instalacion-y-ensamble',
      '/manual-de-cuidados-y-recomendaciones/pieles',
      '/manual-de-cuidados-y-recomendaciones/aceros',
      '/manual-de-cuidados-y-recomendaciones/aluminios',
      '/manual-de-cuidados-y-recomendaciones/cristales',
      '/manual-de-cuidados-y-recomendaciones/cromados',
      '/manual-de-cuidados-y-recomendaciones',
      '/manual-de-cuidados-y-recomendaciones/maderas',
      '/manual-de-cuidados-y-recomendaciones/piezas-plasticas',
      '/manual-de-cuidados-y-recomendaciones/textiles',
      '/manual-de-cuidados-y-recomendaciones/viniles',
      '/manual-de-cuidados-y-recomendaciones/vinilos',
      '/manual-de-cuidados-y-recomendaciones/pintura-electrostatica'
    ];

    var STORE_MANAGER_FORBIDDEN_PATHS = [
      '/addquotation',
      '/dashboard',
      //'/checkout/client',
      //'/checkout/paymentmethod',
      '/continuequotation'
    ];

    var BROKER_FORBIDDEN_PATHS = [
      '/clients/list',
      '/quotations/list',
      '/dashboard',
      '/checkout/client',
      '/checkout/paymentmethod',
      '/continuequotation',
      '/addquotation'
    ];

    var service = {
      authManager: authManager,
      signUp: signUp,
      signIn: signIn,
      logout: logout,
      dennyAccessBroker: dennyAccessBroker,
      dennyAccessStoreManager: dennyAccessStoreManager,
      isBroker: isBroker,
      isStoreManager: isStoreManager,
      isAdmin: isAdmin,
      isUserAdminOrManager: isUserAdminOrManager,
      isUserSellerOrAdmin: isUserSellerOrAdmin,
      isUserManager: isUserManager,
      isAccountingUser: isAccountingUser,
      isSeller: isSeller,
      runPolicies: runPolicies,
      showUnauthorizedDialogIfNeeded: showUnauthorizedDialogIfNeeded,
      USER_ROLES: USER_ROLES,
      isUserSignedIn: isUserSignedIn,
      isPublicPath: isPublicPath,
      isStoreManagerForbiddenPath: isStoreManagerForbiddenPath,
      isBrokerForbiddenPath: isBrokerForbiddenPath
    };

    return service;

    function isUserSignedIn() {
      var user = localStorageService.get('user');
      return user ? true : false;
    }

    function showUnauthorizedDialogIfNeeded(err) {
      if (err.status === 401) {
        dialogService.showDialog('Usuario no autorizado');
        return;
      }
    }

    function isPublicPath(path) {
      return PUBLIC_PATHS.indexOf(path) > -1;
    }

    function isStoreManagerForbiddenPath(path) {
      var result = _.some(STORE_MANAGER_FORBIDDEN_PATHS, function(
        forbiddenPath
      ) {
        return path.search(forbiddenPath) > -1;
      });
      return result;
    }

    function isBrokerForbiddenPath(path) {
      var result = _.some(BROKER_FORBIDDEN_PATHS, function(forbiddenPath) {
        return path.search(forbiddenPath) > -1;
      });
      return result;
    }

    function signUp(data, success, error) {
      $http
        .post(api.baseUrl + '/user/create', data)
        .then(success)
        .catch(error);
    }

    function signIn(data, success, error) {
      localStorageService.remove('token');
      localStorageService.remove('user');
      localStorageService.remove('quotation');
      localStorageService.remove('broker');
      $http
        .post(api.baseUrl + '/auth/signin', data)
        .then(success)
        .catch(error);
    }

    function authManager(params) {
      var url = '/auth/manager';
      return api.$http.post(url, params);
    }

    function logout(successCB) {
      localStorageService.remove('token');
      localStorageService.remove('user');
      localStorageService.remove('quotation');
      localStorageService.remove('broker');
      localStorageService.remove('activeStore');
      localStorageService.remove('companyActive');
      localStorageService.remove('companyActiveName');
      localStorageService.remove('currentQuotation');
      delete $rootScope.user;
      if (successCB) {
        successCB();
      }
    }

    function dennyAccessBroker() {
      var _user = localStorageService.get('user');
      if (isBroker(_user)) {
        $location.path('/');
      }
    }

    function dennyAccessStoreManager() {
      var _user = localStorageService.get('user');
      if (isStoreManager(_user)) {
        $location.path('/');
      }
    }

    function isBroker(user) {
      return !!(user && user.role && user.role.name === USER_ROLES.BROKER);
    }

    function isStoreManager(user) {
      return user && user.role && user.role.name === USER_ROLES.STORE_MANAGER;
    }

    function isAdmin(user) {
      return user && user.role && user.role.name === USER_ROLES.ADMIN;
    }

    function isSeller(user) {
      return user && user.role && user.role.name === USER_ROLES.SELLER;
    }

    function isAccountingUser(user) {
      return user && user.role && user.role.name === USER_ROLES.ACCOUNTING;
    }

    function isUserAdminOrManager() {
      return (
        $rootScope.user.role &&
        ($rootScope.user.role.name === USER_ROLES.ADMIN ||
          $rootScope.user.role.name === USER_ROLES.STORE_MANAGER)
      );
    }

    function isUserSellerOrAdmin() {
      return (
        $rootScope.user.role &&
        ($rootScope.user.role.name === USER_ROLES.ADMIN ||
          $rootScope.user.role.name === USER_ROLES.SELLER)
      );
    }

    function isUserManager() {
      return (
        $rootScope.user.role.name === USER_ROLES.STORE_MANAGER &&
        $rootScope.user.mainStore
      );
    }

    function runPolicies() {
      var token = localStorageService.get('token') || false;
      var user = localStorageService.get('user') || false;
      var currentPath = $location.path();

      if (token) {
        //Check if token is expired
        var expiration = jwtHelper.getTokenExpirationDate(token);
        if (expiration <= new Date()) {
          return logout(function() {
            $location.path('/');
          });
        }

        if (
          user.role.name === USER_ROLES.STORE_MANAGER &&
          isStoreManagerForbiddenPath(currentPath)
        ) {
          return $location.path('/');
        } else if (
          user.role.name === USER_ROLES.BROKER &&
          isBrokerForbiddenPath(currentPath)
        ) {
          return $location.path('/');
        }

        //Gets user from API and save it to local storage
        return saveMostRecentUserInfoToStorage(user);
      } else {
        logout();
        if (!isPublicPath(currentPath)) {
          $location.path('/');
        }
      }
    }

    function saveMostRecentUserInfoToStorage(user) {
      return userService
        .getUser(user.id, { quickRead: true })
        .then(function(res) {
          user = res.data.data;
          localStorageService.set('user', user);
          $rootScope.user = user;
          return true;
        })
        .catch(function(err) {
          console.log('err saveMostRecentUserInfoToStorage', err);
        });
    }
  }
})();
