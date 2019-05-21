'use strict';

/**
 * @ngdoc directive
 * @name actualApp.directive:categoryItem
 * @description
 * # categoryItem
 */
angular.module('actualApp')
  .directive('categoryItem',['api' ,function (api) {
    return {
      scope:{
        activeStore:'=',
        category: '=',
        stockKey:'@'
      },
      templateUrl: 'views/directives/category-item.html',
      restrict: 'E',
      link: function postLink(scope) {

        scope.getCategoryBackground = function(handle){
          var image =  '/images/mesas.jpg';
          image = api.baseUrl + '/categories/' + handle + '.jpg';
          return {'background-image' : 'url(' + image + ')'};
        }

      }
    };
  }]);
