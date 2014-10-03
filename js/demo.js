angular.module('demo', ['demo.errorHandler'])


	// MANUAL HANDLING...

	// The following service is not wrapped or decorated in any way.
	// It has two methods:
	// - throwsAnError() which throws an Error and
	// - promiseRejects() which returns a promise that will reject after 500ms

	.factory('undecoratedService', function ($q, $timeout) {

		return {
			throwsAnError: function throwsAnError() {
				throw new Error('This is an error from throwsAnError.');
			},

			promiseRejects: function promiseRejects() {
				var defer = $q.defer();
				$timeout(function () {
					defer.reject('Something went wrong (asynchronously).');
				}, 500);
				return defer.promise;
			}
		};
	})

	// The controller will call the methods of undecoratedService in several ways to demonstrate some
	// possible ways of manual error handling. These
	.controller('manualController', function ($scope, errorHandler, undecoratedService) {

		// No error handling.
		$scope.synchronousError = function () {
			undecoratedService.throwsAnError();
		};

		// Manual error handling (try-catch).
		$scope.manualError = function () {
			try {
				undecoratedService.throwsAnError();
			} catch (err) {
				errorHandler.errors.push(err && err.message || err);
			}
		};

		// Error handling through manual wrapping in errorHandler (kinda stupid).
		$scope.wrappedSynchronousError = function () {
			errorHandler.call(undecoratedService.throwsAnError, undecoratedService);
		}

		// No error handling for asynchronous errors.
		$scope.asynchronousError = function () {
			undecoratedService.promiseRejects();
		};

		// The manual way.
		$scope.manualAsynchronousError = function () {
			undecoratedService.promiseRejects()
				['catch'](function (err) {
					errorHandler.errors.push(err);
				});
		};

		// Manual wrapping with the errorHandler.
		$scope.wrappedAsynchronousError = function () {
			errorHandler.call(undecoratedService.promiseRejects, undecoratedService);
		}
	})


	// AUTOMATIC HANDLING...

	// The methods are actually quite the same as in the undecoratedService, the only difference is
	// that the service will be wrapped by the errorHandler service in the .config() block below it.

	.factory('decoratedService', function ($q, $timeout) {

		// The throwsAnError function throws an error.
		function throwsAnError() {
			throw new Error('You won\'t believe what just happened!');
		}

		// The promiseRejectsAfterAWhile function returns a promise that... rejects after a while.
		function promiseRejectsAfterAWhile() {

			var defer = $q.defer();

			$timeout(function () {
				defer.reject('Something happened, but I\'m not sure how to fix it.');
			}, 500);

			return defer.promise;
		}

		// Provide a small description for each method for even better error messages.
		throwsAnError.description = 'perform some synchronous operation';
		promiseRejectsAfterAWhile.description = 'perform some asynchronous operation';

		return {
			throwsAnError: throwsAnError,
			promiseRejectsAfterAWhile: promiseRejectsAfterAWhile
		};
	})

	// Decorate our decoratedService, we could also decorate the built-in $http service.
	.config(function (errorHandlerProvider, $provide) {
		errorHandlerProvider.decorate($provide, ['decoratedService']);
	})

	// The controller demonstrates the simple use of the service.
	.controller('autoController', function ($scope, decoratedService) {
		$scope.synchronousError = function () {
			decoratedService.throwsAnError();
		}

		$scope.asynchronousError = function () {
			decoratedService.promiseRejectsAfterAWhile();
		}
	})


	// EXAMPLE SCENARIO

	// Define a service.
	.factory('exampleService', function ($http) {

		function loadData(filename) {
			return $http.get(filename)
				.then(function loadDataSuccess(result) {
					return result.data;
				});
		}

		loadData.description = 'load the example data in the \'realistic scenario\'';

		return {
			loadData: loadData
		};
	})

	// Decorate the service...
	.config(function (errorHandlerProvider, $provide) {
		errorHandlerProvider.decorate($provide, ['exampleService']);
	})

	// And use it.
	.controller('exampleController', function ($scope, exampleService) {
		$scope.data = '';
		$scope.loadData = function loadData(filename) {
			$scope.data = '';
			exampleService.loadData(filename).then(function (data) {
				$scope.data = data;
			});
		};
	})

  // The following is used to show the error messages on screen. Normally you would probably use a directive for this.
  .run(function ($rootScope, errorHandler) {
  	$rootScope.errorHandler = errorHandler;
  });