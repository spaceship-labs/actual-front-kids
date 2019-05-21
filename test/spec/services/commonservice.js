'use strict';

describe('Service: commonService', function () {

  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var commonService;
  beforeEach(inject(function (_commonService_) {
    commonService = _commonService_;
  }));

  it('should map the terminal code to its string value', function(){
    var code = 'banamex';
    expect(commonService.mapTerminalCode(code)).toBe('Banamex');
  });
});
