angular.module('demo', ['demo.errorHandler'])

	// MANUAL HANDLING...
	// The following service is not wrapped or decorated in any way.
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
	.controller('manualController', function ($scope, errorHandler, undecoratedService) {
		$scope.manualError = function () {
			try {
				undecoratedService.throwsAnError();
			} catch (err) {
				errorHandler.errors.push(err && err.message || err);
			}
		};

		$scope.synchronousError = function () {
			undecoratedService.throwsAnError();
		};

		$scope.wrappedSynchronousError = function () {
			errorHandler.call(undecoratedService.throwsAnError, undecoratedService);
		}

		$scope.asynchronousError = function () {
			undecoratedService.promiseRejects();
		};

		$scope.manualAsynchronousError = function () {
			undecoratedService.promiseRejects()
				['catch'](function (err) {
					errorHandler.errors.push(err);
				});
		};

		$scope.wrappedAsynchronousError = function () {
			errorHandler.call(undecoratedService.promiseRejects, undecoratedService);
		}
	})

	// AUTOMATIC HANDLING...
	// The decoratedService is wrapped by the errorHandler service in the .config() block below.
	.factory('decoratedService', function ($q, $timeout) {

		// The throwsAnError function throws an error.
		function throwsAnError() {
			throw new Error('You won\'t believe what just happened!');
		}
		throwsAnError.description = 'perform some synchronous operation';

		// The promiseRejectsAfterAWhile function returns a promise that... rejects after a while.
		function promiseRejectsAfterAWhile() {
			var defer = $q.defer();
			$timeout(function () {
				defer.reject('Something happened, but I\'m not sure how to fix it.');
			}, 500);
			return defer.promise;
		}
		promiseRejectsAfterAWhile.description = 'perform some asynchronous operation';

		return {
			throwsAnError: throwsAnError,
			promiseRejectsAfterAWhile: promiseRejectsAfterAWhile
		};
	})
	.config(function (errorHandlerProvider, $provide) {
		// Decorate both our own decoratedService and the built-in $http service.
		errorHandlerProvider.decorate($provide, ['decoratedService']);
	})
	.controller('autoController', function ($scope, decoratedService, $http) {
		$scope.synchronousError = function () {
			decoratedService.throwsAnError();
		}

		$scope.asynchronousError = function () {
			decoratedService.promiseRejectsAfterAWhile();
		}
	})

	// EXAMPLE SCENARIO
	.factory('exampleService', function ($http) {

		function loadData(successful) {
			return $http.get(successful ? 'data' : 'doesntExist')
				.then(function loadDataSuccess(result) {
					return result.data;
				});
		}
		loadData.description = 'load the example data from the \'realistic scenario\'';

		return {
			loadData: loadData
		};
	})
	.config(function (errorHandlerProvider, $provide) {
		errorHandlerProvider.decorate($provide, ['exampleService']);
	})
	.controller('exampleController', function ($scope, exampleService) {
		$scope.data = '';
		$scope.loadData = function loadData(successful) {
			$scope.data = '';
			exampleService.loadData(successful).then(function (data) {
				$scope.data = data;
			});
		};
	})

  .run(function ($rootScope, errorHandler) {
  	$rootScope.errorHandler = errorHandler;
  });