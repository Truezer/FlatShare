(function () {
	"use strict"
	
	angular
		.module('app')
		.config(dmRoutes)
		.controller('dmMainController', dmMainController)
		.controller('dmDiscografiaController', dmDiscografiaController)
		.controller('dmEventosController', dmEventosController)
		.controller('dmBiografiaController', dmBiografiaController);

	dmRoutes.$inject = ['$routeProvider'];
	function dmRoutes($routeProvider) {
  		$routeProvider.when("/main", { controller: "dmMainController",
	                                   controllerAs: "vm",
	                                   templateUrl: "/app/main.html"
									 })
					   .when("/discografia", { controller: "dmDiscografiaController",
	                                           controllerAs: "vm",
	                                           templateUrl: "/app/discografia.html"
									         })
					   .when("/eventos", { controller: "dmEventosController",
	                                       controllerAs: "vm",
	                                       templateUrl: "/app/eventos.html"
									     })									
					   .when("/biografia", { controller: "dmBiografiaController",
	                                    controllerAs: "vm",
	                                    templateUrl: "/app/biografia.html"
									  });
	}
	
	// Main Controller
	dmMainController.$inject = [];
	function dmMainController($scope, $routeParams) {
		
	}

	// Discografía Controller
	dmDiscografiaController.$inject = [];
	function dmDiscografiaController($scope) {
		
	}

	// Eventos Controller
	dmEventosController.$inject = [];
	function dmEventosController($scope) {

	}

	// Biografía Controller
	dmBiografiaController.$inject = [];
	function dmBiografiaController($scope) {
		
		var vm = this;

		activate();

		function activate() {
			getHelloWorld();
		}

		///////////////////

		function getUsers() {
			vm.hello = 'Hello World!';
			return vm.hello;
		}
		
	}	
	
	
})();