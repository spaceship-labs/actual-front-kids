'use strict';

angular.module('actualApp')
  .controller('ResetPasswordCtrl', ResetPasswordCtrl);

function ResetPasswordCtrl(
  $rootScope,
  $location,
  api, 
  dialogService,
  userService
){
  var vm = this;
  angular.extend(vm, {
  	resetPassword: resetPassword
  });

	var urlParams = $location.search();
	var email = urlParams.email;
	var token = urlParams.token;
	if(!token || !email){
		$location.path('/');
	}

  if($rootScope.user){
  	$location.path('/');
  }

  function resetPassword(form){
		if(form.$valid && vm.password && vm._password && (vm.password === vm._password)){
			vm.isLoading = true;

			var params = {
        password: vm.password,
        confirm_pass: vm._password,
        email: email,
        token: token
			};

	  	userService.resetPassword(params)
	  		.then(function(res){
	  			vm.isLoading = false;
          if(res.data.success){
            vm.processCompleted = true;
            vm.message = 'Tu contraseña se ha actualizado con exito';
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

ResetPasswordCtrl.$inject = [
  '$rootScope',
  '$location',
  'api',
  'dialogService',
  'userService'
];
