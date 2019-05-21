'use strict';
angular.module('actualApp')
  .controller('UsersBrokerCtrl', UsersBrokerCtrl);

function UsersBrokerCtrl($rootScope, commonService, userService,localStorageService){
  var vm = this;
  vm.update = update;
  vm.user = $rootScope.user;
  vm.states = commonService.getStates();
  vm.countries = commonService.getCountries();

  function update(form){
    if(form.$valid){
      vm.isLoading = true;
      userService.update(vm.user).then(function(res){
        vm.isLoading = false;
        commonService.showDialog('Datos actualizados');
        if(res.data.id){
          $rootScope.user = res.data;
          localStorageService.set('user',res.data);
        }
      });
    }
  }
}
