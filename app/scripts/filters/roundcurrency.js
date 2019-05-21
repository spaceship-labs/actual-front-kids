(function(){
	'use-strict';

	angular
		.module('actualApp')
		.filter('roundCurrency', ['$filter',function($filter) {
		  return function(input, up) {
		  	
			  var roundCents = function(ammount, options){
			    options = options || {up:true};
			    var integers = Math.floor(ammount);
			    var cents = (ammount - integers).toPrecision(6);
			    var roundedCents = 0;
			    if(cents > 0){
			      if(options.up){
			        roundedCents = Math.ceil( (cents*100) ) / 100;
			      }else{
			        roundedCents = Math.floor( (cents*100) ) / 100;        
			      }
			    }
			    var rounded = integers + roundedCents;
			    return rounded;
			  }
		  	up = !_.isUndefined(up) ? up : true;
		  	var rounded = roundCents(input, {up:up});
		    var output 	= $filter('currency')(rounded);
		    return output;
		  }
	}]);


})();
