(function ()
{
    'use strict';

    angular
        .module('actualApp')
        .factory('dialogService', dialogService);

    function dialogController($scope, $mdDialog, params){
      $scope.init = function(){
        $scope.message = params.message || '';
      };
      $scope.closeDialog = function(){
          $mdDialog.hide();
          if(params.callback){
            params.callback();
          }
      };
      $scope.init();
    }

    dialogController.$inject = ['$scope','$mdDialog','params'];

    /** @ngInject */
    function dialogService($q, $log, $mdDialog, $window, $location, $rootScope){
        var service = {
            showDialog: showDialog,
            showDestroyDialog: showDestroyDialog,
        };

        return service;

        function showDialog(message, callback, parent, ev){
          var parentCon = angular.element('body');
          if(parent){
            parentCon = angular.element(parent);
          }

          // Show the sent data.. you can delete this safely.
          $mdDialog.show({
              controller: dialogController,
              templateUrl: 'views/partials/dialog-default.html',
              parent             : parentCon,
              targetEvent        : ev,
              clickOutsideToClose: true,
              locals:{
                params: {
                  callback:callback,
                  message:message
                }
              }
          });
        }

        function showDestroyDialog(ev, destroyPromise,id, redirectUrl, isPromise, loadingFlag){
          var redirectPath = redirectUrl || false;
          var deferred = $q.defer();
          var confirm = $mdDialog.confirm()
                .title('Eliminar')
                .textContent('¿Deseas eliminar este registro?')
                .ariaLabel('Eliminar')
                .targetEvent(ev)
                .ok('Eliminar')
                .cancel('Cancelar');
          $mdDialog.show(confirm).then(function() {
            $rootScope.$emit('destroyingItemStart', true);
            loadingFlag = true;
            destroyPromise(id).then(
              function(res){
                loadingFlag = false;
                $rootScope.$emit('destroyingItemEnd', true);

                if(isPromise){
                  deferred.resolve({destroyed:true});
                }
                else{
                  if(redirectPath){
                    $location.path(redirectPath);
                  }
                  else{
                    $window.location.reload();
                  }
                }
              },
              function(err){
                $rootScope.$emit('destroyingItemEnd', true);
                console.log(err);
                deferred.reject(err);
              }
            );
          }, function() {
            console.log('Cancelado');
          });

          if(isPromise){
            return deferred.promise;
          }

        }

    }

})();
