'use strict';

describe('Service: productService', function () {

  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var productService;
  beforeEach(inject(function (_productService_) {
    productService = _productService_;
  }));
});
