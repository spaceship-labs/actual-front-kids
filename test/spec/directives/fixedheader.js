'use strict';

describe('Directive: fixedHeader', function () {

  // load the directive's module
  beforeEach(module('actualApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  /*
  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<fixed-header></fixed-header>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the fixedHeader directive');
  }));
  */
});
