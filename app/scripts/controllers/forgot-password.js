'use strict';

angular.module('actualApp')
  .controller('ForgotPasswordCtrl', ForgotPasswordCtrl);

function ForgotPasswordCtrl(
  $rootScope,
  $location,
  api, 
  dialogService,
  userService
){
  var vm = this;
  angular.extend(vm, {
  	sendPasswordRecovery: sendPasswordRecovery
  });

  if($rootScope.user){
  	$location.path('/');
  }

  function sendPasswordRecovery(form){
		if(form.$valid && vm.email){
			vm.isLoading = true;
	  	userService.sendPasswordRecovery(vm.email)
	  		.then(function(res){
	  			vm.isLoading = false;
          if(res.data.success){
            vm.processCompleted = true;
            vm.message = 'Se ha enviado un enlace a tu email para reestablecer tu contraseña';
          }else{
            vm.message = 'Hubo un error, intenta de nuevo';
          }

        	dialogService.showDialog(vm.message);
	  		})
	  		.catch(function(err){
          vm.isLoading = false;
          vm.message = 'Hubo un error, intenta de nuevo';
          dialogService.showDialog(vm.message);	  			
	  		});
		}else{
			dialogService.showDialog('Revisa tus datos e intenta de nuevo');
		}
  }

}

ForgotPasswordCtrl.$inject = [
  '$rootScope',
  '$location',
  'api',
  'dialogService',
  'userService'
];
