var app = angular.module('app', ['ngTouch', 
                                 'ui.bootstrap',
                                 'ui.grid', 
                                 'ui.grid.edit', 
                                 'ui.grid.rowEdit', 
                                 'ui.grid.cellNav', 
                                 'ui.grid.selection']);

app.controller('DictCtrl', ['$scope', '$http', '$q', '$interval', '$uibModal', 
  function ($scope, $http, $q, $interval, $uibModal) {
  $scope.gridOptions = {
    exporterMenuCsv: false,
    enableFiltering: true,
    enableGridMenu: false,
    enableCellEditOnFocus: false,
    columnDefs: [
      {
        name: 'id', 
        displayName: "ID", 
        width: 100,
        enableHiding: false, 
        enableCellEditOnFocus: true, 
        cellEditableCondition: function($scope){
          return $scope.row.entity.id == 0;
        },
      },
      {
        name: 'keyword', 
        enableHiding: false, 
        type: 'string', 
        cellEditableCondition: function($scope){
         return false;
        }
      },
      { 
        name: 'detail', 
        enableHiding: false, 
        type: 'object', 
        cellEditableCondition: function($scope){
         return false;
        }
      }, 
      {
        name: 'Edit', 
        displayName: '', 
        width: 80,
        field: 'widgets',  
        enableHiding: false, 
        enableFiltering: false, 
        enableSorting: false,
        cellEditableCondition: function($scope){
          return false;
        },
        cellTemplate: `<div class="ui-grid-cell-contents">
                          <button type="button" class="btn btn-warning btn-sm" 
                            ng-click="grid.appScope.copyItem(row.entity.id)">
                            Copy <i class="glyphicon glyphicon-copy"></i>
                          </button>
                        </div>`}
    ]
  };

  $scope.copyItem = function(id) {
    for(let counter = 0; counter < $scope.gridOptions.data.length; counter++) {
      if($scope.gridOptions.data[counter].id == id) {
        var newItem = angular.copy($scope.gridOptions.data[counter]);
        newItem.id = 0;

        $scope.gridOptions.data.push(newItem);
        break;
      }
    }
  };

  $scope.editItem = function() {
    let selectedRows = $scope.gridApi.selection.getSelectedRows();
    if(selectedRows && selectedRows.length > 0) {
        this.openModal(selectedRows);
    } else {
      $scope.alerts.push({ type: 'info', msg: 'Select an item to edit!' });
    }
  };

  $scope.openModal = function(selectedRows) {
    let $ctrl = this;
    var modalInstance = $uibModal.open({
      animation: $ctrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'editModal.html',
      controller: 'ModalCtrl',
      controllerAs: '$ctrl',
      size: 'lg',
      resolve: {
        items: function () {
          return selectedRows;
        }
      }
    });

    modalInstance.result.then(function (items) {
      // Post data to server to save
      $http.post('/app/data.json', items)
        .success(function(data) {
          // On successful save update grid with updated data.
          $http.get('/app/data.json')
            .success(function(data) {
              $scope.gridOptions.data = data;
              $scope.alerts.push({ type: 'success', msg: 'Data updated successfully!' });
            });
        });
    }, function () {
        console.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.alerts = [];

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  $scope.saveRow = function(rowEntity) {
    // create a fake promise - normally you'd use the promise returned by $http or $resource
    var promise = $q.defer();
    $scope.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise);
 
    // fake a delay of 3 seconds whilst the save occurs, return error if gender is "male"
    $interval( function() {
      if (rowEntity.id === 2 ){
        promise.reject();
      } else {
        promise.resolve();
        $scope.alerts.push({ type: 'success', msg: 'New item added successfully!' });
      }
    }, 1000, 1);
  };

  $scope.gridOptions.onRegisterApi = function(gridApi){
    //set gridApi on scope
    $scope.gridApi = gridApi;
    gridApi.rowEdit.on.saveRow($scope, $scope.saveRow);
  };

  $http.get('/app/data.json')
    .success(function(data) {
      $scope.gridOptions.data = data;
    });
}]);

app.controller('ModalCtrl', ['$uibModalInstance', 'items', '$http', 
function ($uibModalInstance, items) {
  var $ctrl = this;
  $ctrl.desc = '';
  $ctrl.items = items;

  $ctrl.ok = function () {
    $ctrl.items.forEach(function(item) {
      item.detail = $ctrl.desc;
    }, this);

    $uibModalInstance.close($ctrl.items);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}]);
