'use strict';
angular.module('actualApp')
  .controller('SrServicesCtrl', SrServicesCtrl);

function SrServicesCtrl(
  $scope,
  $rootScope,
  $location, 
  $timeout,
  $routeParams, 
  $q ,
  $mdSidenav,
  srproductService, 
  productService,
  dialogService,
  productSearchService
){
  var vm = this;

  angular.extend(vm, {
    totalResults:0,
    isLoading: true,
    filters: [],
    sortOptions: productSearchService.SORT_OPTIONS,
    doSearch: doSearch,
    loadMore: loadMore,
    scrollTo: scrollTo,
  });

  init();

  function init(){
    vm.search = {
      items: 10,
      page: 1
    };
    vm.isLoading = true;
    doInitialSearch();
  }

  function doInitialSearch(){
    srproductService.search(vm.search).then(function(res){
      vm.totalResults = res.data.total;
      vm.isLoading = false;
      return productService.formatProducts(res.data.services);
    })
    .then(function(fProducts){
      vm.products = fProducts;
    })
    .catch(function(err){
      console.log(err);
      var error = err.data || err;
      error = error ? error.toString() : '';
      dialogService.showDialog('Hubo un error: ' + error );           
    });    
  }


  function doSearch(options){
    if(!options || !angular.isDefined(options.isLoadingMore)){
      vm.search.page = 1;
    }
    vm.isLoading = true;

    var params = vm.search;
    console.log('params', params);

    srproductService.search(params).then(function(res){
      vm.totalResults = res.data.total;
      return productService.formatProducts(res.data.services);
    })
    .then(function(fProducts){
      if(options && options.isLoadingMore){
        var productsAux = angular.copy(vm.products);
        vm.products = productsAux.concat(fProducts);
      }else{
        vm.products = fProducts;
        vm.scrollTo('search-page');
      }
      vm.isLoading = false;
    });
  }

  function loadMore(){
    vm.search.page++;
    vm.doSearch({isLoadingMore: true});
  }

  function scrollTo(target){
    $timeout(
        function(){
          $('html, body').animate({
            scrollTop: $('#' + target).offset().top - 100
          }, 600);
        },
        300
    );
  }
}

SrServicesCtrl.$inject = [
  '$scope',
  '$rootScope',
  '$location',
  '$timeout',
  '$routeParams',
  '$q',
  '$mdSidenav',
  'srproductService',
  'productService',
  'dialogService',
  'productSearchService',
];
