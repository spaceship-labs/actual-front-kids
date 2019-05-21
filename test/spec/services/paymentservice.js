'use strict';

describe('Service: paymentService', function() {
  // load the service's module
  beforeEach(module('actualApp'));

  // instantiate service
  var paymentService;
  beforeEach(inject(function(_paymentService_) {
    paymentService = _paymentService_;
  }));

  it('should get the MXN amount from a usd payment', function() {
    var payment = { ammount: 10, exchangeRate: 18.5 };
    var amountMXN = paymentService.getAmountMXN(
      payment.ammount,
      payment.exchangeRate
    );
    var expected = payment.ammount * payment.exchangeRate;
    expect(amountMXN).toBe(expected);
  });

  it('should get an array of payment options for credit card payment method', function() {
    var method = {
      type: 'credit-card',
      storeType: 'home'
    };
    var options = paymentService.getPaymentOptionsByMethod(method);
    expect(options).toBeDefined();
    expect(options.length).toBeGreaterThan(0);
  });

  it('should get the payment type string for debit card', function() {
    var payment = { type: 'debit-card' };
    var typeString = paymentService.getPaymentTypeString(payment);
    expect(typeString).toBe('1 sola exhibición');
  });

  it('should get balance for client balance payment method', function() {
    var quotation = {
      Client: {
        Balance: 100,
        ewallet: 50
      }
    };
    var method = { type: 'client-balance' };
    var balance = paymentService.getMethodAvailableBalance(method, quotation);
    expect(balance).toBe(quotation.Client.Balance);
  });

  it('should get balance for ewallet payment method', function() {
    var quotation = {
      Client: {
        Balance: 100,
        ewallet: 50
      }
    };
    var method = { type: 'ewallet' };
    var balance = paymentService.getMethodAvailableBalance(method, quotation);
    expect(balance).toBe(quotation.Client.ewallet);
  });

  it('should get the client balance description string', function() {
    var balance = 100;
    var description = paymentService.getClientBalanceDescription(balance);
    expect(description).toMatch(/Saldo disponible/);
    expect(description).toMatch(/100/);
  });

  it('should get return true when payment has a debit or credit card type', function() {
    var payment = { type: 'debit-card' };
    var result = paymentService.isCardCreditOrDebitPayment(payment);
    expect(result).toBe(true);

    var payment2 = { type: 'credit-card' };
    var result2 = paymentService.isCardCreditOrDebitPayment(payment2);
    expect(result2).toBe(true);
  });

  it('should get an array of specific payment options (almost all with banorte terminal, except american-express) for credit/debit card payment method in studio cumbres', function() {
    var method = {
      type: 'credit-card',
      storeCode: 'actual_studio_cumbres',
      storeType: 'studio',
      group: 1
    };
    var options = paymentService.getPaymentOptionsByMethod(method);
    expect(options).toBeDefined();
    expect(options.length).toBeGreaterThan(0);
    var optionsAux = options.filter(function(option) {
      return option.terminal.value !== 'american-express';
    });
    var everyOptionHasBanorteAsTerminal = optionsAux.every(function(option) {
      return option.terminal.value === 'banorte';
    });
    expect(everyOptionHasBanorteAsTerminal).toBe(true);
  });

  it('should get an array of specific payment options (almost all with banorte terminal, except american-express) for credit/debit card payment method in studio playa', function() {
    var method = {
      type: 'credit-card',
      storeCode: 'actual_studio_playa_del_carmen',
      storeType: 'studio',
      group: 1
    };
    var options = paymentService.getPaymentOptionsByMethod(method);
    expect(options).toBeDefined();
    expect(options.length).toBeGreaterThan(0);
    var optionsAux = options.filter(function(option) {
      return option.terminal.value !== 'american-express';
    });
    var everyOptionHasBanorteAsTerminal = optionsAux.every(function(option) {
      return option.terminal.value === 'banorte';
    });
    expect(everyOptionHasBanorteAsTerminal).toBe(true);
  });

  describe('isCanceledPayment', function() {
    it('should return true if payment is canceled', function() {
      var payment = { status: 'canceled' };
      expect(paymentService.isCanceled(payment)).toBe(true);
    });

    it('should return false if payment is not canceled', function() {
      var payment = { status: 'processed' };
      expect(paymentService.isCanceled(payment)).toBe(false);
    });
  });

  describe('mapStatusType', function() {
    it('should return the correct label for canceled status type', function() {
      var payment = { status: 'canceled' };
      expect(paymentService.mapStatusType(payment.status)).toBe('Cancelado');
    });

    it('should return the same status as label when it is not recognized', function() {
      var payment = { status: 'not.recognized' };
      expect(paymentService.mapStatusType(payment.status)).toBe(
        'not.recognized'
      );
    });
  });
});
