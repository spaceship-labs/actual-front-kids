(function() {
  'use strict';

  angular.module('actualApp').factory('checkoutService', checkoutService);

  /** @ngInject */
  function checkoutService(
    $http,
    $location,
    $q,
    $filter,
    api,
    clientService,
    commonService,
    quotationService
  ) {
    var service = {
      areMethodsDisabled: areMethodsDisabled,
      isActivePaymentGroup: isActivePaymentGroup,
      isActiveMethod: isActiveMethod,
      getPaidPercentage: getPaidPercentage,
      isMinimumPaid: isMinimumPaid,
      returnToCheckout: returnToCheckout
    };

    function getPaidPercentage(quotation) {
      if (!quotation) {
        return false;
      }

      var percentage = 0;
      if (quotation) {
        percentage = quotation.ammountPaid / (quotation.total / 100);
      }

      //Floating point issue precision with JS
      //TODO find fix to precision
      //Problem: sometimes ammount paid and total is equal, but percentage throws: 99.99999999999999
      //Return 100 when total and ammount paid is equal
      if (quotation.ammountPaid === quotation.total) {
        percentage = 100;
      }

      return percentage;
    }

    function isMinimumPaid(quotation) {
      if (quotation) {
        var minPaidPercentage = 100;
        if (getPaidPercentage(quotation) >= minPaidPercentage) {
          return true;
        }
      }
      return false;
    }

    function areMethodsDisabled(methods, quotation) {
      if (!quotation) {
        return false;
      }

      var areAllDisabled = methods.every(function(m) {
        return !isActiveMethod(m, quotation);
      });

      return areAllDisabled;
    }

    function isActivePaymentGroup(group, quotation) {
      if (!quotation) {
        return false;
      }

      var isGroupUsed = false;
      var groupNumber = group.group;
      var currentGroup = quotation.paymentGroup;
      var areGroupMethodsDisabled = areMethodsDisabled(
        group.methods,
        quotation
      );
      if (currentGroup < 0 || currentGroup === 1) {
        isGroupUsed = true;
      } else if (currentGroup > 0 && currentGroup === groupNumber) {
        isGroupUsed = true;
      }

      return isGroupUsed && !areGroupMethodsDisabled;
    }

    function isActiveMethod(method, quotation) {
      if (!quotation) {
        return false;
      }

      var remaining = method.total - quotation.ammountPaid;
      remaining = commonService.roundCurrency(remaining);
      var min = method.min || 0;
      //console.log('remaining', remaining);
      //console.log('min', min);

      if (remaining === 0) {
        return false;
      }

      return remaining >= min;
    }

    function returnToCheckout() {
      var queryParams = $location.search();
      if (queryParams && queryParams.checkoutProcess) {
        var quotationId = quotationService.getActiveQuotationId();

        if (quotationId && !queryParams.continueToPayment) {
          $location.path('/checkout/client/' + quotationId);
        } else if (quotationId && queryParams.continueToPayment) {
          $location.path('/checkout/paymentmethod/' + quotationId);
        }
      }
    }

    return service;
  }
})();
