function CancelPaymentController($scope, $mdDialog, paymentService, payment) {
  $scope.confirm = function confirm() {
    $mdDialog.hide(true);
  };

  $scope.exit = function exit() {
    $mdDialog.cancel(false);
  };
}
