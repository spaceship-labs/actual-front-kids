(function() {
  'use strict';

  angular.module('actualApp').factory('ewalletService', ewalletService);

  /** @ngInject */
  function ewalletService($filter, clientService, commonService) {
    var EWALLET_TYPE = 'ewallet';
    var EWALLET_GROUP_INDEX = 0;

    var service = {
      ewalletType: EWALLET_TYPE,
      ewalletGroupIndex: EWALLET_GROUP_INDEX,
      updateQuotationEwalletBalance: updateQuotationEwalletBalance
    };

    return service;

    //@param quotation - Object quotation populated with Payments and Client
    function updateQuotationEwalletBalance(quotation, paymentMethodsGroups) {
      var group = paymentMethodsGroups[EWALLET_GROUP_INDEX];
      var ewalletPaymentMethod = _.findWhere(group.methods, {
        type: EWALLET_TYPE
      });
      var ewalletPayments = _.where(quotation.Payments, { type: EWALLET_TYPE });
      clientService
        .getEwalletById(quotation.Client.id)
        .then(function(res) {
          var balance = res.data || 0;
          var description = getEwalletDescription(balance);
          if (ewalletPaymentMethod) {
            ewalletPaymentMethod.description = description;
          }
          if (ewalletPayments) {
            ewalletPayments = ewalletPayments.map(function(payment) {
              payment.description = description;
              return payment;
            });
          }
        })
        .catch(function(err) {
          console.log(err);
        });
    }

    function getEwalletDescription(balance) {
      var description = '';
      var balanceRounded = commonService.roundCurrency(balance, { up: false });
      var balanceStr = $filter('currency')(balanceRounded);
      description = 'Saldo disponible: ' + balanceStr + ' MXN';
      return description;
    }
  }
})();
