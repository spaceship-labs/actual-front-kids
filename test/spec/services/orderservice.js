'use strict';

describe('Service: orderService', function() {
  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var orderService;
  beforeEach(
    inject(function(_orderService_) {
      orderService = _orderService_;
    })
  );

  describe('getStatusMap', function() {
    it('should return a map with the relation key-value of or statuses', function() {
      var map = orderService.getStatusMap();
      expect(map['canceled']).toBe('Cancelado');
      expect(map['paid']).toBe('Pagado');
      expect(map['random.status']).toBe(undefined);
    });
  });

  describe('mapStatusType', function() {
    it('should return the label for the status type value, if it is not in the map, return the raw value', function() {
      expect(orderService.mapStatusType('canceled')).toBe('Cancelado');
      expect(orderService.mapStatusType('paid')).toBe('Pagado');
      expect(orderService.mapStatusType('random.status')).toBe('random.status');
    });
  });

  describe('isCanceled', function() {
    it('should return true when order is canceled', function() {
      var order = { id: 'order.id1', status: 'canceled' };
      expect(orderService.isCanceled(order)).toBe(true);
    });
    it('should return false when order is not canceled', function() {
      var order = { id: 'order.id1', status: 'paid' };
      expect(orderService.isCanceled(order)).toBe(false);
    });
  });

  describe('getEwalletAmmount', function() {
    it('should return the amount from ewallet records, specifying a type', function() {
      var ewalletRecords = [
        { type: 'some.type', amount: 200 },
        { type: 'other.type', amount: 300 },
        { type: 'some.type', amount: 400 }
      ];
      expect(orderService.getEwalletAmmount(ewalletRecords, 'some.type')).toBe(
        600
      );
    });
  });

  describe('formatAddress', function() {
    it('should return the address object with specific fields mapped', function() {
      var address = {
        FirstName: 'Jose',
        LastName: 'Sanchez',
        Address: 'Calle 14',
        Tel1: '88221144',
        Cellolar: '9988112233'
      };
      var formattedAddress = orderService.formatAddress(address);
      expect(formattedAddress.name).toBe('Jose Sanchez');
      expect(formattedAddress.address).toBe('Calle 14');
      expect(formattedAddress.phone).toBe('88221144');
      expect(formattedAddress.mobile).toBe('9988112233');
    });
  });
});
