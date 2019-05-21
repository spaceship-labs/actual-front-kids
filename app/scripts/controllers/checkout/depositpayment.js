function DepositController(
  $scope,
  $mdDialog,
  $filter,
  formatService,
  commonService,
  ewalletService,
  dialogService,
  paymentService,
  payment
) {
  $scope.getAmmountMXN = paymentService.getAmountMXN;
  $scope.isDepositPayment = paymentService.isDepositPayment;
  $scope.isTransferPayment = paymentService.isTransferPayment;
  $scope.isCardPayment = paymentService.isCardPayment;

  $scope.init = function() {
    $scope.payment = payment;
    $scope.maxAmount = payment.maxAmount >= 0 ? payment.maxAmount : false;

    if ($scope.payment.currency === paymentService.currencyTypes.USD) {
      $scope.payment.ammount =
        $scope.payment.ammount / $scope.payment.exchangeRate;
      $scope.payment.ammountMXN = $scope.getAmmountMXN(
        $scope.payment.ammount,
        $scope.payment.exchangeRate
      );

      if ($scope.maxAmount) {
        $scope.payment.maxAmount = paymentService.getAmountUSD(
          $scope.maxAmount,
          $scope.payment.exchangeRate
        );
        $scope.maxAmount = $scope.payment.maxAmount;
      }
    }
    //ROUNDING
    if (payment.type !== ewalletService.ewalletType) {
      $scope.payment.remaining = commonService.roundCurrency(
        $scope.payment.remaining
      );
      $scope.payment.ammount = commonService.roundCurrency(
        $scope.payment.ammount
      );
      $scope.maxAmount = commonService.roundCurrency($scope.maxAmount);
    }
  };

  $scope.isValidPayment = function() {
    $scope.errMsg = '';
    if ($scope.maxAmount) {
      if ($scope.payment.ammount <= $scope.maxAmount) {
        return true;
      } else {
        $scope.errMsg = 'Favor de aplicar el saldo total';
        return false;
      }
    }
    return true;
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.openConfirmation = function() {
    $scope.isConfirmationActive = true;
  };

  $scope.cancel = function() {
    $scope.isConfirmationActive = false;
  };

  $scope.save = function() {
    if ($scope.isValidPayment()) {
      $mdDialog.hide($scope.payment);
    } else {
      $scope.isConfirmationActive = false;
    }
  };

  $scope.init();
}
