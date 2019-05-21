function TerminalController(
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
  $scope.numberToLetters = formatService.numberToLetters;

  $scope.init = function() {
    $scope.payment = payment;
    $scope.needsVerification = payment.needsVerification;
    $scope.maxAmount = payment.maxAmount >= 0 ? payment.maxAmount : false;
    $scope.payment.options = paymentService.getPaymentOptionsByMethod(
      $scope.payment
    );

    if ($scope.payment.currency === paymentService.currencyTypes.USD) {
      $scope.payment.ammount =
        $scope.payment.ammount / $scope.payment.exchangeRate;
      $scope.payment.ammountMXN = $scope.getAmmountMXN(
        $scope.payment.ammount,
        $scope.payment.exchangeRate
      );

      if ($scope.maxAmount) {
        $scope.payment.maxAmount =
          $scope.maxAmount / $scope.payment.exchangeRate;
        $scope.maxAmount = $scope.payment.maxAmount;
      }
    }

    //ROUNDING
    $scope.payment.ammount = commonService.roundCurrency(
      $scope.payment.ammount
    );
    $scope.payment.remaining = commonService.roundCurrency(
      $scope.payment.remaining
    );
    if ($scope.maxAmount) {
      $scope.maxAmount = commonService.roundCurrency($scope.maxAmount);
    }
    if ($scope.payment.min) {
      $scope.payment.min = commonService.roundCurrency($scope.payment.min);
    }
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.isMinimumValid = function() {
    $scope.payment.min = $scope.payment.min || 0;
    if (
      $scope.payment.ammount === $scope.payment.remaining ||
      ($scope.payment.remaining - $scope.payment.ammount >=
        $scope.payment.min &&
        $scope.payment.ammount >= $scope.payment.min)
    ) {
      $scope.errMsg = '';
      return true;
    }

    if (
      $scope.remaining < $scope.payment.min ||
      $scope.payment.ammount < $scope.payment.min
    ) {
      $scope.errMsg =
        'El monto mínimo para esta forma de pago es ' +
        $filter('currency')($scope.payment.min) +
        ' pesos.';
    } else {
      $scope.errMsg = 'Favor de aplicar el saldo total';
    }
    return false;
  };

  $scope.$watch('payment.ammount', function(newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.isMinimumValid();
    }
  });

  function isValidVerificationCode() {
    if ($scope.payment.type !== paymentService.types.DEPOSIT) {
      return (
        $scope.payment.verificationCode &&
        $scope.payment.verificationCode !== ''
      );
    }
    return true;
  }

  $scope.isValidPayment = function() {
    $scope.payment.min = $scope.payment.min || 0;
    if ($scope.payment.ammount < $scope.payment.min) {
      $scope.minStr = $filter('currency')($scope.payment.min);
      $scope.errMsg = 'La cantidad minima es: ' + $scope.minStr;
    } else {
      $scope.errMin = false;
    }

    if ($scope.maxAmount) {
      return (
        $scope.isMinimumValid() &&
        $scope.payment.ammount <= $scope.maxAmount &&
        isValidVerificationCode() &&
        $scope.payment.ammount >= $scope.payment.min
      );
    }
    return (
      $scope.payment.ammount &&
      isValidVerificationCode() &&
      $scope.payment.ammount >= $scope.payment.min
    );
  };

  $scope.onChangeCard = function(card) {
    $scope.terminal = getSelectedTerminal(card);
  };

  $scope.onChangePaymentNation = function(payment) {
    $scope.payment.card = null;
    $scope.terminal = null;
    $scope.payment.options = [];
    $scope.payment.options = paymentService.getPaymentOptionsByMethod(payment);
  };

  function getSelectedTerminal(card) {
    var option = _.find($scope.payment.options, function(option) {
      return option.card.value === card;
    });
    if (option) {
      return option.terminal;
    }
    return false;
  }

  $scope.openConfirmation = function() {
    $scope.isConfirmationActive = true;
  };

  $scope.cancel = function() {
    $scope.isConfirmationActive = false;
  };

  $scope.save = function() {
    if ($scope.isValidPayment()) {
      if ($scope.payment.options.length > 0) {
        $scope.terminal = getSelectedTerminal($scope.payment.card);
        $scope.payment.terminal = $scope.terminal.value;
      }
      $mdDialog.hide($scope.payment);
    } else {
      $scope.isConfirmationActive = false;
    }
  };

  $scope.init();
}
