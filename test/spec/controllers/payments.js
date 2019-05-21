'use strict';

describe('Controller: CheckoutPaymentsCtrl', function() {
  // load the controller's module
  beforeEach(module('actualApp'));

  var CheckoutPaymentsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(
    inject(function($controller, $rootScope) {
      scope = $rootScope.$new();
      CheckoutPaymentsCtrl = $controller('CheckoutPaymentsCtrl', {
        $scope: scope,
        activeStore: {
          group: 'studio'
        },
        activeQuotation: {}
        // place here mocked dependencies
      });
    })
  );

  describe('isPaymentModeActive', function() {
    it('should return true on isPaymentModeActive validation when quotation amount paid is not 100%', function() {
      var quotation = {
        ammountPaid: 50,
        total: 100
      };
      var payment = { ammount: 20 };
      var result = CheckoutPaymentsCtrl.isPaymentModeActive(payment, quotation);
      expect(result).toBe(true);
    });

    it('should return false on isPaymentModeActive validation when quotation amount paid is 100%', function() {
      var quotation = {
        ammountPaid: 100,
        total: 100
      };
      var payment = { ammount: 20 };
      var result = CheckoutPaymentsCtrl.isPaymentModeActive(payment, quotation);
      expect(result).toBe(false);
    });
  });

  describe('calculateRemaing', function() {
    it('should calculate the remaining ammount to pay in the quotation', function() {
      var quotation = { ammountPaid: 100 };
      var amount = 40;
      var result = CheckoutPaymentsCtrl.calculateRemaining(amount, quotation);
      expect(result).toBe(amount - quotation.ammountPaid);
    });
  });

  describe('setupActiveMethod', function() {
    it('should set and return the activemethod', function() {
      var method = {
        total: 3200,
        subtotal: 4000,
        discount: 1600,
        group: 2
      };
      var quotation = {
        total: 2000,
        subtotal: 4000,
        discount: 2000,
        paymentGroup: 1,
        ammountPaid: 0
      };

      var activeMethod = CheckoutPaymentsCtrl.setupActiveMethod(
        method,
        quotation
      );

      expect(activeMethod.total).toBe(method.total);
      expect(activeMethod.storeType).toBe('studio');
      expect(activeMethod.remaining).toBe(method.total);
      expect(activeMethod.maxAmount).toBe(method.total);
    });

    it('should set and return the activemethod, with the correct remaining and max amount when there were previous payments applied', function() {
      var method = {
        total: 3200,
        subtotal: 4000,
        discount: 1600,
        group: 2
      };
      var quotation = {
        total: 2000,
        subtotal: 4000,
        discount: 2000,
        paymentGroup: 1,
        ammountPaid: 200
      };

      var activeMethod = CheckoutPaymentsCtrl.setupActiveMethod(
        method,
        quotation
      );

      var expectedRemaining = method.total - quotation.ammountPaid;
      var expectedMaxAmount = method.total - quotation.ammountPaid;
      expect(activeMethod.remaining).toBe(expectedRemaining);
      expect(activeMethod.maxAmount).toBe(expectedMaxAmount);
    });

    it('should set correct values when method type is Balance', function() {
      var method = {
        total: 3200,
        subtotal: 4000,
        discount: 1600,
        group: 1,
        type: 'client-balance'
      };
      var quotation = {
        total: 3200,
        subtotal: 4000,
        discount: 800,
        paymentGroup: 1,
        ammountPaid: 0,
        Client: { Balance: 150 }
      };

      var activeMethod = CheckoutPaymentsCtrl.setupActiveMethod(
        method,
        quotation
      );

      //Remaining should be method.total - quotation.ammountPaid;
      //var expectedRemaining = method.total - quotation.ammountPaid;
      var expectedRemaining = quotation.Client.Balance;
      var expectedMaxAmount = quotation.Client.Balance;

      expect(activeMethod.remaining).toBe(expectedRemaining);
      expect(activeMethod.maxAmount).toBe(expectedMaxAmount);
    });
  });

  describe('choosePaymentMethod', function() {
    it('should return a promise that opens the payment dialog', function() {
      var method = {
        total: 3200,
        subtotal: 4000,
        discount: 1600,
        group: 1,
        type: 'cash'
      };
      var quotation = {
        total: 3200,
        subtotal: 4000,
        discount: 800,
        paymentGroup: 1,
        ammountPaid: 0,
        Client: { Balance: 150 }
      };

      var result = CheckoutPaymentsCtrl.choosePaymentMethod(method, quotation);

      //TODO: Usar una asercion que evaule que el resultado es una promesa
      expect(result).toBeTruthy();
    });

    it('should return false when balance from method type is less than 0.01', function() {
      var method = {
        total: 3200,
        subtotal: 4000,
        discount: 1600,
        group: 1,
        type: 'client-balance'
      };
      var quotation = {
        total: 3200,
        subtotal: 4000,
        discount: 800,
        paymentGroup: 1,
        ammountPaid: 0,
        Client: { Balance: 0 }
      };

      var result = CheckoutPaymentsCtrl.choosePaymentMethod(method, quotation);
      expect(result).toBe(false);
    });

    it('should return false when the Client doesnt have USD payments authorized in SAP and method currency is USD', function() {
      var method = {
        total: 3200,
        subtotal: 4000,
        discount: 1600,
        group: 1,
        currency: 'usd',
        type: 'cash-usd'
      };
      var quotation = {
        total: 3200,
        subtotal: 4000,
        discount: 800,
        paymentGroup: 1,
        ammountPaid: 0,
        Client: { Balance: 0, Currency: 'MXP' }
      };

      var result = CheckoutPaymentsCtrl.choosePaymentMethod(method, quotation);
      expect(result).toBe(false);
    });
  });

  describe('resetActiveMethod', function() {
    it('should reset the active method, when quotation has a payment group, setting the first method of that group', function() {
      var quotation = {
        total: 3200,
        subtotal: 4000,
        discount: 800,
        paymentGroup: 3,
        ammountPaid: 0,
        Client: { Balance: 0, Currency: 'MXP' },
        Payments: [{ ammount: 200, type: '6-msi', group: 2 }]
      };

      var paymentMethodsGroups = [
        {
          group: 1,
          methods: [{ type: 'cash' }, { type: 'cash-usd' }]
        },
        {
          group: 2,
          methods: [{ type: '3-msi' }]
        },
        {
          group: 3,
          methods: [
            { type: '3-msi-banamex' },
            { type: '6-msi' },
            { type: '9-msi' }
          ]
        }
      ];

      CheckoutPaymentsCtrl.paymentMethodsGroups = paymentMethodsGroups;
      var result = CheckoutPaymentsCtrl.resetActiveMethod(quotation);
      expect(result.type).toBe(paymentMethodsGroups[2].methods[0].type);
    });
  });

  describe('setQuotationTotalsByGroup', function() {
    it('should assign quotation totals depending on quotation paymentGroup', function() {
      var paymentMethodsGroups = [
        {
          group: 1,
          methods: [
            { type: 'cash', total: 12749, subtotal: 16999 },
            { type: 'cash-usd', total: 12749, subtotal: 16999 }
          ]
        },
        {
          group: 2,
          methods: [{ type: '3-msi', total: 13599, subtotal: 16999 }]
        },
        {
          group: 3,
          methods: [
            { type: '3-msi-banamex', total: 14449.15, subtotal: 16999 },
            { type: '6-msi', total: 14449.15, subtotal: 16999 },
            { type: '9-msi', total: 14449.15, subtotal: 16999 }
          ]
        }
      ];
      CheckoutPaymentsCtrl.paymentMethodsGroups = paymentMethodsGroups;

      var quotation = {
        total: 12749,
        subtotal: 16999,
        discount: 4250,
        paymentGroup: 3,
        ammountPaid: 0,
        Client: { Balance: 0, Currency: 'MXP' },
        Payments: [{ ammount: 200, type: '6-msi', group: 2 }]
      };

      var result = CheckoutPaymentsCtrl.setQuotationTotalsByGroup(quotation);
      expect(result.total).toBe(paymentMethodsGroups[2].methods[0].total);
    });
  });

  describe('updateVMQuotation', function() {
    it('should merge new updated quotation values to previous', function() {
      var paymentMethodsGroups = [
        {
          group: 1,
          methods: [
            { type: 'cash', total: 12749, subtotal: 16999 },
            { type: 'cash-usd', total: 12749, subtotal: 16999 }
          ]
        },
        {
          group: 2,
          methods: [{ type: '3-msi', total: 13599, subtotal: 16999 }]
        },
        {
          group: 3,
          methods: [
            { type: '3-msi-banamex', total: 14449.15, subtotal: 16999 },
            { type: '6-msi', total: 14449.15, subtotal: 16999 },
            { type: '9-msi', total: 14449.15, subtotal: 16999 }
          ]
        }
      ];

      var quotation = {
        total: 12749,
        subtotal: 16999,
        discount: 4250,
        paymentGroup: 3,
        ammountPaid: 0,
        Client: { Balance: 0, Currency: 'MXP' },
        Payments: [{ ammount: 600, type: '6-msi', group: 3 }]
      };

      CheckoutPaymentsCtrl.paymentMethodsGroups = paymentMethodsGroups;
      CheckoutPaymentsCtrl.quotation = quotation;

      var updateParams = {
        ammountPaid: 1400,
        paymentGroup: 3
      };

      CheckoutPaymentsCtrl.updateVMQuotation(updateParams);
      expect(CheckoutPaymentsCtrl.quotation.total).toBe(
        paymentMethodsGroups[2].methods[0].total
      );
      expect(CheckoutPaymentsCtrl.quotation.ammountPaid).toBe(
        updateParams.ammountPaid
      );
      expect(CheckoutPaymentsCtrl.quotation.paymentGroup).toBe(
        updateParams.paymentGroup
      );
    });
  });

  describe('isPaymentModeActive', function() {
    it('should return true when payments are missing to apply', function() {
      var quotation = {
        ammountPaid: 900,
        total: 1200
      };
      var payment = {
        type: 'cash',
        ammount: 200
      };
      var result = CheckoutPaymentsCtrl.isPaymentModeActive(payment, quotation);
      expect(result).toBe(true);
    });

    it('should return false when quotation total is already paid', function() {
      var quotation = {
        ammountPaid: 1200,
        total: 1200
      };
      var payment = {
        type: 'cash',
        ammount: 200
      };
      var result = CheckoutPaymentsCtrl.isPaymentModeActive(payment, quotation);
      expect(result).toBe(false);
    });
  });

  describe('calculateRemaining', function() {
    it('should return the correct remaining of a quotation left to pay', function() {
      var quotation = { ammountPaid: 250 };
      var ammount = 750;
      var result = CheckoutPaymentsCtrl.calculateRemaining(ammount, quotation);
      expect(result).toBe(500);
    });
  });
});
