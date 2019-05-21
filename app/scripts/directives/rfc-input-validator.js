'use strict';

angular.module('actualApp')
  .directive('rfcInputValidator',[ 'clientService',function(clientService){
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ctrl){
        function rfcValidation(ngModelValue){
          ctrl.$setValidity( 'rfcValidation', clientService.validateRfc(ngModelValue) );
          return ngModelValue;
        }

        scope.$watch(attrs['ngModel'], function(newVal, oldVal){
          if(newVal !== oldVal || (!oldVal && !newVal) ){
            rfcValidation(newVal);
          }
        });
      }
    }
  }]);