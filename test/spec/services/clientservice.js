"use strict";

describe("Service: clientService", function() {
  // load the service's module
  beforeEach(module("actualApp"));

  // instantiate service
  var clientService;
  beforeEach(
    inject(function(_clientService_) {
      clientService = _clientService_;
    })
  );

  it("should return false when validating a wrong RFC", function() {
    var rfc = "wrong.rfc";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(false);
  });

  it("should return true when validating a valid RFC", function() {
    var rfc = "ADB181230DA0";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(true);
  });

  it("should return false when validating a valid RFC with a date like 30/feb/18", function() {
    var rfc = "ADB180230DA0";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(false);
  });

  it("should return true when validating a valid RFC with a date like 28/feb/18", function() {
    var rfc = "ADB180228DA0";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(true);
  });

  it("should return true when ampersand is in the first 3 chars", function() {
    var rfc = "A&X040910HY2";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(true);
  });

  it("should return false when ampersand is not in the first 3 chars", function() {
    var rfc = "AQX040&10HY2";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(false);
  });

  it("should return false when number is  in the first 3 chars", function() {
    var rfc = "A6X040910HY2";
    var result = clientService.validateRfc(
      rfc,
      clientService.GENERIC_RFC,
      clientService.RFC_VALIDATION_REGEX
    );
    expect(result).toBe(false);
  });
});
