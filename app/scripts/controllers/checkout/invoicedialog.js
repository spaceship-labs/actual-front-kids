function InvoiceDialogController($scope, $mdDialog, $location, quotation, client){

  $scope.continue = function(){
    $mdDialog.hide(true);
  };

  $scope.cancel = function(){
    $mdDialog.cancel();
  };

  $scope.modify = function(){
    console.log('modify');
    $location.path('/clients/profile/' + client.id)
      .search({
        activeTab: 1,
        checkoutProcess: quotation.id,
        continueToPayment: 1
      });
    $mdDialog.hide(false);
  };
}