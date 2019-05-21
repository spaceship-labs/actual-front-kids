'use strict';

/**
 * @ngdoc directive
 * @name actualApp.directive:listingProduct
 * @description
 * # listingProduct
 */
angular.module('actualApp').directive('listingProduct', [
  '$rootScope',
  '$timeout',
  'api',
  'commonService',
  function($rootScope, $timeout, api, commonService) {
    return {
      scope: {
        product: '=',
        showStock: '=?',
        srService: '=?',
      },
      templateUrl: 'views/directives/listing-product.html',
      restrict: 'E',
      link: function postLink(scope) {
        scope.showStock = _.isUndefined(scope.showStock)
          ? true
          : scope.showStock;
        scope.areImagesLoaded = false;
        scope.images = [];
        scope.activeStore = $rootScope.activeStore;

        scope.setUpImages = function() {
          scope.imageSizeIndexGallery = 2;
          scope.imageSizeIndexIcon = 10;
          scope.imageSize = api.imageSizes.gallery[scope.imageSizeIndexGallery];

          //Setting default sr service image
          if (scope.srService && scope.product.icons.length > 0) {
            if (!scope.product.icons[0].url) {
              scope.product.icons[0].url =
                api.baseUrl + '/wallpaper-installation.jpg';
            }
          }

          //Adding icon as gallery first image
          if (scope.product.icons[scope.imageSizeIndexIcon]) {
            scope.images.push(scope.product.icons[0]);
          } else {
            scope.images.push(scope.product.icons[0]);
          }

          //Images for gallery
          if (scope.product.files) {
            scope.imageSize = '';
            scope.product.files.forEach(function(img) {
              scope.images.push({
                url:
                  api.cdnUrl +
                  '/uploads/products/gallery/' +
                  img.filename +
                  '?d=' +
                  scope.imageSize,
              });
            });
          }

          $timeout(function() {
            scope.areImagesLoaded = true;
          }, 500);
        };

        scope.init = function() {
          scope.setUpImages();
        };

        scope.roundCurrency = function(ammount) {
          ammount = commonService.roundIntegerCurrency(ammount);
          return ammount;
        };

        scope.ezOptions = {
          constrainType: 'height',
          constrainSize: 274,
          zoomType: 'lens',
          containLensZoom: true,
          cursor: 'pointer',
        };

        scope.init();
      },
    };
  },
]);
