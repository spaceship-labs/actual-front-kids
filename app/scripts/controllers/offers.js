'use strict';
angular.module('actualApp').controller('OffersCtrl', OffersCtrl);

function OffersCtrl(
  $scope,
  $q,
  $filter,
  $rootScope,
  packageService,
  quotationService,
  api,
  localStorageService,
  productService,
  deliveryService,
  dialogService,
  activeStore
) {
  var vm = this;
  angular.extend(vm, {
    init: init,
    addPackageToCart: addPackageToCart,
    warehouses: [],
    activeStoreWarehouse: false,
  });

  function init() {
    vm.isLoading = true;
    packageService
      .getPackagesByStore(activeStore.id)
      .then(function(res) {
        vm.packages = res.data || [];
        vm.packages = vm.packages.map(function(p) {
          p.image = api.cdnUrl + '/uploads/groups/' + p.icon_filename;
          return p;
        });
        return loadWarehouses(activeStore);
      })
      .then(function(warehouses) {
        vm.activeStoreWarehouse = _.findWhere(warehouses, {
          id: activeStore.Warehouse,
        });
        vm.isLoading = false;
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  function loadWarehouses() {
    return api.$http.get('/company/find').then(function(res) {
      vm.warehouses = res.data;
      return res.data;
    });
  }

  function addPackageToCart(packageId) {
    vm.isLoading = true;
    var products = [];
    packageService
      .getProductsByPackage(packageId)
      .then(function(res) {
        products = res.data;
        products = mapPackageProducts(products);
        var promises = getProductsDeliveriesPromises(products);
        return $q.all(promises);
      })
      .then(function(deliveries) {
        var packageProducts = mapProductsDeliveryDates(
          products,
          deliveries,
          packageId
        );
        console.log('packageProducts', packageProducts);

        if (packageProducts.length > 0) {
          quotationService.addMultipleProducts(packageProducts);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  function getProductsDeliveriesPromises(products) {
    var promises = [];
    for (var i = 0; i < products.length; i++) {
      promises.push(
        productService.delivery(products[i].ItemCode, activeStore.id)
      );
    }
    return promises;
  }

  function mapPackageProducts(products) {
    var packageProducts = products.map(function(product) {
      var packageProduct = {
        ItemCode: product.ItemCode,
        id: product.id,
        quantity: product.packageRule.quantity,
        name: product.Name || product.ItemName,
      };
      return packageProduct;
    });
    return packageProducts;
  }

  function mapProductsDeliveryDates(products, deliveryDates, packageId) {
    products = products.map(function(product, index) {
      var productDeliveryDates = deliveryDates[index] || [];
      console.log('product: ' + product.ItemCode);
      console.log('deliveryDates', productDeliveryDates);
      product = assignCloserDeliveryDate(
        product,
        productDeliveryDates,
        packageId
      );
      return product;
    });
    var unavailableProducts = groupUnavailableProducts(products);
    if (unavailableProducts.length > 0) {
      showUnavailableStockMsg(unavailableProducts);
      return [];
    }
    return products;
  }

  function groupUnavailableProducts(products) {
    var unavailable = products.filter(function(p) {
      return !p.hasStock;
    });
    return unavailable;
  }

  function assignCloserDeliveryDate(product, productDeliveryDates, packageId) {
    product.hasStock = true;
    productDeliveryDates = $filter('orderBy')(productDeliveryDates, 'date');

    productDeliveryDates = deliveryService.sortDeliveriesByHierarchy(
      productDeliveryDates,
      vm.warehouses,
      vm.activeStoreWarehouse
    );

    console.log('sortDeliveriesByHierarchy', productDeliveryDates);
    productDeliveryDates = removeImmediateDeliveryDates(productDeliveryDates);

    console.log('removeImmediateDeliveryDates', productDeliveryDates);

    for (var i = productDeliveryDates.length - 1; i >= 0; i--) {
      var deliveryDate = productDeliveryDates[i];
      if (product.quantity <= parseInt(deliveryDate.available)) {
        product.shipDate = deliveryDate.date;
        product.originalShipDate = _.clone(deliveryDate.date);
        product.productDate = deliveryDate.productDate;
        product.shipCompany = deliveryDate.company;
        product.shipCompanyFrom = deliveryDate.companyFrom;
        product.promotionPackage = packageId;
        product.PurchaseAfter = deliveryDate.PurchaseAfter;
        product.PurchaseDocument = deliveryDate.PurchaseDocument;
      }
    }
    if (!product.shipDate) {
      product.hasStock = false;
    }
    return product;
  }

  function removeImmediateDeliveryDates(deliveryDates) {
    return deliveryDates.filter(function(deliveryDate) {
      return !deliveryDate.ImmediateDelivery;
    });
  }

  function showUnavailableStockMsg(products) {
    var htmlProducts = products.reduce(function(acum, p) {
      acum += p.name + '(' + p.ItemCode + '), ';
      return acum;
    }, '');
    dialogService.showDialog(
      'No hay stock disponible de los siguientes productos: ' + htmlProducts
    );
  }

  init();
}

OffersCtrl.$inject = [
  '$scope',
  '$q',
  '$filter',
  '$rootScope',
  'packageService',
  'quotationService',
  'api',
  'localStorageService',
  'productService',
  'deliveryService',
  'dialogService',
  'activeStore',
];
