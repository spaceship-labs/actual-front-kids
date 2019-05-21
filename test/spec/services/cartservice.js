'use strict';

describe('Service: cartService', function () {

  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var cartService;
  beforeEach(inject(function (_cartService_) {
    cartService = _cartService_;
  }));
});
