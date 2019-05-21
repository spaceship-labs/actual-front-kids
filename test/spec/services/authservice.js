'use strict';

describe('Service: AuthService', function() {
  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var authService;
  var $rootScope;
  beforeEach(
    inject(function(_authService_, _$rootScope_) {
      $rootScope = _$rootScope_;
      authService = _authService_;
    })
  );

  it('should return true by verifying a public path', function() {
    expect(authService.isPublicPath('/politicas-de-entrega')).toBe(true);
  });

  it('should return false by verifying a non public path', function() {
    expect(authService.isPublicPath('/dashboard')).toBe(false);
  });

  /*
  it('should return true when user has an admin or manager role', function() {
    $rootScope.user = {
      role: { name: 'admin' }
    };
    //console.log('$rootScope', $rootScope);
    expect(authService.isUserAdminOrManager()).toBe(true);
  });
  
  it('should return true when user has an admin or manager role', function() {
    $rootScope.user = {
      role: { name: 'seller' }
    };
    expect(authService.isUserSellerOrAdmin()).toBe(true);
  });
  */

  it('should return true when user has a seller role', function() {
    var user = {
      role: { name: 'seller' }
    };
    expect(authService.isSeller(user)).toBe(true);
  });

  it('should return true when user has an admin role', function() {
    var user = {
      role: { name: 'admin' }
    };
    expect(authService.isAdmin(user)).toBe(true);
  });

  it('should return true when user has a store manager role', function() {
    var user = {
      role: { name: 'store manager' }
    };
    expect(authService.isStoreManager(user)).toBe(true);
  });

  it('should return true when user has a broker role', function() {
    var user = {
      role: { name: 'broker' }
    };
    expect(authService.isBroker(user)).toBe(true);
  });

  it('should return true when user has an accounting role', function() {
    var user = {
      role: { name: 'accounting' }
    };
    expect(authService.isAccountingUser(user)).toBe(true);
  });
});
