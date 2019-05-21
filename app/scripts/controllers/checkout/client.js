'use strict';
angular.module('actualApp')
  .controller('CheckoutClientCtrl', CheckoutClientCtrl);

function CheckoutClientCtrl(
  commonService, 
  clientService ,
  $timeout,
  $q,
  $routeParams, 
  $rootScope, 
  $location,
  $mdDialog,
  $mdMedia,
  categoriesService, 
  productService, 
  quotationService, 
  orderService,
  dialogService,
  authService
){
  var vm = this;
  angular.extend(vm,{
    continueProcess: continueProcess,
    getContactName: getContactName,
    mapCFDIuseCode: clientService.mapCFDIuseCode,
    isClientFiscalDataValid: clientService.isClientFiscalDataValid
  });

  function init(){
    $location.search({});
    vm.isLoading = true;
    vm.isLoadingClient = true;
    
    quotationService.getById($routeParams.id)
      .then(function(res){
        vm.quotation = res.data;
        vm.isLoading = false;
        return quotationService.validateQuotationStockById(vm.quotation.id); 
      })
      .then(function(isValidStock){
        if( !isValidStock){
          $location.path('/quotations/edit/' + vm.quotation.id)
            .search({stockAlert:true});
        }

        if(!vm.quotation.Details || vm.quotation.Details.length === 0){
          $location.path('/quotations/edit/' + vm.quotation.id);
        }

        if(vm.quotation.Order){
          $location.path('/checkout/order/' + vm.quotation.Order.id);
        }

        if(vm.quotation.Client){
          clientService.getById(vm.quotation.Client.id)
            .then(function(res){
              vm.client = res.data;
              vm.isLoadingClient = false;

              if( !vm.isClientFiscalDataValid(vm.client)){
                dialogService.showDialog('Los datos fiscales estan incompletos o no son validos');
              }              

              vm.contacts = vm.client.Contacts.map(function(contact){
                contact.completeAdrress = clientService.buildAddressStringByContact(contact);
                return contact;
              });
              if(!vm.quotation.Address && vm.contacts.length > 0){
                vm.quotation.Address = vm.contacts[0].id;
              }            
            })
            .catch(function(err){
              vm.isLoadingClient = false;
              var error = err.data || err;
              console.log('err', err);
              error = error ? error.toString() : '';
              dialogService.showDialog('Hubo un error: ' + error );          

            });
        }
        
      });
  }

  function getContactName(contact){
    var name = '';
    if(contact.FirstName || contact.LastName){
      name = contact.FirstName + ' ' + contact.LastName;
    }else{
      name = contact.Name
    }
    return name;
  }

  function findContactById(id){
    return _.findWhere(vm.contacts, {id: id});
  }

  function showInvoiceDataAlert(ev){
    var controller = InvoiceDialogController;
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));    
    return $mdDialog.show({
      controller: [
        '$scope', 
        '$mdDialog',
        '$location',
        'quotation',
        'client',
        controller
      ],
      templateUrl: 'views/checkout/invoice-dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen,
      locals:{
        quotation: vm.quotation,
        client: vm.client
      }
    });
  }  

  function continueProcess(){
    if(!vm.quotation.Details || vm.quotation.Details.length === 0){
      dialogService.showDialog('No hay artículos en esta cotización');
      return;
    }

    if( !vm.isClientFiscalDataValid(vm.client)){
      dialogService.showDialog('Los datos fiscales estan incompletos o no son validos');
      return;
    }

    if(vm.quotation.Address && !vm.quotation.immediateDelivery){
      var selectedContact = findContactById(vm.quotation.Address);
      console.log('vm.quotation.Address', selectedContact)
      if(!selectedContact.Address){
        dialogService.showDialog('Agrega los datos de envio',function(){
          $location.path('/clients/profile/' + vm.quotation.Client.id)
            .search({
              activeTab:3,
              checkoutProcess: vm.quotation.id
            });
        });
        return;
      }
    }
    
    if( vm.quotation.Address || vm.quotation.immediateDelivery){
  
      vm.isLoading = true;
      var params = {Address: vm.quotation.Address};
      quotationService.update(vm.quotation.id, params)
        .then(function(res){
          vm.isLoading = false;
          return showInvoiceDataAlert();
        })
        .then(function(goToPayments){
          if(!goToPayments){
            return $q.reject();
          }

          $location.path('/checkout/paymentmethod/' + vm.quotation.id).search({});
        })
        .catch(function(err){
          console.log(err);
          authService.showUnauthorizedDialogIfNeeded(err);
          var error = err.data || err;
          error = error ? error.toString() : '';
          dialogService.showDialog('Hubo un error: ' + error );          
        });
  
    }

    else{
      dialogService.showDialog('Asigna una dirección de envío',function(){
        $location.path('/clients/profile/' + vm.quotation.Client.id)
          .search({
            activeTab:3,
            checkoutProcess: vm.quotation.id
          });
      });
    }
  }

  init();
}
