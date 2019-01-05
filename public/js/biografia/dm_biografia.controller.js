(function () {
	"use strict"
	
	angular
		.module('app')
		.controller('dmController', dmController);

	dmController.$inject = [];
	function dmController() {
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