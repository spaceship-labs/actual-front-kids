'use strict';
angular.module('actualApp')
  .controller('AddquotationCtrl', AddquotationCtrl);

function AddquotationCtrl(
  $rootScope, 
  $q ,
  clientService, 
  quotationService
){
  var vm = this;
  vm.queryClients = queryClients;
  vm.selectedItemChange = selectedItemChange;
  vm.createQuotation = createQuotation;
  vm.addQuotationAndClient = addQuotationAndClient;
  vm.isLoading = false;

  function queryClients(term){
    if(term !== '' && term){
      var params = {term: term, autocomplete: true};
      return clientService.getClients(1,params)
        .then(function(res){
          return res.data.data;
        });
    }
    else{
      return [];
    }
  }

  function selectedItemChange(item){
    if(item && item.id){
      createQuotation(item.id);
    }
  }

  function addQuotationAndClient(){
    createQuotation(null, {createClient: true});
  }

  function createQuotation(clientId, options){
    options = options || {};
    var params = {};
    if(clientId) {
      params.Client = clientId;
    }
    
    vm.isLoading = true;
    quotationService.newQuotation(params, {createClient: options.createClient});
  }
}
AddquotationCtrl.$inject = [
  '$rootScope',
  '$q',
  'clientService',
  'quotationService'
];
