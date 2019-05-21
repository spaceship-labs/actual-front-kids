'use strict';
angular.module('actualApp').controller('ProductCtrl', ProductCtrl);

function ProductCtrl(
  productService,
  $log,
  $location,
  $rootScope,
  $routeParams,
  $q,
  $timeout,
  $mdDialog,
  $mdMedia,
  $sce,
  $filter,
  api,
  quotationService,
  pmPeriodService,
  localStorageService,
  deliveryService,
  cartService,
  commonService,
  categoriesService,
  dialogService,
  ENV,
  activeStore
) {
  var vm = this;
  var activeStoreWarehouse = false;

  angular.extend(vm, {
    customFullscreen: $mdMedia('xs') || $mdMedia('sm'),
    toggleVariants: true,
    variants: [],
    applyDiscount: applyDiscount,
    addToCart: addToCart,
    getQtyArray: getQtyArray,
    getWarehouseName: getWarehouseName,
    getPiecesString: getPiecesString,
    init: init,
    isImmediateDelivery: isImmediateDelivery,
    isImmediateDeliveryGroup: isImmediateDeliveryGroup,
    isLoading: true,
    isSRService: isSRService,
    resetProductCartQuantity: resetProductCartQuantity,
    trustAsHtml: trustAsHtml,
    sas: commonService.getSasHash(),
    ENV: ENV,
    activeStore: activeStore
  });

  init($routeParams.id);

  function init(productId, reload) {
    console.log('start loading product', new Date());
    vm.filters = [];
    vm.activeVariants = {};
    vm.galleryImages = [];
    vm.isLoading = true;
    vm.isLoadingDeliveries = true;

    var params = { populateFields: ['CustomBrand'] };

    productService
      .getById(productId, params)
      .then(function(res) {
        var productFound = res.data.data;
        if (!productFound || !productFound.ItemCode) {
          dialogService.showDialog('No se encontro el articulo');
        }

        return productService.formatSingleProduct(productFound);
      })
      .then(function(formattedProduct) {
        vm.product = formattedProduct;
        vm.mainPromo = vm.product.mainPromo;
        vm.lowestCategory = categoriesService.getLowestCategory(
          vm.product.Categories
        );
        vm.productCart = {
          quantity: 1
        };
        if (reload) {
          $location
            .path('/product/' + productId, false)
            .search({ variantReload: 'true' });
          loadProductFilters(vm.product);
        } else {
          loadProductFilters(vm.product);
          loadWarehouses(activeStore);
          loadVariants(vm.product);
        }

        vm.isLoading = false;
        var activeQuotationId = quotationService.getActiveQuotationId();
        return productService.delivery(
          productId,
          activeStore.id,
          activeQuotationId
        );
      })
      .then(function(deliveries) {
        setUpDeliveries(deliveries);
      })
      .catch(function(err) {
        console.log(err);
      });

    pmPeriodService
      .getActive()
      .then(function(res) {
        vm.validPayments = res.data;
      })
      .catch(function(err) {
        $log.error(err);
      });
  }

  function setUpDeliveries(deliveries) {
    deliveries = $filter('orderBy')(deliveries, 'date');

    vm.deliveries = deliveries;
    vm.deliveriesGroups = deliveryService.groupDeliveryDates(vm.deliveries);
    vm.deliveriesGroups = $filter('orderBy')(vm.deliveriesGroups, 'date');
    vm.available = deliveryService.getAvailableByDeliveries(deliveries);

    if (vm.deliveries && vm.deliveries.length > 0) {
      vm.productCart.deliveryGroup = vm.deliveriesGroups[0];
    } else {
      vm.productCart.quantity = 0;
    }
    vm.isLoadingDeliveries = false;
  }

  function loadVariants(product) {
    productService
      .loadVariants(product, activeStore)
      .then(function(variants) {
        vm.variants = variants;
        vm.hasVariants = checkIfHasVariants(vm.variants);
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  function checkIfHasVariants(variants) {
    var hasVariants = false;
    for (var key in variants) {
      if (variants[key].products.length > 1) {
        hasVariants = true;
      }
    }
    return hasVariants;
  }

  function getPiecesString(stock) {
    var str = 'piezas';
    if (stock === 1) {
      str = 'pieza';
    }
    return str;
  }

  function getWarehouseName(whsId) {
    var name = '';
    if (vm.warehouses) {
      name = _.findWhere(vm.warehouses, { id: whsId }).WhsName;
    }
    return name;
  }

  function loadWarehouses(activeStore) {
    api.$http
      .get('/company/find')
      .then(function(res) {
        vm.warehouses = res.data;
        activeStoreWarehouse = _.findWhere(vm.warehouses, {
          id: activeStore.Warehouse
        });
      })
      .catch(function(err) {
        $log.error(err);
      });
  }

  function applyDiscount(discount, price) {
    var result = price;
    result = price - (price / 100) * discount;
    return result;
  }

  function trustAsHtml(string) {
    return $sce.trustAsHtml(string);
  }

  function loadProductFilters(product) {
    productService
      .getAllFilters({ quickread: true })
      .then(function(res) {
        var data = res.data || [];
        var filters = data.map(function(filter) {
          filter.Values = [];
          product.FilterValues.forEach(function(value) {
            if (value.Filter === filter.id) {
              filter.Values.push(value);
            }
          });
          return filter;
        });
        vm.filters = filters.filter(function(filter) {
          return filter.Values.length > 0;
        });
      })
      .catch(function(err) {
        $log.error(err);
      });
  }

  function addToCart($event) {
    if (vm.isLoadingDeliveries) {
      return;
    }

    vm.isLoading = true;
    console.log('vm.productCart.deliveryGroup', vm.productCart.deliveryGroup);
    var productCartItems = cartService.getProductCartItems(
      vm.productCart.deliveryGroup,
      vm.productCart.quantity,
      vm.warehouses,
      activeStoreWarehouse
    );

    console.log('productCartItems', productCartItems);
    if (productCartItems.length === 1) {
      var cartItem = productCartItems[0];
      var params = cartService.buildAddProductToCartParams(
        vm.product.id,
        cartItem
      );
      console.log('params', params);
      quotationService.addProduct(vm.product.id, params);
    } else if (productCartItems.length > 1) {
      var multiParams = productCartItems.map(function(cartItem) {
        return cartService.buildAddProductToCartParams(vm.product.id, cartItem);
      });
      quotationService.addMultipleProducts(multiParams);
    }
  }

  function resetProductCartQuantity() {
    vm.productCart = cartService.resetProductCartQuantity(vm.productCart);
  }

  function getQtyArray(n) {
    n = n || 0;
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(i + 1);
    }
    return arr;
  }

  function isImmediateDelivery(date) {
    var currentDate = moment().startOf('date');
    date = moment(date).startOf('date');
    return currentDate.format() === date.format() && !isSRService(vm.product);
  }

  function isImmediateDeliveryGroup(deliveryGroup) {
    return (
      isImmediateDelivery(deliveryGroup.date) && deliveryGroup.ImmediateDelivery
    );
  }

  function isSRService(product) {
    return product.Service === 'Y';
  }
}

ProductCtrl.$inject = [
  'productService',
  '$log',
  '$location',
  '$rootScope',
  '$routeParams',
  '$q',
  '$timeout',
  '$mdDialog',
  '$mdMedia',
  '$sce',
  '$filter',
  'api',
  'quotationService',
  'pmPeriodService',
  'localStorageService',
  'deliveryService',
  'cartService',
  'commonService',
  'categoriesService',
  'dialogService',
  'ENV',
  'activeStore'
];
