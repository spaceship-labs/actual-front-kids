'use strict';
angular.module('actualApp')
  .controller('ClientsListCtrl', ClientsListCtrl);

function ClientsListCtrl(
  $location,
  $routeParams, 
  $q ,
  productService, 
  clientService, 
  userService, 
  $rootScope, 
  dialogService
){

  var vm = this;

  vm.applyFilters = applyFilters;
  vm.user = $rootScope.user;
  vm.columnsClients = [
    {key:'CardCode', label:'CardCode'},
    {key:'CardName', label:'Cliente'},
    {key:'E_Mail', label:'Email'},
    {key:'LicTradNum', label:'RFC'},
    {key:'Phone1', label:'Télefono'},
    {
      key:'Acciones',
      label:'Acceder',
      propId: 'id',
      actions:[
        {url:'/clients/profile/',type:'edit'},
      ]
    },

  ];
  vm.filterOptions = [
    {label: 'Mis clientes', value: vm.user.Seller.SlpCode},
    {label:'Todos los clientes', value: 'none'}
  ];
  vm.apiResourceClients = clientService.getClients;
  vm.filters = {
    SlpCode: 'none'
    //SlpCode: $rootScope.user.Seller.SlpCode
  };

  function applyFilters(){
    $rootScope.$broadcast('reloadTable', true);
  }

}
