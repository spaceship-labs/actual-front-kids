'use strict';
angular.module('actualApp')
  .controller('HomeCtrl', HomeCtrl);

function HomeCtrl(
  $location, 
  $scope,
  $rootScope,
  api, 
  activeStore
){
  var vm = this;
  angular.extend(vm,{
    areProductsLoaded: false,
    api: api,
  });

  function init(){
    vm.activeStore = activeStore;
    vm.stockProperty = 'productsNum';
    if(activeStore && activeStore.code !== 'proyectos'){
      vm.stockProperty = activeStore.code;
    }
  }

  init();
}

HomeCtrl.$inject = [
  '$location',
  '$scope',
  '$rootScope',
  'api',
  'activeStore'
];
