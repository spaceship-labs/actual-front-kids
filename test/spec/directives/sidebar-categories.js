'use strict';

describe('Directive: sidebarCategories', function () {

  // load the directive's module
  beforeEach(module('actualApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  /*
  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<sidebar-categories></sidebar-categories>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the sidebarCategories directive');
  }));
  */
});
