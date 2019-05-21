'use strict';
angular.module('actualApp')
  .controller('CategoryCtrl', CategoryCtrl);

function CategoryCtrl(
  $routeParams, 
  $mdSidenav, 
  $timeout,
  categoriesService, 
  productService,
  productSearchService
){
  var vm     = this;

  angular.extend(vm,{
    filters: [],
    subnavIndex: 0,
    showLevel2: false,
    showLevel3: false,
    enableSortOptions: false,
    enableFiltersTrigger: false,
    discountFilters: productSearchService.DISCOUNTS_SEARCH_OPTIONS,
    stockFilters: productSearchService.STOCK_SEARCH_OPTIONS,
    societyFilters: productSearchService.SOCIETY_OPTIONS,
    sortOptions: productSearchService.SORT_OPTIONS,

    setSubnavIndex: setSubnavIndex,
    searchByFilters: searchByFilters,
    toggleSearchSidenav: toggleSearchSidenav,
    loadMore: loadMore,
    scrollTo: scrollTo,
    removeSearchValue: removeSearchValue,
    removeMinPrice: removeMinPrice,
    removeMaxPrice: removeMaxPrice,
    removeBrandSearchValue: removeBrandSearchValue,
    removeSelectedDiscountFilter: removeSelectedDiscountFilter,
    removeSelectedStockFilter: removeSelectedStockFilter,
    removeSelectedSocietyFilter: removeSelectedSocietyFilter,
    toggleColorFilter: toggleColorFilter,
    setActiveSortOption: setActiveSortOption,
    getFilterById: getFilterById
  });


  function setSubnavIndex(index){
    vm.subnavIndex = index;
  }

  function init(){
    var activeSortOptionKey = 'slowMovement';
    vm.activeSortOption = _.findWhere(vm.sortOptions,{key: activeSortOptionKey});
        
    vm.search = {
      items: 10,
      page: 1,
      category: $routeParams.category,
      sortOption: vm.activeSortOption
    };

    loadCustomBrands();
    loadCategories();
    doInitialProductsSearch();
  }

  function loadCategories() {
    vm.isLoading = true;
    categoriesService.getCategoryByHandle($routeParams.category).then(function(res){
      vm.category = res.data;

      if(vm.category && vm.category.Childs.length === 0){
      	vm.enableSortOptions = true;
        vm.enableFiltersTrigger = true;
      }

      var hasLevel2Categories = false;
      var filters = vm.category.Filters.map(function(filter){
        return filter.id;
      });
      productService.getAllFilters({ids: filters}).then(function(res){
        vm.filters = res.data;

        vm.filters = vm.filters.map(function(filter){
          filter.orderBy = filter.customOrder ? 'createdAt' : 'Name';
          return filter;
        });

        vm.filters = sortFiltersByList(vm.filters);
        onCloseSidenav();

      });
      hasLevel2Categories = !!vm.category.Childs.find(function(child) {
        return child.CategoryLevel === 2;
      });
      vm.showLevel2 = hasLevel2Categories;
      vm.showLevel3 = !hasLevel2Categories;
      vm.isLoading = false;
    });

  }

  function onCloseSidenav(){
    $mdSidenav('searchFilters').onClose(function () {
      for(var i = 0; i < vm.filters.length; i++){
        vm.filters[i].active = false;
      }
      vm.isBrandFilterActive = false;
      vm.isDiscountFilterActive = false;
      vm.isStockFilterActive = false;
    });
  }  

  function sortFiltersByList(filters){
    var sortList = ['estilo','material','color','forma'];
    var sorted =  filters.sort(function(a,b){
      return sortList.indexOf(b.Handle) - sortList.indexOf(a.Handle);
    });
    return sorted;
  }

  function loadCustomBrands(){
    productService.getCustomBrands()
      .then(function(res){
        vm.customBrands = res.data;
        console.log('customBrands', vm.customBrands);
      })
      .catch(function(err){
        console.log('err', err);
      });    
  }

  function doInitialProductsSearch(){
    vm.isLoadingProducts = true;
    /*
    if(vm.search.sortOption.key === 'slowMovement' && vm.enableSortOptions){
      vm.search.slowMovement = true;
    }else{
      vm.search.slowMovement = false;
    } 
    */   
    productService.searchCategoryByFilters(vm.search)
      .then(function(res){
        console.log('res', res);
        var products = res.data.products || [];
        vm.totalProducts = res.data.total;
        vm.isLoadingProducts = false;
        return productService.formatProducts(products);
      })
      .then(function(productsFormatted){
        vm.products = productsFormatted;
        console.log('vm.products', vm.products);
      })
      .catch(function(err){
        console.log('err', err);
      });
  }  

  function searchByFilters(options){
    if(!options || !angular.isDefined(options.isLoadingMore)){
      vm.search.page = 1;
    }

    vm.isLoadingProducts = true;

    //SEARCH VALUES
    vm.searchValues = productSearchService.getSearchValuesByFilters(vm.filters);
    var searchValuesIds = productSearchService.getSearchValuesIds(vm.searchValues);

    //BRANDS
    vm.brandSearchValues = vm.customBrands.filter(function(brand){
      return brand.selected;
    });
    var brandSearchValuesIds = vm.brandSearchValues.map(function(brand){
      return brand.id;
    });

    //DISCOUNTS
    vm.discountFiltersSelected = vm.discountFilters.filter(function(discount){
      return discount.selected;
    });
    var discountFiltersValues = vm.discountFiltersSelected.map(function(discount){
      return discount.value;
    });

    //STOCK
    vm.stockFiltersSelected = vm.stockFilters.filter(function(stock){
      return stock.selected;
    });
    var stockFiltersValues = vm.stockFiltersSelected.map(function(stock){
      return stock.value;
    });

    //SOCIETIES
    vm.societyFiltersSelected = vm.societyFilters.filter(function(society){
      return society.selected;
    });
    var societyFiltersValues = vm.societyFiltersSelected.map(function(society){
      return society.code;
    });


    var params = {
      filtervalues: searchValuesIds,
      brandsIds: brandSearchValuesIds,
      discounts: discountFiltersValues,
      societyCodes: societyFiltersValues,

      stockRanges: stockFiltersValues,
      sortOption: vm.activeSortOption,

      minPrice: vm.minPrice,
      maxPrice: vm.maxPrice,
      category: $routeParams.category,
      page: vm.search.page,
    };

    /*
    if(vm.activeSortOption && vm.activeSortOption.key === 'slowMovement' && vm.enableSortOptions){
      params.slowMovement = true;      
    }
    */

    productService.searchCategoryByFilters(params)
      .then(function(res){
        var products = res.data.products || [];
        vm.totalProducts = res.data.total;
        return productService.formatProducts(products);
      })
      .then(function(productsFormatted){
        if(options && options.isLoadingMore){
          var productsAux = angular.copy(vm.products);
          vm.products = productsAux.concat(productsFormatted);
        }else{
          vm.products = productsFormatted;
          vm.scrollTo('category-page');
        }

        vm.isLoadingProducts = false;
      })
      .catch(function(err){
        console.log('err', err);
      });
  }

  function removeSearchValue(value){
    var removeIndex = vm.searchValues.indexOf(value);
    if(removeIndex > -1){
      vm.searchValues.splice(removeIndex, 1);
    }
    vm.filters.forEach(function(filter){
      filter.Values.forEach(function(val){
        if(val.id === value.id){
          val.selected = false;
        }
      });
    });

    searchByFilters();
  }

  function removeBrandSearchValue(value){
    var removeIndex = vm.brandSearchValues.indexOf(value);
    if(removeIndex > -1){
      vm.brandSearchValues.splice(removeIndex, 1);
    }
    vm.customBrands.forEach(function(brand){
      if(brand.id === value.id){
        brand.selected = false;
      }
    });

    searchByFilters();
  }

  function removeSelectedDiscountFilter(discount){
    var removeIndex = vm.discountFiltersSelected.indexOf(discount);
    if(removeIndex > -1){
      vm.discountFiltersSelected.splice(removeIndex, 1);
    }
    vm.discountFilters.forEach(function(discountFilter){
      if(discountFilter.value === discount.value){
        discountFilter.selected = false;
      }
    });

    searchByFilters();

  }

  function removeSelectedStockFilter(stockRangeObject){
    var removeIndex = vm.stockFiltersSelected.indexOf(stockRangeObject);
    if(removeIndex > -1){
      vm.stockFiltersSelected.splice(removeIndex, 1);
    }
    vm.stockFilters.forEach(function(stockFilters){
      if(stockFilters.id === stockRangeObject.id){
        stockFilters.selected = false;
      }
    });

    searchByFilters();
  }  

  function removeSelectedSocietyFilter(society){
    var removeIndex = vm.societyFiltersSelected.indexOf(society);
    if(removeIndex > -1){
      vm.societyFiltersSelected.splice(removeIndex, 1);
    }
    vm.societyFilters.forEach(function(societyFilter){
      if(societyFilter.code === society.code){
        societyFilter.selected = false;
      }
    });

    searchByFilters();
  } 


  function removeMinPrice(){
    delete vm.minPrice;
    searchByFilters();
  }

  function removeMaxPrice(){
    delete vm.maxPrice;
    searchByFilters();
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

  function loadMore(){
    vm.search.page++;
    vm.searchByFilters({isLoadingMore: true});
  }

  function toggleColorFilter(value, filter){
    value.selected = !value.selected;
    vm.searchByFilters();
  }

  function toggleSearchSidenav(filterHandleToOpen){
    $mdSidenav('searchFilters').toggle();
    
    if(filterHandleToOpen){
      var filterIndexToOpen = _.findIndex(vm.filters, function(filter){
        return filter.Handle === filterHandleToOpen;
      });
      if(filterIndexToOpen >= 0){
        vm.filters[filterIndexToOpen].active = true;
      }
      else{

        switch(filterHandleToOpen){
          case 'brand':
            vm.isBrandFilterActive = true;
            break;
          case 'discount':
            vm.isDiscountFilterActive = true;
            break;
          case 'stock':
            vm.isStockFilterActive = true;
            break;
        }
      }
    }
  }


  function setActiveSortOption(sortOption){

    if(vm.activeSortOption.key  === sortOption.key){
      sortOption.direction = sortOption.direction === 'ASC' ? 'DESC' : 'ASC';
    }
    else if(sortOption.key === 'salesCount' || sortOption.key === 'slowMovement'){
      sortOption.direction = 'DESC';
    }
    else{
      sortOption.direction = 'ASC';
    }

    vm.activeSortOption = sortOption;
    searchByFilters();
  }

  function getFilterById(filterId){
    return _.findWhere(vm.filters, {id: filterId});
  }


  init();
}

CategoryCtrl.$inject = [
  '$routeParams',
  '$mdSidenav',
  '$timeout',
  'categoriesService',
  'productService',
  'productSearchService'
];
