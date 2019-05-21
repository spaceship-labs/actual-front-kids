(function() {
  'use strict';
  function MainCtrl(
    api,
    $mdUtil,
    $rootScope,
    $q,
    $scope,
    $location,
    $window,
    $route,
    $mdSidenav,
    $filter,
    authService,
    cartService,
    productService,
    categoriesService,
    quotationService,
    localStorageService,
    userService,
    siteService,
    storeService,
    $mdDialog,
    dialogService,
    deliveryService,
    commonService,
    clientService,
    ENV
  ) {
    var vm = this;
    angular.extend(vm, {
      activeStore: {},
      isActiveBackdrop: false,
      isActiveCart: false,
      isActiveLogin: false,
      isLoadingLogin: false,
      searchType: 'search',
      loginForm: {},
      pointersSources: quotationService.getPointersSources(),
      pointersSidenav: [],
      activateLoginModal: activateLoginModal,
      deactivateLoginModal: deactivateLoginModal,
      getActiveModule: getActiveModule,
      getCategoryBackground: getCategoryBackground,
      getCategoryIcon: getCategoryIcon,
      logOut: logOut,
      removeCurrentQuotation: removeCurrentQuotation,
      signIn: signIn,
      toggleLoginModal: toggleLoginModal,
      togglePointerSidenav: togglePointerSidenav,
      toggleProfileModal: toggleProfileModal,
      getStores: getStores,
      saveBroker: saveBroker,
      saveSource: saveSource,
      syncClientsDiscounts: syncClientsDiscounts,
      handleSearch: handleSearch,
      getFirstPointerSourceValue: getFirstPointerSourceValue,
      setPointerSourceType: setPointerSourceType,
      adminUrl: ENV.adminUrl,
      ENV: ENV
    });
    $rootScope.loadActiveQuotation = loadActiveQuotation;
    $rootScope.pointersSources = vm.pointersSources;
    $scope.mainData;

    init();

    function init() {
      vm.token = localStorageService.get('token');
      vm.user = localStorageService.get('user');
      $rootScope.user = vm.user;
      if ($location.search().itemcode) {
        vm.searchingItemCode = true;
      }

      loadMainData();
      loadSiteInfo();

      buildPointersSidenav();
      vm.isLoadingCategoriesTree = true;
      categoriesService
        .createCategoriesTree()
        .then(function(res) {
          vm.isLoadingCategoriesTree = false;
          vm.categoriesTree = res.data;
        })
        .catch(function(err) {
          console.log(err);
        });

      $scope.$watch(
        function() {
          return localStorageService.get('quotation');
        },
        function(quotation) {
          vm.quotation = quotation;
        }
      );

      moment.locale('es');

      $(document).click(function(e) {
        var $target = $(event.target);
        var profileHeader = $('#profile-header');
        var profileHeaderTrigger = $('#profile-header-trigger');
        var loginHeader = $('#login-header');
        var loginHeaderTrigger = $('#login-header-trigger');

        if (
          !$target.is(profileHeader) &&
          !$target.is(profileHeaderTrigger) &&
          !profileHeaderTrigger.find($target).length &&
          vm.isActiveProfileHeader
        ) {
          toggleProfileModal();
        } else if (
          !$target.is(loginHeader) &&
          !$target.is(loginHeaderTrigger) &&
          !loginHeaderTrigger.find($target).length &&
          vm.isActiveLogin
        ) {
          toggleLoginModal();
        }
        $scope.$apply();
      });
    }

    function handleSearch() {
      switch (vm.searchType) {
        case 'itemcode':
          if (!vm.searchValue) {
            dialogService.showDialog('Ingresa un itemcode');
            return;
          }
          searchProduct({ itemcode: vm.searchValue });
          break;

        case 'clientsDiscount':
          syncClientsDiscounts();
          break;

        case 'clientsCredit':
          syncClientsCredit();
          break;

        case 'clientSync':
          if (!vm.searchValue) {
            dialogService.showDialog('Ingresa un cardcode');
            return;
          }
          syncClientByCardCode(vm.searchValue);
          break;

        default:
          searchProduct({ term: vm.searchValue });
          break;
      }
    }

    function searchProduct(params) {
      $location.path('/search').search(params);
    }

    function buildPointersSidenav() {
      for (var i = 0; i < 9; i++) {
        vm.pointersSidenav.push({ selected: false });
      }
    }

    function loadMainData() {
      console.log('cargando main data', new Date());
      $rootScope.isMainDataLoaded = false;
      $q
        .all([loadActiveStore(), loadActiveQuotation()])
        .then(function(data) {
          $scope.mainData = {
            activeStore: data[0],
            activeQuotation: data[1]
          };
          console.log('$scope.mainData', $scope.mainData);
          $rootScope.$emit('mainDataLoaded', $scope.mainData);
          $rootScope.isMainDataLoaded = true;
          console.log('termino main data', new Date());
        })
        .catch(function(err) {
          console.log('err', err);
        });
    }

    function loadActiveStore() {
      console.log('loadActiveStore start', new Date());
      var deferred = $q.defer();
      userService
        .getActiveStore()
        .then(function(activeStore) {
          vm.activeStore = activeStore;
          $rootScope.activeStore = activeStore;
          console.log('loadActiveStore end', new Date());
          $rootScope.$emit('activeStoreAssigned', activeStore);
          deferred.resolve(activeStore);
        })
        .catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
      return deferred.promise;
    }

    function loadActiveQuotation() {
      var deferred = $q.defer();
      console.log('start loadActiveQuotation', new Date());

      quotationService.getActiveQuotation().then(function(res) {
        var quotation = res.data;
        $rootScope.isActiveQuotationLoaded = true;
        if (quotation && quotation.id) {
          quotation.savedSourceType = _.clone(quotation.sourceType);
          quotation.savedSource = _.clone(quotation.source);
          vm.activeQuotation = quotation;
          $rootScope.activeQuotation = quotation;
          $rootScope.$emit('activeQuotationAssigned', vm.activeQuotation);
          deferred.resolve(vm.activeQuotation);
          console.log('finish loadActiveQuotation', new Date());
        } else {
          vm.activeQuotation = false;
          $rootScope.activeQuotation = false;
          $rootScope.$emit('activeQuotationAssigned', false);
          deferred.resolve(false);
        }
      });
      return deferred.promise;
    }

    function loadBrokers() {
      var deferred = $q.defer();
      userService
        .getBrokers()
        .then(function(brokers) {
          vm.brokers = brokers;
          $rootScope.brokers = brokers;
          deferred.resolve(brokers);
        })
        .catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
      return deferred.promise;
    }

    function loadSiteInfo() {
      var deferred = $q.defer();
      console.log('loadSiteInfo start', new Date());
      siteService
        .findByHandle('actual-group')
        .then(function(res) {
          vm.site = res.data || {};
          $rootScope.site = res.data || {};
          deferred.resolve(vm.site);
          console.log('loadSiteInfo end', new Date());
        })
        .catch(function(err) {
          console.log(err);
          deferred.reject(err);
        });
      return deferred.promise;
    }

    $rootScope.$on('newActiveQuotation', function(ev, newQuotationId) {
      loadActiveQuotation();
    });

    function removeCurrentQuotation() {
      quotationService.removeCurrentQuotation();
    }

    function togglePointerSidenav() {
      if (!quotationService.getActiveQuotationId()) {
        return;
      }

      $mdSidenav('pointers').toggle();
      if ($mdSidenav('pointers').isOpen() && !vm.brokers) {
        loadBrokers();
      }
    }

    function getCategoryIcon(handle) {
      return categoriesService.getCategoryIcon(handle);
    }

    //$rootScope.$on("$locationChangeStart",function(event, next, current){
    $scope.$on('$routeChangeStart', function(event, next, current) {
      if (current) {
        authService.runPolicies();

        //Only updating active quotation on every page change
        console.log('loadActiveQuotation change page', new Date());
        $rootScope.isActiveQuotationLoaded = false;
        loadActiveQuotation().then(function() {
          console.log('scope.mainData', $scope.mainData);
          $scope.mainData = $scope.mainData || {};
          $scope.mainData.activeQuotation = $rootScope.activeQuotation;
          $rootScope.$emit('mainDataLoaded', $scope.mainData);
          $rootScope.isMainDataLoaded = true;
          console.log('end loadActiveQuotation change page', new Date());
        });

        resetSearchBox();
      }

      vm.activeModule = vm.getActiveModule();
      if ($location.search().itemcode) {
        vm.searchingItemCode = true;
      } else {
        vm.searchingItemCode = false;
      }
    });

    function resetSearchBox() {
      vm.searchValue = '';
      vm.searchType = 'search';
    }

    function getActiveModule() {
      var activeModule = false;
      var path = $location.path();
      var policiesPaths = [
        '/politicas-de-entrega',
        '/politicas-de-garantia',
        '/politicas-de-almacenaje',
        '/politicas-de-instalacion-y-ensamble'
      ];
      var manualsPaths = [
        '/manual-de-cuidados-y-recomendaciones/pieles',
        '/manual-de-cuidados-y-recomendaciones/aceros',
        '/manual-de-cuidados-y-recomendaciones/aluminios',
        '/manual-de-cuidados-y-recomendaciones/cristales',
        '/manual-de-cuidados-y-recomendaciones/cromados',
        '/manual-de-cuidados-y-recomendaciones',
        '/manual-de-cuidados-y-recomendaciones/maderas',
        '/manual-de-cuidados-y-recomendaciones/piezas-plasticas',
        '/manual-de-cuidados-y-recomendaciones/textiles',
        '/manual-de-cuidados-y-recomendaciones/viniles',
        '/manual-de-cuidados-y-recomendaciones/vinilos',
        '/manual-de-cuidados-y-recomendaciones/pintura-electrostatica'
      ];
      if (path.indexOf('dashboard') >= 0) {
        activeModule = 'dashboard';
      } else if (path.indexOf('addquotation') >= 0) {
        activeModule = 'addquotation';
      } else if (path.indexOf('clients') >= 0) {
        activeModule = 'clients';
      } else if (path.indexOf('quotations') >= 0) {
        activeModule = 'quotations';
      } else if (path.indexOf('orders') >= 0) {
        activeModule = 'orders';
      } else if (path.indexOf('commissions') >= 0) {
        activeModule = 'commissions';
      } else if (path.indexOf('scorecard') >= 0) {
        activeModule = 'scorecard';
      } else if (policiesPaths.indexOf(path) > -1) {
        activeModule = 'policies';
      } else if (manualsPaths.indexOf(path) > -1) {
        activeModule = 'manuals';
      }
      return activeModule;
    }

    function toggleLoginModal() {
      if (vm.isActiveLogin) {
        vm.isActiveLogin = false;
        vm.isActiveBackdrop = false;
      } else {
        vm.isActiveLogin = true;
        vm.isActiveBackdrop = true;
        vm.isActiveProfileHeader = false;
      }
    }

    function toggleProfileModal() {
      if (vm.isActiveProfileHeader) {
        vm.isActiveProfileHeader = false;
        vm.isActiveBackdrop = false;
      } else {
        vm.isActiveProfileHeader = true;
        vm.isActiveBackdrop = true;
      }
    }

    function hideProfileModal() {
      vm.isActiveProfileHeader = false;
      vm.isActiveBackdrop = false;
    }

    function activateLoginModal() {
      if (!vm.user) {
        vm.isActiveLogin = true;
        vm.isActiveBackdrop = true;
      }
    }

    function deactivateLoginModal() {
      if (!vm.user) {
        vm.isActiveLogin = false;
        vm.isActiveBackdrop = false;
      }
    }

    function handleSignInError(err) {
      vm.isLoadingLogin = false;
      if (err) {
        vm.loginErr = 'Datos incorrectos';
        console.log('vm.loginErr', vm.loginErr);
      }
    }

    function syncClientsCredit() {
      vm.isLoadingSync = true;
      clientService
        .syncClientsCredit()
        .then(function(res) {
          console.log(res);
          dialogService.showDialog('Tabla de créditos actualizada');
          vm.isLoadingSync = false;
          resetSearchBox();
        })
        .catch(function(err) {
          dialogService.showDialog('Hubo un error: ' + err.data);
          vm.isLoadingSync = false;
        });
    }

    function syncClientsDiscounts() {
      vm.isLoadingSync = true;
      clientService
        .syncClientsDiscounts()
        .then(function(res) {
          console.log(res);
          dialogService.showDialog('Descuentos de clientes actualizados');
          vm.isLoadingSync = false;
          resetSearchBox();
        })
        .catch(function(err) {
          dialogService.showDialog('Hubo un error: ' + err.data);
          vm.isLoadingSync = false;
        });
    }

    function syncClientByCardCode(cardcode) {
      vm.isLoadingSync = true;
      clientService
        .syncClientByCardCode(cardcode)
        .then(function(res) {
          console.log(res);
          dialogService.showDialog('Cliente actualizado');
          vm.isLoadingSync = false;
          resetSearchBox();
        })
        .catch(function(err) {
          dialogService.showDialog('Hubo un error: ' + err.data);
          vm.isLoadingSync = false;
        });
    }

    function signIn() {
      vm.isLoadingLogin = true;
      var formData = {
        email: vm.loginForm.email,
        password: vm.loginForm.password,
        activeStore: vm.loginForm.activeStoreId
      };
      authService.signIn(formData, $rootScope.successAuth, handleSignInError);
    }

    function logOut() {
      authService.logout(function() {
        $location.path('/');
        $window.location.reload();
      });
    }

    $rootScope.successAuth = function(res) {
      var responseData = res.data;

      vm.user = responseData.user;
      localStorageService.remove('currentQuotation');
      localStorageService.set('token', responseData.token);
      localStorageService.set('user', responseData.user);
      localStorageService.set('activeStore', responseData.user.activeStore);
      $window.location.reload();
    };

    function getCategoryBackground(handle) {
      var image = '/images/mesas.jpg';
      image = api.baseUrl + '/categories/' + handle + '.jpg';
      return { 'background-image': 'url(' + image + ')' };
    }

    $scope.$on('$routeChangeStart', function(next, current) {
      vm.isActiveBackdrop = false;
      vm.isActiveLogin = false;
      vm.isActiveCart = false;
      vm.isLoadingLogin = false;
    });

    function getStores(email) {
      userService.getStores(email).then(function(stores) {
        vm.stores = stores;
        if (vm.stores.length > 0) {
          vm.loginForm.activeStoreId = vm.stores[0].id;
        }
      });
    }

    function setPointerSourceType(source) {
      if (vm.activeQuotation) {
        vm.activeQuotation.sourceType =
          vm.activeQuotation.sourceType || source.childs[0].value;
      }
    }

    function saveBroker(broker) {
      localStorageService.set('broker', broker);
      togglePointerSidenav();
    }

    function saveSource(source, sourceType) {
      if (source === 'Broker') {
        quotationService
          .updateBroker(vm.quotation, { brokerId: vm.activeQuotation.Broker })
          .then(function(res) {
            vm.pointersLoading = false;
            togglePointerSidenav();
            dialogService.showDialog('Datos guardados');
          })
          .catch(function(err) {
            vm.pointersLoading = false;
            console.log(err);
            togglePointerSidenav();
            dialogService.showDialog('Hubo un error, revisa tus datos');
          });
      } else {
        if (vm.quotation) {
          vm.pointersLoading = true;
          var params = {
            source: source,
            sourceType: sourceType
          };
          quotationService
            .updateSource(vm.quotation, params)
            .then(function(res) {
              vm.pointersLoading = false;
              togglePointerSidenav();
              dialogService.showDialog('Datos guardados');
              $rootScope.$emit('changedActiveQuotationSource', params);
              console.log(res);
            })
            .catch(function(err) {
              vm.pointersLoading = false;
              console.log(err);
              togglePointerSidenav();
              dialogService.showDialog('Hubo un error, revisa tus datos');
            });
        }
      }
    }

    function getFirstPointerSourceValue(sourceChilds, activeQuotation) {
      if (
        activeQuotation.savedSourceType &&
        activeQuotation.savedSource === activeQuotation.source
      ) {
        return activeQuotation.savedSourceType;
      }
      var sortedChilds = $filter('orderBy')(sourceChilds, 'label');
      return sortedChilds[0].value;
    }

    //$scope.$on('$destroy', $mdUtil.enableScrolling);
  }

  angular.module('actualApp').controller('MainCtrl', MainCtrl);
  MainCtrl.$inject = [
    'api',
    '$mdUtil',
    '$rootScope',
    '$q',
    '$scope',
    '$location',
    '$window',
    '$route',
    '$mdSidenav',
    '$filter',
    'authService',
    'cartService',
    'productService',
    'categoriesService',
    'quotationService',
    'localStorageService',
    'userService',
    'siteService',
    'storeService',
    '$mdDialog',
    'dialogService',
    'deliveryService',
    'commonService',
    'clientService',
    'ENV'
  ];
})();
