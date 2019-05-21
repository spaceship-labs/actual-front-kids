'use strict';

describe('Directive: tableList', function () {

  // load the directive's module
  beforeEach(module('actualApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  /*it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<table-list></table-list>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the tableList directive');
  }));*/
});
