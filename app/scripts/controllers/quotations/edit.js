'use strict';
angular
  .module('actualApp')
  .controller('QuotationsEditCtrl', QuotationsEditCtrl);

function QuotationsEditCtrl(
  $log,
  $location,
  $routeParams,
  $q,
  $scope,
  localStorageService,
  $rootScope,
  $mdMedia,
  $mdDialog,
  $filter,
  quotationService,
  api,
  dialogService,
  userService,
  packageService,
  paymentService,
  deliveryService,
  authService,
  siteService,
  storeService,
  ENV,
  activeStore
) {
  var vm = this;
  angular.extend(vm, {
    newRecord: {},
    api: api,
    brokers: [],
    isLoadingRecords: false,
    isLoading: true,
    recordTypes: quotationService.getRecordTypes(),
    closeTypes: quotationService.getClosingReasons(),
    timePickerOptions: {
      step: 20,
      timeFormat: 'g:ia',
      appendTo: 'body',
      disableTextInput: true,
    },
    addNewProduct: addNewProduct,
    addRecord: addRecord,
    alertRemoveDetail: alertRemoveDetail,
    appliesForPackageOrPromotionDiscount: appliesForPackageOrPromotionDiscount,
    attachImage: attachImage,
    closeQuotation: closeQuotation,
    continueBuying: continueBuying,
    daysDiff: daysDiff,
    getPromotionPackageById: getPromotionPackageById,
    getUnitPriceWithDiscount: getUnitPriceWithDiscount,
    getWarehouseById: getWarehouseById,
    isUserAdminOrManager: authService.isUserAdminOrManager,
    isValidStock: isValidStock,
    print: print,
    promotionPackages: [],
    quotationStore: {},
    removeDetail: removeDetail,
    removeDetailsGroup: removeDetailsGroup,
    sendByEmail: sendByEmail,
    showDetailGroupStockAlert: showDetailGroupStockAlert,
    toggleRecord: toggleRecord,
    deattachImage: deattachImage,
    methodsHaveMsi: methodsHaveMsi,
    setEstimatedCloseDate: setEstimatedCloseDate,
    getSourceName: getSourceName,
    getSourceTypeName: getSourceTypeName,
    ENV: ENV,
    activeStore: activeStore,
  });

  init($routeParams.id);

  $rootScope.$on('changedActiveQuotationSource', function(e, params) {
    if (vm.quotation && params.source && params.sourceType) {
      vm.quotation.source = params.source;
      vm.quotation.sourceType = params.sourceType;
    }
  });

  function init(quotationId) {
    vm.promotionPackages = [];
    vm.isLoading = true;
    vm.isLoadingDetails = true;

    loadWarehouses();
    loadBrokers();
    showAlerts();

    console.log('start loading quotation', new Date());

    quotationService
      .getById(quotationId)
      .then(function(res) {
        vm.isLoading = false;
        vm.quotation = res.data;

        if (vm.quotation.estimatedCloseDate) {
          vm.estimatedCloseDateWrapper.setDate(
            new Date(vm.quotation.estimatedCloseDate)
          );
        }

        quotationService.setActiveQuotation(vm.quotation.id);

        vm.status = 'Abierta';
        if (vm.quotation.Order || vm.quotation.isClosed) {
          vm.status = 'Cerrada';
        }

        loadPaymentMethods();
        loadQuotationStore(vm.quotation);

        return quotationService.populateDetailsWithProducts(vm.quotation, {
          populate: ['FilterValues'],
        });
      })
      .then(function(details) {
        vm.quotation.Details = details;
        return quotationService.loadProductsFilters(vm.quotation.Details);
      })
      .then(function(detailsWithFilters) {
        vm.quotation.Details = detailsWithFilters;
        vm.quotation.DetailsGroups = deliveryService.groupDetails(
          vm.quotation.Details
        );
        vm.isLoadingDetails = false;
        vm.isValidatingStock = true;
        return quotationService.getCurrentStock(vm.quotation.id);
      })
      .then(function(response) {
        var detailsStock = response.data;
        vm.quotation.Details = quotationService.mapDetailsStock(
          vm.quotation.Details,
          detailsStock
        );
        vm.quotation.DetailsGroups = deliveryService.groupDetails(
          vm.quotation.Details
        );

        vm.isValidatingStock = false;
        vm.isLoadingRecords = true;
        return quotationService.getRecords(vm.quotation.id);
      })
      .then(function(result) {
        if (result) {
          vm.quotation.Records = result.data;
        }
        vm.isLoadingRecords = false;
      })
      .catch(function(err) {
        console.log(err);

        authService.showUnauthorizedDialogIfNeeded(err);

        var error = err.data || err;
        error = error ? error.toString() : '';
        dialogService.showDialog('Hubo un error: ' + error);
      });
  }

  function loadQuotationStore(quotation) {
    var storeId = quotation.Store;
    storeService.getById(storeId).then(function(store) {
      vm.quotationStore = store;
      console.log('vm.quotationStore', vm.quotationStore);
    });
  }

  function loadBrokers() {
    userService
      .getBrokers()
      .then(function(brokers) {
        vm.brokers = brokers;
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  function showAlerts() {
    if ($location.search().startQuotation) {
      //dialogService.showDialog('Cotizacion creada, agrega productos a tu cotización');
    }
    if ($location.search().createdClient) {
      //dialogService.showDialog('Cliente registrado');
    }

    if ($location.search().missingAddress) {
      dialogService.showDialog('Asigna una dirección de entrega');
    }

    if ($location.search().stockAlert) {
      quotationService.showStockAlert();
    }
  }

  function loadWarehouses() {
    api.$http
      .get('/company/find')
      .then(function(res) {
        vm.warehouses = res.data;
      })
      .catch(function(err) {
        $log.error(err);
      });
  }

  function loadPaymentMethods() {
    vm.isLoadingPaymentMethods = true;
    quotationService
      .getPaymentOptions(vm.quotation.id)
      .then(function(response) {
        var groups = response.data || [];
        vm.paymentMethodsGroups = formatPaymentMethodsGroups(groups);
        vm.isLoadingPaymentMethods = false;
      })
      .catch(function(err) {
        console.log('err', err);
        vm.isLoadingPaymentMethods = false;
      });
  }

  function methodsHaveMsi(methods) {
    return _.every(methods, function(method) {
      return method.msi;
    });
  }

  function formatPaymentMethodsGroups(paymentMethodsGroups) {
    for (var i = 0; i < paymentMethodsGroups.length; i++) {
      var subGroupsObject = _.groupBy(
        paymentMethodsGroups[i].methods,
        'mainCard'
      );
      var subGroups = [];
      for (var key in subGroupsObject) {
        subGroups.push(subGroupsObject[key]);
      }
      paymentMethodsGroups[i].subGroups = subGroups;
    }
    return paymentMethodsGroups;
  }

  function print() {
    window.print();
  }

  function sendByEmail() {
    vm.isLoading = true;
    quotationService
      .sendByEmail(vm.quotation.id)
      .then(function(res) {
        vm.isLoading = false;
        dialogService.showDialog('Email enviado al cliente');
      })
      .catch(function(err) {
        $log.error(err);
        vm.isLoading = false;
        dialogService.showDialog('Hubo un error, intentalo de nuevo');
      });
  }

  function getWarehouseById(id) {
    var warehouse = {};
    if (vm.warehouses) {
      warehouse = _.findWhere(vm.warehouses, { id: id });
    }
    return warehouse;
  }

  function toggleRecord(record) {
    vm.quotation.Records.forEach(function(rec) {
      if (rec.id != record.id) {
        rec.isActive = false;
      }
    });
    record.isActive = !record.isActive;
  }

  function appliesForPackageOrPromotionDiscount(detail) {
    var appliesFor = false;
    if (detail.PromotionPackageApplied) {
      appliesFor = 'packageDiscount';
    } else if (detail.discount) {
      appliesFor = 'promoDiscount';
    }
    return appliesFor;
  }

  function setEstimatedCloseDate() {
    console.log(
      'pikaday vm.quotation.estimatedCloseDateWrapper',
      vm.estimatedCloseDateWrapper
    );
    console.log(
      'vm.quotation.estimatedCloseDateHolder',
      vm.quotation.estimatedCloseDateHolder
    );

    if (vm.quotation.estimatedCloseDateHolder && vm.estimatedCloseDateWrapper) {
      vm.isLoadingEstimatedCloseDate = true;
      vm.quotation.estimatedCloseDate = moment(vm.estimatedCloseDateWrapper._d)
        .endOf('day')
        .toDate();

      quotationService
        .setEstimatedCloseDate(vm.quotation.id, vm.quotation.estimatedCloseDate)
        .then(function(res) {
          if (res.data) {
            vm.quotation.estimatedCloseDate = res.data;
            dialogService.showDialog('Fecha estimada de cierre guardada');
          } else {
            dialogService.showDialog(
              'Hubo un error al guardar los datos, revisa tu información'
            );
          }
          vm.isLoadingEstimatedCloseDate = false;
        })
        .catch(function(err) {
          console.log('err', err);
          dialogService.showDialog(
            'Hubo un error al guardar los datos, revisa tu información'
          );
          vm.isLoadingEstimatedCloseDate = false;
        });
    } else {
      dialogService.showDialog(
        'Ingresa la fecha estimada de cierre para guardar'
      );
    }
  }

  function addRecord(form) {
    if (vm.newRecord.eventType && form.$valid) {
      vm.isLoadingRecords = true;

      //Formatting date and time
      var date = moment(vm.newRecord.date._d);
      var time = vm.newRecord.time;
      var year = date.get('year');
      var month = date.get('month');
      var day = date.get('date');
      var dateTime = moment(time)
        .set('year', year)
        .set('month', month)
        .set('date', day)._d;

      vm.newRecord.dateTime = dateTime;

      var params = {
        dateTime: vm.newRecord.dateTime,
        eventType: vm.newRecord.eventType,
        notes: vm.newRecord.notes,
        file: vm.newRecord.file,
      };

      quotationService
        .addRecord(vm.quotation.id, params)
        .then(function(res) {
          var record = res.data;

          if (record) {
            vm.quotation.Records.push(record);
          }

          vm.newRecord = {};
          vm.isLoadingRecords = false;
          dialogService.showDialog('Evento guardado');
        })
        .catch(function(err) {
          dialogService.showDialog('Hubo un error ' + (err.data || err));
          $log.error(err);
          vm.isLoadingRecords = false;
        });
    } else {
      dialogService.showDialog('Datos incompletos, revisa los campos');
    }
  }

  function closeQuotation(form, closeReason, extraNotes) {
    if (closeReason) {
      vm.isLoading = true;
      var params = {
        notes: extraNotes,
        closeReason: closeReason,
        extraNotes: extraNotes,
      };
      quotationService
        .closeQuotation(vm.quotation.id, params)
        .then(function(res) {
          var record = res.data.record;
          var quotation = res.data.quotation;
          if (record) {
            vm.quotation.Records.push(record);
          }
          if (quotation) {
            vm.quotation.isClosed = quotation.isClosed;
            if (vm.quotation.isClosed) {
              vm.status = 'Cerrada';
            }
          }
          vm.isLoading = false;
          vm.quotation.Records.forEach(function(rec) {
            rec.isActive = false;
          });
        })
        .catch(function(err) {
          $log.error(err);
        });
    }
  }

  function getPromotionPackageById(packageId) {
    return _.findWhere(vm.promotionPackages, { id: packageId });
  }

  function attachImage(file) {
    vm.newRecord.file = file;
  }

  function deattachImage() {
    if (vm.newRecord) {
      delete vm.newRecord.file;
    }
  }

  function addNewProduct() {
    quotationService.setActiveQuotation(vm.quotation.id);
    $rootScope.$emit('newActiveQuotation', vm.quotation.id);
    $location.path('/');
  }

  function alertRemoveDetail(ev, detailsGroup) {
    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog
      .confirm()
      .title('¿Eliminar articulo de la cotizacion?')
      .textContent('-' + detailsGroup.Product.Name)
      .ariaLabel('')
      .targetEvent(ev)
      .ok('Eliminar')
      .cancel('Cancelar');

    $mdDialog.show(confirm).then(
      function() {
        removeDetailsGroup(detailsGroup);
      },
      function() {
        console.log('Eliminado');
      }
    );
  }

  function removeDetailsGroup(detailsGroup) {
    var deferred = $q.defer();
    vm.isLoadingDetails = true;
    var detailsIds = detailsGroup.details.map(function(d) {
      return d.id;
    });
    var params = {
      detailsIds: detailsIds,
    };
    quotationService
      .removeDetailsGroup(params, vm.quotation.id)
      .then(function(res) {
        var updatedQuotation = res.data;
        vm.isLoadingDetails = false;
        vm.quotation.total = updatedQuotation.total;
        vm.quotation.subtotal = updatedQuotation.subtotal;
        vm.quotation.discount = updatedQuotation.discount;
        vm.quotation.totalProducts = updatedQuotation.totalProducts;
        if (updatedQuotation.Details) {
          vm.quotation.Details = updateDetailsInfo(
            vm.quotation.Details,
            updatedQuotation.Details
          );
          vm.quotation.DetailsGroups = deliveryService.groupDetails(
            vm.quotation.Details
          );
        }

        loadPaymentMethods();
        return $rootScope.loadActiveQuotation();
      })
      .then(function() {
        deferred.resolve();
      })
      .catch(function(err) {
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  function removeDetail(detailId, index) {
    vm.isLoadingDetails = true;
    quotationService
      .removeDetail(detailId, vm.quotation.id)
      .then(function(res) {
        var updatedQuotation = res.data;
        vm.quotation.Details.splice(index, 1);
        vm.isLoadingDetails = false;
        vm.quotation.total = updatedQuotation.total;
        vm.quotation.subtotal = updatedQuotation.subtotal;
        vm.quotation.discount = updatedQuotation.discount;
        vm.quotation.totalProducts = updatedQuotation.totalProducts;
        if (updatedQuotation.Details) {
          vm.quotation.Details = updateDetailsInfo(
            updatedQuotation.Details,
            updatedQuotation.Details
          );
        }
        $rootScope.loadActiveQuotation();
      })
      .catch(function(err) {
        $log.error(err);
      });
  }

  function updateDetailsInfo(details, newDetails) {
    for (var i = 0; i < details.length; i++) {
      var detail = details[i];
      var match = _.findWhere(newDetails, { id: detail.id });
      if (match) {
        detail.unitPrice = match.unitPrice;
        detail.discountPercentPromos = match.discountPercentPromos;
        detail.discountPercent = match.discountPercent;
        detail.discount = match.discount;
        detail.subtotal = match.subtotal;
        detail.total = match.total;
        detail.Promotion = match.Promotion;
        detail.PromotionPackageApplied = match.PromotionPackageApplied;
      }
    }
    details = details.filter(function(d) {
      return _.findWhere(newDetails, { id: d.id });
    });
    return details;
  }

  function isValidStock(details) {
    if (!details) {
      return false;
    }
    return quotationService.isValidStock(details);
  }

  function showInvoiceDataAlertIfNeeded(ev) {
    var controller = InvoiceDialogController;
    var useFullScreen = $mdMedia('sm') || $mdMedia('xs');

    if (!vm.quotation.immediateDelivery || !vm.quotation.Client) {
      var deferred = $q.defer();
      deferred.resolve(true);
      return deferred.promise;
    }

    return $mdDialog.show({
      controller: [
        '$scope',
        '$mdDialog',
        '$location',
        'quotation',
        'client',
        controller,
      ],
      templateUrl: 'views/checkout/invoice-dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen,
      locals: {
        quotation: vm.quotation,
        client: vm.quotation.Client,
      },
    });
  }

  function continueBuying() {
    if (!isValidStock(vm.quotation.Details)) {
      quotationService.showStockAlert();
      return;
    }

    if (!vm.quotation.Details || vm.quotation.Details.length === 0) {
      dialogService.showDialog('No hay artículos en esta cotización');
      return;
    }

    if (!vm.quotation.Order) {
      if (
        vm.quotation.estimatedCloseDateHolder &&
        vm.estimatedCloseDateWrapper
      ) {
        vm.quotation.estimatedCloseDate = moment(
          vm.estimatedCloseDateWrapper._d
        )
          .endOf('day')
          .toDate();
      }

      //Not updating Details, not necessary
      var params = angular.copy(vm.quotation);
      delete params.Details;
      delete params.source;
      delete params.sourceType;

      showInvoiceDataAlertIfNeeded()
        .then(function(continueProcess) {
          if (!continueProcess) {
            return $q.reject();
          }
          vm.isLoading = true;
          return quotationService.update(vm.quotation.id, params);
        })
        .then(function(res) {
          var quotationUpdated = res.data;

          if (quotationHasImmediateDeliveryProducts(vm.quotation)) {
            var immediateDeliveryMsg =
              '¡Elegiste un artículo "entrega en tienda" el cliente tiene que llevarselo!';
            dialogService.showDialog(immediateDeliveryMsg);
          }

          if (vm.quotation.Client) {
            if (quotationUpdated.immediateDelivery) {
              return $location.path(
                '/checkout/paymentmethod/' + quotationUpdated.id
              );
            }

            $location.path('/checkout/client/' + vm.quotation.id);
          } else {
            $location.path('/continuequotation').search({
              checkoutProcess: vm.quotation.id,
              goToCheckout: true,
            });
          }
          vm.isLoading = false;
        })
        .catch(function(err) {
          console.log(err);
          authService.showUnauthorizedDialogIfNeeded(err);
        });
    } else {
      dialogService.showDialog('Esta cotización ya tiene un pedido asignado');
    }
  }

  function quotationHasImmediateDeliveryProducts(quotation) {
    return _.some(quotation.Details, function(detail) {
      return detail.immediateDelivery && !detail.isSRService;
    });
  }

  function getUnitPriceWithDiscount(unitPrice, discountPercent) {
    var result = unitPrice - unitPrice / 100 * discountPercent;
    return result;
  }

  function daysDiff(a, b) {
    a = (a && new Date(a)) || new Date();
    b = (b && new Date(b)) || new Date();
    var _MS_PER_DAY = 1000 * 60 * 60 * 24;
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.abs(Math.floor((utc2 - utc1) / _MS_PER_DAY));
  }

  function showDetailGroupStockAlert(ev, detailGroup) {
    var controller = StockDialogController;
    var useFullScreen = $mdMedia('sm') || $mdMedia('xs');
    $mdDialog
      .show({
        controller: [
          '$scope',
          '$mdDialog',
          '$location',
          'quotationService',
          'vm',
          'detailGroup',
          controller,
        ],
        templateUrl: 'views/quotations/stock-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        fullscreen: useFullScreen,
        locals: {
          vm: vm,
          detailGroup: detailGroup,
        },
      })
      .then(function() {})
      .catch(function() {
        console.log('cancelled');
      });
  }

  function getSourceName() {
    var sourceValue = vm.quotation.source;
    var source = _.findWhere($rootScope.pointersSources, {
      value: sourceValue,
    });
    if (!source) {
      source = {};
    }
    var sourceName = source.label || sourceValue;
    return sourceName;
  }

  function getSourceTypeName() {
    var sourceType;
    var sourceValue = vm.quotation.source;
    var sourceTypeValue = vm.quotation.sourceType;

    var source = _.findWhere($rootScope.pointersSources, {
      value: sourceValue,
    });
    if (source) {
      sourceType = _.findWhere(source.childs, { value: sourceTypeValue });
    } else {
      sourceType = {};
    }

    var sourceTypeName = sourceType ? sourceType.label : sourceTypeValue;
    return sourceTypeName;
  }
}

QuotationsEditCtrl.$inject = [
  '$log',
  '$location',
  '$routeParams',
  '$q',
  '$scope',
  'localStorageService',
  '$rootScope',
  '$mdMedia',
  '$mdDialog',
  '$filter',
  'quotationService',
  'api',
  'dialogService',
  'userService',
  'packageService',
  'paymentService',
  'deliveryService',
  'authService',
  'siteService',
  'storeService',
  'ENV',
  'activeStore',
];
