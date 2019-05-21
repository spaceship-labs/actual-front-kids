(function() {
  'use strict';

  angular.module('actualApp').factory('quotationService', quotationService);

  /** @ngInject */
  function quotationService(
    $location,
    $q,
    $rootScope,
    api,
    Upload,
    productService,
    localStorageService,
    dialogService,
    authService
  ) {
    var service = {
      addDetail: addDetail,
      addProduct: addProduct,
      addRecord: addRecord,
      addMultipleProducts: addMultipleProducts,
      closeQuotation: closeQuotation,
      createDetailObjectFromParams: createDetailObjectFromParams,
      create: create,
      isValidStock: isValidStock,
      getActiveQuotation: getActiveQuotation,
      getActiveQuotationId: getActiveQuotationId,
      getByClient: getByClient,
      getById: getById,
      getByIdQuickRead: getByIdQuickRead,
      getCountByUser: getCountByUser,
      getList: getList,
      populateDetailsWithProducts: populateDetailsWithProducts,
      getQuotationTotals: getQuotationTotals,
      getCurrentStock: getCurrentStock,
      getRecords: getRecords,
      getTotalsByUser: getTotalsByUser,
      getClosingReasons: getClosingReasons,
      getPaymentOptions: getPaymentOptions,
      getPayments: getPayments,
      getPointersSources: getPointersSources,
      getRecordTypes: getRecordTypes,
      getSapOrderConnectionLogs: getSapOrderConnectionLogs,
      loadProductsFilters: loadProductsFilters,
      newQuotation: newQuotation,
      mapDetailsStock: mapDetailsStock,
      removeDetail: removeDetail,
      removeDetailsGroup: removeDetailsGroup,
      removeCurrentQuotation: removeCurrentQuotation,
      setActiveQuotation: setActiveQuotation,
      setEstimatedCloseDate: setEstimatedCloseDate,
      sendByEmail: sendByEmail,
      showStockAlert: showStockAlert,
      update: update,
      updateSource: updateSource,
      updateBroker: updateBroker,
      validateQuotationStockById: validateQuotationStockById,
      isValidQuotationAddress: isValidQuotationAddress
    };

    return service;

    function create(params) {
      var url = '/quotation/create';
      return api.$http.post(url, params);
    }

    function update(id, params) {
      var url = '/quotation/update/' + id;
      return api.$http.post(url, params);
    }

    function updateSource(id, params) {
      var url = '/quotation/' + id + '/source';
      return api.$http.post(url, params);
    }

    function updateBroker(id, params) {
      var url = '/quotation/' + id + '/broker';
      return api.$http.post(url, params);
    }

    function getById(id, params) {
      var url = '/quotation/findbyid/' + id;
      return api.$http.post(url, params);
    }

    function getByIdQuickRead(id, params) {
      var url = '/quotation/findbyidquickread/' + id;
      return api.$http.post(url, params);
    }

    function getByClient(page, params) {
      var p = page || 1;
      var url = '/quotation/findbyclient/' + p;
      return api.$http.post(url, params);
    }

    function getList(page, params) {
      var p = page || 1;
      var url = '/quotation/find/' + p;
      return api.$http.post(url, params);
    }

    function addRecord(quotationId, params) {
      var url = '/quotation/addrecord/' + quotationId;
      return Upload.upload({ url: api.baseUrl + url, data: params });
    }

    function addDetail(quotationId, params) {
      var url = '/quotation/adddetail/' + quotationId;
      return api.$http.post(url, params);
    }

    function addMultipleDetails(quotationId, params) {
      var url = '/quotation/addmultipledetails/' + quotationId;
      return api.$http.post(url, params);
    }

    function removeDetail(id, quotationId) {
      var url = '/quotation/removedetail/' + id + '/' + quotationId;
      return api.$http.post(url);
    }

    function removeDetailsGroup(detailsGroup, quotationId) {
      var url = '/quotation/removedetailsgroup/' + quotationId;
      return api.$http.post(url, detailsGroup);
    }

    function getTotalsByUser(userId, params) {
      var url = '/quotation/user/' + userId + '/totals';
      return api.$http.post(url, params);
    }

    function getCountByUser(userId, params) {
      var url = '/quotation/user/' + userId + '/count';
      return api.$http.post(url, params);
    }

    function closeQuotation(id, params) {
      var url = '/quotation/' + id + '/close';
      return api.$http.post(url, params);
    }

    function getSapOrderConnectionLogs(id) {
      var url = '/quotation/' + id + '/saporderconnectionlogs';
      return api.$http.post(url);
    }

    function isValidQuotationAddress(quotation) {
      return quotation.immediateDelivery || quotation.Address ? true : false;
    }

    function populateDetailsWithProducts(quotation, options) {
      options = options || {};
      var deferred = $q.defer();
      if (quotation && quotation.Details) {
        var productsIds = quotation.Details.map(function(detail) {
          return detail.Product; //product id
        });

        var params = {
          ids: productsIds,
          populate_fields: options.populate || []
        };

        productService
          .multipleGetByIds(params)
          .then(function(res) {
            console.log('res', res);
            return productService.formatProducts(res.data);
          })
          .then(function(formattedProducts) {
            //Match detail - product
            quotation.Details = quotation.Details.map(function(detail) {
              detail.Product = _.findWhere(formattedProducts, {
                id: detail.Product
              });
              return detail;
            });
            deferred.resolve(quotation.Details);
          })
          .catch(function(err) {
            console.log('err', err);
            deferred.reject(err);
          });
      } else {
        deferred.resolve([]);
      }
      return deferred.promise;
    }

    function getActiveQuotation() {
      var deferred = $q.defer();
      var quotationId = localStorageService.get('quotation');
      if (!quotationId) {
        deferred.resolve(false);
        return deferred.promise;
      }
      return getByIdQuickRead(quotationId);
    }

    function getActiveQuotationId() {
      return localStorageService.get('quotation');
    }

    function setActiveQuotation(quotationId) {
      if (getActiveQuotationId() !== quotationId || !quotationId) {
        localStorageService.set('quotation', quotationId);
        $rootScope.$broadcast('newActiveQuotation', quotationId);
      }
    }

    function removeCurrentQuotation() {
      localStorageService.remove('quotation');
      $rootScope.$broadcast('newActiveQuotation', false);
    }

    function newQuotation(params, options) {
      options = options || {};
      create(params).then(function(res) {
        var quotation = res.data;
        if (quotation) {
          setActiveQuotation(quotation.id);
          if (options.createClient) {
            $location.path('/clients/create').search({
              checkoutProcess: quotation.id,
              startQuotation: true
            });
          } else {
            $location
              .path('/quotations/edit/' + quotation.id)
              .search({ startQuotation: true });
          }
        }
      });
    }

    function createDetailObjectFromParams(productId, params, quotationId) {
      var detail = {
        Product: productId,
        quantity: params.quantity,
        Quotation: quotationId,
        shipDate: params.shipDate,
        immediateDelivery: params.immediateDelivery,
        originalShipDate: params.originalShipDate,
        productDate: params.productDate,
        shipCompany: params.shipCompany,
        shipCompanyFrom: params.shipCompanyFrom,
        PromotionPackage: params.promotionPackage || null,
        PurchaseAfter: params.PurchaseAfter,
        PurchaseDocument: params.PurchaseDocument
      };
      return detail;
    }

    function addProduct(productId, params) {
      var quotationId = localStorageService.get('quotation');
      var detail = createDetailObjectFromParams(productId, params, quotationId);
      if (quotationId) {
        //Agregar al carrito
        addDetail(quotationId, detail)
          .then(function(res) {
            //setActiveQuotation(quotationId);
            $location.path('/quotations/edit/' + quotationId);
          })
          .catch(function(err) {
            console.log(err);
            authService.showUnauthorizedDialogIfNeeded(err);
          });
      } else {
        //Crear cotizacion con producto agregado
        var createParams = { Details: [detail] };

        create(createParams)
          .then(function(res) {
            var quotation = res.data;
            if (quotation) {
              setActiveQuotation(quotation.id);
              $location.path('/quotations/edit/' + quotation.id);
            }
          })
          .catch(function(err) {
            console.log(err);
            authService.showUnauthorizedDialogIfNeeded(err);
          });
      }
    }

    //@params: Object products, containing id, quantity
    function addMultipleProducts(products) {
      var quotationId = localStorageService.get('quotation');
      if (quotationId) {
        var detailsParams = products.map(function(product) {
          return createDetailObjectFromParams(product.id, product, quotationId);
        });

        addMultipleDetails(quotationId, { Details: detailsParams })
          .then(function(details) {
            //setActiveQuotation(quotationId);
            $location.path('/quotations/edit/' + quotationId);
          })
          .catch(function(err) {
            console.log(err);
            authService.showUnauthorizedDialogIfNeeded(err);
          });
      } else {
        //Crear cotizacion con producto agregado
        var createParams = {
          Details: products.map(function(product) {
            var detail = createDetailObjectFromParams(product.id, product);
            return detail;
          })
        };

        create(createParams)
          .then(function(res) {
            var quotation = res.data;
            if (quotation) {
              setActiveQuotation(quotation.id);
              $location.path('/quotations/edit/' + quotation.id);
            }
          })
          .catch(function(err) {
            console.log(err);
            authService.showUnauthorizedDialogIfNeeded(err);
          });
      }
    }

    function loadProductsFilters(details) {
      var deferred = $q.defer();

      if (details.length === 0) {
        deferred.resolve(details);
        return deferred.promise;
      }

      productService
        .getAllFilters({ quickread: true })
        .then(function(res) {
          //Assign filters to every product
          var filters = res.data;
          details.forEach(function(detail) {
            filters = filters.map(function(filter) {
              filter.Values = [];

              if (detail.Product && detail.Product.FilterValues) {
                detail.Product.FilterValues.forEach(function(value) {
                  if (value.Filter === filter.id) {
                    filter.Values.push(value);
                  }
                });
              }

              return filter;
            });

            filters = filters.filter(function(filter) {
              return filter.Values.length > 0;
            });

            if (detail.Product && detail.Product.Filters) {
              detail.Product.Filters = filters;
            }
          });

          deferred.resolve(details);
        })
        .catch(function(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    }

    function getQuotationTotals(quotationId, params) {
      var url = '/quotation/totals/' + quotationId;
      return api.$http.post(url, params);
    }

    function getRecords(quotationId) {
      var url = '/quotation/' + quotationId + '/records';
      return api.$http.post(url);
    }

    function sendByEmail(id) {
      var url = '/quotation/sendemail/' + id;
      return api.$http.post(url);
    }

    function getCurrentStock(id) {
      var url = '/quotation/getCurrentStock/' + id;
      return api.$http.post(url);
    }

    function getPaymentOptions(id, params) {
      var url = '/quotation/' + id + '/paymentoptions';
      return api.$http.post(url, params);
    }

    function getPayments(id) {
      var url = '/quotation/' + id + '/payments';
      return api.$http.get(url);
    }

    function setEstimatedCloseDate(id, estimatedCloseDate) {
      var params = {
        estimatedCloseDate: estimatedCloseDate
      };
      var url = '/quotation/' + id + '/estimatedclosedate';
      return api.$http.post(url, params);
    }

    function mapDetailsStock(details, detailsStock) {
      details = details.map(function(detail) {
        var detailStock = _.findWhere(detailsStock, { id: detail.id });
        if (detailsStock) {
          detail.validStock = detailStock.validStock;
        }
        return detail;
      });
      return details;
    }

    function isValidStock(detailsStock) {
      return _.every(detailsStock, function(detail) {
        return detail.validStock;
      });
    }

    function validateQuotationStockById(id) {
      var url = '/quotation/validatestock/' + id;
      var deferred = $q.defer();
      api.$http
        .post(url)
        .then(function(response) {
          if (response.data.isValid) {
            deferred.resolve(true);
          } else {
            deferred.resolve(false);
          }
        })
        .catch(function(err) {
          deferred.reject(err);
        });
      return deferred.promise;
    }

    function getClosingReasons() {
      var closingReasons = [
        'Cliente de otro asesor',
        'Duplicada',
        'Cliente compró en otra tienda de la empresa.',
        'Cliente compró en otra mueblería.',
        'Cliente se murió',
        'Cliente solicita no ser contactado más',
        'Cliente ya no está interesado',
        'Cliente es incontactable',
        'Cliente se mudó',
        'Vendedor no dio seguimiento suficiente',
        'Vendedor cotizó artículos equivocados',
        'Los precios son altos',
        'Las fechas de entrega son tardadas',
        'No vendemos el articulo solicitado',
        'Otra razón (especificar)'
      ];
      return closingReasons;
    }

    function getRecordTypes() {
      var recordTypes = ['Email', 'Llamada', 'WhatsApp', 'Visita'];
      return recordTypes;
    }

    function getPointersSources() {
      var sources = [
        {
          label: 'Internet',
          value: 'internet',
          childs: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Mailing', value: 'mailing' },
            { label: 'Google(Buscador)', value: 'google' },
            { label: 'Yucatán premier', value: 'yucatan-premier' },
            { label: 'Instagram', value: 'Instagram' },
            {
              label: 'Diario de Yucatán Online',
              value: 'diario-de-yucatan-online'
            },
            { label: 'Foursquare', value: 'foursquare' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Periódico o Revista',
          value: 'periodico-revista',
          childs: [
            { label: 'ALTTA', value: 'altta' },
            { label: 'Cancunissimo', value: 'cancunissimo' },
            { label: 'Diario de Yucatán', value: 'diario-de-yucatan' },
            { label: 'The playa times', value: 'the-playa-times' },
            { label: 'Ambientes', value: 'ambientes' },
            { label: 'Abitat', value: 'abitat' },
            { label: 'Portal Inmobiliario', value: 'portal-inmobiliario' },
            { label: 'Ser Playa', value: 'ser-playa' },
            { label: 'Vive', value: 'vive' },
            { label: 'Ya la hice', value: 'ya-la-hice' },
            { label: 'Playacar', value: 'playacar' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Radio',
          value: 'radio',
          childs: [
            { label: 'Mix Cancún', value: 'mix-cancun' },
            { label: 'Imagen Cancún', value: 'imagen-cancun' },
            { label: 'Radiofórmula Cancún', value: 'radioformula-cancun' },
            { label: 'Pirata', value: 'pirata' },
            { label: 'Kiss Mérida', value: 'kiss-merida' },
            {
              label: '104.3 Qfm / Rock by the sea',
              value: '104.3qfm_rock-by-the-sea'
            },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Volanteo',
          value: 'volanteo',
          childs: [
            { label: 'En calle', value: 'calle' },
            { label: 'En plaza', value: 'plaza' },
            { label: 'En evento', value: 'evento' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Espectacular',
          value: 'espectacular',
          childs: [
            {
              label: 'Carr. Playa del Carmen - Cáncun',
              value: 'carretera-playa-del-carmen-cancun'
            },
            {
              label: 'Cancún - Distribuidor Vial',
              value: 'cancun-distribuidor-vial'
            },
            {
              label: 'Cancún - Entrada Pto. Cancun (Bonampak)',
              value: 'cancun-entrada-pto-cancun-bonampak'
            },
            { label: 'Mérida - El country', value: 'merida-el-country' },
            { label: 'Tulum', value: 'tulum' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Ubicación',
          value: 'ubicacion',
          childs: [{ label: 'Tienda', value: 'tienda' }]
        },
        {
          label: 'Activaciones Especiales',
          value: 'activaciones-especiales',
          childs: [
            { label: 'Valla Móvil', value: 'valla-movil' },
            { label: 'Pantalla Digital', value: 'pantalla-digital' },
            { label: 'Evento mensual kids', value: 'evento-mensual-kids' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Recomendado Cancún',
          value: 'recomendado-cancun',
          childs: [
            { label: 'Quinta Maretta', value: 'quinta-maretta' },
            { label: 'Live Desarrollos', value: 'live-desarrollos' },
            { label: 'Cumbres Towers', value: 'cumbres-towers' },
            { label: 'Long Island', value: 'long-island' },
            { label: 'Cumbres Towers', value: 'cumbres-towers' },
            { label: 'Sky', value: 'sky' },
            { label: 'Astoria', value: 'astoria' },
            { label: 'BeTowers', value: 'be-towers' },
            { label: 'Cascades', value: 'cascades' },
            { label: 'Towers', value: 'towers' },
            { label: 'Tribeca', value: 'tribeca' },
            { label: 'Liverté', value: 'liverte' },
            { label: 'Jardines del Sur', value: 'jardines-del-sur' },
            { label: 'Prado Norte', value: 'prado-norte' },
            { label: 'Taina', value: 'taina' },
            { label: 'Ynfinity', value: 'ynfinity' },
            { label: 'Kaanali', value: 'kaanali' },
            { label: 'Isola', value: 'isola' },
            { label: 'SLS', value: 'sls' },
            { label: 'Cascades / Everest', value: 'cascades-everest' },
            { label: 'Dream Lagoons', value: 'dream-lagoons' },
            { label: 'Kabeek', value: 'kabeek' },
            { label: 'Aria', value: 'aria' },
            { label: 'Brezza', value: 'brezza' },
            { label: 'Allure', value: 'allure' },
            { label: 'Riva', value: 'riva' },
            { label: 'Marea', value: 'marea' },
            { label: 'Palmar Residencial', value: 'palmar-residencial' },
            {
              label: 'Marina Condos & Canal Homes',
              value: 'marina-condos-and-canal-homes'
            },
            { label: 'Artila', value: 'artila' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Recomendado Playa del Carmen',
          value: 'recomendado-playa-del-carmen',
          childs: [
            { label: 'Maji Condos', value: 'maji-condos' },
            { label: 'Mareazul', value: 'mareazul' },
            { label: 'Lagunas de Mayakoba', value: 'lagunas-de-mayakoba' },
            { label: 'Lorena Ochoa', value: 'lorena-ochoa' },
            { label: 'Mooh Ha', value: 'moon-ha' },
            { label: 'Menesse', value: 'menesse' },
            { label: 'Akab', value: 'akab' },
            { label: 'Aleda', value: 'aleda' },
            { label: 'Mara', value: 'mara' },
            { label: 'Bamoa', value: 'bamoa' },
            { label: 'Nick Prince', value: 'nick-prince' },
            { label: 'Calle 38', value: 'calle-38' },
            { label: 'Terrazas', value: 'terrazas' },
            { label: 'Encanto', value: 'encanto' },
            { label: 'Los Olivos', value: 'los-olivos' },
            { label: 'La Joya', value: 'la-joya' },
            { label: 'The Shore', value: 'the-shore' },
            { label: 'Central Park', value: 'central-park' },
            { label: 'iPlaya', value: 'iplaya' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Recomendado Mérida',
          value: 'recomendado-merida',
          childs: [
            { label: 'Altozano', value: 'altozano' },
            { label: 'Armonia', value: 'armonia' },
            { label: 'Country Towers', value: 'country-towers' },
            { label: 'Serena', value: 'serena' },
            { label: 'Anthea', value: 'anthea' },
            { label: 'La Vista', value: 'la-vista' },
            { label: 'Floresta', value: 'floresta' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Recomendado Chetumal',
          value: 'recomendado-chetumal',
          childs: [
            { label: 'La conquista', value: 'la-conquista' },
            { label: 'Andara', value: 'andara' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Recomendado Puerto Morelos',
          value: 'recomendado-puerto-morelos',
          childs: [
            { label: 'Palma Real', value: 'palma-real' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        },
        {
          label: 'Recomendado Tulum',
          value: 'recomendado-tulum',
          childs: [
            { label: 'Aldea Zama', value: 'aldea-zama' },
            { label: 'Bahía Príncipe', value: 'bahia-principe' },
            { label: 'Flora & fauna', value: 'flora-and-fauna' },
            { label: 'Panoramic', value: 'panoramic' },
            { label: 'Sanctuary', value: 'sanctuary' },
            { label: 'Manor', value: 'manor' },
            { label: 'Anah', value: 'anah' },
            { label: 'Casa', value: 'casa' },
            { label: 'Carmela', value: 'carmela' },
            { label: 'Otro / No recuerda', value: 'otro' }
          ]
        }
      ];
      return sources;
    }

    function showStockAlert() {
      var msg = 'Hay un cambio de disponibilidad en uno o más de tus articulos';
      dialogService.showDialog(msg);
    }
  }
})();
