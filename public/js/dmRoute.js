var dmCore = null;

(function () {
	"use strict"
	
	dmCore = angular
		.module('dmCore', ['ngRoute'])
		.config(function dmRoutes($routeProvider) {
				$routeProvider.when("/Main", { controller: "dmMainController",
												templateUrl: "/app/main.html"
									 })
								.when("/Discografia", { controller: "dmDiscografiaController",
	                                           templateUrl: "/app/discografia.html"
									         })
								.when("/Eventos", { controller: "dmEventosController",
	                                       templateUrl: "/app/eventos.html"
									     })									
								.when("/Biografia", { controller: "dmBiografiaController",
	                                    templateUrl: "/app/biografia.html"
									  });
				})
		.controller('dmMainController', function ($scope) {})
		.controller('dmDiscografiaController', function ($scope) {})
		.controller('dmEventosController', function ($scope) {})
		.controller('dmBiografiaController', function ($scope) {});

	
})();