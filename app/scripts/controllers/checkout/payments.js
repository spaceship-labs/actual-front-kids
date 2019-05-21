'use strict';
angular
  .module('actualApp')
  .controller('CheckoutPaymentsCtrl', CheckoutPaymentsCtrl);

function CheckoutPaymentsCtrl(
  $rootScope,
  $routeParams,
  $scope,
  $q,
  $mdMedia,
  $mdDialog,
  $location,
  $filter,
  commonService,
  dialogService,
  formatService,
  orderService,
  quotationService,
  authService,
  paymentService,
  ewalletService,
  checkoutService,
  clientService,
  $interval,
  api,
  activeStore
) {
  var vm = this;

  angular.extend(vm, {
    api: api,
    openAddPaymentDialog: openAddPaymentDialog,
    areMethodsDisabled: checkoutService.areMethodsDisabled,
    calculateRemaining: calculateRemaining,
    createOrder: createOrder,
    choosePaymentMethod: choosePaymentMethod,
    getPaidPercentage: checkoutService.getPaidPercentage,
    isActiveGroup: checkoutService.isActivePaymentGroup,
    isActiveMethod: checkoutService.isActiveMethod,
    isMinimumPaid: checkoutService.isMinimumPaid,
    isPaymentModeActive: isPaymentModeActive,
    intervalProgress: false,
    customFullscreen: $mdMedia('xs') || $mdMedia('sm'),
    singlePayment: true,
    multiplePayment: false,
    isLoading: true,
    loadingEstimate: 0,
    payments: [],
    sapLogs: [],
    paymentMethodsGroups: [],
    CLIENT_BALANCE_TYPE: paymentService.types.CLIENT_BALANCE,
    roundCurrency: commonService.roundCurrency,
    isPaymentCanceled: paymentService.isCanceled,
    openCancelPaymentConfirmDialog: openCancelPaymentConfirmDialog,
    //EXPOSED FOR TESTING PURPOSES
    setupActiveMethod: setupActiveMethod,
    resetActiveMethod: resetActiveMethod,
    setQuotationTotalsByGroup: setQuotationTotalsByGroup,
    updateVMQuotation: updateVMQuotation,
    isUserAdmin: authService.isAdmin($rootScope.user),
    isStoreManager: authService.isStoreManager($rootScope.user)
  });

  var EWALLET_TYPE = ewalletService.ewalletType;
  var CLIENT_BALANCE_TYPE = vm.CLIENT_BALANCE_TYPE;

  init();

  function init() {
    animateProgress();
    vm.isLoading = true;

    var forceLatestData = true;
    var getParams = {
      payments: true,
      forceLatestData: forceLatestData
    };

    quotationService
      .getById($routeParams.id, getParams)
      .then(function(res) {
        vm.quotation = res.data;
        loadSapLogs(vm.quotation.id);

        return $q.all([
          quotationService.validateQuotationStockById(vm.quotation.id),
          loadPaymentMethods()
        ]);
      })
      .then(function(result) {
        var isValidStock = result[0];

        if (!isValidStock) {
          console.log('Out of stock');
          $location
            .path('/quotations/edit/' + vm.quotation.id)
            .search({ stockAlert: true });
        }

        if (!vm.quotation.Details || vm.quotation.Details.length === 0) {
          $location.path('/quotations/edit/' + vm.quotation.id);
        }

        if (!quotationService.isValidQuotationAddress(vm.quotation)) {
          $location
            .path('/quotations/edit/' + vm.quotation.id)
            .search({ missingAddress: true });
        }

        if (vm.quotation.Order) {
          $location.path('/checkout/order/' + vm.quotation.Order.id);
        }

        if (!clientService.validateRfc(vm.quotation.Client.LicTradNum)) {
          console.log('invalid rfc');
          $location.path('/checkout/client/' + vm.quotation.id);
          return;
        }

        vm.quotation.ammountPaid = vm.quotation.ammountPaid || 0;
        vm.isLoading = false;
      })
      .catch(function(err) {
        console.log('err', err);
        dialogService.showDialog('Error: \n' + err.data);
      });
  }

  function loadSapLogs(quotationId) {
    vm.isLoadingSapLogs = true;
    quotationService
      .getSapOrderConnectionLogs(quotationId)
      .then(function(res) {
        vm.sapLogs = res.data;
        vm.isLoadingSapLogs = false;
      })
      .catch(function(err) {
        console.log('err', err);
        vm.isLoadingSapLogs = false;
      });
  }

  function loadPaymentMethods() {
    var deferred = $q.defer();
    var params = {
      financingTotals: true
    };
    quotationService
      .getPaymentOptions(vm.quotation.id, params)
      .then(function(response) {
        var groups = response.data || [];
        vm.paymentMethodsGroups = groups;

        paymentService.updateQuotationClientBalance(
          vm.quotation,
          vm.paymentMethodsGroups
        );

        vm.quotation = setQuotationTotalsByGroup(vm.quotation);
        deferred.resolve();
      })
      .catch(function(err) {
        console.log('err', err);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  function setupActiveMethod(method, quotation) {
    quotation.total = _.clone(method.total);
    quotation.subtotal = _.clone(method.subtotal);
    quotation.discount = _.clone(method.discount);

    var remaining = calculateRemaining(quotation.total, quotation);

    method = _.extend(method, {
      storeType: activeStore.group,
      storeCode: activeStore.code,
      remaining: _.clone(remaining),
      maxAmount: _.clone(remaining)
    });

    if (method.type === EWALLET_TYPE || method.type === CLIENT_BALANCE_TYPE) {
      var balanceAvailable = paymentService.getMethodAvailableBalance(
        method,
        quotation
      );
      method.maxAmount = balanceAvailable;

      //TODO: Revisar esta operacion.
      if (balanceAvailable <= remaining) {
        method.remaining = balanceAvailable;
      }
    }

    return method;
  }

  function choosePaymentMethod(method, quotation) {
    vm.activeMethod = setupActiveMethod(method, quotation);

    if (
      vm.activeMethod.maxAmount < 0.01 &&
      paymentService.isClientBalanceOrEwalletPayment(method)
    ) {
      dialogService.showDialog('Fondos insuficientes');
      return false;
    }

    if (
      quotation.Client &&
      vm.activeMethod.currency === paymentService.currencyTypes.USD &&
      quotation.Client.Currency === 'MXP'
    ) {
      dialogService.showDialog(
        'Pagos en dolares no disponibles para este cliente por configuración en SAP'
      );
      return false;
    }

    return openAddPaymentDialog(
      vm.activeMethod,
      _.clone(vm.activeMethod.remaining)
    );
  }

  function resetActiveMethod(quotation) {
    delete vm.activeMethod;

    var groupIndex = quotation.paymentGroup - 1;
    var group = vm.paymentMethodsGroups[groupIndex];
    var firstMethodInGroup = group.methods[0];
    return setupActiveMethod(firstMethodInGroup, quotation);
  }

  function setQuotationTotalsByGroup(quotation) {
    var paymentGroupNumber = quotation.paymentGroup;
    console.log('paymentGroupNumber', paymentGroupNumber);
    console.log('vm.paymentMethodsGrous', vm.paymentMethodsGroups);
    var currentGroup = _.findWhere(vm.paymentMethodsGroups, {
      group: paymentGroupNumber
    });
    var firstMethod = currentGroup.methods[0];
    quotation.paymentGroup = paymentGroupNumber;
    quotation.total = _.clone(firstMethod.total);
    quotation.subtotal = _.clone(firstMethod.subtotal);
    quotation.discount = _.clone(firstMethod.discount);
    return quotation;
  }

  function updateVMQuotation(source) {
    vm.quotation.ammountPaid = source.ammountPaid;
    vm.quotation.paymentGroup = source.paymentGroup;
    vm.quotation = setQuotationTotalsByGroup(vm.quotation);
  }

  function loadPayments() {
    quotationService
      .getPayments(vm.quotation.id)
      .then(function(res) {
        var payments = res.data;
        vm.quotation.Payments = payments;
        vm.isLoadingPayments = false;
      })
      .catch(function(err) {
        console.log('err', err);
        dialogService.showDialog('Hubo un error, recarga la página');
        vm.isLoadingPayments = false;
      });
  }

  function isPaymentModeActive(payment, quotation) {
    return (
      (payment.ammount > 0 && quotation.ammountPaid < quotation.total) ||
      payment.ammount < 0
    );
  }

  function addPayment(payment) {
    if (isPaymentModeActive(payment, vm.quotation)) {
      vm.isLoadingPayments = true;
      vm.isLoading = true;
      var createdPayment;
      paymentService
        .addPayment(vm.quotation.id, payment)
        .then(function(_createdPayment) {
          createdPayment = _createdPayment;
          return quotationService.getById($routeParams.id);
        })
        .then(function(res) {
          if (res.data) {
            var updatedQuotation = res.data;
            vm.quotation.Payments.push(createdPayment);
            updateVMQuotation(updatedQuotation);
            delete vm.activeMethod;
            loadPayments();
            return loadPaymentMethods();
          } else {
            return $q.reject('Hubo un error');
          }
        })
        .then(function() {
          vm.isLoading = false;
          if (vm.quotation.ammountPaid >= vm.quotation.total) {
            createOrder();
          } else {
            dialogService.showDialog('Pago aplicado');
          }

          if (payment.type === CLIENT_BALANCE_TYPE) {
            paymentService.updateQuotationClientBalance(
              vm.quotation,
              vm.paymentMethodsGroups
            );
          }
        })
        .catch(function(err) {
          console.log(err);
          authService.showUnauthorizedDialogIfNeeded(err);

          vm.isLoadingPayments = false;
          vm.isLoading = false;
          var error = err.data || err;
          error = error ? error.toString() : '';
          dialogService.showDialog('Hubo un error: ' + error);
        });
    } else {
      createOrder();
    }
  }

  function openAddPaymentDialog(activeMethod, amount) {
    if (activeMethod) {
      var templateUrl = 'views/checkout/payment-cash-dialog.html';
      var controller = DepositController;

      var paymentConfig = _.extend(activeMethod, {
        currency: activeMethod.currency || paymentService.currencyTypes.MXN,
        ammount: _.clone(amount)
      });

      if (paymentConfig.terminals) {
        templateUrl = 'views/checkout/payment-dialog.html';
        controller = TerminalController;
      }

      var useFullScreen =
        ($mdMedia('sm') || $mdMedia('xs')) && vm.customFullscreen;

      var dialogConfig = {
        controller: [
          '$scope',
          '$mdDialog',
          '$filter',
          'formatService',
          'commonService',
          'ewalletService',
          'dialogService',
          'paymentService',
          'payment',
          controller
        ],
        templateUrl: templateUrl,
        parent: angular.element(document.body),
        targetEvent: null,
        clickOutsideToClose: true,
        fullscreen: useFullScreen,
        locals: {
          payment: paymentConfig
        }
      };

      return $mdDialog
        .show(dialogConfig)
        .then(function(payment) {
          addPayment(payment);
        })
        .catch(function(err) {
          resetActiveMethod(vm.quotation);
        });
    } else {
      return commonService.showDialog('Revisa los datos, e intenta de nuevo');
    }
  }

  function openCancelPaymentConfirmDialog(payment) {
    var templateUrl = 'views/cancellations/cancel-payment.html';
    var controller = CancelPaymentController;
    var useFullScreen =
      ($mdMedia('sm') || $mdMedia('xs')) && vm.customFullscreen;
    var dialogConfig = {
      controller: [
        '$scope',
        '$mdDialog',
        'paymentService',
        'payment',
        controller
      ],
      templateUrl: templateUrl,
      parent: angular.element(document.body),
      targetEvent: null,
      clickOutsideToClose: true,
      fullscreen: useFullScreen,
      locals: {
        payment: payment
      }
    };
    $mdDialog.show(dialogConfig).then(function(isConfirmed) {
      if (isConfirmed) {
        cancelPayment(payment);
      }
    });
  }

  function cancelPayment(payment) {
    vm.isLoading = true;
    paymentService
      .cancel(payment.id)
      .then(function(canceledPayment) {
        return quotationService.getById($routeParams.id);
      })
      .then(function(res) {
        if (res.data) {
          var updatedQuotation = res.data;
          updateVMQuotation(updatedQuotation);
          delete vm.activeMethod;
          loadPayments();
          return loadPaymentMethods();
        } else {
          return $q.reject('Hubo un error');
        }
      })
      .then(function() {
        vm.isLoading = false;
        dialogService.showDialog('Pago cancelado');
        if (payment.type === CLIENT_BALANCE_TYPE) {
          paymentService.updateQuotationClientBalance(
            vm.quotation,
            vm.paymentMethodsGroups
          );
        }
      })
      .catch(function(err) {
        console.log(err);
        authService.showUnauthorizedDialogIfNeeded(err);
        vm.isLoading = false;
        var error = err.data || err;
        error = error ? error.toString() : '';
        dialogService.showDialog('Hubo un error: ' + error);
      });
  }

  function calculateRemaining(amount, quotation) {
    return amount - quotation.ammountPaid;
  }

  function createOrder() {
    if (!vm.quotation.Details || vm.quotation.Details.length === 0) {
      dialogService.showDialog('No hay artículos en esta cotización');
      return;
    }

    if (checkoutService.isMinimumPaid(vm.quotation)) {
      vm.isLoadingProgress = true;
      vm.loadingEstimate = 0;
      var createParams = {
        quotationId: vm.quotation.id
      };
      animateProgress();
      orderService
        .create(createParams)
        .then(function(res) {
          vm.isLoadingProgress = false;
          vm.order = res.data;
          if (vm.order.id) {
            quotationService.removeCurrentQuotation();
            $location
              .path('/checkout/order/' + vm.order.id)
              .search({ orderCreated: true });
          }
        })
        .catch(function(err) {
          console.log('err', err);
          var errMsg = '';
          if (err) {
            errMsg = err.data || err;
            errMsg = errMsg ? errMsg.toString() : '';
            dialogService.showDialog(
              'Hubo un error, recarga la página \n' + errMsg
            );
          }
          loadSapLogs(vm.quotation.id);
          vm.isLoadingProgress = false;
        });
    }
  }

  function animateProgress() {
    vm.intervalProgress = $interval(function() {
      vm.loadingEstimate += 5;
      if (vm.loadingEstimate >= 100) {
        vm.loadingEstimate = 0;
      }
    }, 1000);
  }

  $scope.$on('$destroy', function() {
    $mdDialog.cancel();
    if (vm.intervalProgress) {
      $interval.cancel(vm.intervalProgress);
    }
  });
}
