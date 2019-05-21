'use strict';

/**
 * @ngdoc directive
 * @name actualApp.directive:sidebarCategories
 * @description
 * # sidebarCategories
 */
angular.module('actualApp')
  .directive('sidebarCategories', SidebarCategories);

function SidebarCategories(
  categoriesService, 
  $timeout, 
  $rootScope, 
  $location, 
  localStorageService
) {
  return {
    templateUrl: 'views/directives/sidebar-categories.html',
    restrict: 'E',
    scope:{
      categoriesTree: '=',
      selectedCategoryId: '=',
      activeStore: '=?activeStore'
    },
    controller: ['$scope', '$rootScope' ,function($scope, $rootScope) {
      $scope.storeCode = false;

      $scope.init = function(){
        $scope.isActiveOffers = false;
        if($location.path() === '/ofertas'){
          $scope.isActiveOffers = true;
        }

        if($scope.activeStore){
          $scope.storeCode = $scope.activeStore.code;
        }
        else{
          $scope.storeCode = 'productsNum';
        }
      };

      $scope.$on('$routeChangeSuccess', function(next, current) {
        if($location.path() == '/ofertas'){
          $scope.isActiveOffers = true;
        }
      });

      $scope.$watch('categoriesTree', function(newVal, oldVal){
        if(newVal != oldVal){
          $scope.showSelectedCategoryId();
        }
      });

      $scope.$watch('selectedCategoryId', function(newVal, oldVal){
        if(newVal != oldVal && angular.isArray($scope.categoriesTree) ){
          $scope.showSelectedCategoryId();
        }
      });

      var mainDataListener = function(){};
      mainDataListener = $rootScope.$on('mainDataLoaded', function(e, mainData){
        $scope.activeStore = mainData.activeStore;
        $scope.storeCode = $scope.activeStore.code;
      });

      $scope.showSelectedCategoryId = function(){
        var selected = $scope.selectedCategoryId;
        var activeCountL1 = 0;
        var activeCountL2 = 0;
        var activeCountL3 = 0;
        if($scope.categoriesTree){
          $scope.categoriesTree.forEach(function(mainCategory){
            var hasSelectedAsChild = _.findWhere(mainCategory.Childs, {id: selected});
            var hasSelectedAsGrandChild = false;
            mainCategory.Childs.forEach(function(child){
              if(child.Childs){
                child.Childs.forEach(function(grandChild){
                  if(grandChild.id == selected && activeCountL3 < 1){
                    hasSelectedAsGrandChild = true;
                  }
                });
              }
            });
            if(mainCategory.id == selected ||  hasSelectedAsChild || hasSelectedAsGrandChild && activeCountL1<1){
              mainCategory.isActive = true;
              activeCountL1++;
              if(hasSelectedAsChild || hasSelectedAsGrandChild){
                mainCategory.Childs.forEach(function(category){
                  var hasSelectedAsChildAux = _.findWhere(category.Childs, {id: selected});
                  if(category.id == selected || hasSelectedAsChildAux && activeCountL2<1){
                    category.isActive = true;
                    activeCountL2++;
                    if(hasSelectedAsChildAux && activeCountL3 < 1){
                      hasSelectedAsChildAux.isActive = true;
                      activeCountL3++;
                    }
                  }
                });
              }
            }
          });
        }
      }

      $scope.toggleMainCategory = function(mainCategory,event){
        if(mainCategory.Childs){
          event.preventDefault();
        }

        $scope.categoriesTree.forEach(function(category){
          if(category.Handle != mainCategory.Handle){
            category.isActive = false;
            //Closing also child categories
            category.Childs.forEach(function(subCategory){
              subCategory.isActive = false;
            });
          }
        });

        mainCategory.isActive = !mainCategory.isActive;

      };

      $scope.toggleCategory = function(category, event){
        if(category.Childs){
          event.preventDefault();
        }
        category.isActive = !category.isActive

      };

      $scope.getCategoryIcon = function(handle){
        return categoriesService.getCategoryIcon(handle);
      };


      $scope.cleanUp = function(){
        $scope.categoriesTree.forEach(function(category){
          category.isActive = false;
          //Closing also child categories
          if(category.Childs){
            category.Childs.forEach(function(subCategory){
              subCategory.isActive = false;
              if(subCategory.Childs){
                subCategory.Childs.forEach(function(innerCategory){
                  innerCategory.isActive = false;
                });
              }
            });
          }
        });
      };

      $scope.$on('$destroy', function() {
        $scope.cleanUp();
        mainDataListener();
      });

      $scope.init();

    }]
  };
}

SidebarCategories.$inject = [
  'categoriesService',
  '$timeout',
  '$rootScope',
  '$location',
  'localStorageService'
];