'use strict';

/**
 * @ngdoc directive
 * @name actualApp.directive:productGallery
 * @description
 * # productGallery
 */
angular.module('actualApp').directive('productGallery', [
  'api',
  'productService',
  '$q',
  '$timeout',
  function(api, productService, $q, $timeout) {
    return {
      scope: {
        product: '=',
      },
      templateUrl: 'views/directives/product-gallery.html',
      restrict: 'E',
      link: function postLink(scope) {
        scope.galleryImages = [];
        scope.opts = {
          index: 0,
          history: false,
          hideAnimationDuration: 0,
          showAnimationDuration: 0,
          shareEl: false,
        };

        scope.closeGallery = function() {
          scope.open = false;
        };

        scope.setupGallery = function() {
          setupImages(scope.product);
          $timeout(function() {
            scope.gallery = $('#slick-gallery');
            scope.galleryReel = $('#slick-thumbs');
            scope.gallery.on('afterChange', function(e, slick, currentSlide) {
              $timeout(function() {
                scope.galleryReel.slick('slickGoTo', currentSlide);
                scope.selectedSlideIndex = currentSlide;
              }, 0);
            });
            getImageSizes();
          }, 1000);
        };

        function setupImages() {
          var imageSizeIndexGallery = 2;
          scope.selectedSlideIndex = 0;
          scope.areImagesLoaded = true;
          var imageSize = api.imageSizes.gallery[imageSizeIndexGallery];
          scope.product.files =
            productService.sortProductImages(scope.product) ||
            scope.product.files;

          //Default image services sr
          if (
            scope.product.icons.length >= 0 &&
            scope.product.Service === 'Y'
          ) {
            if (!scope.product.icons[0].url) {
              scope.product.icons[0].url =
                api.baseUrl + '/wallpaper-installation.jpg';
            }
          }

          if (scope.product.icons.length >= 0) {
            var img = {
              src: scope.product.icons[0].url,
              w: 500,
              h: 500,
            };
            scope.galleryImages.push(img);
          }
          if (scope.product.files) {
            //TEMPORAL
            scope.product.files.forEach(function(img) {
              scope.galleryImages.push({
                src: api.baseUrl + '/uploads/products/gallery/' + img.filename,
                w: 500,
                h: 500,
              });
            });
          }
        }

        scope.setGalleryIndex = function(index) {
          scope.selectedSlideIndex = index;
          scope.gallery.slick('slickGoTo', index);
        };

        scope.showGallery = function(i) {
          if (scope.loadedSizes) {
            if (angular.isDefined(i)) {
              scope.opts.index = i;
            }
            scope.open = true;
          }
        };

        function getImageSize(galleryImg) {
          var deferred = $q.defer();
          var img = new Image();
          img.src = galleryImg.src;
          img.onload = function() {
            galleryImg.w = this.width;
            galleryImg.h = this.height;
            scope.$apply();
            deferred.resolve();
          };
          return deferred.promise;
        }

        function getImageSizes() {
          var promises = [];
          for (var i = 0; i < scope.galleryImages.length; i++) {
            promises.push(getImageSize(scope.galleryImages[i]));
          }
          $q.all(promises)
            .then(function() {
              scope.loadedSizes = true;
            })
            .catch(function(err) {
              console.log(err);
            });
        }

        scope.setupGallery();
      },
    };
  },
]);
